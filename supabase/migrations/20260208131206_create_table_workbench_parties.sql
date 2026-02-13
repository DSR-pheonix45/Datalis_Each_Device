create table public.workbench_parties (
  id uuid primary key default gen_random_uuid(),

  workbench_id uuid not null
    references public.workbenches(id)
    on delete cascade,

  name text not null,

  party_type text not null
    check (party_type in ('customer', 'vendor', 'both')),

  gstin text,
  pan text,

  is_active boolean default true,

  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  unique (workbench_id, name)
);

