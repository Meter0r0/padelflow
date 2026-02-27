import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
    const { data: sessionsToWarn, error: warnError } = await supabase
        .from('whatsapp_sessions')
        .select(`
            id,
            active_booking_id,
            matches (
                id,
                created_at,
                status,
                is_deposit_paid
            )
        `)
        .not('active_booking_id', 'is', null);

    console.log(JSON.stringify(sessionsToWarn?.slice(0, 2), null, 2));
}
run();
