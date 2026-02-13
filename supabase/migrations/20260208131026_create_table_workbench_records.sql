create table public.workbench_records (
  id uuid primary key default gen_random_uuid(),

  workbench_id uuid not null
    references workbenches(id) on delete cascade,

  record_type text not null
    check (record_type in (
      'transaction',
      'compliance',
      'budget',
      'chat',
      'document',
      'adjustment'
    )),

  reference_id uuid, 
  -- points to the actual domain table row

  summary text, 
  -- human readable line: "???20,000 paid to X vendor"

  metadata jsonb,
  -- lightweight context (amount, date, party name)

  created_by uuid
    references auth.users(id),

  created_at timestamptz default now()
);

