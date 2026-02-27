
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ouzpxtjhkfdminnkzuxd.supabase.co';
const supabaseKey = 'sb_publishable_5Nd6MVZD13nkZlHv8ge_dA_J3dCD-lh';
const supabase = createClient(supabaseUrl, supabaseKey);

async function fetchLatestMatch() {
    const { data, error } = await supabase
        .from('matches')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (error) {
        console.error('Error fetching match:', error);
        return;
    }

    if (data) {
        console.log(`LATEST_MATCH_ID:${data.id}`);
    } else {
        console.log('No matches found.');
    }
}

fetchLatestMatch();
