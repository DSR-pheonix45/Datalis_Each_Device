create table public.plans (
  id text primary key,
  name text not null,

  max_workbenches int not null,
  max_chat_sessions int not null,   -- per month
  retention_days int not null,

  price_inr int not null,           -- monthly price
  created_at timestamptz default now()
);

