import { supabase } from './src/lib/supabase';
async function test() {
    console.log("Forcing DB Token Update...");
    const { error, data } = await supabase.from('clients').update({ telegram_bot_token: '8020594754:AAFXlnll40gcu_3rHwO8g_0KW_tfmJdV3WI' }).eq('id', 'a4f26c61-082f-4257-bd02-1e0192fe3c0c').select();
    console.log("Update Error:", error);
    console.log("Updated rows:", data);
}
test().catch(e => console.error(e));
