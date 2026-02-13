create table public.workbench_invites (
  id uuid primary key default gen_random_uuid(),

  workbench_id uuid not null
    references workbenches(id) on delete cascade,

  email text not null,
  role text not null
    check (role in ('ca', 'analyst', 'investor')),

  invited_by uuid not null
    references auth.users(id),

  token text not null unique,
  expires_at timestamptz not null,

  accepted_at timestamptz,

  created_at timestamptz default now()
);

