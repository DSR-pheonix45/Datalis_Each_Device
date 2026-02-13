import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing environment variables')
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey)

    let body;
    try {
      body = await req.json()
    } catch (e) {
      throw new Error('Invalid JSON body')
    }

    const { name, books_start_date, description } = body

    if (!name || typeof name !== "string") {
      throw new Error("Workbench name is required");
    }

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('No authorization header')
    
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)

    if (authError || !user) throw new Error('Unauthorized')

    console.log(`[DEBUG] create-workbench: Creating workbench "${name}" for user ${user.id}`);

    // 1. Create the workbench
    const { data: workbench, error: wbError } = await supabaseClient
      .from("workbenches")
      .insert({
        name,
        description: description ?? null,
        books_start_date: books_start_date ?? null,
        state: 'CREATED',
        history_window_months: 12
      })
      .select()
      .single();

    if (wbError) {
      console.error('[DEBUG] create-workbench: Workbench insert error:', wbError);
      throw wbError;
    }

    // 2. Add the creator as the founder
    const { error: memberError } = await supabaseClient
      .from("workbench_members")
      .insert({
        workbench_id: workbench.id,
        user_id: user.id,
        role: 'founder'
      });

    if (memberError) {
      console.error('[DEBUG] create-workbench: Member insert error:', memberError);
      throw memberError;
    }

    // 3. Create initial ledger accounts
    const initialAccounts = [
      { 
        workbench_id: workbench.id, 
        name: 'Cash', 
        account_type: 'cash', 
        category: 'Cash', 
        cash_impact: true 
      },
      { 
        workbench_id: workbench.id, 
        name: 'Primary Bank', 
        account_type: 'bank', 
        category: 'Cash', 
        cash_impact: true 
      },
      { 
        workbench_id: workbench.id, 
        name: 'Accounts Receivable', 
        account_type: 'bank', 
        category: 'Receivable', 
        cash_impact: false 
      },
      { 
        workbench_id: workbench.id, 
        name: 'Accounts Payable', 
        account_type: 'bank', 
        category: 'Payable', 
        cash_impact: false 
      }
    ];

    const { error: accountsError } = await supabaseClient
      .from("workbench_accounts")
      .insert(initialAccounts);

    if (accountsError) {
      console.error('[DEBUG] create-workbench: Accounts insert error:', accountsError);
      // We don't throw here to avoid failing the whole workbench creation
      // but we log it.
    }

    // 4. Emit Audit Log
    await supabaseClient
      .from("audit_logs")
      .insert({
        workbench_id: workbench.id,
        user_id: user.id,
        action: 'CREATE_WORKBENCH',
        entity_type: 'workbenches',
        entity_id: workbench.id,
        new_data: { name }
      });

    return new Response(JSON.stringify(workbench), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('[DEBUG] create-workbench fatal error:', error);
    
    // Determine the error message
    const errorMessage = error instanceof Error ? error.message : 
                        (typeof error === 'object' && error !== null && 'message' in error ? (error as any).message : 
                        String(error));

    return new Response(JSON.stringify({ 
      error: errorMessage,
      details: error
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400, // Returning 400 because something actually failed
    })
  }
})
