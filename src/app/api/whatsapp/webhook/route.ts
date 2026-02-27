import { NextRequest, NextResponse } from 'next/server';
import { AIService } from '@/services/ai';
import { supabase } from '@/lib/supabase';

// Verify Token for Meta Webhook Verification
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('WEBHOOK_VERIFIED');
            return new NextResponse(challenge, { status: 200 });
        } else {
            return new NextResponse(null, { status: 403 });
        }
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Check if this is a WhatsApp status update or message
        if (body.object) {
            if (
                body.entry &&
                body.entry[0].changes &&
                body.entry[0].changes[0] &&
                body.entry[0].changes[0].value.messages &&
                body.entry[0].changes[0].value.messages[0]
            ) {
                const phone_number_id = body.entry[0].changes[0].value.metadata.phone_number_id;
                const from = body.entry[0].changes[0].value.messages[0].from; // extract the phone number from the webhook payload
                const msg_body = body.entry[0].changes[0].value.messages[0].text.body; // extract the message text from the webhook payload

                console.log(`[Webhook] Message received from ${from}: ${msg_body}`);

                // Manage Session
                const { data: session, error: sessionError } = await supabase
                    .from('whatsapp_sessions')
                    .select('*')
                    .eq('phone_number', from)
                    .single();

                if (sessionError && sessionError.code !== 'PGRST116') {
                    console.error('[Webhook] Error fetching session:', sessionError);
                }

                if (session) {
                    await supabase
                        .from('whatsapp_sessions')
                        .update({ last_interaction: new Date().toISOString() })
                        .eq('id', session.id);
                    console.log(`[Webhook] Session updated for ${from}`);
                } else {
                    await supabase
                        .from('whatsapp_sessions')
                        .insert({
                            phone_number: from,
                            current_state: 'IDLE',
                            last_interaction: new Date().toISOString(),
                        });
                    console.log(`[Webhook] New session created for ${from}`);
                }

                // Process with AI Service
                await AIService.processMessage(from, msg_body);

                // Here you would typically send the reply back using the WhatsApp Cloud API
                // For now, the AI Service generates the reply but we need a 'WhatsAppService' to send it.
                // We'll log it for now as per instructions "objetivo inmediato".

            }
            return new NextResponse(null, { status: 200 });
        } else {
            return new NextResponse(null, { status: 404 });
        }
    } catch (error) {
        console.error('Error processing webhook:', error);
        return new NextResponse(null, { status: 500 });
    }
}
