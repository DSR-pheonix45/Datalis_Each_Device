create table public.user_subscriptions (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references auth.users(id)
    on delete cascade
    unique,

  plan_id text not null
    references plans(id),

  status text not null
    check (status in ('active','expired','cancelled')),

  started_at timestamptz not null,
  expires_at timestamptz not null,

  created_at timestamptz default now()
);

