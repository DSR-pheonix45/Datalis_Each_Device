-- Create storage bucket for workbench documents
insert into storage.buckets (id, name, public)
values ('workbench_documents', 'workbench_documents', false)
on conflict (id) do nothing;

-- Enable RLS on the bucket (if not already enabled by default)
-- Note: buckets table is in storage schema, policies are on storage.objects

create policy "Workbench members can view documents"
  on storage.objects for select
  using (
    bucket_id = 'workbench_documents'
    and (storage.foldername(name))[1]::uuid in (
      select workbench_id from public.workbench_members
      where user_id = auth.uid()
    )
  );

create policy "Workbench members can upload documents"
  on storage.objects for insert
  with check (
    bucket_id = 'workbench_documents'
    and (storage.foldername(name))[1]::uuid in (
      select workbench_id from public.workbench_members
      where user_id = auth.uid()
      and role in ('founder', 'ca', 'analyst', 'member')
    )
  );

create policy "Workbench admins can delete documents"
  on storage.objects for delete
  using (
    bucket_id = 'workbench_documents'
    and (storage.foldername(name))[1]::uuid in (
      select workbench_id from public.workbench_members
      where user_id = auth.uid()
      and role in ('founder', 'ca')
    )
  );
