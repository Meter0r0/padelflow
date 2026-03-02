import { supabase } from './src/lib/supabase';

async function cleanup() {
    console.log("Cleaning up test clubs...");
    await supabase.from('clubs').delete().eq('name', 'Test Club V2');
    console.log("Cleanup complete.");
}
cleanup().catch(console.error);
