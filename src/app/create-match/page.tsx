'use client';

import { useState } from 'react';
import { createMatchAction } from '@/app/actions';

export default function CreateMatchPage() {
    const [proposedDates, setProposedDates] = useState(['']);
    const [proposedTimes, setProposedTimes] = useState(['']);

    const addOption = () => {
        setProposedDates([...proposedDates, '']);
        setProposedTimes([...proposedTimes, '']);
    };

    const removeOption = (index: number) => {
        if (proposedDates.length > 1) {
            setProposedDates(proposedDates.filter((_, i) => i !== index));
            setProposedTimes(proposedTimes.filter((_, i) => i !== index));
        }
    };

    return (
        <main className="container">
            <h1 className="title">Crear Nuevo Partido 🎾</h1>

            <div className="card">
                <form action={createMatchAction}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>
                            Próximos Horarios (Proponé al menos uno)
                        </label>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {proposedDates.map((date, index) => (
                                <div key={index} style={{
                                    display: 'flex',
                                    gap: '0.5rem',
                                    alignItems: 'center',
                                    background: 'rgba(255,255,255,0.02)',
                                    padding: '0.75rem',
                                    borderRadius: '0.75rem',
                                    border: '1px solid rgba(255,255,255,0.05)'
                                }}>
                                    <input
                                        type="date"
                                        name="proposedDate"
                                        className="input"
                                        required
                                        value={date}
                                        onChange={(e) => {
                                            const newDates = [...proposedDates];
                                            newDates[index] = e.target.value;
                                            setProposedDates(newDates);
                                        }}
                                        style={{ flex: 2 }}
                                    />
                                    <input
                                        type="time"
                                        name="proposedTime"
                                        list="time-suggestions"
                                        className="input"
                                        required
                                        value={proposedTimes[index]}
                                        onChange={(e) => {
                                            const newTimes = [...proposedTimes];
                                            newTimes[index] = e.target.value;
                                            setProposedTimes(newTimes);
                                        }}
                                        placeholder="HH:MM"
                                        style={{ flex: 1 }}
                                    />
                                    {proposedDates.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeOption(index)}
                                            style={{
                                                background: 'rgba(239, 68, 68, 0.1)',
                                                color: '#ef4444',
                                                border: 'none',
                                                borderRadius: '0.5rem',
                                                padding: '0.5rem',
                                                cursor: 'pointer',
                                                fontSize: '1.25rem'
                                            }}
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        <datalist id="time-suggestions">
                            <option value="08:00" /><option value="08:30" />
                            <option value="09:00" /><option value="09:30" />
                            <option value="10:00" /><option value="10:30" />
                            <option value="11:00" /><option value="11:30" />
                            <option value="12:00" /><option value="12:30" />
                            <option value="13:00" /><option value="13:30" />
                            <option value="14:00" /><option value="14:30" />
                            <option value="15:00" /><option value="15:30" />
                            <option value="16:00" /><option value="16:30" />
                            <option value="17:00" /><option value="17:30" />
                            <option value="18:00" /><option value="18:30" />
                            <option value="19:00" /><option value="19:30" />
                            <option value="20:00" /><option value="20:30" />
                            <option value="21:00" /><option value="21:30" />
                            <option value="22:00" /><option value="22:30" />
                        </datalist>

                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={addOption}
                            style={{ marginTop: '1rem', width: '100%', fontSize: '0.875rem' }}
                        >
                            + Agregar otra opción de horario
                        </button>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700, color: '#94a3b8' }}>Duración del Partido</label>
                        <select name="duration" className="input" defaultValue="90">
                            <option value="60">60 Minutos</option>
                            <option value="90">90 Minutos</option>
                            <option value="120">120 Minutos</option>
                            <option value="150">150 Minutos (Torneo)</option>
                        </select>
                    </div>

                    <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(56, 189, 248, 0.05)', padding: '1rem', borderRadius: '0.75rem' }}>
                        <input type="checkbox" name="isRegular" id="isRegular" style={{ width: '1.25rem', height: '1.25rem', cursor: 'pointer' }} />
                        <label htmlFor="isRegular" style={{ cursor: 'pointer', fontWeight: 600 }}>
                            🔁 Es un partido semanal (Regular)
                        </label>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', fontSize: '1.125rem', padding: '1rem' }}>
                        Crear y Obtener Link de Invitación
                    </button>
                </form>
            </div>
        </main>
    );
}
