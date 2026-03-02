const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase.rpc('get_policies'); // Common function if exists
  if (error) {
      // If RPC doesn't exist, we will try to just do an update that we know should fall under RLS but might be failing for schema reasons
      const result = await supabase.from('clients').update({ telegram_bot_token: '8020594754:AAFXlnll40gcu_3rHwO8g_0KW_tfmJdV3WI' }).eq('id', 'a4f26c61-082f-4257-bd02-1e0192fe3c0c');
      console.log('Update Result:', result);
  }
}
check();
