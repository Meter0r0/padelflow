import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { WhatsAppService } from '@/services/whatsapp';
import { TelegramService } from '@/services/telegram';
import { MatchService } from '@/services/match';

/**
 * CRON JOB (Simulated): Check for pending reservations that are about to expire.
 * 
 * Logic:
 * 1. Reminders: 15 mins before expiry (45-50 mins since creation).
 * 2. Expirations: Cancel after 65 mins.
 */

export async function GET(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    console.log('[Cron] Checking expirations...');

    const now = new Date();
    const fortyFiveMinsAgo = new Date(now.getTime() - 45 * 60000);
    const fiftyMinsAgo = new Date(now.getTime() - 50 * 60000);
    const sixtyMinsAgo = new Date(now.getTime() - 60 * 60000);
    const sixtyFiveMinsAgo = new Date(now.getTime() - 65 * 60000);

    // ==========================================
    // 1. SESSION-BASED NOTIFICATIONS & BOT RESET
    // ==========================================
    const { data: sessionsToWarn, error: warnError } = await supabase
        .from('whatsapp_sessions')
        .select(`
            id,
            phone_number,
            telegram_chat_id,
            provider,
            active_booking_id,
            client_id,
            matches (
                id,
                created_at,
                status,
                is_deposit_paid
            )
        `)
        .not('active_booking_id', 'is', null)
        .eq('current_state', 'AWAITING_PAYMENT');

    if (warnError) console.error('[Cron] Warn Error:', warnError);

    let sessionsProcessed = 0;

    if (sessionsToWarn) {
        for (const session of sessionsToWarn) {
            const match = (session as any).matches;
            if (!match || match.status !== 'pending' || match.is_deposit_paid) continue;

            // Robust UTC/offset parsing
            // If it already has 'Z' or a timezone offset like '-03:00', we append nothing.
            // A typical offset check: if it contains '+' or if the time part contains '-'
            const hasExplicitOffset = match.created_at.endsWith('Z') || match.created_at.includes('+') || (match.created_at.includes('T') && match.created_at.split('T')[1].includes('-'));
            const suffix = hasExplicitOffset ? '' : 'Z';
            const createdAt = new Date(match.created_at + suffix);

            // Safety check
            if (isNaN(createdAt.getTime())) {
                console.warn(`[Cron] Invalid date parsed for match ${match.id}: ${match.created_at}`);
                continue;
            }

            // A) At 60 mins: Notify user and reset bot session (but leave match active for 5 more mins)
            if (createdAt <= sixtyMinsAgo) {
                const message = "❌ *NOTIFICACIÓN DE CADUCIDAD* ❌\n\nTu pre-reserva ha vencido debido a que transcurrió el tiempo de 1 hora sin registrar el pago. Ya podés volver a usar el bot para gestionar una nueva reserva. ¡Te esperamos pronto! 👋🎾";

                if (session.provider === 'telegram' && session.telegram_chat_id && session.client_id) {
                    await TelegramService.sendMessage(session.client_id, session.telegram_chat_id, message);
                } else if (session.provider === 'whatsapp' && session.phone_number) {
                    // await WhatsAppService.sendMessage(session.phone_number, message);
                }

                // Clear session active booking to free the bot immediately
                await supabase.from('whatsapp_sessions').update({
                    active_booking_id: null,
                    current_state: 'IDLE'
                }).eq('id', session.id);

                sessionsProcessed++;
                continue;
            }

            // B) Between 45 and 50 mins: Send warning
            if (createdAt <= fortyFiveMinsAgo && createdAt >= fiftyMinsAgo) {
                const message = "⚠️ *RECORDATORIO DE GESTIÓN* ⚠️\n\nLe informamos que su pre-reserva vencerá en 15 minutos. Por favor, remita el comprobante de pago a la brevedad para asegurar su lugar. De lo contrario, la reserva será cancelada automáticamente. Gracias.";

                if (session.provider === 'telegram' && session.telegram_chat_id && session.client_id) {
                    await TelegramService.sendMessage(session.client_id, session.telegram_chat_id, message);
                } else if (session.provider === 'whatsapp' && session.phone_number) {
                    // await WhatsAppService.sendMessage(session.phone_number, message);
                }
                sessionsProcessed++;
            }
        }
    }

    // ==========================================
    // 2. HARD EXPIRATIONS (Match Cancellation)
    // ==========================================
    // Query matches directly that are >= 65 mins old, pending and unpaid.
    // We add 'Z' to the ISO string if we're comparing timestamps in DB, 
    // but usually supabase filters handle it well.
    const { data: expiredMatches, error: expiredError } = await supabase
        .from('matches')
        .select('id')
        .eq('status', 'pending')
        .eq('is_deposit_paid', false)
        .lte('created_at', sixtyFiveMinsAgo.toISOString());

    if (expiredError) {
        console.error('[Cron] Error fetching expired matches:', expiredError);
    }

    let matchesCancelled = 0;
    if (expiredMatches) {
        for (const match of expiredMatches) {
            await MatchService.cancelMatch(match.id);
            matchesCancelled++;
            console.log(`[Cron] Cancelled match ${match.id} (65+ mins without payment)`);
        }
    }

    // ==========================================
    // 3. GENERAL INACTIVITY TIMEOUT (> 20 MINS)
    // ==========================================
    const twentyMinsAgo = new Date(now.getTime() - 20 * 60000);
    const { data: inactiveSessions, error: inactiveError } = await supabase
        .from('whatsapp_sessions')
        .select('id, phone_number, telegram_chat_id, provider, current_state, last_interaction, client_id')
        .neq('current_state', 'IDLE')
        .neq('current_state', 'AWAITING_PAYMENT') // Don't time out people waiting for payment confirmation here, 
        // the 60-min logic above handles them.
        .lt('last_interaction', twentyMinsAgo.toISOString());

    if (inactiveError) console.error('[Cron] Inactive Error:', inactiveError);

    let inactiveProcessed = 0;
    if (inactiveSessions) {
        for (const session of inactiveSessions) {
            const message = "⏳ *CONVERSACIÓN FINALIZADA* ⏳\n\nParece que no has tenido actividad por un momento, así que he cerrado la sesión. ¡No dudes en escribirme de nuevo cuando quieras reservar! 👋🎾";

            if (session.provider === 'telegram' && session.telegram_chat_id && session.client_id) {
                await TelegramService.sendMessage(session.client_id, session.telegram_chat_id, message);
            } else if (session.provider === 'whatsapp' && session.phone_number) {
                // await WhatsAppService.sendMessage(session.phone_number, message);
            }

            await supabase.from('whatsapp_sessions').update({
                current_state: 'IDLE',
                active_booking_id: null
            }).eq('id', session.id);

            inactiveProcessed++;
            console.log(`[Cron] Session ${session.id} timed out due to inactivity.`);
        }
    }

    return NextResponse.json({
        success: true,
        metrics: {
            paymentSessionsProcessed: sessionsProcessed,
            hardMatchesCancelled: matchesCancelled,
            inactiveSessionsClosed: inactiveProcessed
        }
    });
}
