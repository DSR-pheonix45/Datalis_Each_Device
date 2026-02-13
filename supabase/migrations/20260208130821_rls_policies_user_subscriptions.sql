alter table public.user_subscriptions enable row level security;

create policy "read own subscription"
on public.user_subscriptions
for select
using (auth.uid() = user_id);

