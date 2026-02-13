alter table public.party_accounts enable row level security;

-- SELECT
create policy "party_accounts_select_ops_only"
on public.party_accounts
for select
using (
  exists (
    select 1
    from workbench_parties wp
    join workbench_members wm
      on wm.workbench_id = wp.workbench_id
    where wp.id = party_accounts.party_id
      and wm.user_id = auth.uid()
      and wm.role in ('founder', 'ca', 'analyst')
  )
);

-- INSERT
create policy "party_accounts_insert_ops"
on public.party_accounts
for insert
with check (
  exists (
    select 1
    from workbench_parties wp
    join workbench_members wm
      on wm.workbench_id = wp.workbench_id
    where wp.id = party_accounts.party_id
      and wm.user_id = auth.uid()
      and wm.role in ('founder', 'ca', 'analyst')
  )
);

-- UPDATE
create policy "party_accounts_update_ops"
on public.party_accounts
for update
using (
  exists (
    select 1
    from workbench_parties wp
    join workbench_members wm
      on wm.workbench_id = wp.workbench_id
    where wp.id = party_accounts.party_id
      and wm.user_id = auth.uid()
      and wm.role in ('founder', 'ca', 'analyst')
  )
);

