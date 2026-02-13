alter table public.compliances enable row level security;

-- SELECT
create policy "compliances_select_all_members"
on public.compliances
for select
using (
  exists (
    select 1
    from workbench_members wm
    where wm.workbench_id = compliances.workbench_id
      and wm.user_id = auth.uid()
  )
);

-- INSERT
create policy "compliances_insert_ops"
on public.compliances
for insert
with check (
  exists (
    select 1
    from workbench_members wm
    where wm.workbench_id = compliances.workbench_id
      and wm.user_id = auth.uid()
      and wm.role in ('founder', 'ca', 'analyst')
  )
);

-- UPDATE
create policy "compliances_update_ops"
on public.compliances
for update
using (
  exists (
    select 1
    from workbench_members wm
    where wm.workbench_id = compliances.workbench_id
      and wm.user_id = auth.uid()
      and wm.role in ('founder', 'ca', 'analyst')
  )
);

