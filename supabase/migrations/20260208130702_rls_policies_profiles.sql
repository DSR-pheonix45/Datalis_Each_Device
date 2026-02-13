alter table public.user_profiles enable row level security;

-- user can read their own profiles --

create policy "read own profile"
on public.user_profiles
for select
using (auth.uid() = user_id);

-- user can create their own profiles (Onboarding) -- 

create policy "create own profile"
on public.user_profiles
for insert
with check (auth.uid() = user_id);

-- user can update their own profile --

create policy "update own profile"
on public.user_profiles
for update
using (auth.uid() = user_id);
