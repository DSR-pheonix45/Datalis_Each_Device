-- 1. Add workbench_record_id to transactions
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS workbench_record_id uuid REFERENCES public.workbench_records(id) ON DELETE CASCADE;

-- 2. Update Trigger Function to use workbench_record_id
CREATE OR REPLACE FUNCTION public.process_new_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_entry_type text;
  v_record_id uuid;
BEGIN
  -- Determine entry type based on transaction direction
  IF NEW.direction = 'credit' THEN
    v_entry_type := 'debit'; 
  ELSE
    v_entry_type := 'credit';
  END IF;

  -- Find associated record
  -- Priority 1: Direct link via workbench_record_id
  IF NEW.workbench_record_id IS NOT NULL THEN
    v_record_id := NEW.workbench_record_id;
  -- Priority 2: Fallback to document link (legacy)
  ELSIF NEW.source_document_id IS NOT NULL THEN
    SELECT id INTO v_record_id FROM public.workbench_records 
    WHERE document_id = NEW.source_document_id LIMIT 1;
  END IF;

  -- Insert Ledger Entry (Bank/Asset Side)
  INSERT INTO public.ledger_entries (
    workbench_id,
    record_id,
    account_id,
    amount,
    entry_type,
    category,
    description,
    transaction_date
  ) VALUES (
    NEW.workbench_id,
    v_record_id,
    NEW.workbench_account_id,
    NEW.amount,
    v_entry_type,
    NEW.purpose, -- Use purpose as category for now
    NEW.purpose, -- description
    NEW.transaction_date
  );

  RETURN NEW;
END;
$$;

-- 3. Cleanup Broken Ledger Entries (record_id is null)
-- We delete them so they don't cause double counting or "phantom" cash entries.
-- The intelligenceService will pick up the transactions from activeRecords since they won't be in ledger.
DELETE FROM public.ledger_entries WHERE record_id IS NULL;
