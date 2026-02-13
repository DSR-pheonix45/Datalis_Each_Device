create table public.adjustments (
  id uuid primary key default gen_random_uuid(),

  workbench_id uuid not null
    references public.workbenches(id)
    on delete cascade,

  original_transaction_id uuid not null
    references public.transactions(id)
    on delete restrict,

  adjustment_type text not null
    check (adjustment_type in (
      'reverse',
      'reclassify',
      'correct_budget',
      'party_correction'
    )),

  -- what is being corrected
  reason text not null,

  -- optional correction targets
  corrected_party_id uuid
    references public.workbench_parties(id),

  corrected_budget_id uuid
    references public.budgets(id),

  -- monetary impact (signed)
  adjustment_amount numeric not null,

  created_by uuid not null
    references auth.users(id),

  created_at timestamptz default now(),

  unique (original_transaction_id)
);

