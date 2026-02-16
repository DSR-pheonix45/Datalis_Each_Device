// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// @ts-ignore
serve(async (req: Request) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabase = createClient(
            // @ts-ignore
            Deno.env.get('SUPABASE_URL') ?? '',
            // @ts-ignore
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        // Parse multipart form data
        const formData = await req.formData()
        const file = formData.get('file')

        if (!file) {
            return new Response(
                JSON.stringify({ error: 'No file uploaded', success: false }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            )
        }

        // Get the user from the authorization header
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return new Response(
                JSON.stringify({ error: 'Unauthorized', success: false }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
            )
        }

        // Return a dataset object. In a real deployment, this would insert into a database table
        // and potentially upload the file to storage.
        const dataset = {
            id: crypto.randomUUID(),
            user_id: user.id,
            filename: (file as File).name,
            size_bytes: (file as File).size,
            mime_type: (file as File).type,
            created_at: new Date().toISOString()
        }

        return new Response(
            JSON.stringify({ success: true, dataset }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error: any) {
        console.error(error)
        return new Response(
            JSON.stringify({ error: error?.message || 'Unknown error', success: false }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
    }
})
