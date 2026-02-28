import { NextRequest, NextResponse } from 'next/server';
import { AIService } from '@/services/ai';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest, { params }: { params: Promise<{ clientId: string }> }) {
    const { clientId } = await params;
    const searchParams = req.nextUrl.searchParams;
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    if (mode && token) {
        // Fetch specific client verify token
        const { data: client } = await supabase.from('clients').select('whatsapp_verify_token').eq('id', clientId).single();
        const VERIFY_TOKEN = client?.whatsapp_verify_token;

        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log(`WEBHOOK_VERIFIED for Client ${clientId}`);
            return new NextResponse(challenge, { status: 200 });
        } else {
            return new NextResponse(null, { status: 403 });
        }
    }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ clientId: string }> }) {
    try {
        const { clientId } = await params;
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

                console.log(`[Webhook] Message received from ${from} to Client ${clientId}: ${msg_body}`);

                // Fetch the client to ensure it exists and has credentials (we'll need the token to reply via WhatsAppService later)
                const { data: client } = await supabase.from('clients').select('id').eq('id', clientId).single();
                if (!client) {
                    console.error('[WhatsApp Webhook] Unknown Client:', clientId);
                    return new NextResponse(null, { status: 404 });
                }

                // Process with AI Service directly 
                // Session creation and state management is now securely handled inside AIService
                const { AIService } = await import('@/services/ai');
                await AIService.processMessage(from, msg_body, 'whatsapp', '', clientId);

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
