-- Enable RLS --
alter table public.workbench_members enable row level security;

-- SELECT: Members can see members --
create policy "members_select"
on public.workbench_members
for select
using (
  exists (
    select 1
    from workbench_members wm
    where wm.workbench_id = workbench_members.workbench_id
      and wm.user_id = auth.uid()
  )
);

-- INSERT: Founder or CA can invite/add --
create policy "members_insert_founder_ca"
on public.workbench_members
for insert
with check (
  exists (
    select 1
    from workbench_members wm
    where wm.workbench_id = workbench_members.workbench_id
      and wm.user_id = auth.uid()
      and wm.role in ('founder', 'ca')
  )
);

-- UPDATE (role change): Founder or CA --
create policy "members_update_founder_ca"
on public.workbench_members
for update
using (
  exists (
    select 1
    from workbench_members wm
    where wm.workbench_id = workbench_members.workbench_id
      and wm.user_id = auth.uid()
      and wm.role in ('founder', 'ca')
  )
);

-- DELETE (remove member): Founder or CA --
create policy "members_delete_founder_ca"
on public.workbench_members
for delete
using (
  exists (
    select 1
    from workbench_members wm
    where wm.workbench_id = workbench_members.workbench_id
      and wm.user_id = auth.uid()
      and wm.role in ('founder', 'ca')
  )
);
