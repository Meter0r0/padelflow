import { supabase } from '@/lib/supabase';

export const WhatsAppService = {
    async sendMessage(to: string, text: string) {
        const phone_number_id = process.env.WHATSAPP_PHONE_NUMBER_ID;
        const access_token = process.env.WHATSAPP_ACCESS_TOKEN;

        if (!phone_number_id || !access_token) {
            console.warn('[WhatsAppService] Missing credentials. Message not sent:', { to, text });
            return;
        }

        try {
            const response = await fetch(
                `https://graph.facebook.com/v17.0/${phone_number_id}/messages`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${access_token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        messaging_product: 'whatsapp',
                        to: to,
                        text: { body: text },
                    }),
                }
            );

            const result = await response.json();
            if (!response.ok) {
                console.error('[WhatsAppService] Error sending message:', result);
            } else {
                console.log(`[WhatsAppService] Message sent to ${to}: ${result.messages[0].id}`);
            }
        } catch (error) {
            console.error('[WhatsAppService] Network error:', error);
        }
    }
};
