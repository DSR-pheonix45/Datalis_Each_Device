create table public.user_profiles (
  id uuid primary key default gen_random_uuid(),

  -- link to auth
  user_id uuid not null
    references auth.users(id)
    on delete cascade
    unique,

  -- identity
  name text not null,

  role text not null
    check (role in ('founder', 'ca', 'analyst', 'investor')),

  contact_number text,

  -- system
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Alter table details for partial onboarding / job title -- 
alter table public.user_profiles
add column status text not null
  check (status in ('partial', 'active'))
  default 'partial';

alter table public.user_profiles
add column job_title text;

