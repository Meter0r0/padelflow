import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { MatchService } from '@/services/match';

export async function POST(req: NextRequest, { params }: { params: Promise<{ clientId: string }> }) {
    try {
        const { clientId } = await params;
        const body = await req.json();

        // Handle Callback Queries (Buttons)
        if (body.callback_query) {
            const { data, from, message } = body.callback_query;
            const chatId = from.id.toString();
            const messageId = message.message_id;

            // 1. We must find the client first to get the bot token, we no longer assume global token
            const { data: client } = await supabase
                .from('clients')
                .select('telegram_bot_token')
                .eq('id', clientId)
                .single();

            if (!client || !client.telegram_bot_token) {
                console.error('[Telegram Webhook] Client no encontrado o sin token configurado:', clientId);
                return NextResponse.json({ ok: false });
            }

            // Also check the club by telegram_id if applicable, though for callbacks we just need the match
            // We use the matchId inside the data to identify the club anyway

            // 2. Parse Action
            if (data.startsWith('reserve_')) {
                const matchId = data.replace('reserve_', '');

                // Needs the match to grab the club ID to verify it belongs to this client or just fulfill it
                const match = await MatchService.getMatch(matchId);
                if (!match) return NextResponse.json({ ok: false });

                // Confirm the reservation
                const success = await MatchService.reserveCourt(matchId, match.club_id || '', 'Confirmado vía Telegram');

                if (success) {
                    // Answer callback and update message with the specific Client's Bot Token
                    await fetch(`https://api.telegram.org/bot${client.telegram_bot_token}/editMessageText`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            chat_id: chatId,
                            message_id: messageId,
                            text: `${message.text}\n\n✅ <b>RESERVADO (Confirmado)</b>`,
                            parse_mode: 'HTML'
                        })
                    });
                }
            } else if (data.startsWith('reject_')) {
                // Just acknowledge and maybe update text
                await fetch(`https://api.telegram.org/bot${client.telegram_bot_token}/answerCallbackQuery`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ callback_query_id: body.callback_query.id, text: 'Entendido, gracias.' })
                });
            }
        }

        // Handle User Messages (New AI Logic)
        else if (body.message && body.message.text) {
            const chatId = body.message.chat.id.toString();
            const text = body.message.text;
            const firstName = body.message.from?.first_name || '';
            const lastName = body.message.from?.last_name || '';
            const userName = `${firstName} ${lastName}`.trim();

            console.log(`[Telegram Webhook] Message from ${userName} (${chatId}) to Client ${clientId}: ${text}`);

            // Delegate to AI Service, now passing the clientId
            const { AIService } = await import('@/services/ai'); // Dynamic import to avoid circular dep issues if any
            
            // IMPORTANT: In Vercel Serverless we MUST await this fully before returning, otherwise the process is killed midway.
            await AIService.processMessage(chatId, text, 'telegram', userName, clientId);
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('Error en Webhook de Telegram:', error);
        return NextResponse.json({ ok: false }, { status: 500 });
    }
}
