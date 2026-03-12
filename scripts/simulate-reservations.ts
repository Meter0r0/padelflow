import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''; // Use service_role if available to bypass RLS for inserts
const supabase = createClient(supabaseUrl, supabaseKey);

const DAYS_TO_SIMULATE = 7;
const START_HOUR = 8; // 08:00
const END_HOUR = 23; // 23:59

// Helpers for random data
const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomDuration = () => (Math.random() < 0.5 ? 60 : 90);
const firstNames = ['Ariel', 'Juan', 'Carlos', 'Martin', 'Lucas', 'Matias', 'Diego', 'Facundo', 'Nico', 'Tomas', 'Fede', 'Santi', 'Eze', 'Ale', 'Gaby'];
const lastNames = ['Perez', 'Garcia', 'Gomez', 'Rodriguez', 'Fernandez', 'Lopez', 'Martinez', 'Sanchez', 'Donofrio', 'Diaz', 'Romero', 'Suarez'];
const getRandomName = () => `${firstNames[getRandomInt(0, firstNames.length - 1)]} ${lastNames[getRandomInt(0, lastNames.length - 1)]}`;

async function main() {
    console.log('🔄 Iniciando simulación de reservas...');

    // 1. Fetch all courts and clubs
    const { data: courts, error: courtsError } = await supabase.from('courts').select('id, name, club_id, is_active').eq('is_active', true);
    if (courtsError) {
        console.error('Error fetching courts:', courtsError);
        return;
    }

    if (!courts || courts.length === 0) {
        console.log('No active courts found.');
        return;
    }

    console.log(`✅ Se encontraron ${courts.length} canchas activas.`);

    // 2. Generate slots for the next X days
    const now = new Date();
    // Start from tomorrow or today if early
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let matchesToInsert = [];

    for (const court of courts) {
        console.log(`\n📅 Generando para cancha: ${court.name} (Club: ${court.club_id})`);

        for (let dayOffset = 0; dayOffset < DAYS_TO_SIMULATE; dayOffset++) {
            const currentDate = new Date(today);
            currentDate.setDate(currentDate.getDate() + dayOffset);

            // We iterate exactly in 30-min steps to pack things tightly or skip.
            let currentMinOfDate = START_HOUR * 60; // start at e.g 08:00
            const endMinOfDate = (END_HOUR + 1) * 60; // 24:00

            while (currentMinOfDate < endMinOfDate) {
                const hourOfDay = Math.floor(currentMinOfDate / 60);

                // Probability limits:
                const probability = hourOfDay < 18 ? 0.10 : 0.70;

                // Do we book this slot?
                const isBooked = Math.random() < probability;

                // Even if not booked, we need to decide next possible start
                let durationMinutes = 30; // default step if not booked

                if (isBooked) {
                    durationMinutes = getRandomDuration();

                    // Create date
                    const matchDate = new Date(currentDate);
                    matchDate.setHours(hourOfDay, currentMinOfDate % 60, 0, 0);

                    // Skip if date is in the past (actually, allow past for today if we want historical, but let's say only future within today)
                    if (matchDate > now) {
                        const isoString = matchDate.toISOString();

                        // Register Match
                        matchesToInsert.push({
                            club_id: court.club_id,
                            court_details: court.name,
                            status: 'confirmed',
                            court_status: 'reserved',
                            proposed_time: isoString,
                            confirmed_option: isoString,
                            options: [isoString],
                            duration_minutes: durationMinutes,
                            is_regular: false,
                            is_deposit_paid: Math.random() < 0.8, // 80% paid deposit
                            created_at: new Date().toISOString()
                        });
                    }
                }

                currentMinOfDate += durationMinutes;
            }
        }
    }

    console.log(`\n🚀 Se generaron ${matchesToInsert.length} reservas para insertar.`);

    // 3. Insert in batches and create participants
    for (let i = 0; i < matchesToInsert.length; i++) {
        const payload = matchesToInsert[i];

        const { data: insertedMatch, error: matchError } = await supabase
            .from('matches')
            .insert([payload])
            .select()
            .single();

        if (matchError) {
            console.error('Error insertando partido:', matchError, payload);
            continue;
        }

        const matchId = insertedMatch.id;
        // Insert participants (4)
        const participantsPayload = Array.from({ length: 4 }).map((_, idx) => ({
            match_id: matchId,
            name: getRandomName(),
            status: 'accepted',
            is_organizer: idx === 0,
            selected_options: [0]
        }));

        const { error: partError } = await supabase
            .from('participants')
            .insert(participantsPayload);

        if (partError) {
            console.error(`Error insertando participantes para match ${matchId}:`, partError);
        } else {
            if ((i + 1) % 10 === 0) {
                console.log(`   └ Progreso: ${i + 1} / ${matchesToInsert.length}`);
            }
        }
    }

    console.log('\n✅ Simulación completada exitosamente.');
}

main().catch(console.error);
