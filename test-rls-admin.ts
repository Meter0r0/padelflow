import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function fix() {
    console.log("Forcing DB Token Update as ADMIN...");
    const { error, data } = await supabaseAdmin.from('clients')
        .update({ telegram_bot_token: '8020594754:AAFXlnll40gcu_3rHwO8g_0KW_tfmJdV3WI' })
        .eq('id', 'a4f26c61-082f-4257-bd02-1e0192fe3c0c')
        .select();
        
    console.log("Update ADMIN Error:", error);
    console.log("Updated rows:", data);
}
fix().catch(e => console.error(e));
