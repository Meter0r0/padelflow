import { MatchService } from '@/services/match';
import Link from 'next/link';

export default async function ClubPortalPage() {
    const { clubs } = await MatchService.getAdminDashboard();

    return (
        <main className="container">
            <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
                <h1 className="title">Portal de Establecimientos 🏢</h1>
                <p style={{ color: '#94a3b8' }}>Seleccioná tu club para gestionar reservas y canchas.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {clubs.map((club) => (
                    <Link key={club.id} href={`/club/${club.id}/dashboard`} style={{ textDecoration: 'none' }}>
                        <div className="card" style={{
                            margin: 0,
                            padding: '2rem',
                            textAlign: 'center',
                            transition: 'all 0.2s ease',
                            border: '1px solid rgba(255,255,255,0.05)'
                        }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🏢</div>
                            <h2 style={{ margin: '0 0 0.5rem 0', color: 'white' }}>{club.name}</h2>
                            <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                                {club.address || 'Sin dirección configurada'}
                            </p>
                            <span className="btn btn-secondary" style={{ width: '100%', fontSize: '0.875rem' }}>Entrar al Panel →</span>
                        </div>
                    </Link>
                ))}
            </div>

            {clubs.length === 0 && (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <p style={{ color: '#64748b' }}>No hay clubes registrados todavía.</p>
                </div>
            )}

            <div style={{ marginTop: '4rem', textAlign: 'center' }}>
                <Link href="/" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.875rem' }}>
                    ← Volver al Inicio
                </Link>
            </div>
        </main>
    );
}
