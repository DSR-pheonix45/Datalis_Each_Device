// Quick test script to see the actual Edge Function error
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://drwzmmmykrxluzmkgnda.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRyd3ptbW15a3J4bHV6bWtnbmRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MTE0NzIsImV4cCI6MjA3ODA4NzQ3Mn0.K88d7QVsXqzI6hoZ73uFwpPh9gYI0O6zl7NjYZX5oOA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testCreateWorkbench() {
    try {
        console.log('Testing create-workbench Edge Function...');

        const response = await fetch('https://drwzmmmykrxluzmkgnda.supabase.co/functions/v1/create-workbench', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseAnonKey}`,
                'apikey': supabaseAnonKey
            },
            body: JSON.stringify({
                name: 'Test Workbench',
                books_start_date: '2026-01-01',
                description: 'Test description'
            })
        });

        const responseText = await response.text();
        console.log('Status:', response.status);
        console.log('Response:', responseText);

        if (!response.ok) {
            console.error('Error response body:', responseText);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

testCreateWorkbench();
