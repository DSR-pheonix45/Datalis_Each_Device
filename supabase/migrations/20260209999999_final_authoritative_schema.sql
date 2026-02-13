-- Sync with Authoritative Schema
-- This migration brings the database to the state required by the application code.

-- MODULE 0: IDENTITY & ACCESS
create table if not exists user_profiles (
  user_id uuid primary key references auth.users on delete cascade,
  name text,
  role text check (role in ('founder', 'ca', 'analyst', 'investor')),
  status text check (status in ('partial', 'active')) default 'partial',
  contact_number text,
  job_title text,
  industry text,
  company_size text,
  company_name text,
  cin text,
  pan text,
  director_name text,
  domain text,
  zoho_integration boolean default false,
  created_at timestamp with time zone default now()
);

-- Add missing columns to user_profiles if they exist but are missing these
do $$ 
begin 
    if not exists (select 1 from information_schema.columns where table_name='user_profiles' and column_name='contact_number') then
        alter table user_profiles add column contact_number text;
    end if;
    if not exists (select 1 from information_schema.columns where table_name='user_profiles' and column_name='job_title') then
        alter table user_profiles add column job_title text;
    end if;
    if not exists (select 1 from information_schema.columns where table_name='user_profiles' and column_name='industry') then
        alter table user_profiles add column industry text;
    end if;
    if not exists (select 1 from information_schema.columns where table_name='user_profiles' and column_name='company_size') then
        alter table user_profiles add column company_size text;
    end if;
    if not exists (select 1 from information_schema.columns where table_name='user_profiles' and column_name='company_name') then
        alter table user_profiles add column company_name text;
    end if;
    if not exists (select 1 from information_schema.columns where table_name='user_profiles' and column_name='cin') then
        alter table user_profiles add column cin text;
    end if;
    if not exists (select 1 from information_schema.columns where table_name='user_profiles' and column_name='pan') then
        alter table user_profiles add column pan text;
    end if;
    if not exists (select 1 from information_schema.columns where table_name='user_profiles' and column_name='director_name') then
        alter table user_profiles add column director_name text;
    end if;
    if not exists (select 1 from information_schema.columns where table_name='user_profiles' and column_name='domain') then
        alter table user_profiles add column domain text;
    end if;
    if not exists (select 1 from information_schema.columns where table_name='user_profiles' and column_name='zoho_integration') then
        alter table user_profiles add column zoho_integration boolean default false;
    end if;
end $$;

-- Ensure permissions are correct for all roles
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all routines in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;

-- MODULE 1: WORKBENCH CORE
-- We use 'if not exists' but also ensure columns are correct if it exists
create table if not exists workbenches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  state text not null default 'CREATED',
  history_window_months int default 12,
  books_start_date date,
  created_at timestamp with time zone default now()
);

-- Add missing columns to workbenches if they were created by older migrations
do $$ 
begin 
    if not exists (select 1 from information_schema.columns where table_name='workbenches' and column_name='state') then
        alter table workbenches add column state text not null default 'CREATED';
    end if;
    if not exists (select 1 from information_schema.columns where table_name='workbenches' and column_name='history_window_months') then
        alter table workbenches add column history_window_months int default 12;
    end if;
    if not exists (select 1 from information_schema.columns where table_name='workbenches' and column_name='books_start_date') then
        alter table workbenches add column books_start_date date;
    end if;
    if not exists (select 1 from information_schema.columns where table_name='workbenches' and column_name='description') then
        alter table workbenches add column description text;
    end if;
    if not exists (select 1 from information_schema.columns where table_name='workbenches' and column_name='status') then
        alter table workbenches add column status text default 'active';
    end if;
end $$;

create table if not exists workbench_members (
  workbench_id uuid references workbenches on delete cascade,
  user_id uuid references auth.users on delete cascade,
  role text check (role in ('founder', 'ca', 'analyst', 'investor')),
  primary key (workbench_id, user_id)
);

-- CHAT MODULE
create table if not exists chat_sessions (
  id uuid primary key default gen_random_uuid(),
  workbench_id uuid references workbenches on delete cascade,
  user_id uuid references auth.users on delete cascade,
  title text,
  created_at timestamp with time zone default now()
);

create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references chat_sessions on delete cascade,
  role text check (role in ('user', 'assistant')),
  content text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now()
);

-- AUDIT LOGS
create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  workbench_id uuid references workbenches on delete cascade,
  user_id uuid references auth.users,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  old_data jsonb,
  new_data jsonb,
  created_at timestamp with time zone default now()
);

-- MODULE 2: SEMANTIC BASE
-- Handle workbench_accounts schema mismatch
do $$ 
begin 
    if exists (select 1 from information_schema.columns where table_name='workbench_accounts' and column_name='account_name') then
        alter table workbench_accounts rename column account_name to name;
    end if;
    if not exists (select 1 from information_schema.columns where table_name='workbench_accounts' and column_name='category') then
        alter table workbench_accounts add column category text not null default 'General';
    end if;
    if not exists (select 1 from information_schema.columns where table_name='workbench_accounts' and column_name='cash_impact') then
        alter table workbench_accounts add column cash_impact boolean default false;
    end if;
    -- Relax account_type constraint if it exists
    alter table workbench_accounts drop constraint if exists workbench_accounts_account_type_check;
end $$;

create table if not exists workbench_accounts (
  id uuid primary key default gen_random_uuid(),
  workbench_id uuid references workbenches on delete cascade,
  name text not null,
  account_type text not null,
  category text not null,
  cash_impact boolean default false,
  created_at timestamp with time zone default now()
);

create table if not exists workbench_parties (
  id uuid primary key default gen_random_uuid(),
  workbench_id uuid references workbenches on delete cascade,
  name text not null,
  party_type text check (party_type in ('customer', 'vendor', 'both')),
  gstin text,
  pan text,
  created_at timestamp with time zone default now()
);

-- MODULE 3: DOCUMENT INGESTION
create table if not exists workbench_documents (
  id uuid primary key default gen_random_uuid(),
  workbench_id uuid references workbenches on delete cascade,
  file_path text not null,
  document_type text,
  processing_status text default 'UPLOADED',
  uploaded_at timestamp with time zone default now()
);

-- MODULE 4: RECORDS
-- Handle workbench_records schema mismatch
do $$ 
begin 
    if not exists (select 1 from information_schema.columns where table_name='workbench_records' and column_name='party_id') then
        alter table workbench_records add column party_id uuid references workbench_parties on delete set null;
    end if;
    if not exists (select 1 from information_schema.columns where table_name='workbench_records' and column_name='gross_amount') then
        alter table workbench_records add column gross_amount numeric default 0;
    end if;
    if not exists (select 1 from information_schema.columns where table_name='workbench_records' and column_name='tax_amount') then
        alter table workbench_records add column tax_amount numeric default 0;
    end if;
    if not exists (select 1 from information_schema.columns where table_name='workbench_records' and column_name='net_amount') then
        alter table workbench_records add column net_amount numeric default 0;
    end if;
    if not exists (select 1 from information_schema.columns where table_name='workbench_records' and column_name='issue_date') then
        alter table workbench_records add column issue_date date;
    end if;
    if not exists (select 1 from information_schema.columns where table_name='workbench_records' and column_name='due_date') then
        alter table workbench_records add column due_date date;
    end if;
    if not exists (select 1 from information_schema.columns where table_name='workbench_records' and column_name='status') then
        alter table workbench_records add column status text check (status in ('draft', 'confirmed')) default 'draft';
    end if;
    if not exists (select 1 from information_schema.columns where table_name='workbench_records' and column_name='document_id') then
        alter table workbench_records add column document_id uuid references workbench_documents on delete set null;
    end if;
    if not exists (select 1 from information_schema.columns where table_name='workbench_records' and column_name='confidence_score') then
        alter table workbench_records add column confidence_score numeric default 1.0;
    end if;
    if not exists (select 1 from information_schema.columns where table_name='workbench_records' and column_name='metadata') then
        alter table workbench_records add column metadata jsonb default '{}'::jsonb;
    end if;
    -- Relax record_type constraint if it exists
    alter table workbench_records drop constraint if exists workbench_records_record_type_check;
end $$;

create table if not exists workbench_records (
  id uuid primary key default gen_random_uuid(),
  workbench_id uuid references workbenches on delete cascade,
  document_id uuid references workbench_documents on delete set null,
  record_type text not null,
  party_id uuid references workbench_parties on delete set null,
  summary text,
  gross_amount numeric default 0,
  tax_amount numeric default 0,
  net_amount numeric default 0,
  issue_date date,
  due_date date,
  confidence_score numeric default 1.0,
  status text check (status in ('draft', 'confirmed')) default 'draft',
  metadata jsonb default '{}'::jsonb,
  created_by uuid references auth.users,
  created_at timestamp with time zone default now()
);

-- MODULE 5: LEDGER (IMMUTABLE)
create table if not exists ledger_entries (
  id uuid primary key default gen_random_uuid(),
  workbench_id uuid references workbenches on delete cascade,
  record_id uuid references workbench_records on delete cascade,
  account_id uuid references workbench_accounts on delete cascade,
  counter_account_id uuid references workbench_accounts on delete cascade,
  amount numeric not null,
  entry_type text check (entry_type in ('debit', 'credit')),
  category text,
  transaction_date date not null,
  created_at timestamp with time zone default now()
);

-- Handle adjustments schema mismatch
do $$ 
begin 
    if not exists (select 1 from information_schema.columns where table_name='adjustments' and column_name='original_entry_id') then
        alter table adjustments add column original_entry_id uuid references ledger_entries on delete cascade;
    end if;
    if not exists (select 1 from information_schema.columns where table_name='adjustments' and column_name='adjustment_amount') then
        alter table adjustments add column adjustment_amount numeric not null default 0;
    end if;
end $$;

create table if not exists adjustments (
  id uuid primary key default gen_random_uuid(),
  original_entry_id uuid references ledger_entries on delete cascade,
  adjustment_amount numeric not null,
  reason text not null,
  created_by uuid references auth.users,
  created_at timestamp with time zone default now()
);

-- MODULE 8: COMPLIANCE
-- Handle compliances schema mismatch
do $$ 
begin 
    if not exists (select 1 from information_schema.columns where table_name='compliances' and column_name='period') then
        alter table compliances add column period text;
    end if;
    if not exists (select 1 from information_schema.columns where table_name='compliances' and column_name='filed_date') then
        alter table compliances add column filed_date date;
    end if;
end $$;

create table if not exists compliances (
  id uuid primary key default gen_random_uuid(),
  workbench_id uuid references workbenches on delete cascade,
  name text not null,
  period text,
  deadline date,
  status text not null,
  filed_date date,
  created_at timestamp with time zone default now()
);

-- MODULE 9: BUDGETS
-- Handle budgets schema mismatch
do $$ 
begin 
    if not exists (select 1 from information_schema.columns where table_name='budgets' and column_name='period_start') then
        alter table budgets add column period_start date not null default current_date;
    end if;
    if not exists (select 1 from information_schema.columns where table_name='budgets' and column_name='period_end') then
        alter table budgets add column period_end date not null default (current_date + interval '1 month');
    end if;
    if not exists (select 1 from information_schema.columns where table_name='budgets' and column_name='total_amount') then
        alter table budgets add column total_amount numeric not null default 0;
    end if;
end $$;

create table if not exists budgets (
  id uuid primary key default gen_random_uuid(),
  workbench_id uuid references workbenches on delete cascade,
  name text not null,
  period_start date not null,
  period_end date not null,
  total_amount numeric not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now()
);

create table if not exists budget_items (
  id uuid primary key default gen_random_uuid(),
  budget_id uuid references budgets on delete cascade,
  category text not null,
  amount numeric not null,
  created_at timestamp with time zone default now()
);

-- MODULE 7: FINANCIAL INTELLIGENCE (SQL VIEWS)

-- Trial Balance View
create or replace view trial_balance as
select 
  a.workbench_id,
  a.id as account_id,
  a.name as account_name,
  a.account_type,
  a.category,
  sum(case when le.entry_type = 'debit' then le.amount else -le.amount end) as balance
from workbench_accounts a
left join ledger_entries le on a.id = le.account_id
group by a.workbench_id, a.id, a.name, a.account_type, a.category;

-- P&L View
create or replace view profit_and_loss as
select 
  workbench_id,
  account_name,
  category,
  balance
from trial_balance
where account_type in ('Revenue', 'Expense');

-- Balance Sheet View
create or replace view balance_sheet as
select 
  workbench_id,
  account_name,
  category,
  balance
from trial_balance
where account_type in ('Asset', 'Liability', 'Equity');

-- Cash Position View
create or replace view view_cash_position as
select 
  workbench_id,
  sum(case when entry_type = 'debit' then -amount else amount end) as balance
from ledger_entries
group by workbench_id;

-- Budget vs Actual View
create or replace view view_budget_vs_actual as
select 
  b.workbench_id,
  b.id as budget_id,
  b.name as budget_name,
  bi.category,
  bi.amount as budgeted_amount,
  coalesce(sum(le.amount), 0) as actual_amount,
  case 
    when bi.amount = 0 then 0 
    else (coalesce(sum(le.amount), 0)::float / bi.amount::float) * 100 
  end as progress_percentage
from budgets b
join budget_items bi on b.id = bi.budget_id
left join ledger_entries le on b.workbench_id = le.workbench_id 
  and le.category = bi.category
  and le.created_at between b.period_start and b.period_end
group by b.workbench_id, b.id, b.name, bi.category, bi.amount;

-- Payables View
create or replace view view_payables as
select 
  wr.workbench_id,
  wr.id as record_id,
  wr.party_id,
  wp.name as party_name,
  wr.net_amount as total_amount,
  wr.due_date,
  wr.status
from workbench_records wr
left join workbench_parties wp on wr.party_id = wp.id
where (wr.record_type = 'bill' or (wr.record_type = 'transaction' and (wr.metadata->>'direction') = 'debit')) 
  and wr.status = 'draft';

-- Receivables View
create or replace view view_receivables as
select 
  wr.workbench_id,
  wr.id as record_id,
  wr.party_id,
  wp.name as party_name,
  wr.net_amount as total_amount,
  wr.due_date,
  wr.status
from workbench_records wr
left join workbench_parties wp on wr.party_id = wp.id
where (wr.record_type = 'invoice' or (wr.record_type = 'transaction' and (wr.metadata->>'direction') = 'credit')) 
  and wr.status = 'draft';

-- Expense Categorization View
create or replace view view_expense_categorization as
select 
  workbench_id,
  category,
  count(*) as transaction_count,
  sum(amount) as total_amount,
  (sum(amount)::float / nullif((select sum(amount) from ledger_entries where workbench_id = le.workbench_id), 0)::float) * 100 as percentage
from ledger_entries le
where entry_type = 'debit'
group by workbench_id, category;

-- Exception Flags View
create or replace view view_exception_flags as
select 
  workbench_id,
  'Unclassified transaction' as message,
  'warning' as severity,
  id as entity_id
from ledger_entries
where category is null
union all
select 
  workbench_id,
  'Overdue record' as message,
  'danger' as severity,
  id as entity_id
from workbench_records
where due_date < current_date and status = 'draft';

-- RLS HELPER FUNCTIONS
create or replace function public.is_workbench_member(wb_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.workbench_members
    where workbench_id = wb_id
    and user_id = auth.uid()
  );
end;
$$ language plpgsql security definer;

-- RLS POLICIES
alter table user_profiles enable row level security;
drop policy if exists "Users can read own profile" on user_profiles;
create policy "Users can read own profile" on user_profiles for select using (auth.uid() = user_id);
drop policy if exists "Users can update own profile" on user_profiles;
create policy "Users can update own profile" on user_profiles for update using (auth.uid() = user_id);

alter table workbenches enable row level security;
drop policy if exists "Members can read workbench" on workbenches;
create policy "Members can read workbench" on workbenches for select using (public.is_workbench_member(id));

alter table workbench_members enable row level security;
drop policy if exists "Members can read other members" on workbench_members;
create policy "Members can read other members" on workbench_members for select using (public.is_workbench_member(workbench_id));

alter table chat_sessions enable row level security;
drop policy if exists "Users can read own chat sessions" on chat_sessions;
create policy "Users can read own chat sessions" on chat_sessions for select using (auth.uid() = user_id);
alter table chat_messages enable row level security;
drop policy if exists "Users can read own chat messages" on chat_messages;
create policy "Users can read own chat messages" on chat_messages for select using (exists (select 1 from chat_sessions where id = chat_messages.session_id and user_id = auth.uid()));

alter table audit_logs enable row level security;
drop policy if exists "Members can read audit logs" on audit_logs;
create policy "Members can read audit logs" on audit_logs for select using (public.is_workbench_member(workbench_id));

alter table workbench_accounts enable row level security;
drop policy if exists "Members can read accounts" on workbench_accounts;
create policy "Members can read accounts" on workbench_accounts for select using (public.is_workbench_member(workbench_id));

alter table workbench_parties enable row level security;
drop policy if exists "Non-investors can read parties" on workbench_parties;
create policy "Non-investors can read parties" on workbench_parties for select using (public.is_workbench_member(workbench_id));

alter table workbench_documents enable row level security;
drop policy if exists "Members can read documents" on workbench_documents;
create policy "Members can read documents" on workbench_documents for select using (public.is_workbench_member(workbench_id));

alter table workbench_records enable row level security;
drop policy if exists "Members can read records" on workbench_records;
create policy "Members can read records" on workbench_records for select using (public.is_workbench_member(workbench_id));

alter table ledger_entries enable row level security;
drop policy if exists "Members can read ledger entries" on ledger_entries;
create policy "Members can read ledger entries" on ledger_entries for select using (public.is_workbench_member(workbench_id));
alter table adjustments enable row level security;
drop policy if exists "Members can read adjustments" on adjustments;
create policy "Members can read adjustments" on adjustments for select using (public.is_workbench_member((select workbench_id from ledger_entries where id = adjustments.original_entry_id)));

alter table compliances enable row level security;
drop policy if exists "Members can read compliances" on compliances;
create policy "Members can read compliances" on compliances for select using (public.is_workbench_member(workbench_id));

alter table budgets enable row level security;
drop policy if exists "Members can read budgets" on budgets;
create policy "Members can read budgets" on budgets for select using (public.is_workbench_member(workbench_id));
alter table budget_items enable row level security;
drop policy if exists "Members can read budget items" on budget_items;
create policy "Members can read budget items" on budget_items for select using (exists (select 1 from budgets where id = budget_items.budget_id and public.is_workbench_member(workbench_id)));
