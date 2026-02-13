import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { workbench_id, record_type, summary, metadata } = await req.json()

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabaseClient.auth.getUser(token)

    if (!user) throw new Error('Unauthorized')

    console.log(`Creating record: ${record_type}`, { workbench_id, summary, metadata });

    let reference_id = null;
    let entity_type = 'workbench_records';
    let recordData = null;

    // 1. Insert into Domain Tables
    if (record_type === 'party') {
      entity_type = 'workbench_parties';
      const { data, error } = await supabaseClient
        .from("workbench_parties")
        .insert({
          workbench_id,
          name: metadata.party_name || summary,
          party_type: metadata.party_type || 'both',
          gstin: metadata.gstin,
          pan: metadata.pan
        })
        .select()
        .single();
      if (error) throw error;
      reference_id = data.id;
      
      // Also create a log in workbench_records so it shows in the activity feed
      const { data: logRecord, error: logError } = await supabaseClient
        .from("workbench_records")
        .insert({
          workbench_id,
          record_type: 'party',
          summary: summary || metadata.party_name,
          party_id: data.id,
          reference_id: data.id,
          metadata: {
            ...metadata,
            user: user.email
          },
          created_by: user.id,
          status: 'confirmed'
        })
        .select()
        .single();
      
      if (logError) console.error("Error creating party log record:", logError);
      recordData = logRecord || data;
    } else {
      // All other types (transaction, compliance, budget) go into workbench_records
      const insertData: any = {
        workbench_id,
        record_type,
        summary,
        metadata: {
          ...metadata,
          user: user.email
        },
        created_by: user.id,
        status: 'draft'
      };

      // Map specific fields based on type
      if (record_type === 'transaction') {
        const amount = parseFloat(metadata.amount) || 0;
        insertData.gross_amount = amount;
        insertData.net_amount = amount;
        insertData.issue_date = metadata.transaction_date;
        insertData.party_id = metadata.party_id && metadata.party_id !== "" ? metadata.party_id : null;
        insertData.status = 'confirmed'; // Transactions are confirmed by default if created manually?
      } else if (record_type === 'budget') {
        const amount = parseFloat(metadata.amount) || 0;
        insertData.gross_amount = amount;
        insertData.net_amount = amount;
        insertData.summary = metadata.budget_name || summary;
      } else if (record_type === 'compliance') {
        insertData.issue_date = metadata.deadline;
        insertData.status = metadata.status === 'filed' ? 'confirmed' : 'draft';
        insertData.summary = metadata.name || summary;
      }

      const { data, error } = await supabaseClient
        .from("workbench_records")
        .insert(insertData)
        .select()
        .single();
      
      if (error) {
        console.error("Database error inserting workbench_record:", error);
        throw error;
      }
      reference_id = data.id;
      recordData = data;

      // 2. ALSO Insert into Domain-specific tables for visibility in tabs
      if (record_type === 'budget') {
        const insertData = {
          workbench_id,
          name: metadata.budget_name || summary,
          total_amount: parseFloat(metadata.amount) || 0,
          period_start: new Date().toISOString().split('T')[0],
          period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days default
          metadata: { ...metadata, record_id: data.id }
        };
        
        console.log("Inserting domain budget:", insertData);
        
        const { data: budget, error: bError } = await supabaseClient
          .from("budgets")
          .insert(insertData)
          .select()
          .single();
        
        if (!bError && budget) {
          // Add a default budget item so it shows in the table
          await supabaseClient
            .from("budget_items")
            .insert({
              budget_id: budget.id,
              category: metadata.department || 'General',
              amount: parseFloat(metadata.amount) || 0
            });
        } else if (bError) {
          console.error("Error creating domain budget:", bError);
        }
      } else if (record_type === 'compliance') {
        const insertData = {
          workbench_id,
          name: metadata.name || summary,
          deadline: metadata.deadline,
          status: metadata.status || 'pending',
          filed_date: metadata.status === 'filed' ? (metadata.filed_date || new Date().toISOString().split('T')[0]) : null
        };
        
        console.log("Inserting domain compliance:", insertData);
        
        const { error: cError } = await supabaseClient
          .from("compliances")
          .insert(insertData);
        
        if (cError) console.error("Error creating domain compliance:", cError);
      } else if (record_type === 'transaction') {
        const insertData = {
          workbench_id,
          amount: parseFloat(metadata.amount) || 0,
          direction: metadata.direction,
          transaction_date: metadata.transaction_date,
          payment_type: metadata.payment_type,
          party_id: metadata.party_id && metadata.party_id !== "" ? metadata.party_id : null,
          party_account_id: metadata.party_account_id && metadata.party_account_id !== "" ? metadata.party_account_id : null,
          workbench_account_id: metadata.workbench_account_id && metadata.workbench_account_id !== "" ? metadata.workbench_account_id : null,
          external_reference: metadata.external_reference || null,
          source_document_id: metadata.source_document_id && metadata.source_document_id !== "" ? metadata.source_document_id : null,
          invoice_document_id: metadata.invoice_document_id && metadata.invoice_document_id !== "" ? metadata.invoice_document_id : null,
          purpose: metadata.purpose || null,
          created_by: user.id
        };
        
        console.log("Inserting domain transaction:", insertData);
        
        const { error: tError } = await supabaseClient
          .from("transactions")
          .insert(insertData);
        
        if (tError) {
          console.error("Error creating domain transaction:", tError);
          // Return the error to the client for better debugging
          throw new Error(`Transaction table insert failed: ${tError.message}`);
        }
      }
    }

    // 3. Emit Audit Log
    await supabaseClient
      .from("audit_logs")
      .insert({
        workbench_id,
        user_id: user.id,
        action: `CREATE_${record_type.toUpperCase()}`,
        entity_type,
        entity_id: reference_id,
        new_data: { metadata, summary }
      });

    return new Response(JSON.stringify(recordData), {
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
