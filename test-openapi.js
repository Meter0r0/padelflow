require('dotenv').config({ path: '.env.local' });
(async () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/';
  const res = await fetch(url, {
    headers: {
      apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    }
  });
  const data = await res.json();
  // find the 'matches' definition
  const matches = data.definitions.matches;
  console.log('matches.created_at type:', matches.properties.created_at.type, matches.properties.created_at.format, matches.properties.created_at.default);
})();
