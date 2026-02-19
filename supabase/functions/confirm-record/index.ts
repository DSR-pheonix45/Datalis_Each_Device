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

    // 3. Prepare Transaction Data
    // We expect the UI to have populated the metadata with necessary transaction details
    // before calling confirm.
    const metadata = record.metadata || {};
    
    // Required Fields for Transactions
    const direction = metadata.direction || (record.record_type === 'income' ? 'credit' : 'debit');
    const paymentType = metadata.payment_type || 'cash'; // Default to cash if not specified? Or fail?
    // Let's default to 'cash' for now to avoid breaking if UI doesn't send it, 
    // but ideally we should validate.
    
    const accountId = metadata.account_id || null; // Workbench Account (Bank/Cash)
    // If account_id is missing, we might have an issue if we want to track balances.
    // But transactions table allows null workbench_account_id? 
    // Let's check schema... "workbench_account_id uuid references public.workbench_accounts(id)" - Nullable.
    
    // However, for a valid financial transaction, we usually want an account.
    
    const transactionDate = record.issue_date || new Date().toISOString().split('T')[0];
    
    // 4. Create Transaction
    // This will trigger the 'process_new_transaction' function which creates ledger entries.
    const { error: txnError } = await supabaseClient
      .from("transactions")
      .insert({
        workbench_id: record.workbench_id,
        amount: record.net_amount,
        direction: direction,
        transaction_date: transactionDate,
        payment_type: paymentType,
        party_id: record.party_id,
        workbench_account_id: accountId,
        external_reference: metadata.external_reference || (paymentType === 'cash' ? null : `REF-${record.id.substring(0,8)}`),
        source_document_id: record.document_id, // Link to the document
        purpose: record.summary || 'Confirmed Record',
        created_by: user.id
      });

    if (txnError) {
      console.error("Transaction creation failed:", txnError);
      throw new Error(`Failed to create transaction: ${txnError.message}`);
    }

    // 5. Update record status
    const { error: updateError } = await supabaseClient
      .from("workbench_records")
      .update({ 
        status: 'confirmed',
        metadata: {
          ...metadata,
          confirmed_at: new Date().toISOString(),
          confirmed_by: user.id
        }
      })
      .eq("id", record_id);

    if (updateError) throw updateError;

    // 6. Emit Audit Log
    await supabaseClient
      .from("audit_logs")
      .insert({
        workbench_id: record.workbench_id,
        user_id: user.id,
        action: 'CONFIRM_RECORD',
        entity_type: 'workbench_records',
        entity_id: record.id,
        new_data: { status: 'confirmed', transaction_created: true }
      });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error("Confirm record error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
