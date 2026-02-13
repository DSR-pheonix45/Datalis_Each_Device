create table public.compliances (
  id uuid primary key default gen_random_uuid(),

  workbench_id uuid not null
    references workbenches(id) on delete cascade,

  name text not null,
  form text,
  deadline date not null,

  status text default 'pending'
    check (status in ('pending', 'filed', 'overdue')),

  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

