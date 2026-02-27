'use client';

import { addCourtAction, deleteCourtAction, updateCourtAction } from '@/app/actions';
import { useState } from 'react';

export default function CourtManager({ clubId, courts }: { clubId: string, courts: any[] }) {
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    return (
        <div className="card" style={{ margin: 0, padding: '1.5rem', background: 'rgba(255,255,255,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Gestión de Canchas 🏠</h3>
                <button
                    onClick={() => {
                        setIsAdding(!isAdding);
                        setEditingId(null);
                    }}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem', width: 'auto' }}
                >
                    {isAdding ? 'Cancelar' : '+ Nueva Cancha'}
                </button>
            </div>

            {isAdding && (
                <form action={async (formData) => {
                    await addCourtAction(formData);
                    setIsAdding(false);
                }} style={{ marginBottom: '1.5rem', background: 'rgba(56, 189, 248, 0.05)', padding: '1rem', borderRadius: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <input type="hidden" name="clubId" value={clubId} />
                    <input name="name" placeholder="Número/Nombre" required className="input" style={{ marginBottom: 0, flex: '1 1 150px' }} />
                    <input name="type" placeholder="Tipo (Cristal, Muro, etc.)" className="input" style={{ marginBottom: 0, flex: '1 1 120px' }} />
                    <div style={{ position: 'relative', flex: '1 1 100px' }}>
                        <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>$</span>
                        <input name="price" type="number" step="0.01" placeholder="Precio" required className="input" style={{ marginBottom: 0, paddingLeft: '1.75rem' }} />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: 'auto', padding: '0 1.5rem' }}>Agregar</button>
                </form>
            )}

            <div style={{ display: 'grid', gap: '0.75rem' }}>
                {courts.map(court => {
                    const isEditing = editingId === court.id;

                    if (isEditing) {
                        return (
                            <form
                                key={court.id}
                                action={async (formData) => {
                                    await updateCourtAction(formData);
                                    setEditingId(null);
                                }}
                                style={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: '0.5rem',
                                    padding: '0.75rem 1rem',
                                    background: 'rgba(56, 189, 248, 0.05)',
                                    borderRadius: '0.75rem',
                                    border: '1px solid var(--primary)'
                                }}
                            >
                                <input type="hidden" name="courtId" value={court.id} />
                                <input type="hidden" name="clubId" value={clubId} />
                                <input name="name" defaultValue={court.name} placeholder="Nombre" required className="input" style={{ marginBottom: 0, flex: '1 1 150px' }} />
                                <input name="type" defaultValue={court.type} placeholder="Tipo" className="input" style={{ marginBottom: 0, flex: '1 1 100px' }} />
                                <div style={{ position: 'relative', flex: '1 1 80px' }}>
                                    <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>$</span>
                                    <input name="price" type="number" step="1" defaultValue={court.price} placeholder="Precio" required className="input" style={{ marginBottom: 0, paddingLeft: '1.75rem' }} />
                                </div>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.8rem', cursor: 'pointer', flex: '0 0 auto' }}>
                                    <input type="checkbox" name="isActive" defaultChecked={court.is_active !== false} />
                                    Habilitada
                                </label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button type="submit" className="btn btn-primary" style={{ width: 'auto', padding: '0 1rem' }}>OK</button>
                                    <button type="button" onClick={() => setEditingId(null)} className="btn btn-secondary" style={{ width: 'auto', padding: '0 1rem' }}>✘</button>
                                </div>
                            </form>
                        );
                    }

                    return (
                        <div key={court.id} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '0.75rem 1rem',
                            background: 'rgba(255,255,255,0.03)',
                            borderRadius: '0.75rem',
                            border: '1px solid rgba(255,255,255,0.05)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ background: court.is_active === false ? '#475569' : 'var(--primary)', color: 'white', width: '2.5rem', height: '2.5rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>
                                    {court.name.match(/\d+/)?.[0] || court.name[0]}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 700, color: court.is_active === false ? '#64748b' : 'white' }}>{court.name}</div>
                                    <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>{court.type}</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontWeight: 800, color: court.is_active === false ? '#64748b' : '#22c55e', fontSize: '1.125rem' }}>
                                        ${court.price || 0}
                                    </div>
                                    <div style={{ fontSize: '0.65rem', fontWeight: 700, color: court.is_active === false ? '#ef4444' : '#22c55e' }}>
                                        {court.is_active === false ? 'INACTIVA' : 'ACTIVA'}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                    <button
                                        onClick={() => {
                                            setEditingId(court.id);
                                            setIsAdding(false);
                                        }}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}
                                        title="Editar"
                                    >
                                        ✏️
                                    </button>
                                    <form action={deleteCourtAction} onSubmit={(e) => {
                                        if (!confirm('¿Estás seguro de eliminar esta cancha?')) e.preventDefault();
                                    }}>
                                        <input type="hidden" name="courtId" value={court.id} />
                                        <input type="hidden" name="clubId" value={clubId} />
                                        <button type="submit" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '1rem' }} title="Eliminar">
                                            🗑️
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    );
                })}
                {courts.length === 0 && (
                    <p style={{ textAlign: 'center', color: '#64748b', fontSize: '0.875rem', margin: '1rem 0' }}>
                        No hay canchas configuradas aún.
                    </p>
                )}
            </div>
        </div>
    );
}
