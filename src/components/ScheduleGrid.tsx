'use client';

import { Match, MatchWithParticipants, Participant } from '@/types';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import BookingActionsModal from './BookingActionsModal';

interface ScheduleGridProps {
    courts: any[];
    matches: Match[];
    selectedDate: Date;
    clubHours?: Record<string, { open: string, close: string, closed: boolean }>;
    clubId?: string;
}

export default function ScheduleGrid({ courts, matches, selectedDate, clubHours = {}, clubId }: ScheduleGridProps) {
    const CELL_HEIGHT = 42;
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const targetRef = useRef<HTMLDivElement>(null);
    const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

    // Responsive State
    const [isMobile, setIsMobile] = useState(false);
    const [selectedMobileCourtId, setSelectedMobileCourtId] = useState<string | null>(courts.length > 0 ? courts[0].id : null);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const checkMobile = () => {
            setIsMobile(window.matchMedia('(max-width: 768px)').matches);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Generate hours from 08:00 to 23:30
    const timeSlots: string[] = [];
    for (let h = 8; h <= 23; h++) {
        timeSlots.push(`${h.toString().padStart(2, '0')}:00`);
        timeSlots.push(`${h.toString().padStart(2, '0')}:30`);
    }

    // Autoscroll to 18:00 on mount
    useEffect(() => {
        if (targetRef.current && scrollContainerRef.current) {
            // Wait a bit for layout to settle
            setTimeout(() => {
                targetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 500);
        }
    }, [selectedDate]);

    // Help with Argentina Timezone translation (YYYY-MM-DD and HH:mm)
    const getArDate = (date: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
    const getArTime = (date: Date) => new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Argentina/Buenos_Aires', hour: '2-digit', minute: '2-digit', hour12: false }).format(date);

    const selectedDateStr = getArDate(selectedDate);

    // Get business hours for this specific day
    const dayOfWeek = selectedDate.getDay().toString(); // 0 is Sunday
    const todayConfig = clubHours[dayOfWeek] || { open: '18:00', close: '23:00', closed: false };

    // Strict Date matcher + Weekly Recurrence logic
    const matchesForDay = matches.filter(m => {
        const isOccupied = m.status === 'confirmed' || m.court_status === 'reserved' || m.status === 'pending';
        const targetTimeStr = m.confirmed_option || m.proposed_time;
        if (!isOccupied || !targetTimeStr) return false;

        const mDate = new Date(targetTimeStr);
        const isExactDate = getArDate(mDate) === selectedDateStr;

        if (isExactDate) return true;

        // If not exact date, check if it's a regular (weekly) and happens on the same day of week
        if (m.is_regular) {
            const matchDayOfWeek = mDate.getDay();
            const selectedDayOfWeek = selectedDate.getDay();

            // Selected date must be AFTER the match creation/confirmation date
            const isFuture = selectedDate.getTime() > mDate.getTime();

            return matchDayOfWeek === selectedDayOfWeek && isFuture;
        }

        return false;
    });

    const displayedCourts = isMobile ? courts.filter(c => c.id === selectedMobileCourtId) : courts;
    // Reduce the horizontal space each court column takes on desktop to make it fit narrower
    const gridMinWidth = isMobile ? '100%' : Math.max(displayedCourts.length * 90 + 70, 400);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            {isMounted && isMobile && courts.length > 0 && (
                <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    overflowX: 'auto',
                    paddingBottom: '0.5rem',
                    marginBottom: '1rem',
                    msOverflowStyle: 'none',
                    scrollbarWidth: 'none',
                    WebkitOverflowScrolling: 'touch'
                }}>
                    {courts.map(court => (
                        <button
                            key={court.id}
                            onClick={() => setSelectedMobileCourtId(court.id)}
                            style={{
                                padding: '0.5rem 1rem',
                                borderRadius: '2rem',
                                background: selectedMobileCourtId === court.id ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                color: selectedMobileCourtId === court.id ? '#0f172a' : 'white',
                                border: '1px solid',
                                borderColor: selectedMobileCourtId === court.id ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                                fontWeight: 800,
                                fontSize: '0.8rem',
                                whiteSpace: 'nowrap',
                                transition: 'all 0.2s',
                                opacity: court.is_active === false ? 0.5 : 1
                            }}
                        >
                            {court.name}
                        </button>
                    ))}
                </div>
            )}

            <div
                ref={scrollContainerRef}
                style={{
                    width: '100%',
                    maxWidth: '100%',
                    margin: '0 auto',
                    overflowX: 'auto',
                    background: 'var(--card-bg)',
                    borderRadius: '1.25rem',
                    border: '1px solid rgba(255,255,255,0.05)',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
                    maxHeight: '75vh',
                    overflowY: 'auto'
                }}
            >
                <div style={{ minWidth: gridMinWidth, position: 'relative' }}>
                    {/* Header: Court Names (Sticky) */}
                    <div style={{
                        display: 'flex',
                        borderBottom: '1px solid rgba(255,255,255,0.1)',
                        background: '#0f172a',
                        position: 'sticky',
                        top: 0,
                        zIndex: 30
                    }}>
                        <div style={{
                            width: 70,
                            flexShrink: 0,
                            padding: '0.75rem',
                            textAlign: 'center',
                            borderRight: '1px solid rgba(255,255,255,0.1)',
                            background: '#1e293b',
                            position: 'sticky',
                            left: 0,
                            zIndex: 40
                        }}>
                            🕒
                        </div>
                        {displayedCourts.map(court => (
                            <div key={court.id} style={{
                                flex: 1,
                                padding: '0.75rem 0.35rem',
                                textAlign: 'center',
                                fontWeight: 900,
                                fontSize: court.is_active === false ? '0.6rem' : '0.7rem',
                                color: court.is_active === false ? '#475569' : 'var(--primary)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                borderRight: '1px solid rgba(255,255,255,0.05)',
                                background: court.is_active === false ? 'rgba(0,0,0,0.3)' : 'transparent',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                {court.name}
                                {court.is_active === false && <span style={{ fontSize: '0.5rem', opacity: 0.5 }}>INACTIVA</span>}
                            </div>
                        ))}
                        {displayedCourts.length === 0 && (
                            <div style={{ flex: 1, padding: '0.75rem', textAlign: 'center', color: '#64748b' }}>
                                Sin canchas
                            </div>
                        )}
                    </div>

                    {/* Grid Body */}
                    <div style={{ position: 'relative' }}>
                        {timeSlots.map((time, idx) => (
                            <div
                                key={time}
                                ref={time === '18:00' ? targetRef : null}
                                style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.03)', height: CELL_HEIGHT }}
                            >
                                {/* Time Label (Sticky Horizontal) */}
                                <div style={{
                                    width: 70,
                                    flexShrink: 0,
                                    textAlign: 'center',
                                    fontSize: '0.85rem',
                                    color: 'white',
                                    borderRight: '2px solid rgba(56, 189, 248, 0.3)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 900,
                                    background: idx % 2 === 0 ? '#1e293b' : '#0f172a',
                                    position: 'sticky',
                                    left: 0,
                                    zIndex: 25,
                                    textShadow: '0 0 10px rgba(0,0,0,0.5)'
                                }}>
                                    {time}
                                </div>

                                {/* Court Columns */}
                                {displayedCourts.map(court => {
                                    const match = matchesForDay.find(m => {
                                        const targetTimeStr = m.confirmed_option || m.proposed_time;
                                        if (!targetTimeStr) return false;

                                        const mDate = new Date(targetTimeStr);
                                        const mTime = getArTime(mDate);
                                        const mCourt = (m.court_details || '').trim().toLowerCase();
                                        const cName = (court.name || '').trim().toLowerCase();

                                        const isCourtMatch = mCourt === cName ||
                                            (mCourt.length > 3 && cName.includes(mCourt)) ||
                                            (cName.length > 3 && mCourt.includes(cName));

                                        return mTime === time && isCourtMatch;
                                    });

                                    // Check Business Hours
                                    const isClosed = todayConfig.closed || time < todayConfig.open || time >= todayConfig.close;

                                    if (match) {
                                        const heightInCells = (match.duration_minutes || 90) / 30;
                                        const matchWithParticipants = match as MatchWithParticipants;
                                        const organizer = matchWithParticipants.participants?.find(p => p.is_organizer) || matchWithParticipants.participants?.[0];
                                        const playerName = organizer?.name || 'Jugador';

                                        const isExactDate = getArDate(new Date(match.confirmed_option || match.proposed_time!)) === selectedDateStr;

                                        const isSenado = isExactDate ? match.is_deposit_paid : false;
                                        const isPreReserva = !isSenado;

                                        let bgColor = 'rgba(56, 189, 248, 0.2)';
                                        let borderColor = 'var(--primary)';
                                        let shadowColor = 'rgba(56, 189, 248, 0.3)';

                                        if (isSenado) {
                                            bgColor = 'rgba(34, 197, 94, 0.25)';
                                            borderColor = '#22c55e';
                                            shadowColor = 'rgba(34, 197, 94, 0.3)';
                                        } else if (isPreReserva) {
                                            bgColor = 'rgba(251, 191, 36, 0.25)';
                                            borderColor = '#fbbf24';
                                            shadowColor = 'rgba(251, 191, 36, 0.3)';
                                        }

                                        const isInactive = court.is_active === false;

                                        return (
                                            <div key={court.id} style={{
                                                flex: 1,
                                                position: 'relative',
                                                borderRight: '1px solid rgba(255,255,255,0.03)',
                                                background: isInactive ? 'rgba(0,0,0,0.4)' : (isClosed ? 'url("data:image/svg+xml,%3Csvg width=\'10\' height=\'10\' viewBox=\'0 0 10 10\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M-1,1 l2,-2 M0,10 l10,-10 M9,11 l2,-2\' stroke=\'rgba(255,255,255,0.02)\' stroke-width=\'1\'/%3E%3C/svg%3E")' : 'transparent'),
                                                opacity: isInactive ? 0.6 : 1
                                            }}>
                                                <div
                                                    onClick={() => clubId ? setSelectedMatch(match) : undefined}
                                                    style={{
                                                        position: 'absolute',
                                                        top: 2, left: 4, right: 4,
                                                        height: heightInCells * CELL_HEIGHT - 4,
                                                        background: bgColor,
                                                        border: `2px solid ${borderColor}`,
                                                        borderRadius: '0.4rem',
                                                        zIndex: 10,
                                                        padding: '0.35rem',
                                                        overflow: 'hidden',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        transition: 'all 0.2s ease',
                                                        boxShadow: `0 4px 12px ${shadowColor}`,
                                                        backdropFilter: 'blur(8px)',
                                                        cursor: clubId ? 'pointer' : 'default'
                                                    }}
                                                >
                                                    <div style={{
                                                        fontSize: '0.55rem',
                                                        fontWeight: 900,
                                                        color: 'rgba(255,255,255,0.7)',
                                                        marginBottom: '2px',
                                                        display: 'flex',
                                                        justifyContent: 'space-between'
                                                    }}>
                                                        <span>#{match.id.slice(0, 4)}</span>
                                                        {match.is_regular && <span>🔁</span>}
                                                    </div>

                                                    {/* Player name */}
                                                    <div style={{
                                                        fontSize: '0.8rem', fontWeight: 900, color: 'white',
                                                        lineHeight: 1.1, marginBottom: '4px', wordBreak: 'break-word',
                                                        display: '-webkit-box', WebkitLineClamp: 2,
                                                        WebkitBoxOrient: 'vertical', overflow: 'hidden'
                                                    }}>
                                                        {playerName.toUpperCase()}
                                                    </div>

                                                    <div style={{ display: 'flex', gap: '0.15rem', alignItems: 'center', justifyContent: 'flex-end', marginTop: 'auto' }}>
                                                        {isSenado ? (
                                                            <div style={{ background: '#22c55e', color: '#0f172a', fontSize: '0.55rem', fontWeight: 900, padding: '2px 4px', borderRadius: '3px' }}>✅ SEÑADO</div>
                                                        ) : (
                                                            <div style={{ background: '#f59e0b', color: '#0f172a', fontSize: '0.55rem', fontWeight: 900, padding: '2px 4px', borderRadius: '3px' }}>⏳ PEND.</div>
                                                        )}
                                                        {clubId && <div style={{ background: 'rgba(255,255,255,0.1)', color: 'white', fontSize: '0.55rem', fontWeight: 900, padding: '2px 4px', borderRadius: '3px' }}>✏️</div>}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }

                                    const isInactive = court.is_active === false;

                                    return (
                                        <div key={court.id} style={{
                                            flex: 1,
                                            borderRight: '1px solid rgba(255,255,255,0.03)',
                                            background: isInactive ? 'rgba(0,0,0,0.4)' : (idx % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent'),
                                            opacity: isInactive ? 0.6 : 1
                                        }} />
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {selectedMatch && clubId && (
                <BookingActionsModal
                    match={selectedMatch}
                    clubId={clubId!}
                    onClose={() => setSelectedMatch(null)}
                />
            )}
        </div>
    );
}
