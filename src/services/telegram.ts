import { supabase } from '@/lib/supabase';

export const TelegramService = {
    async sendMessage(clientId: string, chatId: string, text: string, replyMarkup?: any) {

        const { data: client } = await supabase.from('clients').select('telegram_bot_token').eq('id', clientId).single();
        const TELEGRAM_BOT_TOKEN = client?.telegram_bot_token;

        if (!TELEGRAM_BOT_TOKEN) {
            console.error(`Telegram Bot Token no configurado para cliente ${clientId}`);
            return null;
        }

        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId,
                    text,
                    reply_markup: replyMarkup,
                    parse_mode: 'HTML'
                })
            });

            const data = await response.json();
            if (!data.ok) {
                console.error('Error de Telegram API:', data);
            }
            return data;
        } catch (error) {
            console.error('Error enviando mensaje a Telegram:', error);
            return null;
        }
    },

    async notifyClubMatchConfirmed(clientId: string, clubTelegramId: string, matchId: string, time: string, duration: number) {
        const formattedTime = new Date(time).toLocaleString('es-AR', {
            weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', hour12: false
        });

        const text = `
<b>🚀 ¡Partido Confirmado!</b>

Un nuevo partido de PadelFlow requiere cancha:
📅 <b>Fecha:</b> ${formattedTime}
⏱️ <b>Duración:</b> ${duration} min

¿Tienen cancha disponible para este horario?
        `.trim();

        const replyMarkup = {
            inline_keyboard: [
                [
                    { text: '✅ Confirmar Cancha', callback_data: `reserve_${matchId}` },
                    { text: '❌ No hay Lugar', callback_data: `reject_${matchId}` }
                ],
                [
                    { text: '🖥️ Ver Dashboard', url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/club/dashboard` }
                ]
            ]
        };

        return this.sendMessage(clientId, clubTelegramId, text, replyMarkup);
    }
};
