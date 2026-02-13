drop table if exists public.transactions cascade;

create table public.transactions (
  id uuid primary key default gen_random_uuid(),

  -- scope
  workbench_id uuid not null
    references public.workbenches(id)
    on delete cascade,

  -- money
  amount numeric not null check (amount > 0),

  direction text not null
    check (direction in ('credit', 'debit')),

  transaction_date date not null,

  -- classification
  payment_type text not null
    check (payment_type in ('bank', 'upi', 'gateway', 'wallet', 'cash')),

  -- counterparty
  party_id uuid
    references public.workbench_parties(id),

  party_account_id uuid
    references public.party_accounts(id),

  -- workbench-side account
  workbench_account_id uuid
    references public.workbench_accounts(id),

  -- references
  external_reference text, -- bank txn id / UPI ref / gateway ref

  source_document_id uuid
    references public.workbench_documents(id),

  -- CASH CONTROL
  invoice_document_id uuid
    references public.workbench_documents(id),

  purpose text,

  -- audit
  created_by uuid
    references auth.users(id),

  created_at timestamptz default now(),

  -- ======================
  -- HARD BUSINESS RULES
  -- ======================

  -- cash requires invoice
  check (
    (payment_type = 'cash' and invoice_document_id is not null)
    or
    (payment_type != 'cash')
  ),

  -- bank / upi / gateway should have reference (soft-enforced)
  check (
    payment_type = 'cash'
    or external_reference is not null
  )
);

