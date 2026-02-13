alter table public.transactions enable row level security;

-- SELECT
create policy "transactions_select_all_members"
on public.transactions
for select
using (
  exists (
    select 1
    from workbench_members wm
    where wm.workbench_id = transactions.workbench_id
      and wm.user_id = auth.uid()
  )
);

-- INSERT
create policy "transactions_insert_ops"
on public.transactions
for insert
with check (
  exists (
    select 1
    from workbench_members wm
    where wm.workbench_id = transactions.workbench_id
      and wm.user_id = auth.uid()
      and wm.role in ('founder', 'ca', 'analyst')
  )
);

-- UPDATE
create policy "transactions_update_ops"
on public.transactions
for update
using (
  exists (
    select 1
    from workbench_members wm
    where wm.workbench_id = transactions.workbench_id
      and wm.user_id = auth.uid()
      and wm.role in ('founder', 'ca', 'analyst')
  )
);

