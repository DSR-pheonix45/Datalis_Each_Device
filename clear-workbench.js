
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://drwzmmmykrxluzmkgnda.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyd3ptbW15a3J4bHV6bWtnbmRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MTE0NzIsImV4cCI6MjA3ODA4NzQ3Mn0.K88d7QVsXqzI6hoZ73uFwpPh9gYI0O6zl7NjYZX5oOA';
const supabase = createClient(supabaseUrl, supabaseKey);

async function clearWorkbench() {
    const workbenchId = '51d4aeaa-08df-4be7-a0cf-20b99a44dd23'; // ID for 'test'
    console.log(`Clearing records for workbench ID: ${workbenchId}...`);

    const { error } = await supabase
        .from('workbench_records')
        .delete()
        .eq('workbench_id', workbenchId);

    if (error) {
        console.error('Error deleting records:', error);
    } else {
        console.log('Successfully deleted records. The workbench is now empty.');
    }
}

clearWorkbench();
