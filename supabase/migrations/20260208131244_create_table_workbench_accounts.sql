create table public.workbench_accounts (
  id uuid primary key default gen_random_uuid(),

  workbench_id uuid not null
    references public.workbenches(id)
    on delete cascade,

  account_type text not null
    check (account_type in ('bank', 'upi', 'gateway', 'wallet', 'cash')),

  account_name text not null,
  account_identifier text,
  provider text,

  is_active boolean default true,

  created_at timestamptz default now(),

  unique (workbench_id, account_type, account_identifier)
);

