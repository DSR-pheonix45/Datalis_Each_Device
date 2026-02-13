drop table if exists public.usage_counters cascade;

create table public.usage_counters (
  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  subscription_id uuid not null
    references public.user_subscriptions(id)
    on delete cascade,

  month date not null,

  chat_sessions int default 0,
  workbenches_created int default 0,

  created_at timestamptz default now(),

  primary key (user_id, subscription_id, month)
);


