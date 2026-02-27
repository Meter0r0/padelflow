require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
(async () => {
  const { data, error } = await supabase.rpc('get_schema');
  if (error) {
    // try direct query to pg_catalog or we can just fetch via REST if it's exposed, but information_schema is usually restricted.
    // Instead we can just do a raw SQL query if we have REST endpoints for it. 
    console.log("Error running rpc:", error.message);
  }
})();
