import { ClientService } from '@/services/client';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import TelegramConfigClient from '@/components/TelegramConfigClient';

interface Props {
    searchParams: Promise<{ success?: string; simulate_client?: string }>;
}

export default async function ClientDashboardPage({ searchParams }: Props) {
    const { success, simulate_client } = await searchParams;

    // Determine the current client (for now, default to the first one)
    const client = await ClientService.getClient(simulate_client);

    if (!client) {
        return (
            <main className="container" style={{ textAlign: 'center', marginTop: '4rem' }}>
                <h1 className="title">No se encontró el Cliente</h1>
                <p>Por favor ejecutá la migración inicial o creá un cliente en la base de datos.</p>
            </main>
        );
    }

    const clubs = await ClientService.getClientClubs(client.id);

    async function updateTelegramToken(formData: FormData) {
        'use server';
        const clientId = formData.get('clientId') as string;
        await ClientService.updateClientTokens(clientId, {
            telegram_bot_token: formData.get('telegram_bot_token') as string,
        });
        redirect(`/client/dashboard?success=telegram&simulate_client=${clientId}`);
    }

    async function updateWhatsappTokens(formData: FormData) {
        'use server';
        const clientId = formData.get('clientId') as string;
        await ClientService.updateClientTokens(clientId, {
            whatsapp_phone_number_id: formData.get('whatsapp_phone_number_id') as string,
            whatsapp_access_token: formData.get('whatsapp_access_token') as string,
            whatsapp_verify_token: formData.get('whatsapp_verify_token') as string,
        });
        redirect(`/client/dashboard?success=whatsapp&simulate_client=${clientId}`);
    }

    async function handleCreateClub(formData: FormData) {
        'use server';
        const clientId = formData.get('clientId') as string;
        const name = formData.get('name') as string;
        const address = formData.get('address') as string;
        const defaultPrice = parseInt(formData.get('default_price') as string);

        if (name && defaultPrice) {
            await ClientService.createClub(clientId, name, address, defaultPrice);
            redirect(`/client/dashboard?simulate_client=${clientId}`);
        }
    }

    return (
        <main className="container">
            <div style={{ marginBottom: '2.5rem' }}>
                <h1 className="title" style={{ fontSize: '2rem', marginBottom: '0.5rem', textAlign: 'left', background: 'none', WebkitTextFillColor: 'currentColor', color: 'var(--primary)' }}>
                    Panel de Cliente (SaaS) 🏢
                </h1>
                <p style={{ color: '#94a3b8', fontSize: '1.125rem' }}>
                    Gestiona tu bot unificado y tus sucursales ({client.name})
                </p>
                <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0.5rem', display: 'inline-block', fontSize: '0.875rem' }}>
                    <span style={{ color: '#94a3b8' }}>ID del Cliente (Para Webhooks): </span>
                    <strong style={{ fontFamily: 'monospace', color: 'white' }}>{client.id}</strong>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '3rem' }}>

                {success === 'telegram' && (
                    <div style={{ background: '#38bdf820', border: '1px solid #38bdf8', color: '#38bdf8', padding: '1rem', borderRadius: '0.5rem', fontWeight: 600 }}>
                        ✅ ¡Credenciales de Telegram actualizadas correctamente!
                    </div>
                )}

                {success === 'whatsapp' && (
                    <div style={{ background: '#22c55e20', border: '1px solid #22c55e', color: '#22c55e', padding: '1rem', borderRadius: '0.5rem', fontWeight: 600 }}>
                        ✅ ¡Credenciales de WhatsApp actualizadas correctamente!
                    </div>
                )}

                {/* 1. Bot Configuration */}
                <section>
                    <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.5rem' }}>
                        🤖 Configuración de Bots
                    </h2>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
                        {/* Telegram Form */}
                        <form action={updateTelegramToken} className="card" style={{ margin: 0, padding: '2rem', borderTop: '4px solid #38bdf8' }}>
                            <input type="hidden" name="clientId" value={client.id} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h3 style={{ color: '#38bdf8', fontSize: '1.25rem', margin: 0 }}>Telegram</h3>
                                {client.telegram_bot_token ? (
                                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#22c55e', background: 'rgba(34, 197, 94, 0.15)', padding: '0.3rem 0.6rem', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: '1rem' }}>
                                        ✅ CONFIGURADO
                                    </span>
                                ) : (
                                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#fbbf24', background: 'rgba(251, 191, 36, 0.15)', padding: '0.3rem 0.6rem', border: '1px solid rgba(251, 191, 36, 0.3)', borderRadius: '1rem' }}>
                                        ⏳ PENDIENTE
                                    </span>
                                )}
                            </div>
                            
                            <TelegramConfigClient clientId={client.id} initialToken={client.telegram_bot_token} />

                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <button type="submit" className="button button-primary" style={{ background: '#38bdf8', color: '#0f172a' }}>
                                    Guardar Telegram
                                </button>
                            </div>
                        </form>

                        {/* WhatsApp Form */}
                        <form action={updateWhatsappTokens} className="card" style={{ margin: 0, padding: '2rem', borderTop: '4px solid #22c55e' }}>
                            <input type="hidden" name="clientId" value={client.id} />

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h3 style={{ color: '#22c55e', fontSize: '1.25rem', margin: 0 }}>WhatsApp (Meta)</h3>
                                {(client.whatsapp_phone_number_id && client.whatsapp_verify_token && client.whatsapp_access_token) ? (
                                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#22c55e', background: 'rgba(34, 197, 94, 0.15)', padding: '0.3rem 0.6rem', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: '1rem' }}>
                                        ✅ CONFIGURADO
                                    </span>
                                ) : (
                                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#fbbf24', background: 'rgba(251, 191, 36, 0.15)', padding: '0.3rem 0.6rem', border: '1px solid rgba(251, 191, 36, 0.3)', borderRadius: '1rem' }}>
                                        ⏳ PENDIENTE / INCOMPLETO
                                    </span>
                                )}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <label style={{ fontSize: '0.875rem', color: '#cbd5e1' }}>Phone Number ID</label>
                                    <input
                                        type="text"
                                        name="whatsapp_phone_number_id"
                                        defaultValue={client.whatsapp_phone_number_id || ''}
                                        placeholder="123456789012345"
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.5)', color: 'white' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <label style={{ fontSize: '0.875rem', color: '#cbd5e1' }}>Verify Token (Para Webhook)</label>
                                    <input
                                        type="text"
                                        name="whatsapp_verify_token"
                                        defaultValue={client.whatsapp_verify_token || ''}
                                        placeholder="miclave_secreta_webhook"
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.5)', color: 'white' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', gridColumn: '1 / -1' }}>
                                    <label style={{ fontSize: '0.875rem', color: '#cbd5e1' }}>Access Token</label>
                                    <input
                                        type="text"
                                        name="whatsapp_access_token"
                                        defaultValue={client.whatsapp_access_token || ''}
                                        placeholder="EAAB..."
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.5)', color: 'white' }}
                                    />
                                </div>
                            </div>
                            <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '1.5rem' }}>Webhook URL: {`https://yourdomain.com/api/whatsapp/webhook/${client.id}`}</span>
                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <button type="submit" className="button button-primary" style={{ background: '#22c55e', color: 'white' }}>
                                    Guardar WhatsApp
                                </button>
                            </div>
                        </form>
                    </div>
                </section>

                {/* 2. Clubs Grid & Creation */}
                <section>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.5rem' }}>
                            🏟️ Sucursales ({clubs.length})
                        </h2>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                        {/* Club Cards */}
                        {clubs.map((club) => (
                            <div key={club.id} className="card" style={{ margin: 0, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <h3 style={{ margin: '0 0 0.5rem 0', color: 'white', fontSize: '1.25rem' }}>{club.name}</h3>
                                    <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        📍 {club.address || 'Sin dirección registrada'}
                                    </p>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                    <span style={{ color: '#22c55e', fontSize: '0.875rem', fontWeight: 600 }}>${club.default_price} / turno</span>
                                    <Link href={`/club/${club.id}/dashboard`} style={{ color: 'var(--primary)', fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none' }}>
                                        Administrar Canchas →
                                    </Link>
                                </div>
                            </div>
                        ))}

                        {/* Add Club Form */}
                        <form action={handleCreateClub} className="card" style={{ margin: 0, padding: '1.5rem', border: '1px dashed rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.02)' }}>
                            <input type="hidden" name="clientId" value={client.id} />
                            <h3 style={{ margin: '0 0 1rem 0', color: '#cbd5e1', fontSize: '1.125rem' }}>Agregar Sucursal</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    placeholder="Nombre de la sede (ej. Sede Centro)"
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.5)', color: 'white' }}
                                />
                                <input
                                    type="text"
                                    name="address"
                                    placeholder="Dirección (opcional)"
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.5)', color: 'white' }}
                                />
                                <input
                                    type="number"
                                    name="default_price"
                                    required
                                    placeholder="Precio base ($16000)"
                                    defaultValue="16000"
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.5)', color: 'white' }}
                                />
                                <button type="submit" className="button button-primary" style={{ width: '100%', padding: '0.5rem' }}>
                                    + Crear Sede
                                </button>
                            </div>
                        </form>
                    </div>
                </section>
            </div>
        </main>
    );
}
