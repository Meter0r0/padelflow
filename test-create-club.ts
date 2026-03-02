import { supabase } from './src/lib/supabase';

async function test() {
    console.log("Testing club creation...");
    const { data, error } = await supabase
        .from('clubs')
        .insert([{
            client_id: 'a4f26c61-082f-4257-bd02-1e0192fe3c0c',
            name: 'Test Club',
            address: '123 Test St',
            default_price: 15000,
            telegram_chat_id: 'PENDING_SETUP'
        }])
        .select()
        .single();
        
    console.log("Error:", error);
    console.log("Data:", data);
}

test().catch(console.error);
