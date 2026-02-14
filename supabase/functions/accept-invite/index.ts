import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { invite_token } = await req.json()

        // Get user from auth header
        const authHeader = req.headers.get('Authorization')!
        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)

        if (authError || !user) throw new Error('Unauthorized')

        console.log(`User ${user.id} attempting to accept invite: ${invite_token}`);

        // 1. Validate Invite
        const { data: invite, error: inviteError } = await supabaseClient
            .from('workbench_invites')
            .select('*')
            .eq('token', invite_token)
            .single()

        if (inviteError || !invite) {
            return new Response(
                JSON.stringify({ error: 'Invite not found or invalid token' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
            )
        }

        if (invite.accepted_at) {
            return new Response(
                JSON.stringify({ error: 'Invite already accepted' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            )
        }

        if (new Date(invite.expires_at) < new Date()) {
            return new Response(
                JSON.stringify({ error: 'Invite has expired' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            )
        }

        // 2. Check if already a member
        const { data: existingMember } = await supabaseClient
            .from('workbench_members')
            .select('id')
            .eq('workbench_id', invite.workbench_id)
            .eq('user_id', user.id)
            .maybeSingle()

        if (existingMember) {
            // Just mark invite as accepted if user is already member
            await supabaseClient
                .from('workbench_invites')
                .update({ accepted_at: new Date().toISOString() })
                .eq('id', invite.id)

            return new Response(
                JSON.stringify({ success: true, message: "Already a member", workbench_id: invite.workbench_id }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            )
        }

        // 3. Add to Members
        const { error: memberError } = await supabaseClient
            .from('workbench_members')
            .insert({
                workbench_id: invite.workbench_id,
                user_id: user.id,
                role: invite.role,
                invited_by: invite.invited_by
            })

        if (memberError) {
            console.error("Error adding member:", memberError);
            throw memberError;
        }

        // 4. Mark Invite Accepted
        const { error: updateError } = await supabaseClient
            .from('workbench_invites')
            .update({ accepted_at: new Date().toISOString() })
            .eq('id', invite.id)

        if (updateError) console.error("Error updating invite status:", updateError);

        return new Response(
            JSON.stringify({ success: true, workbench_id: invite.workbench_id }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error) {
        console.error('Error processing invite:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
