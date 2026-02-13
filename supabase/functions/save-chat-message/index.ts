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

    const { session_id, role, content, metadata, workbench_id } = await req.json()

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabaseClient.auth.getUser(token)

    if (!user) throw new Error('Unauthorized')

    // 1. Save message
    const { data: message, error } = await supabaseClient
      .from("chat_messages")
      .insert({
        session_id,
        role,
        content,
        metadata
      })
      .select()
      .single();

    if (error) throw error;

    // 3. Create audit log if in workbench context
    if (workbench_id) {
      await supabaseClient.from("workbench_records").insert({
        workbench_id,
        record_type: 'chat',
        summary: `Chat Interaction: ${role === 'user' ? 'Query' : 'Response'}`,
        metadata: {
          content: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
          user: user.email
        },
        created_by: user.id
      });
    }

    return new Response(JSON.stringify(message), {
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
