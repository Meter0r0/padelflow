'use client';

import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="container" style={{ minHeight: '90vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>

      <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
        <h1 className="title" style={{ fontSize: '3.5rem', marginBottom: '1rem', letterSpacing: '-0.02em' }}>PadelFlow</h1>
        <p className="subtitle" style={{ fontSize: '1.25rem', opacity: 0.8, maxWidth: '500px', margin: '0 auto' }}>
          La plataforma más inteligente para organizar tus partidos de pádel y gestionar tu club.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '2rem',
        width: '100%',
        maxWidth: '1000px'
      }}>

        {/* Jugadores Card */}
        <Link href="/create-match" style={{ textDecoration: 'none' }}>
          <div className="card" style={{
            margin: 0,
            height: '100%',
            padding: '2.5rem',
            textAlign: 'center',
            transition: 'all 0.3s ease',
            cursor: 'pointer',
            border: '1px solid rgba(56, 189, 248, 0.1)',
            background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.05) 0%, rgba(56, 189, 248, 0.02) 100%)'
          }}
            onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
            onMouseOut={(e) => e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.1)'}
          >
            <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>🎾</div>
            <h2 style={{ fontSize: '1.75rem', marginBottom: '1rem', color: 'white' }}>Jugadores</h2>
            <p style={{ color: '#94a3b8', marginBottom: '2rem', lineHeight: '1.6' }}>
              Organizá tu partido en segundos, votá horarios y sumate a la lista de espera.
            </p>
            <span className="btn btn-primary" style={{ width: '100%', display: 'inline-block' }}>Crear Partido</span>
          </div>
        </Link>

        {/* Clubes & Admin Card */}
        <Link href="/club" style={{ textDecoration: 'none' }}>
          <div className="card" style={{
            margin: 0,
            height: '100%',
            padding: '2.5rem',
            textAlign: 'center',
            transition: 'all 0.3s ease',
            cursor: 'pointer',
            border: '1px solid rgba(34, 197, 94, 0.1)',
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.05) 0%, rgba(34, 197, 94, 0.02) 100%)'
          }}
            onMouseOver={(e) => e.currentTarget.style.borderColor = '#22c55e'}
            onMouseOut={(e) => e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.1)'}
          >
            <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>🏢</div>
            <h2 style={{ fontSize: '1.75rem', marginBottom: '1rem', color: 'white' }}>Clubes y Gestión</h2>
            <p style={{ color: '#94a3b8', marginBottom: '2rem', lineHeight: '1.6' }}>
              Confirmá disponibilidad de canchas, gestioná reservas y observá métricas globales.
            </p>
            <span className="btn btn-secondary" style={{ width: '100%', display: 'inline-block', borderColor: '#22c55e', color: '#22c55e' }}>Entrar al Panel</span>
          </div>
        </Link>

        {/* Partidos Card */}
        <Link href="/partidos" style={{ textDecoration: 'none' }}>
          <div className="card" style={{
            margin: 0,
            height: '100%',
            padding: '2.5rem',
            textAlign: 'center',
            transition: 'all 0.3s ease',
            cursor: 'pointer',
            border: '1px solid rgba(168, 85, 247, 0.1)',
            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.05) 0%, rgba(168, 85, 247, 0.02) 100%)'
          }}
            onMouseOver={(e) => e.currentTarget.style.borderColor = '#a855f7'}
            onMouseOut={(e) => e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.1)'}
          >
            <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>📋</div>
            <h2 style={{ fontSize: '1.75rem', marginBottom: '1rem', color: 'white' }}>Ver Partidos</h2>
            <p style={{ color: '#94a3b8', marginBottom: '2rem', lineHeight: '1.6' }}>
              Explorá todos los partidos programados, revisá estados y sumate a jugar.
            </p>
            <span className="btn" style={{
              width: '100%',
              display: 'inline-block',
              border: '1px solid #a855f7',
              color: '#a855f7',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem'
            }}>Explorar Lista</span>
          </div>
        </Link>

      </div>

      <div style={{ marginTop: '4rem', opacity: 0.4, fontSize: '0.875rem' }}>
        © 2026 PadelFlow - Advanced Match Management
      </div>

    </main>
  );
}
