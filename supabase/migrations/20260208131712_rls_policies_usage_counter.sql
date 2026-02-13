alter table public.usage_counters enable row level security;

create policy "usage_select_subscription_owner"
on public.usage_counters
for select
using (
  exists (
    select 1
    from user_subscriptions us
    where us.id = usage_counters.subscription_id
      and us.user_id = auth.uid()
  )
);


