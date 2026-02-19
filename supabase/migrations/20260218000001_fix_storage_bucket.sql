-- Ensure storage bucket 'workbench_documents' exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'workbench_documents', 
    'workbench_documents', 
    FALSE, 
    10485760, -- 10MB
    ARRAY['application/pdf', 'image/png', 'image/jpeg', 'text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
)
ON CONFLICT (id) DO UPDATE SET
    public = FALSE,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['application/pdf', 'image/png', 'image/jpeg', 'text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];

-- Drop existing policies to avoid conflicts/duplicates
DROP POLICY IF EXISTS "Workbench members can view documents" ON storage.objects;
DROP POLICY IF EXISTS "Workbench members can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Workbench admins can delete documents" ON storage.objects;

-- Enable RLS (should be on by default for storage.objects, but good to ensure)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy 1: VIEW (Select)
-- Members can view files in their workbench folder
CREATE POLICY "Workbench members can view documents"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'workbench_documents'
    AND (storage.foldername(name))[1]::uuid IN (
        SELECT workbench_id 
        FROM public.workbench_members 
        WHERE user_id = auth.uid()
    )
);

-- Policy 2: UPLOAD (Insert)
-- Members with appropriate roles can upload
CREATE POLICY "Workbench members can upload documents"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'workbench_documents'
    AND (storage.foldername(name))[1]::uuid IN (
        SELECT workbench_id 
        FROM public.workbench_members 
        WHERE user_id = auth.uid()
        AND role IN ('founder', 'ca', 'analyst', 'member')
    )
);

-- Policy 3: DELETE
-- Only admins (founder/ca) can delete
CREATE POLICY "Workbench admins can delete documents"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'workbench_documents'
    AND (storage.foldername(name))[1]::uuid IN (
        SELECT workbench_id 
        FROM public.workbench_members 
        WHERE user_id = auth.uid()
        AND role IN ('founder', 'ca')
    )
);

-- Verification Query (Optional, run manually to check)
-- SELECT * FROM storage.buckets WHERE id = 'workbench_documents';
