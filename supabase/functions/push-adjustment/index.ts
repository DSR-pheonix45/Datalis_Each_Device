import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { workbench_id, original_record_id, adjustment_type, reason, metadata } = await req.json()

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabaseClient.auth.getUser(token)

    if (!user) throw new Error('Unauthorized')

    // 1. Fetch original record
    const { data: originalRecord, error: fetchError } = await supabaseClient
      .from("workbench_records")
      .select("*")
      .eq("id", original_record_id)
      .single();

    if (fetchError) throw fetchError;

    // 2. Create Adjustment Record
    const adjustmentAmount = parseFloat(metadata.adjustment_amount) || 0;
    const { data: adjustmentRecord, error: logError } = await supabaseClient
      .from("workbench_records")
      .insert({
        workbench_id,
        record_type: 'adjustment',
        reference_id: originalRecord.reference_id,
        summary: `Adjustment: ${reason}`,
        net_amount: adjustmentAmount,
        gross_amount: adjustmentAmount,
        metadata: {
          ...metadata,
          original_record_id,
          user: user.email
        },
        created_by: user.id
      })
      .select()
      .single();

    if (logError) throw logError;

    // 3. Apply Adjustments to Original Record / Domain Tables
    if (adjustment_type === 'party_correction' && metadata.corrected_party_id) {
      const { error: updateError } = await supabaseClient
        .from("workbench_records")
        .update({ party_id: metadata.corrected_party_id })
        .eq("id", original_record_id);
      
      if (updateError) throw updateError;
    }

    if (adjustment_type === 'reverse' || (metadata.adjustment_amount && metadata.adjustment_amount !== 0)) {
      const amountAdjustment = parseFloat(metadata.adjustment_amount) || 0;
      
      const { data: currentRecord } = await supabaseClient
        .from("workbench_records")
        .select("net_amount, gross_amount")
        .eq("id", original_record_id)
        .single();

      if (currentRecord) {
        const newNetAmount = (currentRecord.net_amount || 0) + amountAdjustment;
        const { error: updateError } = await supabaseClient
          .from("workbench_records")
          .update({ 
            net_amount: newNetAmount,
            metadata: {
              ...originalRecord.metadata,
              is_reversed: adjustment_type === 'reverse' && newNetAmount === 0,
              last_adjustment_id: adjustmentRecord.id
            }
          })
          .eq("id", original_record_id);
        
        if (updateError) throw updateError;
      }
    }

    // 4. Create Ledger Entry for Adjustment
    if (originalRecord.status === 'confirmed' && adjustmentAmount !== 0) {
      const direction = originalRecord.metadata?.direction || (originalRecord.record_type === 'income' ? 'credit' : 'debit');
      const entryType = adjustmentAmount > 0 
        ? (direction === 'credit' ? 'debit' : 'credit')
        : (direction === 'credit' ? 'credit' : 'debit');

      const { error: ledgerError } = await supabaseClient
        .from("ledger_entries")
        .insert({
          workbench_id,
          record_id: adjustmentRecord.id,
          account_id: originalRecord.metadata?.account_id,
          counter_account_id: originalRecord.metadata?.counter_account_id,
          amount: Math.abs(adjustmentAmount),
          entry_type: entryType,
          transaction_date: new Date().toISOString().split('T')[0],
          category: 'adjustment'
        });

      if (ledgerError) console.error("Adjustment Ledger Error:", ledgerError);
    }

    // 5. Emit Audit Log
    await supabaseClient
      .from("audit_logs")
      .insert({
        workbench_id,
        user_id: user.id,
        action: 'PUSH_ADJUSTMENT',
        entity_type: 'workbench_records',
        entity_id: adjustmentRecord.id,
        old_data: { original_record_id },
        new_data: { adjustment_type, reason, metadata }
      });

    return new Response(JSON.stringify(adjustmentRecord), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
