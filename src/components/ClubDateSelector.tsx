'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';

interface ClubDateSelectorProps {
    defaultValue: string;
}

export default function ClubDateSelector({ defaultValue }: ClubDateSelectorProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const containerRef = useRef<HTMLDivElement>(null);

    const handleChange = (date: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('status', 'grid');
        params.set('date', date);
        router.push(`?${params.toString()}`);
    };

    // Helper: format Date object to YYYY-MM-DD in Argentina Tz
    const getArgentinaISO = (d: Date) => {
        const formatted = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'America/Argentina/Buenos_Aires',
            year: 'numeric', month: '2-digit', day: '2-digit'
        }).format(d);
        return formatted;
    };

    // Generate next 30 days
    const days = [];
    // Start with "today" in Argentina Time
    const nowLocal = new Date();
    const todayStr = getArgentinaISO(nowLocal);
    const tzBaseDate = new Date(todayStr + 'T12:00:00-03:00');

    for (let i = 0; i < 30; i++) {
        const d = new Date(tzBaseDate);
        d.setDate(tzBaseDate.getDate() + i);
        days.push(d);
    }

    // Auto-scroll to selected date on load
    useEffect(() => {
        if (!containerRef.current) return;
        const activeBtn = containerRef.current.querySelector('button[data-active="true"]');
        if (activeBtn) {
            activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    }, [defaultValue]);

    // Scroll functions for desktop arrows
    const scrollLeft = () => {
        if (containerRef.current) {
            containerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
        }
    };

    const scrollRight = () => {
        if (containerRef.current) {
            containerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
        }
    };

    return (
        <div style={{ marginBottom: '1.5rem', position: 'relative', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Nav Arrow Left (Desktop only) */}
            <div className="hidden md:flex" style={{
                position: 'absolute',
                left: '-1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 10,
                alignItems: 'center'
            }}>
                <button
                    onClick={scrollLeft}
                    style={{
                        background: 'var(--card-bg)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '50%',
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                        color: 'white'
                    }}
                >
                    ◀
                </button>
            </div>

            {/* Nav Arrow Right (Desktop only) */}
            <div className="hidden md:flex" style={{
                position: 'absolute',
                right: '-1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 10,
                alignItems: 'center'
            }}>
                <button
                    onClick={scrollRight}
                    style={{
                        background: 'var(--card-bg)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '50%',
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                        color: 'white'
                    }}
                >
                    ▶
                </button>
            </div>

            {/* 30-Day Quick Tabs */}
            <div
                ref={containerRef}
                style={{
                    display: 'flex',
                    gap: '0.4rem',
                    overflowX: 'auto',
                    paddingBottom: '0.75rem',
                    msOverflowStyle: 'none',
                    scrollbarWidth: 'none',
                    WebkitOverflowScrolling: 'touch',
                    scrollSnapType: 'x mandatory'
                }}
            >
                {days.map((day, idx) => {
                    const dateStr = getArgentinaISO(day);
                    const isActive = defaultValue === dateStr;

                    const weekday = new Intl.DateTimeFormat('es-AR', { weekday: 'short', timeZone: 'America/Argentina/Buenos_Aires' }).format(day).replace('.', '');
                    const month = new Intl.DateTimeFormat('es-AR', { month: 'short', timeZone: 'America/Argentina/Buenos_Aires' }).format(day).replace('.', '');
                    const dayNum = day.getDate();

                    return (
                        <button
                            key={idx}
                            data-active={isActive}
                            onClick={() => handleChange(dateStr)}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '0.5rem 0.6rem',
                                minWidth: '55px',
                                background: isActive ? 'var(--primary)' : 'rgba(255,255,255,0.03)',
                                color: isActive ? '#0f172a' : 'white',
                                border: isActive ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.05)',
                                borderRadius: '0.6rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                flexShrink: 0,
                                scrollSnapAlign: 'center',
                                gap: '0.1rem'
                            }}
                        >
                            <span style={{ fontSize: '0.55rem', fontWeight: 800, textTransform: 'uppercase', opacity: isActive ? 0.7 : 0.5 }}>
                                {weekday}
                            </span>
                            <span style={{ fontSize: '1.1rem', fontWeight: 900, lineHeight: 1 }}>
                                {dayNum}
                            </span>
                            <span style={{ fontSize: '0.5rem', fontWeight: 700, textTransform: 'uppercase', opacity: isActive ? 0.8 : 0.4 }}>
                                {month}
                            </span>
                        </button>
                    );
                })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.5rem' }}>
                <span style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Deslizá para ver más fechas
                </span>
            </div>
        </div>
    );
}
