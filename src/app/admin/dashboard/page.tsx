import { MatchService } from '@/services/match';
import { AdminService } from '@/services/admin';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';

export default async function AdminDashboardPage() {
    const { matches, clubs } = await MatchService.getAdminDashboard();
    const clients = await AdminService.getClientsWithStats();

    const now = new Date();

    const stats = {
        totalMatches: matches.length,
        pending: matches.filter(m => m.status === 'pending').length,
        confirmed: matches.filter(m => m.status === 'confirmed').length,
        cancelled: matches.filter(m => m.status === 'cancelled').length,
        played: matches.filter(m => m.status === 'confirmed' && m.confirmed_option && new Date(m.confirmed_option) < now).length,
        totalClubs: clubs.length,
        totalClients: clients.length
    };

    async function handleCreateClient(formData: FormData) {
        'use server';
        const name = formData.get('name') as string;
        if (name) {
            await AdminService.createClient(name);
            revalidatePath('/admin/dashboard');
        }
    }

    async function handleDeleteClient(formData: FormData) {
        'use server';
        const clientId = formData.get('clientId') as string;
        const client = clients.find(c => c.id === clientId);
        if (client && client.clubs_count === 0) {
            await AdminService.deleteClient(clientId);
            revalidatePath('/admin/dashboard');
        }
    }

    return (
        <main className="container">
            <div style={{ marginBottom: '2.5rem' }}>
                <h1 className="title" style={{ fontSize: '2rem', marginBottom: '0.5rem', textAlign: 'left', background: 'none', WebkitTextFillColor: 'currentColor', color: 'var(--primary)' }}>
                    Administración Global 🏛️
                </h1>
                <p style={{ color: '#94a3b8', fontSize: '1.125rem' }}>
                    Control centralizado de PadelFlow
                </p>
            </div>

            {/* Metrics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '3rem' }}>
                <div className="card" style={{ margin: 0, padding: '1.25rem', textAlign: 'center', borderTop: '4px solid var(--primary)' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 900, color: 'white' }}>{stats.totalMatches}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Partidos</div>
                </div>
                <div className="card" style={{ margin: 0, padding: '1.25rem', textAlign: 'center', borderTop: '4px solid #fbbf24' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 900, color: 'white' }}>{stats.pending}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Votando</div>
                </div>
                <div className="card" style={{ margin: 0, padding: '1.25rem', textAlign: 'center', borderTop: '4px solid #22c55e' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 900, color: 'white' }}>{stats.confirmed}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Confirmados</div>
                </div>
                <div className="card" style={{ margin: 0, padding: '1.25rem', textAlign: 'center', borderTop: '4px solid #64748b' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 900, color: 'white' }}>{stats.played}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Jugados</div>
                </div>
                <div className="card" style={{ margin: 0, padding: '1.25rem', textAlign: 'center', borderTop: '4px solid #818cf8' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 900, color: 'white' }}>{stats.totalClubs}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Clubes</div>
                </div>
                <div className="card" style={{ margin: 0, padding: '1.25rem', textAlign: 'center', borderTop: '4px solid #f43f5e' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 900, color: 'white' }}>{stats.totalClients}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Clientes</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '3rem' }}>

                {/* Clients Section */}
                <section>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.5rem' }}>
                            🤝 Clientes SaaS ({stats.totalClients})
                        </h2>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                        {clients.map((client) => (
                            <div key={client.id} className="card" style={{ margin: 0, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '3px solid #f43f5e' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <h3 style={{ margin: '0 0 0.5rem 0', color: 'white', fontSize: '1.25rem' }}>{client.name}</h3>
                                        <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.875rem' }}>ID: {client.id.slice(0, 8)}</p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <form action={handleDeleteClient}>
                                            <input type="hidden" name="clientId" value={client.id} />
                                            {client.clubs_count === 0 ? (
                                                <button type="submit" style={{ background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', padding: '0.2rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }} title="Borrar Cliente">
                                                    🗑️ Borrar
                                                </button>
                                            ) : (
                                                <span style={{ fontSize: '0.75rem', color: '#64748b' }} title="No se puede borrar porque tiene sucursales">No borrable</span>
                                            )}
                                        </form>
                                    </div>
                                </div>
                                
                                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: '#cbd5e1' }}>
                                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: '0.5rem' }}>
                                        <strong>{client.clubs_count}</strong> Sucursales
                                    </div>
                                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: '0.5rem' }}>
                                        🤖 {client.telegram_bot_token || client.whatsapp_access_token ? 'Bots Activos' : 'Sin Bots'}
                                    </div>
                                </div>
                                
                                <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                    <Link href={`/client/dashboard?simulate_client=${client.id}`} className="button button-primary" style={{ display: 'block', textAlign: 'center', width: '100%', background: 'transparent', border: '1px solid var(--primary)', color: 'var(--primary)' }}>
                                        Ir al Panel de Cliente →
                                    </Link>
                                </div>
                            </div>
                        ))}

                        {/* Add Client Form */}
                        <form action={handleCreateClient} className="card" style={{ margin: 0, padding: '1.5rem', border: '1px dashed rgba(244, 63, 94, 0.4)', background: 'rgba(244, 63, 94, 0.02)' }}>
                            <h3 style={{ margin: '0 0 1rem 0', color: '#f43f5e', fontSize: '1.125rem' }}>Crear Nuevo Cliente</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <input type="text" name="name" required placeholder="Nombre Comercial (obligatorio)" style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.5)', color: 'white' }} />
                                <button type="submit" className="button button-primary" style={{ width: '100%', padding: '0.5rem', background: '#f43f5e', color: 'white' }}>
                                    + Crear Cliente
                                </button>
                            </div>
                        </form>
                    </div>
                </section>

                {/* Matches Table */}
                <section>
                    <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.5rem' }}>
                        📊 Listado de Partidos
                    </h2>
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {matches.map((match) => {
                            const matchDate = match.confirmed_option ? new Date(match.confirmed_option) : null;
                            const isPlayed = match.status === 'confirmed' && matchDate && matchDate < now;

                            let statusLabel = match.status.toUpperCase();
                            let statusColor = 'rgba(255,255,255,0.1)';

                            if (isPlayed) {
                                statusLabel = 'JUGADO';
                                statusColor = 'rgba(100, 116, 139, 0.2)'; // Grayish
                            } else if (match.status === 'confirmed') {
                                statusColor = 'rgba(34, 197, 94, 0.2)';
                            } else if (match.status === 'pending') {
                                statusColor = 'rgba(251, 191, 36, 0.2)';
                            } else if (match.status === 'cancelled') {
                                statusColor = 'rgba(239, 68, 68, 0.2)';
                            }

                            return (
                                <Link key={match.id} href={`/match/${match.id}`} style={{ textDecoration: 'none' }}>
                                    <div className="card" style={{
                                        margin: 0,
                                        padding: '1.25rem',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        transition: 'transform 0.2s ease',
                                        borderLeft: `4px solid ${isPlayed ? '#64748b' : match.status === 'confirmed' ? '#22c55e' : match.status === 'pending' ? '#fbbf24' : '#ef4444'}`
                                    }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                            <div style={{ fontSize: '1.125rem', fontWeight: 800, color: 'white' }}>
                                                {match.confirmed_option ? (
                                                    new Date(match.confirmed_option).toLocaleString('es-AR', {
                                                        weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false
                                                    })
                                                ) : (
                                                    `Creado el ${new Date(match.created_at + (match.created_at.endsWith('Z') || match.created_at.match(/[+-]\d{2}:?\d{2}$/) ? '' : 'Z')).toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}`
                                                )}
                                            </div>
                                            <div style={{ fontSize: '0.875rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                🏢 {match.club?.name || 'Club No Definido'}
                                                <span style={{ opacity: 0.3 }}>|</span>
                                                👥 {match.participants?.length || 0} Jugadores
                                            </div>
                                        </div>

                                        <span style={{
                                            padding: '0.4rem 0.8rem',
                                            borderRadius: '2rem',
                                            fontSize: '0.7rem',
                                            fontWeight: 800,
                                            background: statusColor,
                                            color: 'white',
                                            border: '1px solid rgba(255,255,255,0.1)'
                                        }}>
                                            {statusLabel}
                                        </span>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </section>

                {/* Clubs Section */}
                <section>
                    <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.5rem' }}>
                        🏢 Red de Clubes
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
                        {clubs.map((club) => (
                            <Link key={club.id} href={`/club/${club.id}/dashboard`} style={{ textDecoration: 'none' }}>
                                <div className="card" style={{ margin: 0, padding: '1.5rem', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                    <div>
                                        <h3 style={{ margin: '0 0 0.5rem 0', color: 'white' }}>{club.name}</h3>
                                        <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: 0 }}>
                                            {club.address || 'Sin dirección'}
                                        </p>
                                    </div>
                                    <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700 }}>
                                            Ver Panel del Club →
                                        </span>
                                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                            ID: {club.id.slice(0, 8)}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>

            </div>
        </main>
    );
}
