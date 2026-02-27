require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
(async () => {
  const { data } = await supabase.from('matches').select('id, created_at').order('created_at', { ascending: false }).limit(1);
  console.log('from DB:', data[0].created_at);
  const matched = data[0].created_at;
  const fixed = matched + (matched.endsWith('Z') || matched.match(/[+-]\d{2}:?\d{2}$/) ? '' : 'Z');
  console.log('fixed:', fixed);
  console.log('output:', new Date(fixed).toLocaleString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' }));
})();
