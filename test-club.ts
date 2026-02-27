import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkClubs() {
    const { data: clubs, error } = await supabase.from('clubs').select('*').limit(1);

    if (clubs && clubs.length > 0) {
        const clubId = clubs[0].id;
        console.log("Found club id:", clubId);

        // try to update
        const { data: updatedClub, error: updateError } = await supabase
            .from('clubs')
            .update({ name: clubs[0].name })
            .eq('id', clubId)
            .select()
            .maybeSingle();

        console.log("Update Error:", updateError);
        console.log("Updated Club:", updatedClub);
    }
}

checkClubs();
