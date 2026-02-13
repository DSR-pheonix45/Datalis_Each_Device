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

    const { record_id } = await req.json()

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabaseClient.auth.getUser(token)

    if (!user) throw new Error('Unauthorized')

    // 1. Fetch record and validate
    const { data: record, error: fetchError } = await supabaseClient
      .from("workbench_records")
      .select("*, workbenches(id)")
      .eq("id", record_id)
      .single();

    if (fetchError || !record) throw new Error('Record not found');
    if (record.status === 'confirmed') throw new Error('Record already confirmed');

    // 2. Validate role (Ops Only)
    const { data: member, error: memberError } = await supabaseClient
      .from("workbench_members")
      .select("role")
      .eq("workbench_id", record.workbench_id)
      .eq("user_id", user.id)
      .single();

    if (memberError || !['founder', 'ca', 'analyst'].includes(member.role)) {
      throw new Error('Insufficient permissions to confirm record');
    }

    // 3. Update record status
    const { error: updateError } = await supabaseClient
      .from("workbench_records")
      .update({ status: 'confirmed' })
      .eq("id", record_id);

    if (updateError) throw updateError;

    // 4. Create Ledger Entries (Module 5)
    // Map UI direction to accounting entries
    // UI 'credit' = Money In = Accounting 'debit' for Cash/Bank
    // UI 'debit' = Money Out = Accounting 'credit' for Cash/Bank
    const direction = record.metadata?.direction || (record.record_type === 'income' ? 'credit' : 'debit');
    const entryType = direction === 'credit' ? 'debit' : 'credit';

    const { error: ledgerError } = await supabaseClient
      .from("ledger_entries")
      .insert({
        workbench_id: record.workbench_id,
        record_id: record.id,
        account_id: record.metadata?.account_id,
        counter_account_id: record.metadata?.counter_account_id,
        amount: record.net_amount,
        entry_type: entryType,
        transaction_date: record.issue_date || new Date().toISOString().split('T')[0],
        category: record.metadata?.category || 'unclassified'
      });

    if (ledgerError) {
      console.error("Ledger insertion error:", ledgerError);
      // Don't throw if ledger fail, just log it for now or decide if it's critical
    }

    // 5. Emit Audit Log
    await supabaseClient
      .from("audit_logs")
      .insert({
        workbench_id: record.workbench_id,
        user_id: user.id,
        action: 'CONFIRM_RECORD',
        entity_type: 'workbench_records',
        entity_id: record.id,
        new_data: { status: 'confirmed' }
      });

    return new Response(JSON.stringify({ success: true }), {
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
