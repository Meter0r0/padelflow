'use client';

import { useState } from 'react';

interface InviteButtonsProps {
    matchId: string;
    proposedTime: string;
}

export default function InviteButtons({ matchId, proposedTime }: InviteButtonsProps) {
    const [copied, setCopied] = useState(false);

    const getAppUrl = () => {
        // Use the local IP for mobile testing if NEXT_PUBLIC_APP_URL is not set
        const origin = typeof window !== 'undefined' ? window.location.origin : 'http://192.168.100.15:3000';
        const url = process.env.NEXT_PUBLIC_APP_URL || origin;
        return url.replace(/\/$/, '');
    };

    const inviteUrl = `${getAppUrl()}/match/${matchId}`;

    const text = `🎾 ¡Sale Pádel! 🎾\n\n📅 Horario: ${new Date(proposedTime).toLocaleString('es-AR', {
        weekday: 'long', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false
    })}\n\n📲 Entrá acá para anotarte:\n\n${inviteUrl}`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(inviteUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy', err);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2.5rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn"
                    style={{
                        background: '#25D366',
                        color: '#0c1221',
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        fontWeight: 800,
                        padding: '1.125rem',
                        boxShadow: '0 4px 12px rgba(37, 211, 102, 0.2)',
                        flex: 1,
                        minWidth: '200px'
                    }}
                >
                    <span style={{ fontSize: '1.25rem' }}>💬</span>
                    <span>Invitar por WhatsApp</span>
                </a>

                <button
                    onClick={handleCopy}
                    className="btn"
                    style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        color: 'white',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        padding: '1.125rem',
                        flex: 1,
                        minWidth: '200px'
                    }}
                >
                    <span>{copied ? '✅' : '🔗'}</span>
                    <span>{copied ? 'Enlace Copiado' : 'Copiar Enlace'}</span>
                </button>
            </div>

            <div style={{
                fontSize: '0.7rem',
                color: '#64748b',
                textAlign: 'center',
                wordBreak: 'break-all',
                background: 'rgba(0,0,0,0.15)',
                padding: '0.75rem',
                borderRadius: '0.75rem',
                marginTop: '0.5rem',
                border: '1px solid rgba(255,255,255,0.03)'
            }}>
                {inviteUrl}
            </div>
        </div>
    );
}
