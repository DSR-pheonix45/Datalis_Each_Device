
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://drwzmmmykrxluzmkgnda.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyd3ptbW15a3J4bHV6bWtnbmRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MTE0NzIsImV4cCI6MjA3ODA4NzQ3Mn0.K88d7QVsXqzI6hoZ73uFwpPh9gYI0O6zl7NjYZX5oOA';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkWorkbench() {
    console.log("Checking for workbench named 'test'...");
    const { data: wbs, error: wbError } = await supabase
        .from('workbenches')
        .select('*')
        .ilike('name', '%test%');

    if (wbError) {
        console.error('Error fetching workbench:', wbError);
        return;
    }

    if (wbs.length === 0) {
        console.log("No workbench found with name 'test'.");
        return;
    }

    console.log(`Found ${wbs.length} workbenches.`);

    for (const wb of wbs) {
        console.log(`\nWorkbench: "${wb.name}" (ID: ${wb.id})`);

        // Check Record Count
        const { count, error } = await supabase
            .from("workbench_records")
            .select("id", { count: 'exact', head: true })
            .eq("workbench_id", wb.id);

        if (error) {
            console.error("  Error counting records:", error);
        } else {
            console.log(`  Records Count: ${count}`);
            if (count === 0) {
                console.log("  Pass: Is truly empty.");
            } else {
                console.log("  Fail: Not empty.");
            }
        }
    }
}

checkWorkbench();
