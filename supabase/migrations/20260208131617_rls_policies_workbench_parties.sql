alter table public.workbench_parties enable row level security;

-- SELECT
create policy "parties_select_ops_only"
on public.workbench_parties
for select
using (
  exists (
    select 1
    from workbench_members wm
    where wm.workbench_id = workbench_parties.workbench_id
      and wm.user_id = auth.uid()
      and wm.role in ('founder', 'ca', 'analyst')
  )
);

-- INSERT
create policy "parties_insert_ops"
on public.workbench_parties
for insert
with check (
  exists (
    select 1
    from workbench_members wm
    where wm.workbench_id = workbench_parties.workbench_id
      and wm.user_id = auth.uid()
      and wm.role in ('founder', 'ca', 'analyst')
  )
);

-- UPDATE
create policy "parties_update_ops"
on public.workbench_parties
for update
using (
  exists (
    select 1
    from workbench_members wm
    where wm.workbench_id = workbench_parties.workbench_id
      and wm.user_id = auth.uid()
      and wm.role in ('founder', 'ca', 'analyst')
  )
);

