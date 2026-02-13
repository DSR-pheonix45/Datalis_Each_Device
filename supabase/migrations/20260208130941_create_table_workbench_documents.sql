create table public.workbench_documents (
  id uuid primary key default gen_random_uuid(),

  workbench_id uuid not null
    references workbenches(id) on delete cascade,

  uploaded_by uuid not null
    references auth.users(id),

  file_name text not null,
  file_path text not null,  -- full bucket path
  file_size bigint not null,
  mime_type text not null,

  document_type text
    check (document_type in (
      'bank_statement',
      'invoice',
      'ledger',
      'compliance',
      'contract',
      'other'
    )),

  processing_status text not null default 'uploaded'
    check (processing_status in (
      'uploaded',
      'parsing',
      'parsed',
      'failed'
    )),

  extracted_schema jsonb,     -- tables / columns inferred
  extracted_text text,        -- OCR / text content
  derived_tables jsonb,       -- normalized txns, ledgers etc.

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

