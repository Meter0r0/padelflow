import { supabase } from './src/lib/supabase';
async function test() {
    console.log("Testing Supabase RLS Write permissions...");
    // Try to update with standard client (anon key)
    const { error: err1, data: data1 } = await supabase.from('clients')
        .update({ name: 'Default Client (Test RLS)' })
        .eq('id', 'a4f26c61-082f-4257-bd02-1e0192fe3c0c')
        .select();
        
    console.log("Update with anon_key returned:", data1);
}
test().catch(e => console.error(e));
