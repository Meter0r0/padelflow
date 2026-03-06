'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogOut } from 'lucide-react';
import { Club } from '@/types';

export default function ClubPortalPage() {
    const [clubs, setClubs] = useState<Club[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchClubs = async () => {
            try {
                // Since this page is protected by AuthWrapper, getSession should work
                const { data: { session } } = await supabase.auth.getSession();
                if (!session?.user) return;

                // Call the API or fetch directly via Supabase. 
                // For direct DB strategy:
                const { data, error } = await supabase
                    .from('clubs')
                    .select('*')
                    .eq('client_id', session.user.id);

                if (data) {
                    setClubs(data);
                }
            } catch (err) {
                console.error("Error fetching clubs:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchClubs();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    if (isLoading) {
        return (
            <main className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <div style={{ color: '#94a3b8' }}>Cargando tus clubes...</div>
            </main>
        );
    }

    return (
        <main className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                <div style={{ textAlign: 'left' }}>
                    <h1 className="title" style={{ fontSize: '2rem', textAlign: 'left' }}>Tus Clubes 🏢</h1>
                    <p style={{ color: '#94a3b8' }}>Seleccioná el panel que deseas gestionar.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <Link href="/client/dashboard" style={{
                        fontSize: '0.875rem',
                        color: 'var(--primary)',
                        textDecoration: 'none',
                        fontWeight: 600,
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        padding: '0.625rem 1rem',
                        borderRadius: '0.75rem',
                        background: 'rgba(56, 189, 248, 0.05)',
                        transition: 'all 0.2s'
                    }}>
                        🤖 Gestión de Bots y Sucursales
                    </Link>
                    <button
                        onClick={handleLogout}
                        title="Cerrar Sesión"
                        style={{ background: 'rgba(248, 113, 113, 0.1)', color: '#f87171', border: '1px solid rgba(248, 113, 113, 0.2)', padding: '0.75rem', borderRadius: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.2s' }}
                        onMouseOver={(e) => e.currentTarget.style.background = 'rgba(248, 113, 113, 0.2)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'rgba(248, 113, 113, 0.1)'}
                    >
                        <LogOut size={20} />
                    </button>
                </div>
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
                        }}
                            onMouseOver={(e) => e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.5)'}
                            onMouseOut={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'}
                        >
                            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🏢</div>
                            <h2 style={{ margin: '0 0 0.5rem 0', color: 'white' }}>{club.name}</h2>
                            <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                                {club.address || 'Sin dirección configurada'}
                            </p>
                            <span className="btn btn-secondary" style={{ width: '100%', fontSize: '0.875rem', border: '1px solid rgba(56, 189, 248, 0.3)', color: '#38bdf8' }}>Entrar al Panel →</span>
                        </div>
                    </Link>
                ))}

                {/* Add new club card */}
                <div className="card" style={{
                    margin: 0,
                    padding: '2rem',
                    textAlign: 'center',
                    border: '1px dashed rgba(255,255,255,0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '240px',
                    cursor: 'not-allowed',
                    opacity: 0.6
                }}>
                    <div style={{ fontSize: '2rem', marginBottom: '1rem', color: '#64748b' }}>+</div>
                    <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                        Agregar Sucursal (Próximamente)
                    </p>
                </div>
            </div>

            <div style={{ marginTop: '4rem', textAlign: 'center' }}>
                <Link href="/" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.875rem' }}>
                    ← Volver al Inicio
                </Link>
            </div>
        </main>
    );
}
