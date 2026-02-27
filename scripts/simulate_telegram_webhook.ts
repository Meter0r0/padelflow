

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;
const WEBHOOK_URL = `${BASE_URL}/api/telegram/webhook`;

const TEST_CHAT_ID = 123456789;
const TEST_USER = {
    id: TEST_CHAT_ID,
    is_bot: false,
    first_name: "Test",
    last_name: "User",
    username: "testuser",
    language_code: "es"
};

async function sendTelegramUpdate(text: string) {
    const payload = {
        update_id: Date.now(),
        message: {
            message_id: Date.now(),
            from: TEST_USER,
            chat: {
                id: TEST_CHAT_ID,
                type: "private",
                first_name: TEST_USER.first_name,
                username: TEST_USER.username
            },
            date: Math.floor(Date.now() / 1000),
            text: text
        }
    };

    try {
        console.log(`Sending message: "${text}" to ${WEBHOOK_URL}`);
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        console.log('Response Status:', response.status);
        console.log('Response Body:', data);
    } catch (error) {
        console.error('Error sending webhook:', error);
    }
}

// Run the simulation
async function run() {
    console.log("--- Simulating Telegram Webhook ---");
    // 1. Send "Hola" to trigger greeting/registration
    await sendTelegramUpdate("Hola, busco cancha");
}

run();
