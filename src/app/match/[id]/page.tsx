import { notFound } from 'next/navigation';
import { MatchService } from '@/services/match';
import { joinMatchAction, cancelMatchAction, removeParticipantAction, toggleDepositAction } from '@/app/actions';
import InviteButtons from '@/components/InviteButtons';
import OrganizerControls from '@/components/OrganizerControls';
import JoinMatchForm from '@/components/JoinMatchForm';

// Define the type for route params
type Props = {
    params: Promise<{ id: string }>;
};

import MatchIdentityHandler from '@/components/MatchIdentityHandler';
import RealtimeMatchSync from '@/components/RealtimeMatchSync';

// Use an async function for the component
export default async function MatchPage({ params }: Props) {
    const { id } = await params;

    // Check if this is a regular match that needs recycling
    const wasRecycled = await MatchService.checkAndRecycleIfNeeded(id);

    if (wasRecycled) {
        console.log(`[MatchPage] Partido regular ${id} fue reciclado automáticamente`);
    }

    const match = await MatchService.getMatch(id);

    if (!match) {
        notFound();
    }

    const { participants, options } = match;
    const organizer = participants.find(p => p.is_organizer);

    // Payment calculations
    const totalPrice = match.payment_amount_total || 0;
    const depositAmount = match.payment_amount_expected || 0;
    const isPaid = match.is_deposit_paid;

    // The decimal part of the deposit is just an identifier, we subtract only the integer part from the total debt.
    const pendingBalance = isPaid ? Math.max(0, totalPrice - Math.floor(depositAmount)) : totalPrice;

    // Pre-calculate votes for all options (Deduplicated by name)
    const uniqueVotersMap = new Map();
    participants.forEach(p => {
        const norm = p.name.trim().toLowerCase();
        if (!uniqueVotersMap.has(norm)) uniqueVotersMap.set(norm, p);
    });

    const optionsVotes = (options || []).map((optStr) => {
        const optTime = new Date(optStr).getTime();
        return Array.from(uniqueVotersMap.values()).filter(p => {
            const isValidStatus = p.status === 'accepted' || p.status === 'invited' || p.status === 'waitlist';
            if (!isValidStatus) return false;
            const pSelectedIndices = Array.isArray(p.selected_options) ? p.selected_options.map(Number) : [];
            return pSelectedIndices.some((pIdx: number) => {
                const pOptStr = options[pIdx];
                return pOptStr && new Date(pOptStr).getTime() === optTime;
            });
        }).length;
    });

    // If confirmed, use confirmed_option, else show all options
    const displayOptions = match.status === 'confirmed' && match.confirmed_option
        ? [match.confirmed_option]
        : (options || [match.proposed_time]); // Fallback

    // We need to know if the current user (browser) corresponds to any participant.
    // BUT this is Server Component. We can't know LocalStorage here.
    // Logic:
    // 1. When user joins/creates via Server Action, we need to pass back the "Participant ID" to the client
    //    so it can save it.
    //    Problem: Server Actions return void/redirect currently.
    //    Solution: We can't easily set LS from Server Action redirect.
    //    Workaround: The Server Action sets a Cookie? Or URL param?
    //    URL Param is easiest: ?joined=participant_id&role=organizer

    // Let's assume we update the redirect in actions.ts to include params.
    // Then we read searchParams here and pass to MatchIdentityHandler.

    return (
        <main className="container">
            <RealtimeMatchSync matchId={match.id} />
            <MatchIdentityHandler matchId={match.id} />
            {/* Organizer Controls (Client Component injected here needs checks) */}
            <OrganizerControls matchId={match.id} />

            <div className="card">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <h1 className="title" style={{ fontSize: '1.75rem', margin: 0, textAlign: 'left', background: 'none', WebkitTextFillColor: 'currentColor', color: 'var(--primary)' }}>
                                ¡Partido! 🎾
                            </h1>
                            {match.is_regular && (
                                <span style={{
                                    background: 'rgba(56, 189, 248, 0.1)',
                                    color: 'var(--primary)',
                                    padding: '0.25rem 0.6rem',
                                    borderRadius: '2rem',
                                    fontSize: '0.65rem',
                                    fontWeight: 800,
                                    border: '1px solid rgba(56, 189, 248, 0.2)',
                                    textTransform: 'uppercase',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.3rem'
                                }}>
                                    🔁 Semanal
                                </span>
                            )}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <span className={`status-badge status-${match.status}`}>
                                {match.status === 'confirmed' ? 'Confirmado' : match.status === 'cancelled' ? 'Cancelado' : 'Abierto'}
                            </span>
                            <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '0.5rem', fontWeight: 600 }}>
                                Creado: {new Date(match.created_at.replace(/(Z|[+-]\d{2}:?\d{2})$/, '') + 'Z').toLocaleString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Time Options / Voting Results */}
                <div style={{ marginBottom: '2rem' }}>
                    <p style={{ color: '#94a3b8', marginBottom: '0.5rem' }}>
                        {match.status === 'confirmed' ? 'Horario Confirmado:' : 'Opciones Disponibles:'}
                    </p>

                    {/* Club / Reservation Info */}
                    {!match.club_id && match.status === 'confirmed' && (
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px dashed rgba(255,255,255,0.1)',
                            padding: '1rem', borderRadius: '1rem', marginBottom: '1.5rem',
                            textAlign: 'center', color: '#64748b', fontSize: '0.875rem'
                        }}>
                            🚩 Sin club asignado todavía
                        </div>
                    )}

                    {match.club_id && (
                        <div style={{
                            background: match.court_status === 'reserved' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(56, 189, 248, 0.08)',
                            border: `1px solid ${match.court_status === 'reserved' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(56, 189, 248, 0.2)'}`,
                            padding: '1.25rem', borderRadius: '1rem', marginBottom: '1.5rem',
                            textAlign: 'center'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <h4 style={{ color: match.court_status === 'reserved' ? '#4ade80' : 'var(--primary)', margin: 0, fontSize: '0.9rem', fontWeight: 800 }}>
                                    {match.court_status === 'reserved' ? '✅ CANCHA RESERVADA' : '⏳ SOLICITUD ENVIADA'}
                                </h4>
                                {match.is_deposit_paid && (
                                    <span style={{ background: '#22c55e', color: '#0f172a', fontSize: '0.65rem', fontWeight: 900, padding: '0.1rem 0.5rem', borderRadius: '0.5rem' }}>💰 SEÑADO</span>
                                )}
                            </div>
                            <p style={{ fontSize: '1.5rem', fontWeight: 900, margin: '0 0 1rem 0', color: 'white' }}>{match.court_details || 'Cancha a confirmar'}</p>

                            {/* Financial Details (New) */}
                            <div style={{
                                background: 'rgba(0,0,0,0.2)',
                                padding: '1rem',
                                borderRadius: '0.75rem',
                                marginBottom: '1rem',
                                textAlign: 'left',
                                border: '1px solid rgba(255,255,255,0.05)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Precio Total:</span>
                                    <span style={{ fontWeight: 800, color: 'white' }}>${totalPrice.toLocaleString('es-AR')}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Seña:</span>
                                    <span style={{ fontWeight: 800, color: isPaid ? '#4ade80' : '#fbbf24' }}>
                                        {isPaid ? `-${depositAmount.toLocaleString('es-AR')} (Pagado)` : `$${depositAmount.toLocaleString('es-AR')} (Pendiente)`}
                                    </span>
                                </div>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    marginTop: '0.5rem',
                                    paddingTop: '0.5rem',
                                    borderTop: '1px solid rgba(255,255,255,0.1)'
                                }}>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary)' }}>SALDO A PAGAR:</span>
                                    <span style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--primary)' }}>${pendingBalance.toLocaleString('es-AR')}</span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '1rem' }}>
                                <form action={toggleDepositAction}>
                                    <input type="hidden" name="matchId" value={match.id} />
                                    <input type="hidden" name="clubId" value={match.club_id || ''} />
                                    <input type="hidden" name="isPaid" value={(!match.is_deposit_paid).toString()} />
                                    <button type="submit" className="btn" style={{
                                        fontSize: '0.75rem',
                                        padding: '0.4rem 0.8rem',
                                        background: match.is_deposit_paid ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                                        color: match.is_deposit_paid ? '#ef4444' : '#22c55e',
                                        border: `1px solid ${match.is_deposit_paid ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)'}`,
                                        width: 'auto'
                                    }}>
                                        {match.is_deposit_paid ? '❌ Quitar Seña' : '💰 Marcar como Señado'}
                                    </button>
                                </form>
                            </div>

                            {match.club && (
                                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
                                    <div style={{ fontWeight: 800, color: 'white', fontSize: '1rem' }}>{match.club.name}</div>
                                    {match.club.address && (
                                        <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                                            📍 {match.club.address}
                                        </div>
                                    )}

                                    {/* Organizer Info (New) */}
                                    {organizer && (
                                        <div style={{
                                            marginTop: '1rem',
                                            padding: '0.75rem',
                                            background: 'rgba(56, 189, 248, 0.05)',
                                            borderRadius: '0.5rem',
                                            borderLeft: '3px solid var(--primary)',
                                            textAlign: 'left'
                                        }}>
                                            <div style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Organizador</div>
                                            <div style={{ fontWeight: 700, color: 'white' }}>{organizer.name}</div>
                                            {organizer.phone_number && (
                                                <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.1rem' }}>
                                                    📞 <a
                                                        href={`https://wa.me/${organizer.phone_number.replace(/\D/g, '')}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'underline' }}
                                                    >
                                                        {organizer.phone_number}
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {match.club.google_maps_url && (
                                        <a
                                            href={match.club.google_maps_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn btn-secondary"
                                            style={{ marginTop: '0.75rem', fontSize: '0.75rem', padding: '0.5rem 1rem', display: 'inline-flex', width: 'auto' }}
                                        >
                                            🗺️ Ver en Google Maps
                                        </a>
                                    )}
                                </div>
                            )}

                            {match.payment_proof_url && (
                                <div style={{ marginTop: '1rem' }}>
                                    <a
                                        href={match.payment_proof_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn btn-secondary"
                                        style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem', width: 'auto', background: 'rgba(34, 197, 94, 0.1)', color: '#4ade80', border: '1px solid rgba(34, 197, 94, 0.2)' }}
                                    >
                                        📄 Ver Comprobante Enviado
                                    </a>
                                </div>
                            )}
                        </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {displayOptions.map((opt, idx) => {
                            if (!opt) return null;
                            const startTime = new Date(opt);
                            const endTime = new Date(startTime.getTime() + (match.duration_minutes || 90) * 60000);

                            // Use pre-calculated votes based on time match
                            const currentOptTime = new Date(opt).getTime();
                            const originalIdx = options.findIndex(o => new Date(o).getTime() === currentOptTime);
                            const votes = originalIdx !== -1 ? optionsVotes[originalIdx] : 0;

                            const isWinning = match.status === 'confirmed';

                            return (
                                <div key={idx} style={{
                                    padding: '1rem',
                                    background: isWinning ? 'rgba(56, 189, 248, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                                    border: `1px solid ${isWinning ? 'var(--primary)' : 'rgba(255,255,255,0.05)'}`,
                                    borderRadius: '0.75rem',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 700, fontSize: '1rem', color: isWinning ? 'var(--primary)' : 'white' }}>
                                            {startTime.toLocaleString('es-AR', {
                                                weekday: 'short', day: 'numeric', month: 'short', hour12: false,
                                                timeZone: 'America/Argentina/Buenos_Aires'
                                            }).toUpperCase()}
                                        </div>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                                            {startTime.toLocaleString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Argentina/Buenos_Aires' })}
                                            <span style={{ fontSize: '0.875rem', fontWeight: 400, opacity: 0.6, margin: '0 0.25rem' }}>a</span>
                                            {endTime.toLocaleString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Argentina/Buenos_Aires' })}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 900, color: isWinning ? 'var(--success)' : 'inherit' }}>
                                            {isWinning && votes >= 4 ? `${votes}+` : votes}
                                        </div>
                                        <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', opacity: 0.5, letterSpacing: '0.05em' }}>
                                            Votos
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Players List with Remove Button */}
                <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.5rem' }}>
                    Jugadores
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2.5rem' }}>
                    {participants.map((player) => (
                        <div key={player.id} style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            background: 'rgba(255, 255, 255, 0.03)', padding: '1rem', borderRadius: '0.75rem',
                            border: '1px solid rgba(255,255,255,0.05)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{
                                    width: '2.5rem', height: '2.5rem', borderRadius: '50%',
                                    background: player.status === 'waitlist' ? 'rgba(255,255,255,0.05)' : 'rgba(56, 189, 248, 0.1)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '1rem', fontWeight: 800, color: player.status === 'waitlist' ? '#64748b' : 'var(--primary)',
                                    border: `1px solid ${player.status === 'waitlist' ? 'transparent' : 'rgba(56, 189, 248, 0.2)'}`
                                }}>
                                    {player.name.charAt(0).toUpperCase()}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{ fontWeight: 700, color: player.status === 'waitlist' ? '#94a3b8' : 'white' }}>
                                            {player.name}
                                        </span>
                                        {player.is_organizer && <span style={{ fontSize: '0.75rem', color: 'var(--warning)', opacity: 0.9 }}>⭐</span>}
                                    </div>
                                    {player.status === 'waitlist' && (
                                        <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                                            En Espera (Suplente)
                                        </span>
                                    )}
                                </div>
                            </div>
                            <OrganizerRemoveButton matchId={match.id} participantId={player.id} />
                        </div>
                    ))}
                    {participants.length === 0 && (
                        <div style={{ padding: '2rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '1rem', border: '1px dashed rgba(255,255,255,0.05)' }}>
                            <p style={{ color: '#64748b', margin: 0 }}>Nadie se ha anotado aún.</p>
                        </div>
                    )}
                </div>


                {/* Join / Vote Form */}
                {match.status !== 'cancelled' && (
                    <div style={{ borderTop: '1px solid var(--card-border)', paddingTop: '2.5rem' }}>
                        <JoinMatchForm
                            matchId={match.id}
                            matchStatus={match.status}
                            options={match.options}
                            optionsVotes={optionsVotes}
                        />
                    </div>
                )}

                {/* Invite Buttons */}
                <div style={{ marginTop: '2rem' }}>
                    {/* If confirmed, share confirmed time. If pending, share dynamic link */}
                    <InviteButtons matchId={match.id} proposedTime={match.confirmed_option || match.options[0]} />
                </div>
            </div>
        </main>
    );
}

// Small client component for Remove Button (Only shows if organizer)
import OrganizerRemoveButton from '@/components/OrganizerRemoveButton';
