import { supabase } from './src/lib/supabase';
async function test() {
    const { data } = await supabase.from('clients').select('id, name');
    console.log("All Active Clients:", data);
}
test().catch(e => console.error(e));
