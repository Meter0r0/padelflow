'use client';

import { useState, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectTo = searchParams?.get('redirectTo') || '/client/dashboard';

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setMessage(null);

        try {
            if (isLogin) {
                const { error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (signInError) throw signInError;

                router.push(redirectTo);
            } else {
                if (!name.trim()) {
                    throw new Error("El nombre de la organización es obligatorio");
                }

                // Register user
                const { data: authData, error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                });

                if (signUpError) throw signUpError;

                if (authData.user) {
                    const { error: clientError } = await supabase.from('clients').insert([{
                        id: authData.user.id,
                        name: name
                    }]);

                    if (clientError) {
                        console.error("Error linking client object:", clientError);
                    }

                    if (authData.session) {
                        router.push(redirectTo);
                    } else {
                        setMessage("Revisa tu correo para confirmar tu cuenta.");
                    }
                }
            }
        } catch (err: any) {
            setError(err.message || 'Ocurrió un error. Verifica tus datos.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '3rem 2rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{isLogin ? '🏢' : '✨'}</div>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: 'white' }}>
                    {isLogin ? 'Acceso a Clubes' : 'Nuevo Administrador'}
                </h1>
                <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                    {isLogin ? 'Ingresá tus credenciales para continuar' : 'Comenzá a automatizar tu club'}
                </p>
            </div>

            {error && (
                <div style={{ background: 'rgba(248, 113, 113, 0.1)', color: '#f87171', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1.5rem', fontSize: '0.875rem', textAlign: 'center' }}>
                    {error}
                </div>
            )}

            {message && (
                <div style={{ background: 'rgba(74, 222, 128, 0.1)', color: '#4ade80', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1.5rem', fontSize: '0.875rem', textAlign: 'center' }}>
                    {message}
                </div>
            )}

            <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {!isLogin && (
                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', color: '#cbd5e1', marginBottom: '0.5rem' }}>Nombre de Organización / Club</label>
                        <input
                            type="text"
                            className="input"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ej: Padel Pro Center"
                            required={!isLogin}
                            style={{ marginBottom: 0 }}
                        />
                    </div>
                )}

                <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', color: '#cbd5e1', marginBottom: '0.5rem' }}>Correo Electrónico</label>
                    <input
                        type="email"
                        className="input"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="tu@correo.com"
                        required
                        style={{ marginBottom: 0 }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', color: '#cbd5e1', marginBottom: '0.5rem' }}>Contraseña</label>
                    <input
                        type="password"
                        className="input"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        style={{ marginBottom: 0 }}
                    />
                </div>

                <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isLoading}
                    style={{ marginTop: '1rem', opacity: isLoading ? 0.7 : 1 }}
                >
                    {isLoading ? 'Procesando...' : (isLogin ? 'Iniciar Sesión' : 'Crear Cuenta')}
                </button>
            </form>

            <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.875rem', color: '#94a3b8' }}>
                {isLogin ? '¿No tenés cuenta? ' : '¿Ya tenés cuenta? '}
                <button
                    type="button"
                    onClick={() => { setIsLogin(!isLogin); setError(null); setMessage(null); }}
                    style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', fontWeight: 600, padding: 0 }}
                >
                    {isLogin ? 'Registrate' : 'Iniciá Sesión'}
                </button>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <main className="container" style={{ minHeight: '90vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <Suspense fallback={<div style={{ color: '#94a3b8' }}>Cargando portal...</div>}>
                <LoginForm />
            </Suspense>
        </main>
    );
}
