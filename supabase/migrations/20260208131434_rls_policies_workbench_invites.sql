-- Enable RLS --
alter table public.workbench_invites enable row level security;

-- SELECT: Founder or CA --
create policy "invites_select_founder_ca"
on public.workbench_invites
for select
using (
  exists (
    select 1
    from workbench_members wm
    where wm.workbench_id = workbench_invites.workbench_id
      and wm.user_id = auth.uid()
      and wm.role in ('founder', 'ca')
  )
);

-- INSERT: Founder or CA --
create policy "invites_insert_founder_ca"
on public.workbench_invites
for insert
with check (
  exists (
    select 1
    from workbench_members wm
    where wm.workbench_id = workbench_invites.workbench_id
      and wm.user_id = auth.uid()
      and wm.role in ('founder', 'ca')
  )
);

-- UPDATE (accept invite): Invited user only --
create policy "invites_accept_self"
on public.workbench_invites
for update
using (
  email = auth.email()
);
