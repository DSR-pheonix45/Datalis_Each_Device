alter table public.workbench_records enable row level security;

-- SELECT
create policy "records_select_all_members"
on public.workbench_records
for select
using (
  exists (
    select 1
    from workbench_members wm
    where wm.workbench_id = workbench_records.workbench_id
      and wm.user_id = auth.uid()
  )
);

-- INSERT
create policy "records_insert_ops"
on public.workbench_records
for insert
with check (
  exists (
    select 1
    from workbench_members wm
    where wm.workbench_id = workbench_records.workbench_id
      and wm.user_id = auth.uid()
      and wm.role in ('founder', 'ca', 'analyst')
  )
);

-- UPDATE
create policy "records_update_ops"
on public.workbench_records
for update
using (
  exists (
    select 1
    from workbench_members wm
    where wm.workbench_id = workbench_records.workbench_id
      and wm.user_id = auth.uid()
      and wm.role in ('founder', 'ca', 'analyst')
  )
);

