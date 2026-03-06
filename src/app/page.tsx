'use client';

import Link from 'next/link';
import styles from './page.module.css';

export default function HomePage() {
  return (
    <main className={styles.main}>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroBackground}></div>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            Automatizá tu Club de Pádel con <span className={styles.heroTitleHighlight}>IA Avanzada</span>
          </h1>
          <p className={styles.heroSubtitle}>
            La plataforma más inteligente y eficiente. Nuestro Bot atiende a tus clientes 24/7, organiza reservas, optimiza huecos libres y cobra señas automáticamente.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/club" className={styles.btnPrimaryLarge}>
              Entrar al Panel del Club
            </Link>
          </div>
        </div>
      </section>

      {/* Integrations Bar */}
      <section className={styles.integrationsSection}>
        <h3 className={styles.integrationsTitle}>Integración nativa y total</h3>
        <div className={styles.integrationsFlex}>
          <div className={styles.integrationBadge}>
            <span style={{ color: '#25D366' }}>💬</span> WhatsApp
          </div>
          <div className={styles.integrationBadge}>
            <span style={{ color: '#229ED9' }}>✈️</span> Telegram
          </div>
          <div className={styles.integrationBadge}>
            <span style={{ color: '#009EE3' }}>💳</span> Mercado Pago
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className={styles.featuresGrid}>

        <div className={styles.glassCard}>
          <div className={styles.cardIcon}>🤖</div>
          <h3 className={styles.cardTitle}>Gestión 100% Autónoma</h3>
          <p className={styles.cardText}>
            Comunicate directamente por WhatsApp o Telegram. La IA comprende lenguaje natural, verifica disponibilidad en tiempo real y gestiona las reservas sin necesidad de una persona dedicada a esta tarea.
          </p>
        </div>

        <div className={styles.glassCard}>
          <div className={styles.cardIcon}>⏳</div>
          <h3 className={styles.cardTitle}>Disponibilidad 24/7</h3>
          <p className={styles.cardText}>
            No pierdas más turnos por no contestar a tiempo. PadelFlow asiste a tus jugadores en cualquier momento del día, brindando excelencia en el servicio a toda hora.
          </p>
        </div>

        <div className={styles.glassCard}>
          <div className={styles.cardIcon}>📈</div>
          <h3 className={styles.cardTitle}>Optimización de Canchas</h3>
          <p className={styles.cardText}>
            El bot aplica estrategias para llenar los espacios vacíos y organizar mejor tus franjas horarias, captando jugadores dispersos y consolidando partidos completos.
          </p>
        </div>

      </section>

      {/* Secondary Hero / Club Management Focus */}
      <section className={styles.managementSection}>
        <div className={styles.managementBackground}></div>
        <div className={styles.managementContent}>
          <h2 className={styles.managementTitle}>Eficiencia y Profesionalismo</h2>
          <p className={styles.managementSubtitle}>
            Olvidate del Excel y los errores de doble reserva. Centralizá todo tu club en una interfaz limpia, veloz y orientada a los deportes. Tomá decisiones basadas en datos y rentabilizá tu negocio al máximo.
          </p>
        </div>
      </section>

      {/* Pricing Section */}
      <section className={styles.pricingSection}>
        <div className={styles.pricingCard}>
          <div className={styles.pricingContent}>
            <span className={styles.pricingLabel}>Suscripción para Clubes</span>
            <div className={styles.pricingPrice}>
              <span className={styles.pricingCurrency}>U$D</span>40<span className={styles.pricingPeriod}>/mes</span>
            </div>
            <p style={{ color: '#64748b', marginTop: '-0.5rem', marginBottom: '2rem' }}>Por cancha</p>

            <p className={styles.pricingInfo}>
              Una tarifa plana, simple y transparente para el club. Incluye el bot conversacional, la plataforma de gestión completa y las integraciones de pagos y mensajería.
            </p>

            <div className={styles.pricingPlayers}>
              🎁 100% Gratis para los jugadores
            </div>
            <p style={{ color: '#94a3b8', marginTop: '1.5rem', fontSize: '1rem', maxWidth: '500px', margin: '1.5rem auto 0 auto' }}>
              Los jugadores disfrutan de una interfaz de primer nivel gratis para armar partidos y conseguir rivales, atrayendo más público a tu club.
            </p>

            <div style={{ marginTop: '3rem' }}>
              <Link href="/club" className={styles.btnPrimaryLarge} style={{ background: '#38bdf8', color: '#0f172a' }}>
                Comenzar ahora
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>© {new Date().getFullYear()} PadelFlow. La evolución en gestión de clubes deportivos.</p>
        <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link href="/partidos" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Ver Partidos</Link>
          <Link href="/create-match" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Organizar</Link>
        </div>
      </footer>

    </main>
  );
}
