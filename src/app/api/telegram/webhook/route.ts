
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { MatchService } from '@/services/match';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Handle Callback Queries (Buttons)
        if (body.callback_query) {
            const { data, from, message } = body.callback_query;
            const chatId = from.id.toString();
            const messageId = message.message_id;

            // 1. Find the club by telegram_chat_id
            const { data: club } = await supabase
                .from('clubs')
                .select('*')
                .eq('telegram_chat_id', chatId)
                .single();

            if (!club) {
                console.error('Club no encontrado para chatId:', chatId);
                return NextResponse.json({ ok: false });
            }

            // 2. Parse Action
            if (data.startsWith('reserve_')) {
                const matchId = data.replace('reserve_', '');

                // Confirm the reservation
                const success = await MatchService.reserveCourt(matchId, club.id, 'Confirmado vía Telegram');

                if (success) {
                    // Answer callback and update message
                    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/editMessageText`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            chat_id: chatId,
                            message_id: messageId,
                            text: `${message.text}\n\n✅ <b>RESERVADO POR: ${club.name}</b>`,
                            parse_mode: 'HTML'
                        })
                    });
                }
            } else if (data.startsWith('reject_')) {
                // Just acknowledge and maybe update text
                await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
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

            console.log(`[Telegram Webhook] Message from ${userName} (${chatId}): ${text}`);

            // Delegate to AI Service
            const { AIService } = await import('@/services/ai'); // Dynamic import to avoid circular dep issues if any
            await AIService.processMessage(chatId, text, 'telegram', userName);
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('Error en Webhook de Telegram:', error);
        return NextResponse.json({ ok: false }, { status: 500 });
    }
}
