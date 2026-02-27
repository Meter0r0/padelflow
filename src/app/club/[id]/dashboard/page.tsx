import { notFound } from 'next/navigation';
import { MatchService } from '@/services/match';
import { Match } from '@/types';
import ReserveCourtForm from '@/components/ReserveCourtForm';
import CourtManager from '@/components/CourtManager';
import ScheduleGrid from '@/components/ScheduleGrid';
import ClubDateSelector from '@/components/ClubDateSelector';
import ConfirmPaymentButton from '@/components/ConfirmPaymentButton';
import CancelReservationButton from '@/components/CancelReservationButton';
import Link from 'next/link';

interface Props {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ status?: string, date?: string }>;
}

export default async function ClubDashboardPage({ params, searchParams }: Props) {
    const { id: clubId } = await params;
    const { status: filterStatus, date: filterDate } = await searchParams;

    const { club, matches } = await MatchService.getClubDashboard(clubId);
    const courts = await MatchService.getClubCourts(clubId);

    if (!club) {
        notFound();
    }

    // cast matches to Match[] to help TS inside filter/map
    const typedMatches = matches as Match[];

    const preReservas = typedMatches.filter(m => m.status === 'pending' && !m.is_deposit_paid);
    const pendingMatches = typedMatches.filter(m => m.court_status === 'requested');
    const reservedMatches = typedMatches.filter(m => m.court_status === 'reserved');

    const activeFilter = filterStatus || 'grid';
    const selectedDate = filterDate ? new Date(filterDate + 'T12:00:00') : new Date();

    return (
        <main style={{ padding: '1.5rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>

            {/* Header y Filtros (Restringidos a 600px) */}
            <div style={{ width: '100%', maxWidth: '600px', padding: '0 1rem', boxSizing: 'border-box' }}>
                <div style={{ marginBottom: '2.5rem', textAlign: 'left' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '0.5rem' }}>
                        <div>
                            <h1 className="title" style={{ fontSize: '1.75rem', marginBottom: '0.25rem', textAlign: 'left', background: 'none', WebkitTextFillColor: 'currentColor', color: 'var(--primary)' }}>
                                Panel del Club
                            </h1>
                            <p style={{ color: '#94a3b8', fontSize: '1rem', margin: 0 }}>
                                {club?.name || 'Local'}
                            </p>
                        </div>
                        <Link href={`/club/${clubId}/settings`} style={{
                            fontSize: '0.875rem',
                            color: '#64748b',
                            textDecoration: 'none',
                            fontWeight: 600,
                            border: '1px solid rgba(255,255,255,0.05)',
                            padding: '0.5rem 1rem',
                            borderRadius: '0.75rem',
                            background: 'rgba(255,255,255,0.02)'
                        }}>
                            ⚙️ Ajustes de Perfil
                        </Link>
                    </div>
                </div>

                {/* Filtros de Estado */}
                <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    marginBottom: '2rem',
                    overflowX: 'auto',
                    paddingBottom: '0.75rem',
                    msOverflowStyle: 'none',
                    scrollbarWidth: 'none',
                    WebkitOverflowScrolling: 'touch'
                }}>
                    <a href="?" className={`btn ${activeFilter === 'grid' ? 'btn-primary' : ''}`} style={{
                        width: 'auto',
                        flexShrink: 0,
                        padding: '0.625rem 1.25rem',
                        fontSize: '0.875rem',
                        background: activeFilter === 'grid' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                        color: activeFilter === 'grid' ? '#0f172a' : 'white',
                        textDecoration: 'none',
                        borderRadius: '0.75rem',
                        border: '1px solid rgba(255,255,255,0.05)'
                    }}>
                        📅 Grilla
                    </a>
                    <a href="?status=pre" className={`btn ${activeFilter === 'pre' ? 'btn-primary' : ''}`} style={{
                        width: 'auto',
                        flexShrink: 0,
                        padding: '0.625rem 1.25rem',
                        fontSize: '0.875rem',
                        background: activeFilter === 'pre' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                        color: activeFilter === 'pre' ? '#0f172a' : 'white',
                        textDecoration: 'none',
                        borderRadius: '0.75rem',
                        border: '1px solid rgba(255,255,255,0.05)'
                    }}>
                        Pre-reservas ({preReservas.length})
                    </a>
                    <a href="?status=requested" className={`btn ${activeFilter === 'requested' ? 'btn-primary' : ''}`} style={{
                        width: 'auto',
                        flexShrink: 0,
                        padding: '0.625rem 1.25rem',
                        fontSize: '0.875rem',
                        background: activeFilter === 'requested' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                        color: activeFilter === 'requested' ? '#0f172a' : 'white',
                        textDecoration: 'none',
                        borderRadius: '0.75rem',
                        border: '1px solid rgba(255,255,255,0.05)'
                    }}>
                        Aprobar ({pendingMatches.length})
                    </a>
                    <a href="?status=reserved" className={`btn ${activeFilter === 'reserved' ? 'btn-primary' : ''}`} style={{
                        width: 'auto',
                        flexShrink: 0,
                        padding: '0.625rem 1.25rem',
                        fontSize: '0.875rem',
                        background: activeFilter === 'reserved' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                        color: activeFilter === 'reserved' ? '#0f172a' : 'white',
                        textDecoration: 'none',
                        borderRadius: '0.75rem',
                        border: '1px solid rgba(255,255,255,0.05)'
                    }}>
                        Listado Reservas ({reservedMatches.length})
                    </a>
                    <a href="?status=all" className={`btn ${activeFilter === 'all' ? 'btn-primary' : ''}`} style={{
                        width: 'auto',
                        flexShrink: 0,
                        padding: '0.625rem 1.25rem',
                        fontSize: '0.875rem',
                        background: activeFilter === 'all' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                        color: activeFilter === 'all' ? '#0f172a' : 'white',
                        textDecoration: 'none',
                        borderRadius: '0.75rem',
                        border: '1px solid rgba(255,255,255,0.05)'
                    }}>
                        Historial ({typedMatches.length})
                    </a>
                    <a href="?status=manage" className={`btn ${activeFilter === 'manage' ? 'btn-primary' : ''}`} style={{
                        width: 'auto',
                        flexShrink: 0,
                        padding: '0.625rem 1.25rem',
                        fontSize: '0.875rem',
                        background: activeFilter === 'manage' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                        color: activeFilter === 'manage' ? '#0f172a' : 'white',
                        textDecoration: 'none',
                        borderRadius: '0.75rem',
                        border: '1px solid rgba(255,255,255,0.05)'
                    }}>
                        ⚙️ Canchas ({courts.length})
                    </a>
                </div>
            </div>

            <div style={{ width: '100%', boxSizing: 'border-box' }}>
                {/* Grilla Section */}
                {activeFilter === 'grid' && (
                    <section style={{ padding: '0 1rem' }}>
                        <ClubDateSelector defaultValue={selectedDate.toISOString().split('T')[0]} />
                        <ScheduleGrid
                            courts={courts}
                            matches={typedMatches}
                            selectedDate={selectedDate}
                            clubHours={club?.opening_hours || {}}
                            clubId={clubId}
                        />

                        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                                <div style={{ width: 12, height: 12, borderRadius: 3, border: '1px solid var(--primary)', background: 'rgba(56, 189, 248, 0.15)' }}></div> Reservado
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                                <div style={{ width: 12, height: 12, borderRadius: 3, border: '1px solid #22c55e', background: 'rgba(34, 197, 94, 0.15)' }}></div> Señado
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                                <div style={{ width: 12, height: 12, borderRadius: 3, border: '1px solid #fbbf24', background: 'rgba(251, 191, 36, 0.15)' }}></div> Pre-reserva
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                                🔁 Regular
                            </div>
                        </div>
                    </section>
                )}

                <div style={{ width: '100%', maxWidth: '600px', margin: '0 auto', padding: '0 1rem', boxSizing: 'border-box', display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>

                    {/* Pre-reservas Section */}
                    {(activeFilter === 'all' || activeFilter === 'pre') && (
                        <section>
                            <h2 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#fbbf24' }}></span>
                                Pre-reservas (Esperando seña) ({preReservas.length})
                            </h2>
                            <div style={{ display: 'grid', gap: '1rem' }}>
                                {preReservas.map((match) => (
                                    <div key={match.id} className="card" style={{ margin: 0, padding: '1.25rem', borderLeft: '4px solid #fbbf24' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                                                    <p style={{ fontWeight: 800, fontSize: '1.125rem', margin: 0 }}>
                                                        {new Date(match.confirmed_option || match.proposed_time!).toLocaleString('es-AR', {
                                                            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
                                                            timeZone: 'America/Argentina/Buenos_Aires'
                                                        })}
                                                    </p>
                                                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                                                        Creada: {new Date(match.created_at + (match.created_at.endsWith('Z') || match.created_at.match(/[+-]\d{2}:?\d{2}$/) ? '' : 'Z')).toLocaleString('es-AR', {
                                                            day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit',
                                                            timeZone: 'America/Argentina/Buenos_Aires'
                                                        })}
                                                    </span>
                                                </div>
                                                <p style={{ fontSize: '0.875rem', color: 'var(--primary)', fontWeight: 700, margin: '0.25rem 0' }}>
                                                    🏠 Cancha: {match.court_details || 'Sin asignar'}
                                                </p>
                                                <p style={{ fontSize: '0.875rem', color: '#94a3b8', margin: 0 }}>
                                                    Monto esperado: ${match.payment_amount_expected || '---'}
                                                </p>
                                                {/* Organizer Info (New) */}
                                                {(() => {
                                                    const organizer = (match as any).participants?.find((p: any) => p.is_organizer);
                                                    if (!organizer) return null;
                                                    return (
                                                        <div style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                                                            <span style={{ color: '#94a3b8' }}>Por: </span>
                                                            <span style={{ fontWeight: 700, color: 'white' }}>{organizer.name}</span>
                                                            {organizer.phone_number && (
                                                                <a
                                                                    href={`https://wa.me/${organizer.phone_number.replace(/\D/g, '')}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    style={{ marginLeft: '0.5rem', color: '#22c55e', textDecoration: 'none', fontWeight: 800 }}
                                                                >
                                                                    🟢 WhatsApp
                                                                </a>
                                                            )}
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end', marginLeft: '1rem' }}>
                                                <ConfirmPaymentButton matchId={match.id} clubId={clubId} />
                                                <CancelReservationButton matchId={match.id} clubId={clubId} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {preReservas.length === 0 && activeFilter === 'pre' && (
                                    <div className="card" style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>
                                        No hay pre-reservas pendientes.
                                    </div>
                                )}
                            </div>
                        </section>
                    )}

                    {/* Pending Requests */}
                    {(activeFilter === 'all' || activeFilter === 'requested') && (
                        <section>
                            <h2 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--primary)' }}></span>
                                Solicitudes por Aprobar ({pendingMatches.length})
                            </h2>

                            <div style={{ display: 'grid', gap: '1.25rem' }}>
                                {pendingMatches.map((match: Match) => (
                                    <div key={match.id} className="card" style={{ margin: 0, padding: '1.5rem', borderLeft: '4px solid var(--primary)' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                            <div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', alignItems: 'center' }}>
                                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                            Asignar Cancha
                                                        </span>
                                                    </div>
                                                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>#{match.id.slice(0, 4)}</span>
                                                </div>
                                                <p style={{ margin: 0, fontSize: '1.375rem', fontWeight: 900, color: 'white' }}>
                                                    {new Date(match.confirmed_option!).toLocaleString('es-AR', {
                                                        weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
                                                        timeZone: 'America/Argentina/Buenos_Aires'
                                                    }).toUpperCase()}
                                                </p>

                                                {/* Organizer Info (New) */}
                                                {(() => {
                                                    const organizer = (match as any).participants?.find((p: any) => p.is_organizer);
                                                    if (!organizer) return null;
                                                    return (
                                                        <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                                                            <span style={{ color: '#94a3b8' }}>Solicitado por: </span>
                                                            <span style={{ fontWeight: 700, color: 'white' }}>{organizer.name}</span>
                                                            {organizer.phone_number && (
                                                                <a
                                                                    href={`https://wa.me/${organizer.phone_number.replace(/\D/g, '')}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    style={{ marginLeft: '0.75rem', color: '#22c55e', textDecoration: 'none', fontWeight: 800, fontSize: '0.8rem', border: '1px solid rgba(34, 197, 94, 0.2)', padding: '0.1rem 0.4rem', borderRadius: '0.4rem', background: 'rgba(34, 197, 94, 0.05)' }}
                                                                >
                                                                    🟢 Enviar WhatsApp
                                                                </a>
                                                            )}
                                                        </div>
                                                    );
                                                })()}
                                            </div>

                                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.25rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                <ReserveCourtForm matchId={match.id} clubId={clubId} courts={courts} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {pendingMatches.length === 0 && activeFilter === 'requested' && (
                                    <div className="card" style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>
                                        No hay solicitudes para aprobar.
                                    </div>
                                )}
                            </div>
                        </section>
                    )}

                    {/* Confirmed / Reserved */}
                    {(activeFilter === 'all' || activeFilter === 'reserved') && (
                        <section>
                            <h2 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e' }}></span>
                                Reservas Confirmadas ({reservedMatches.length})
                            </h2>

                            <div style={{ display: 'grid', gap: '1rem' }}>
                                {reservedMatches.map((match: Match) => (
                                    <div key={match.id} className="card" style={{ margin: 0, padding: '1.25rem', borderLeft: '4px solid #22c55e' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.25rem' }}>
                                                    <p style={{ fontWeight: 800, fontSize: '1.125rem', margin: 0 }}>
                                                        {new Date(match.confirmed_option!).toLocaleString('es-AR', {
                                                            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
                                                            timeZone: 'America/Argentina/Buenos_Aires'
                                                        })}
                                                    </p>
                                                    {match.is_deposit_paid && (
                                                        <span style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', fontSize: '0.6rem', fontWeight: 800, padding: '0.1rem 0.4rem', borderRadius: '1rem', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                                                            💰 SEÑADO
                                                        </span>
                                                    )}
                                                </div>
                                                <p style={{ fontSize: '0.875rem', color: 'var(--primary)', fontWeight: 600, margin: 0 }}>
                                                    📍 {match.court_details}
                                                </p>
                                            </div>
                                            <Link href={`/match/${match.id}`} className="status-badge status-confirmed" style={{ fontSize: '0.7rem', textDecoration: 'none' }}>Ver Detalles</Link>
                                        </div>
                                    </div>
                                ))}
                                {reservedMatches.length === 0 && activeFilter === 'reserved' && (
                                    <div className="card" style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>
                                        No hay reservas confirmadas aún.
                                    </div>
                                )}
                            </div>
                        </section>
                    )}

                    {/* Court Management Section */}
                    {activeFilter === 'manage' && (
                        <section>
                            <CourtManager clubId={clubId} courts={courts} />
                        </section>
                    )}
                </div>
            </div>
        </main>
    );
}
