create table public.party_accounts (
  id uuid primary key default gen_random_uuid(),

  party_id uuid not null
    references public.workbench_parties(id)
    on delete cascade,

  account_type text not null
    check (account_type in ('bank', 'upi', 'wallet')),

  account_identifier text not null,
  account_name text,

  is_primary boolean default false,

  created_at timestamptz default now(),

  unique (party_id, account_type, account_identifier)
);

