create table public.workbench_members (
  id uuid primary key default gen_random_uuid(),

  workbench_id uuid not null
    references workbenches(id) on delete cascade,

  user_id uuid not null
    references auth.users(id) on delete cascade,

  role text not null
    check (role in ('founder', 'ca', 'analyst', 'investor')),

  invited_by uuid 
    references auth.users(id),

  created_at timestamptz default now(),

  unique (workbench_id, user_id)
);

