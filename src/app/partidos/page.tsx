import Link from 'next/link';
import { MatchService } from '@/services/match';

export const dynamic = 'force-dynamic';

export default async function MatchesPage() {
    const { matches } = await MatchService.getAdminDashboard();

    return (
        <main className="container" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', minHeight: '100vh' }}>
            <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontWeight: 'bold' }}>Partidos Disponibles</h1>
                <p style={{ opacity: 0.7, fontSize: '1.1rem' }}>Explora y únete a partidos en tu zona</p>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                gap: '2rem'
            }}>
                {matches.map((match) => {
                    const dateStr = match.proposed_time || (match.options && match.options[0]);
                    const date = dateStr ? new Date(dateStr) : null;

                    return (
                        <Link href={`/match/${match.id}`} key={match.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                            <div style={{
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '16px',
                                padding: '1.5rem',
                                background: 'linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
                                transition: 'transform 0.2s, box-shadow 0.2s',
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                                className="hover:scale-[1.02] hover:shadow-lg"
                            >
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                                        <span style={{
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '999px',
                                            fontSize: '0.75rem',
                                            fontWeight: '600',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em',
                                            background: match.status === 'confirmed' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                                            color: match.status === 'confirmed' ? '#4ade80' : 'rgba(255,255,255,0.7)'
                                        }}>
                                            {match.status === 'confirmed' ? 'Confirmado' : 'Pendiente'}
                                        </span>
                                        <span style={{ fontSize: '0.8rem', opacity: 0.4, fontFamily: 'monospace' }}>#{match.id.slice(0, 6)}</span>
                                    </div>

                                    <h3 style={{ fontSize: '1.4rem', marginBottom: '0.5rem', lineHeight: '1.3' }}>
                                        {date ? date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }) : 'Fecha por definir'}
                                    </h3>
                                    <p style={{ fontSize: '1.1rem', opacity: 0.9, marginBottom: '1rem', color: '#38bdf8' }}>
                                        {date ? date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : '--:--'} hs
                                    </p>

                                    {match.club && (
                                        <p style={{ opacity: 0.7, fontSize: '0.9rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span>📍</span> {match.club.name}
                                        </p>
                                    )}

                                    <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        {match.participants?.map((p: any) => (
                                            <div key={p.id} title={p.name} style={{
                                                width: '32px',
                                                height: '32px',
                                                borderRadius: '50%',
                                                background: '#334155',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '0.85rem',
                                                fontWeight: 'bold',
                                                color: '#fff',
                                                border: '2px solid #1e293b'
                                            }}>
                                                {p.name.charAt(0).toUpperCase()}
                                            </div>
                                        ))}
                                        {Array.from({ length: Math.max(0, 4 - (match.participants?.length || 0)) }).map((_, i) => (
                                            <div key={`empty-${i}`} style={{
                                                width: '32px',
                                                height: '32px',
                                                borderRadius: '50%',
                                                border: '2px dashed #475569',
                                                opacity: 0.5
                                            }} />
                                        ))}
                                    </div>
                                </div>

                                <div style={{
                                    marginTop: '1.5rem',
                                    paddingTop: '1rem',
                                    borderTop: '1px solid rgba(255,255,255,0.05)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    fontSize: '0.9rem'
                                }}>
                                    <span style={{ opacity: 0.6 }}>{match.participants?.length || 0}/4 Jugadores</span>
                                    <span style={{ color: '#38bdf8' }}>Ver Detalles →</span>
                                </div>
                            </div>
                        </Link>
                    )
                })}

                {matches.length === 0 && (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px' }}>
                        <p style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>🎾</p>
                        <p style={{ opacity: 0.8, fontSize: '1.1rem' }}>No hay partidos disponibles en este momento.</p>
                        <Link href="/create-match" style={{ display: 'inline-block', marginTop: '1.5rem', padding: '0.75rem 1.5rem', background: '#38bdf8', color: '#000', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold' }}>
                            Crear el primero
                        </Link>
                    </div>
                )}
            </div>

            <div style={{ marginTop: '5rem', textAlign: 'center' }}>
                <Link href="/" style={{ textDecoration: 'none', color: '#94a3b8', transition: 'color 0.2s' }} className="hover:text-white">
                    ← Volver al inicio
                </Link>
            </div>
        </main>
    );
}
