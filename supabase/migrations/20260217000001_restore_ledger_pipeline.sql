-- Restore ledger_entries table
create table if not exists public.ledger_entries (
  id uuid primary key default gen_random_uuid(),
  workbench_id uuid not null references public.workbenches(id) on delete cascade,
  record_id uuid references public.workbench_records(id) on delete set null,
  account_id uuid references public.workbench_accounts(id) on delete set null,
  counter_account_id uuid references public.workbench_accounts(id) on delete set null,
  amount numeric not null default 0,
  entry_type text check (entry_type in ('debit', 'credit')) not null,
  category text,
  description text,
  transaction_date date default current_date,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now()
);

-- Enable RLS for ledger_entries
alter table public.ledger_entries enable row level security;

-- Policies for ledger_entries
create policy "Users can view ledger entries of their workbenches"
  on public.ledger_entries for select
  using (
    workbench_id in (
      select workbench_id from public.workbench_members
      where user_id = auth.uid()
    )
  );

create policy "Admins and members can insert ledger entries"
  on public.ledger_entries for insert
  with check (
    workbench_id in (
      select workbench_id from public.workbench_members
      where user_id = auth.uid()
      and role in ('founder', 'ca', 'analyst')
    )
  );

-- Restore adjustments table
create table if not exists public.adjustments (
  id uuid primary key default gen_random_uuid(),
  workbench_id uuid not null references public.workbenches(id) on delete cascade,
  ledger_entry_id uuid references public.ledger_entries(id) on delete cascade,
  amount numeric not null,
  reason text,
  status text check (status in ('pending', 'approved', 'rejected')) default 'pending',
  created_by uuid references auth.users(id),
  created_at timestamp with time zone default now()
);

-- Enable RLS for adjustments
alter table public.adjustments enable row level security;

-- Policies for adjustments
create policy "Users can view adjustments of their workbenches"
  on public.adjustments for select
  using (
    workbench_id in (
      select workbench_id from public.workbench_members
      where user_id = auth.uid()
    )
  );

create policy "Admins/Analyst can manage adjustments"
  on public.adjustments for all
  using (
    workbench_id in (
      select workbench_id from public.workbench_members
      where user_id = auth.uid()
      and role in ('founder', 'ca', 'analyst')
    )
  );

-- Trigger to auto-create ledger entries from transactions
create or replace function public.process_new_transaction()
returns trigger
language plpgsql
security definer
as $$
declare
  v_entry_type text;
  v_record_id uuid;
begin
  -- Determine entry type based on transaction direction
  -- If money comes IN (credit in bank terms), it increases the asset (Debit in accounting)
  -- If money goes OUT (debit in bank terms), it decreases the asset (Credit in accounting)
  -- However, usually 'credit' in a transactions table means 'deposit' and 'debit' means 'withdrawal'.
  -- Let's assume:
  -- Transaction 'credit' (deposit) -> Ledger 'debit' (increase asset)
  -- Transaction 'debit' (withdrawal) -> Ledger 'credit' (decrease asset)
  
  if NEW.direction = 'credit' then
    v_entry_type := 'debit'; 
  else
    v_entry_type := 'credit';
  end if;

  -- Find associated record if exists
  if NEW.source_document_id is not null then
    select id into v_record_id from public.workbench_records 
    where document_id = NEW.source_document_id limit 1;
  end if;

  insert into public.ledger_entries (
    workbench_id,
    record_id,
    account_id,
    amount,
    entry_type,
    category,
    description,
    transaction_date
  ) values (
    NEW.workbench_id,
    v_record_id,
    NEW.workbench_account_id,
    NEW.amount,
    v_entry_type,
    NEW.purpose, -- Use purpose as category for now
    NEW.purpose, -- description
    NEW.transaction_date
  );

  return NEW;
end;
$$;

-- Create trigger on transactions
drop trigger if exists on_transaction_created on public.transactions;
create trigger on_transaction_created
  after insert on public.transactions
  for each row
  execute function public.process_new_transaction();

-- Restore Views
create or replace view public.view_trial_balance as
select 
  workbench_id,
  account_id,
  sum(case when entry_type = 'debit' then amount else -amount end) as balance
from public.ledger_entries
group by workbench_id, account_id;

create or replace view public.view_cash_position as
select 
  l.workbench_id,
  l.transaction_date,
  sum(case when l.entry_type = 'debit' then l.amount else -l.amount end) as daily_net,
  sum(sum(case when l.entry_type = 'debit' then l.amount else -l.amount end)) 
    over (partition by l.workbench_id order by l.transaction_date) as running_balance
from public.ledger_entries l
join public.workbench_accounts a on l.account_id = a.id
where a.account_type in ('bank', 'cash', 'wallet') -- Filter for liquid asset accounts
group by l.workbench_id, l.transaction_date;
