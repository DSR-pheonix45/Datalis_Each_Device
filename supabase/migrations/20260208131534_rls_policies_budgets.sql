alter table public.budgets enable row level security;

-- SELECT: All workbench members (including investor)
create policy "budgets_select_all_members"
on public.budgets
for select
using (
  exists (
    select 1
    from workbench_members wm
    where wm.workbench_id = budgets.workbench_id
      and wm.user_id = auth.uid()
  )
);

-- INSERT: Founder / CA / Analyst
create policy "budgets_insert_ops"
on public.budgets
for insert
with check (
  exists (
    select 1
    from workbench_members wm
    where wm.workbench_id = budgets.workbench_id
      and wm.user_id = auth.uid()
      and wm.role in ('founder', 'ca', 'analyst')
  )
);

-- UPDATE: Founder / CA / Analyst
create policy "budgets_update_ops"
on public.budgets
for update
using (
  exists (
    select 1
    from workbench_members wm
    where wm.workbench_id = budgets.workbench_id
      and wm.user_id = auth.uid()
      and wm.role in ('founder', 'ca', 'analyst')
  )
);

