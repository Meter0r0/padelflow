'use client';

import { useEffect, useState } from 'react';
import { joinMatchAction } from '@/app/actions';

interface JoinMatchFormProps {
    matchId: string;
    matchStatus: string;
    options: string[];
    optionsVotes: number[];
}

const PLAYER_NAME_KEY = 'padelflow_player_name';

export default function JoinMatchForm({ matchId, matchStatus, options, optionsVotes }: JoinMatchFormProps) {
    const [playerName, setPlayerName] = useState('');

    // Load saved name from localStorage on mount
    useEffect(() => {
        const savedName = localStorage.getItem(PLAYER_NAME_KEY);
        if (savedName) {
            setPlayerName(savedName);
        }
    }, []);

    // Save name to localStorage before submitting
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        const formData = new FormData(e.currentTarget);
        const name = formData.get('name') as string;

        if (name && name.trim()) {
            localStorage.setItem(PLAYER_NAME_KEY, name.trim());
        }

        // Let the form submit naturally to the server action
    };

    return (
        <div style={{
            background: '#f1f5f9',
            padding: '1.5rem',
            borderRadius: '1.25rem',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
        }}>
            <h3 style={{ marginBottom: '1.25rem', fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>
                {matchStatus === 'confirmed' ? '🙌 ¡Sumate al Partido!' : '🎾 Anotate o Votá'}
            </h3>

            <form action={joinMatchAction} onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <input type="hidden" name="matchId" value={matchId} />

                <div style={{ display: 'grid', gap: '0.75rem' }}>
                    <p style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', marginBottom: '0.25rem', textTransform: 'uppercase' }}>
                        {matchStatus === 'confirmed' ? 'Confirmá que podés jugar:' : 'Elegí tu disponibilidad (Obligatorio)'}
                    </p>
                    {options.map((opt, idx) => (
                        <label key={idx} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            cursor: 'pointer',
                            padding: '0.875rem',
                            background: 'white',
                            borderRadius: '0.75rem',
                            border: '1px solid #e2e8f0',
                            color: '#0f172a',
                            transition: 'all 0.2s ease'
                        }}>
                            <input type="checkbox" name="selectedOptions" value={idx} style={{ width: '1.25rem', height: '1.25rem' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                <span style={{ fontWeight: 600 }}>{new Date(opt).toLocaleString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false, weekday: 'short', day: 'numeric' })}</span>
                                <span style={{
                                    fontSize: '0.75rem',
                                    fontWeight: 800,
                                    color: optionsVotes[idx] >= 4 ? 'var(--success)' : 'var(--primary)',
                                    background: optionsVotes[idx] > 0 ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
                                    padding: '0.2rem 0.5rem',
                                    borderRadius: '0.5rem',
                                    opacity: optionsVotes[idx] > 0 ? 1 : 0.4
                                }}>
                                    {optionsVotes[idx]} {optionsVotes[idx] === 1 ? 'voto' : 'votos'}
                                </span>
                            </div>
                        </label>
                    ))}
                </div>

                {matchStatus !== 'confirmed' && (
                    <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            ¿Sugerir otro horario?
                        </label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input
                                type="date"
                                name="newOptionDate"
                                className="input"
                                style={{ colorScheme: 'light', background: 'white', border: '1px solid #e2e8f0', color: '#0f172a', marginBottom: 0, flex: 1.2 }}
                            />
                            <input
                                type="time"
                                name="newOptionTime"
                                step="1800"
                                list="time-slots-match"
                                className="input"
                                style={{ colorScheme: 'light', background: 'white', border: '1px solid #e2e8f0', color: '#0f172a', marginBottom: 0, flex: 0.8 }}
                            />
                        </div>
                        <datalist id="time-slots-match">
                            <option value="08:00" /> <option value="08:30" />
                            <option value="09:00" /> <option value="09:30" />
                            <option value="10:00" /> <option value="10:30" />
                            <option value="11:00" /> <option value="11:30" />
                            <option value="12:00" /> <option value="12:30" />
                            <option value="13:00" /> <option value="13:30" />
                            <option value="14:00" /> <option value="14:30" />
                            <option value="15:00" /> <option value="15:30" />
                            <option value="16:00" /> <option value="16:30" />
                            <option value="17:00" /> <option value="17:30" />
                            <option value="18:00" /> <option value="18:30" />
                            <option value="19:00" /> <option value="19:30" />
                            <option value="20:00" /> <option value="20:30" />
                            <option value="21:00" /> <option value="21:30" />
                            <option value="22:00" /> <option value="22:30" />
                            <option value="23:00" />
                        </datalist>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem' }}>
                            <input
                                type="checkbox"
                                name="isRegular"
                                id="isRegularMatch"
                                style={{ width: '1rem', height: '1rem', cursor: 'pointer' }}
                            />
                            <label htmlFor="isRegularMatch" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)', cursor: 'pointer' }}>
                                🔁 Marcar como Horario Regular (Semanal)
                            </label>
                        </div>
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <input
                        type="text"
                        name="name"
                        placeholder="Tu Nombre para la lista"
                        required
                        className="input"
                        style={{ marginBottom: 0, background: 'white', border: '1px solid #e2e8f0', color: '#0f172a' }}
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                    />
                    <button type="submit" className="btn btn-primary" style={{ padding: '1rem' }}>
                        {matchStatus === 'confirmed' ? 'Anotarme como Suplente' : 'Confirmar Presencia / Voto'}
                    </button>
                </div>
            </form>
        </div>
    );
}
