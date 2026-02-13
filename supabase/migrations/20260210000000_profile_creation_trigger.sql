-- Robust trigger to initialize user profile and free subscription
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  default_name text;
  new_subscription_id uuid;
begin
  -- 1. Get a default name from email
  default_name := split_part(new.email, '@', 1);
  if default_name = '' or default_name is null then
    default_name := 'New User';
  end if;

  -- 2. Create User Profile
  begin
    insert into public.user_profiles (user_id, name, status, role)
    values (
      new.id,
      coalesce(new.raw_user_meta_data->>'full_name', default_name),
      'partial',
      'founder'
    )
    on conflict (user_id) do nothing;
  exception when others then
    raise warning 'Error creating user profile: %', SQLERRM;
  end;

  -- 3. Initialize Free Subscription
  begin
    insert into public.user_subscriptions (user_id, plan_id, status, started_at, expires_at)
    values (
      new.id,
      'free',
      'active',
      now(),
      now() + interval '10 years' -- Long term for free plan
    )
    on conflict (user_id) do nothing
    returning id into new_subscription_id;

    -- 4. Initialize Usage Counter if subscription was created
    if new_subscription_id is not null then
      insert into public.usage_counters (user_id, subscription_id, month)
      values (
        new.id,
        new_subscription_id,
        date_trunc('month', now())::date
      )
      on conflict do nothing;
    end if;
  exception when others then
    raise warning 'Error initializing subscription/usage: %', SQLERRM;
  end;
  
  return new;
exception when others then
  -- Final safety net to ensure auth.users record is always created
  raise warning 'Critical error in handle_new_user: %', SQLERRM;
  return new;
end;
$$;

-- Drop trigger if it exists
drop trigger if exists on_auth_user_created on auth.users;

-- Create the trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
