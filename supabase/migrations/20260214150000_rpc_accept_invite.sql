create or replace function public.accept_invite(invite_token text)
returns json
language plpgsql
security definer
as $$
declare
  invite_record record;
  current_user_id uuid;
  existing_member_id uuid;
begin
  -- Get current user
  current_user_id := auth.uid();
  if current_user_id is null then
    return json_build_object('error', 'User not authenticated');
  end if;

  -- 1. Get Invite
  select * into invite_record
  from public.workbench_invites
  where token = invite_token;

  if invite_record.id is null then
    return json_build_object('error', 'Invalid token');
  end if;

  if invite_record.accepted_at is not null then
    return json_build_object('error', 'Invite already accepted');
  end if;

  if invite_record.expires_at < now() then
    return json_build_object('error', 'Invite expired');
  end if;

  -- 2. Check if already member
  select id into existing_member_id
  from public.workbench_members
  where workbench_id = invite_record.workbench_id
    and user_id = current_user_id;
  
  if existing_member_id is not null then
     update public.workbench_invites
     set accepted_at = now()
     where id = invite_record.id;
     
     return json_build_object('success', true, 'workbench_id', invite_record.workbench_id, 'message', 'Already a member');
  end if;

  -- 3. Insert Member
  insert into public.workbench_members (workbench_id, user_id, role, invited_by)
  values (invite_record.workbench_id, current_user_id, invite_record.role, invite_record.invited_by);

  -- 4. Mark Accepted
  update public.workbench_invites
  set accepted_at = now()
  where id = invite_record.id;

  return json_build_object('success', true, 'workbench_id', invite_record.workbench_id);
end;
$$;
