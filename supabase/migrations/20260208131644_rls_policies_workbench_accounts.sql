alter table public.workbench_accounts enable row level security;

-- SELECT
create policy "accounts_select_ops_only"
on public.workbench_accounts
for select
using (
  exists (
    select 1
    from workbench_members wm
    where wm.workbench_id = workbench_accounts.workbench_id
      and wm.user_id = auth.uid()
      and wm.role in ('founder', 'ca', 'analyst')
  )
);

-- INSERT
create policy "accounts_insert_ops"
on public.workbench_accounts
for insert
with check (
  exists (
    select 1
    from workbench_members wm
    where wm.workbench_id = workbench_accounts.workbench_id
      and wm.user_id = auth.uid()
      and wm.role in ('founder', 'ca', 'analyst')
  )
);

-- UPDATE
create policy "accounts_update_ops"
on public.workbench_accounts
for update
using (
  exists (
    select 1
    from workbench_members wm
    where wm.workbench_id = workbench_accounts.workbench_id
      and wm.user_id = auth.uid()
      and wm.role in ('founder', 'ca', 'analyst')
  )
);

