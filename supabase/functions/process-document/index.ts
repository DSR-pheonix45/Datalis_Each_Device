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

  // We capture variables outside the try block for use in catch
  let currentWorkbenchId: string | null = null;
  let currentFilePath: string | null = null;
  let currentDocId: string | null = null;

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const body = await req.json();
    const { 
      workbench_id, 
      file_path, 
      file_name, 
      file_size, 
      mime_type, 
      document_type 
    } = body;

    currentWorkbenchId = workbench_id;
    currentFilePath = file_path;

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabaseClient.auth.getUser(token)

    if (!user) throw new Error('Unauthorized')

    // 1. Insert into workbench_documents
    const docInsertData: any = {
      workbench_id,
      file_path,
      document_type,
      processing_status: 'uploaded'
    };

    // Add optional columns if they exist
    docInsertData.file_name = file_name;
    docInsertData.file_size = file_size;
    docInsertData.mime_type = mime_type;
    docInsertData.uploaded_by = user.id;

    let { data: docData, error: dbError } = await supabaseClient
      .from("workbench_documents")
      .insert(docInsertData)
      .select()
      .single();

    if (dbError) {
      console.error("Insert error, trying minimal insert:", dbError);
      const { data: retryData, error: retryError } = await supabaseClient
        .from("workbench_documents")
        .insert({
          workbench_id,
          file_path,
          document_type,
          processing_status: 'uploaded'
        })
        .select()
        .single();
      
      if (retryError) throw retryError;
      docData = retryData;
    }

    if (!docData) throw new Error("Failed to create document record");
    currentDocId = docData.id;

    // 1b. Update status to parsing immediately
    await supabaseClient
      .from("workbench_documents")
      .update({ processing_status: 'parsing' })
      .eq("id", docData.id);

    // 2. Create Audit Log Record and Emit Audit Log in parallel
    const logData: any = {
      workbench_id,
      record_type: 'document',
      summary: `Document uploaded: ${file_name || 'unknown'}`,
      metadata: {
        file_name,
        file_size,
        mime_type,
        document_type,
        user: user.email
      },
      created_by: user.id
    };
    logData.reference_id = docData.id;
    logData.document_id = docData.id;

    const [logResult, auditResult] = await Promise.all([
      supabaseClient.from("workbench_records").insert(logData),
      supabaseClient.from("audit_logs").insert({
        workbench_id,
        user_id: user.id,
        action: 'UPLOAD_DOCUMENT',
        entity_type: 'workbench_documents',
        entity_id: docData.id,
        new_data: { file_name, file_path, document_type }
      })
    ]);

    if (logResult.error) console.error("Error creating audit log record:", logResult.error);
    if (auditResult.error) console.error("Error emitting audit log:", auditResult.error);

    // 4. Simulate OCR Processing
    
    // 4a. Find or create a default party for the workbench
    let { data: party } = await supabaseClient
      .from("workbench_parties")
      .select("id")
      .eq("workbench_id", workbench_id)
      .limit(1)
      .maybeSingle();

    if (!party) {
      const { data: newParty, error: partyError } = await supabaseClient
        .from("workbench_parties")
        .insert({
          workbench_id,
          name: "Miscellaneous Party",
          party_type: 'customer'
        })
        .select()
        .single();
      
      if (!partyError) party = newParty;
    }

    // 4b. Create a financial record based on the document
    const mockAmount = Math.floor(Math.random() * 90000) + 10000;
    const recordType = document_type === 'invoice' ? 'invoice' : (document_type === 'bill' ? 'bill' : 'transaction');
    
    const financialRecord: any = {
      workbench_id,
      record_type: recordType,
      party_id: party?.id,
      summary: `${(document_type || 'DOCUMENT').toUpperCase()} - ${file_name || 'unnamed'}`,
      net_amount: mockAmount,
      gross_amount: mockAmount,
      tax_amount: 0,
      issue_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'draft',
      confidence_score: 0.95,
      created_by: user.id
    };

    // Use both document_id and reference_id for maximum compatibility with different schema versions
    financialRecord.document_id = docData.id;
    financialRecord.reference_id = docData.id;

    let { error: recordError } = await supabaseClient
      .from("workbench_records")
      .insert(financialRecord);

    // If it fails, try a minimal insert without the potentially problematic columns
    if (recordError) {
      console.error("Financial record insert failed, trying minimal version:", recordError);
      const minimalRecord = {
        workbench_id,
        record_type: recordType,
        party_id: party?.id,
        summary: financialRecord.summary,
        net_amount: mockAmount,
        status: 'draft',
        created_by: user.id
      };
      const { error: minimalError } = await supabaseClient
        .from("workbench_records")
        .insert(minimalRecord);
      
      if (minimalError) throw minimalError;
    }

    // 4c. Update document status to parsed
    const { data: updatedDoc, error: updateError } = await supabaseClient
      .from("workbench_documents")
      .update({ processing_status: 'parsed' })
      .eq("id", docData.id)
      .select()
      .single();

    if (updateError) throw updateError;

    return new Response(JSON.stringify(updatedDoc || docData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error("Processing error:", error);
    
    try {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      if (currentDocId) {
        await supabaseClient
          .from("workbench_documents")
          .update({ processing_status: 'failed' })
          .eq("id", currentDocId);
      } else if (currentWorkbenchId && currentFilePath) {
        await supabaseClient
          .from("workbench_documents")
          .update({ processing_status: 'failed' })
          .eq("workbench_id", currentWorkbenchId)
          .eq("file_path", currentFilePath);
      }
    } catch (e) {
      console.error("Failed to mark document as failed:", e);
    }

    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})