-- Add metadata columns to workbench_documents
-- This migration adds support for storing original filename, file size, and content type.

alter table public.workbench_documents 
add column if not exists filename text,
add column if not exists size_bytes bigint,
add column if not exists content_type text;

-- Optional: You can run this to backfill filenames for existing records
-- update public.workbench_documents 
-- set filename = split_part(file_path, '/', 2) 
-- where filename is null and file_path like '%/%';
