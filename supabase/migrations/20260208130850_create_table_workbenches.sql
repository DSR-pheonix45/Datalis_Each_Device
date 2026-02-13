create table public.workbenches (
  id uuid primary key default gen_random_uuid(),

  name text not null,
  description text,

  owner_user_id uuid not null
    references auth.users(id) on delete cascade,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.workbenches
add column status text default 'active'
check (status in ('active', 'archived'));


