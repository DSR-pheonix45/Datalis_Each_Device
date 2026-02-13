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

    const { workbench_id } = await req.json()

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabaseClient.auth.getUser(token)

    if (!user) throw new Error('Unauthorized')

    // 1. Validate permissions
    const { data: member, error: memberError } = await supabaseClient
      .from("workbench_members")
      .select("role")
      .eq("workbench_id", workbench_id)
      .eq("user_id", user.id)
      .single();

    if (memberError || !['founder', 'ca'].includes(member.role)) {
      throw new Error('Insufficient permissions to run reconciliation');
    }

    // 2. Perform Reconciliation Checks (Simplified Logic)
    // In a real system, this would compare transactions against uploaded bank statements
    const issues = [];
    const { data: transactions } = await supabaseClient
      .from("transactions")
      .select("*")
      .eq("workbench_id", workbench_id);

    if (!transactions || transactions.length === 0) {
      issues.push("No transactions found for reconciliation");
    }

    const health_score = issues.length === 0 ? 100 : Math.max(0, 100 - (issues.length * 20));

    // 3. Update Workbench State if Bootstrapping
    const { data: workbench } = await supabaseClient
      .from("workbenches")
      .select("state")
      .eq("id", workbench_id)
      .single();

    if (workbench?.state === 'BOOTSTRAPPING') {
      await supabaseClient
        .from("workbenches")
        .update({ state: 'BOOTSTRAP_COMPLETE' })
        .eq("id", workbench_id);
    }

    // 4. Emit Audit Log
    await supabaseClient
      .from("audit_logs")
      .insert({
        workbench_id,
        user_id: user.id,
        action: 'RUN_RECONCILIATION',
        entity_type: 'workbenches',
        entity_id: workbench_id,
        new_data: { health_score, issues_found: issues.length }
      });

    return new Response(JSON.stringify({ 
      success: true, 
      health_score, 
      issues,
      state_transitioned: workbench?.state === 'BOOTSTRAPPING'
    }), {
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
