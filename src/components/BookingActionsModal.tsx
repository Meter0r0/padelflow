'use client';

import { useState, useTransition } from 'react';
import { cancelMatchAction, rescheduleMatchAction } from '@/app/actions';
import { Match } from '@/types';
import Link from 'next/link';

interface BookingActionsModalProps {
    match: Match;
    clubId: string;
    onClose: () => void;
}

export default function BookingActionsModal({ match, clubId, onClose }: BookingActionsModalProps) {
    const [view, setView] = useState<'menu' | 'reschedule' | 'cancel'>('menu');
    const [newDate, setNewDate] = useState('');
    const [newTime, setNewTime] = useState('');
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    // Helper: format date/time for display
    const formatDT = (isoStr?: string) => {
        if (!isoStr) return '—';
        return new Intl.DateTimeFormat('es-AR', {
            weekday: 'short', day: 'numeric', month: 'short',
            hour: '2-digit', minute: '2-digit', hour12: false,
            timeZone: 'America/Argentina/Buenos_Aires'
        }).format(new Date(isoStr));
    };

    const handleCancel = () => {
        startTransition(async () => {
            try {
                const fd = new FormData();
                fd.set('matchId', match.id);
                fd.set('clubId', clubId);
                await cancelMatchAction(fd);
                onClose();
            } catch (e: any) {
                setError(e.message || 'Error al cancelar.');
            }
        });
    };

    const handleReschedule = () => {
        if (!newDate || !newTime) { setError('Ingresá la nueva fecha y hora.'); return; }
        setError(null);
        startTransition(async () => {
            try {
                const fd = new FormData();
                fd.set('matchId', match.id);
                fd.set('clubId', clubId);
                fd.set('newDate', newDate);
                fd.set('newTime', newTime);
                await rescheduleMatchAction(fd);
                onClose();
            } catch (e: any) {
                setError(e.message || 'Error al reprogramar.');
            }
        });
    };

    const overlay: React.CSSProperties = {
        position: 'fixed', inset: 0, zIndex: 999,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
    };
    const card: React.CSSProperties = {
        background: '#1e293b', borderRadius: '1rem',
        border: '1px solid rgba(255,255,255,0.1)',
        padding: '1.5rem', width: '100%', maxWidth: 380,
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)', color: 'white'
    };
    const btn = (color: string, bg: string): React.CSSProperties => ({
        width: '100%', padding: '0.75rem', borderRadius: '0.5rem',
        border: 'none', cursor: 'pointer', fontWeight: 700,
        fontSize: '0.9rem', color, background: bg,
        marginTop: '0.5rem', transition: 'opacity 0.2s',
        opacity: isPending ? 0.6 : 1
    });

    const matchTime = match.confirmed_option || match.proposed_time;

    return (
        <div style={overlay} onClick={onClose}>
            <div style={card} onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div>
                        <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            Gestionar reserva
                        </p>
                        <p style={{ margin: 0, fontWeight: 900, fontSize: '1rem', color: 'var(--primary)' }}>
                            {match.court_details || 'Cancha'}
                        </p>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>{formatDT(matchTime)}</p>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '1.5rem', lineHeight: 1 }}>×</button>
                </div>

                {/* Status badge */}
                <div style={{ marginBottom: '1rem' }}>
                    <span style={{
                        display: 'inline-block', fontSize: '0.65rem', fontWeight: 900,
                        padding: '3px 8px', borderRadius: '4px', textTransform: 'uppercase',
                        background: match.is_deposit_paid ? '#22c55e22' : '#f59e0b22',
                        color: match.is_deposit_paid ? '#22c55e' : '#f59e0b',
                        border: `1px solid ${match.is_deposit_paid ? '#22c55e44' : '#f59e0b44'}`
                    }}>
                        {match.is_deposit_paid ? '✅ Señado' : '⏳ Sin seña'}
                    </span>
                </div>

                {error && (
                    <div style={{ background: '#ef444422', border: '1px solid #ef4444', borderRadius: '0.4rem', padding: '0.5rem', fontSize: '0.8rem', color: '#ef4444', marginBottom: '0.75rem' }}>
                        {error}
                    </div>
                )}

                {/* MENU VIEW */}
                {view === 'menu' && (
                    <>
                        <Link href={`/match/${match.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                            <button style={{ ...btn('white', 'rgba(255,255,255,0.07)'), border: '1px solid rgba(255,255,255,0.12)' }}>
                                🔍 Ver detalles completos
                            </button>
                        </Link>
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', margin: '0.75rem 0' }} />
                        <button style={btn('white', '#3b82f6')} onClick={() => setView('reschedule')} disabled={isPending}>
                            📅 Mover de fecha/hora
                        </button>
                        <button style={btn('white', '#dc2626')} onClick={() => setView('cancel')} disabled={isPending}>
                            🗑️ Cancelar reserva
                        </button>
                        <button style={{ ...btn('#94a3b8', 'transparent'), border: '1px solid rgba(255,255,255,0.1)', marginTop: '0.75rem' }} onClick={onClose}>
                            Cerrar
                        </button>
                    </>
                )}

                {/* RESCHEDULE VIEW */}
                {view === 'reschedule' && (
                    <>
                        <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.75rem' }}>
                            Seleccioná la nueva fecha y hora para la reserva:
                        </p>
                        <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>Nueva fecha</label>
                        <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)}
                            style={{ width: '100%', padding: '0.6rem', borderRadius: '0.4rem', border: '1px solid rgba(255,255,255,0.1)', background: '#0f172a', color: 'white', fontSize: '0.9rem', boxSizing: 'border-box', marginBottom: '0.5rem' }} />
                        <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>Nueva hora (24hs)</label>
                        <input type="time" value={newTime} onChange={e => setNewTime(e.target.value)}
                            style={{ width: '100%', padding: '0.6rem', borderRadius: '0.4rem', border: '1px solid rgba(255,255,255,0.1)', background: '#0f172a', color: 'white', fontSize: '0.9rem', boxSizing: 'border-box', marginBottom: '1rem' }} />
                        <button style={btn('white', '#3b82f6')} onClick={handleReschedule} disabled={isPending}>
                            {isPending ? 'Guardando...' : '✅ Confirmar nuevo horario'}
                        </button>
                        <button style={{ ...btn('#94a3b8', 'transparent'), border: '1px solid rgba(255,255,255,0.1)' }} onClick={() => { setView('menu'); setError(null); }}>
                            ← Volver
                        </button>
                    </>
                )}

                {/* CANCEL VIEW */}
                {view === 'cancel' && (
                    <>
                        <div style={{ background: '#ef444411', border: '1px solid #ef444433', borderRadius: '0.5rem', padding: '0.75rem', marginBottom: '1rem' }}>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#fca5a5' }}>
                                ⚠️ Al cancelar, el turno quedará libre en la grilla. Esta acción no se puede deshacer.
                            </p>
                            {match.is_deposit_paid && (
                                <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', color: '#f87171' }}>
                                    La reserva tiene una seña pagada. Para el reembolso, contactá directamente al cliente.
                                </p>
                            )}
                        </div>
                        <button style={btn('white', '#dc2626')} onClick={handleCancel} disabled={isPending}>
                            {isPending ? 'Cancelando...' : '🗑️ Sí, cancelar reserva'}
                        </button>
                        <button style={{ ...btn('#94a3b8', 'transparent'), border: '1px solid rgba(255,255,255,0.1)' }} onClick={() => { setView('menu'); setError(null); }}>
                            ← Volver
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
