alter table public.workbenches enable row level security;

-- Select Policy :- Any member can view --

create policy "workbench_select_members"
on public.workbenches
for select
using (
  exists (
    select 1
    from workbench_members wm
    where wm.workbench_id = workbenches.id
      and wm.user_id = auth.uid()
  )
);

-- Insert policy :- Founder only can create --

create policy "workbench_insert_founder"
on public.workbenches
for insert
with check (
  auth.uid() = owner_user_id
);

--update policy :- founder and Ca only --

create policy "workbench_update_founder_ca"
on public.workbenches
for update
using (
  exists (
    select 1
    from workbench_members wm
    where wm.workbench_id = workbenches.id
      and wm.user_id = auth.uid()
      and wm.role in ('founder', 'ca')
  )
);


-- Delete policy :- founder only --
create policy "workbench_delete_founder"
on public.workbenches
for delete
using (
  exists (
    select 1
    from workbench_members wm
    where wm.workbench_id = workbenches.id
      and wm.user_id = auth.uid()
      and wm.role = 'founder'
  )
);

