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

    if (memberError) throw new Error('Unauthorized');

    // 2. Query Derived Views (Module 7)
    const { data: pAndL } = await supabaseClient
      .from("profit_and_loss")
      .select("*")
      .eq("workbench_id", workbench_id);

    const { data: balanceSheet } = await supabaseClient
      .from("balance_sheet")
      .select("*")
      .eq("workbench_id", workbench_id);

    // 3. Calculate KPIs
    const totalRevenue = pAndL?.filter(a => a.category === 'Sales').reduce((sum, a) => sum + Number(a.balance), 0) || 0;
    const totalExpenses = pAndL?.filter(a => a.category === 'Operations').reduce((sum, a) => sum + Number(a.balance), 0) || 0;
    const netProfit = totalRevenue - totalExpenses;

    const intelligence = {
      pAndL,
      balanceSheet,
      kpis: {
        totalRevenue,
        totalExpenses,
        netProfit,
        burnRate: totalExpenses / 12, // Simple monthly average
      }
    };

    // 4. Emit Audit Log
    await supabaseClient
      .from("audit_logs")
      .insert({
        workbench_id,
        user_id: user.id,
        action: 'GET_INTELLIGENCE',
        entity_type: 'workbenches',
        entity_id: workbench_id,
        new_data: { kpis: intelligence.kpis }
      });

    return new Response(JSON.stringify(intelligence), {
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
