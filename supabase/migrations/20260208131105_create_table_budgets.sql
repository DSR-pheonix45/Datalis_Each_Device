create table public.budgets (
  id uuid primary key default gen_random_uuid(),

  workbench_id uuid not null
    references workbenches(id),

  name text not null,
  allocated_amount numeric not null,

  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);
