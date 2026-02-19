-- 1. Workbench Documents (Re-creation)
-- This table stores metadata for uploaded files (invoices, receipts, etc.)
create table if not exists public.workbench_documents (
  id uuid primary key default gen_random_uuid(),
  workbench_id uuid not null references public.workbenches(id) on delete cascade,
  file_path text not null,
  document_type text, -- 'invoice', 'receipt', 'bank_statement', etc.
  processing_status text default 'UPLOADED', -- 'UPLOADED', 'PROCESSING', 'COMPLETED', 'FAILED'
  uploaded_at timestamp with time zone default now()
);

-- RLS for workbench_documents
alter table public.workbench_documents enable row level security;

drop policy if exists "Members can read documents" on public.workbench_documents;
create policy "Members can read documents" 
  on public.workbench_documents 
  for select 
  using (
    exists (
      select 1 from public.workbench_members 
      where workbench_id = workbench_documents.workbench_id 
      and user_id = auth.uid()
    )
  );

drop policy if exists "Members can insert documents" on public.workbench_documents;
create policy "Members can insert documents" 
  on public.workbench_documents 
  for insert 
  with check (
    exists (
      select 1 from public.workbench_members 
      where workbench_id = workbench_documents.workbench_id 
      and user_id = auth.uid()
    )
  );

drop policy if exists "Members can update documents" on public.workbench_documents;
create policy "Members can update documents" 
  on public.workbench_documents 
  for update 
  using (
    exists (
      select 1 from public.workbench_members 
      where workbench_id = workbench_documents.workbench_id 
      and user_id = auth.uid()
    )
  );

drop policy if exists "Members can delete documents" on public.workbench_documents;
create policy "Members can delete documents" 
  on public.workbench_documents 
  for delete 
  using (
    exists (
      select 1 from public.workbench_members 
      where workbench_id = workbench_documents.workbench_id 
      and user_id = auth.uid()
    )
  );


-- 2. Workbench Records (Re-creation)
-- This table acts as a unified activity feed / log for all actions (transactions, parties, budgets, etc.)
-- Required by the 'create-record' edge function.
create table if not exists public.workbench_records (
  id uuid primary key default gen_random_uuid(),
  workbench_id uuid not null references public.workbenches(id) on delete cascade,
  
  document_id uuid references public.workbench_documents(id) on delete set null,
  
  record_type text not null, -- 'transaction', 'party', 'budget', etc.
  
  party_id uuid references public.workbench_parties(id) on delete set null,
  
  summary text,
  
  gross_amount numeric default 0,
  tax_amount numeric default 0,
  net_amount numeric default 0,
  
  issue_date date,
  due_date date,
  
  confidence_score numeric default 1.0,
  
  status text check (status in ('draft', 'confirmed')) default 'draft',
  
  metadata jsonb default '{}'::jsonb,
  
  reference_id uuid, -- Links to the specific domain table (e.g., transactions.id)
  
  created_by uuid references auth.users(id),
  created_at timestamp with time zone default now()
);

-- RLS for workbench_records
alter table public.workbench_records enable row level security;

drop policy if exists "records_select_all_members" on public.workbench_records;
create policy "records_select_all_members"
on public.workbench_records
for select
using (
  exists (
    select 1
    from public.workbench_members wm
    where wm.workbench_id = workbench_records.workbench_id
      and wm.user_id = auth.uid()
  )
);

drop policy if exists "records_insert_ops" on public.workbench_records;
create policy "records_insert_ops"
on public.workbench_records
for insert
with check (
  exists (
    select 1
    from public.workbench_members wm
    where wm.workbench_id = workbench_records.workbench_id
      and wm.user_id = auth.uid()
      and wm.role in ('founder', 'ca', 'analyst')
  )
);

drop policy if exists "records_update_ops" on public.workbench_records;
create policy "records_update_ops"
on public.workbench_records
for update
using (
  exists (
    select 1
    from public.workbench_members wm
    where wm.workbench_id = workbench_records.workbench_id
      and wm.user_id = auth.uid()
      and wm.role in ('founder', 'ca', 'analyst')
  )
);

drop policy if exists "records_delete_ops" on public.workbench_records;
create policy "records_delete_ops"
on public.workbench_records
for delete
using (
  exists (
    select 1
    from public.workbench_members wm
    where wm.workbench_id = workbench_records.workbench_id
      and wm.user_id = auth.uid()
      and wm.role in ('founder', 'ca', 'analyst')
  )
);


-- 3. Transactions Table (New Schema)
-- Replaces/Consolidates financial record keeping
drop table if exists public.transactions cascade;

create table public.transactions (
  id uuid primary key default gen_random_uuid(),

  -- Scope
  workbench_id uuid not null references public.workbenches(id) on delete cascade,

  -- Money
  amount numeric not null check (amount > 0),
  direction text not null check (direction in ('credit', 'debit')), -- credit = money in, debit = money out
  transaction_date date not null,

  -- Classification
  payment_type text not null check (payment_type in ('bank', 'upi', 'gateway', 'wallet', 'cash')),
  
  -- Counterparty
  party_id uuid references public.workbench_parties(id),
  party_account_id uuid references public.party_accounts(id), -- Account of the party (if known)

  -- Workbench-side Account (Where money moved from/to)
  workbench_account_id uuid references public.workbench_accounts(id),

  -- References
  external_reference text, -- bank txn id / UPI ref / gateway ref
  
  -- Documentation
  source_document_id uuid references public.workbench_documents(id), -- Link to the proof (invoice/receipt)
  
  purpose text, -- Description/Reason

  -- Audit
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),

  -- Constraints
  -- 1. Cash transactions don't strictly require external reference (handled by app logic/source doc suggestion)
  -- 2. Non-cash transactions MUST have an external reference (Bank/UPI Ref)
  check ((payment_type = 'cash') or (external_reference is not null))
) TABLESPACE pg_default;

-- Indexes for Transactions
create index IF not exists idx_transactions_workbench on public.transactions using btree (workbench_id) TABLESPACE pg_default;
create index IF not exists idx_transactions_party on public.transactions using btree (party_id) TABLESPACE pg_default;
create index IF not exists idx_transactions_date on public.transactions using btree (transaction_date) TABLESPACE pg_default;
create index IF not exists idx_transactions_source_doc on public.transactions using btree (source_document_id) TABLESPACE pg_default;

-- RLS for Transactions
alter table public.transactions enable row level security;

-- SELECT
drop policy if exists "transactions_select_all_members" on public.transactions;
create policy "transactions_select_all_members"
on public.transactions
for select
using (
  exists (
    select 1
    from public.workbench_members wm
    where wm.workbench_id = transactions.workbench_id
      and wm.user_id = auth.uid()
  )
);

-- INSERT
drop policy if exists "transactions_insert_ops" on public.transactions;
create policy "transactions_insert_ops"
on public.transactions
for insert
with check (
  exists (
    select 1
    from public.workbench_members wm
    where wm.workbench_id = transactions.workbench_id
      and wm.user_id = auth.uid()
      and wm.role in ('founder', 'ca', 'analyst')
  )
);

-- UPDATE
drop policy if exists "transactions_update_ops" on public.transactions;
create policy "transactions_update_ops"
on public.transactions
for update
using (
  exists (
    select 1
    from public.workbench_members wm
    where wm.workbench_id = transactions.workbench_id
      and wm.user_id = auth.uid()
      and wm.role in ('founder', 'ca', 'analyst')
  )
);

-- DELETE
drop policy if exists "transactions_delete_ops" on public.transactions;
create policy "transactions_delete_ops"
on public.transactions
for delete
using (
  exists (
    select 1
    from public.workbench_members wm
    where wm.workbench_id = transactions.workbench_id
      and wm.user_id = auth.uid()
      and wm.role in ('founder', 'ca', 'analyst')
  )
);
