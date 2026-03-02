'use client';

import { useState, useEffect } from 'react';

interface TelegramConfigProps {
    clientId: string;
    initialToken?: string;
}

export default function TelegramConfigClient({ clientId, initialToken }: TelegramConfigProps) {
    const [token, setToken] = useState(initialToken || '');
    const [origin, setOrigin] = useState('');

    useEffect(() => {
        setOrigin(window.location.origin);
    }, []);

    const webhookUrl = `${origin}/api/telegram/webhook/${clientId}`;
    const registrationUrl = `https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(webhookUrl)}`;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <label style={{ fontSize: '0.875rem', color: '#cbd5e1' }}>Bot Token</label>
            <input
                type="text"
                name="telegram_bot_token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz..."
                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.5)', color: 'white' }}
            />
            
            <div style={{ marginTop: '0.5rem', padding: '1rem', background: 'rgba(56, 189, 248, 0.05)', borderRadius: '0.5rem', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#cbd5e1' }}>
                    <strong>1. URL de tu Webhook:</strong>
                </p>
                <code style={{ display: 'block', padding: '0.5rem', background: 'rgba(0,0,0,0.3)', borderRadius: '0.25rem', fontSize: '0.75rem', color: '#38bdf8', wordBreak: 'break-all', marginBottom: '1rem' }}>
                    {webhookUrl}
                </code>

                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#cbd5e1' }}>
                    <strong>2. Activar Bot (Click aquí):</strong>
                </p>
                {token.length > 20 ? (
                    <a 
                        href={registrationUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ display: 'inline-block', fontSize: '0.75rem', color: 'white', background: '#38bdf8', padding: '0.4rem 0.8rem', borderRadius: '0.25rem', textDecoration: 'none', fontWeight: 600 }}
                    >
                        🔗 Registrar Webhook en Telegram
                    </a>
                ) : (
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        ⚠️ Ingresa un token válido primero para generar el link de activación.
                    </span>
                )}
            </div>
        </div>
    );
}
