import { MatchService } from '@/services/match';
import { notFound } from 'next/navigation';
import { updateClubAction } from '@/app/actions';
import Link from 'next/link';
import CourtManager from '@/components/CourtManager';

export default async function ClubSettingsPage({
    params,
    searchParams
}: {
    params: Promise<{ id: string }>,
    searchParams: Promise<{ tab?: string, success?: string }>
}) {
    const { id } = await params;
    const { tab = 'profile', success } = await searchParams;
    const { club } = await MatchService.getClubDashboard(id);
    const courts = await MatchService.getClubCourts(id);

    if (!club) {
        notFound();
    }

    const isSuccess = success === 'true';

    return (
        <main className="container">
            {isSuccess && (
                <div style={{
                    background: 'rgba(34, 197, 94, 0.1)',
                    color: '#22c55e',
                    padding: '1rem',
                    borderRadius: '0.75rem',
                    marginBottom: '2rem',
                    border: '1px solid rgba(34, 197, 94, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    fontWeight: 700
                }}>
                    ✅ Cambios guardados correctamente. Los datos que ves ahora son los actuales en la base de datos.
                </div>
            )}
            <div style={{ marginBottom: '2rem' }}>
                <Link href={`/club/${id}/dashboard`} style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 700 }}>
                    ← Volver al Panel
                </Link>
                <h1 className="title" style={{ marginTop: '1rem' }}>Configuración del Club ⚙️</h1>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid #334155' }}>
                <Link
                    href={`/club/${id}/settings?tab=profile`}
                    style={{
                        padding: '0.75rem 1.5rem',
                        textDecoration: 'none',
                        color: tab === 'profile' ? 'var(--primary)' : '#94a3b8',
                        borderBottom: tab === 'profile' ? '2px solid var(--primary)' : 'none',
                        fontWeight: 700
                    }}
                >
                    Perfil
                </Link>
                <Link
                    href={`/club/${id}/settings?tab=courts`}
                    style={{
                        padding: '0.75rem 1.5rem',
                        textDecoration: 'none',
                        color: tab === 'courts' ? 'var(--primary)' : '#94a3b8',
                        borderBottom: tab === 'courts' ? '2px solid var(--primary)' : 'none',
                        fontWeight: 700
                    }}
                >
                    Canchas
                </Link>
            </div>

            {tab === 'profile' && (
                <div className="card">
                    <form action={updateClubAction}>
                        <input type="hidden" name="clubId" value={id} />

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700, color: '#94a3b8' }}>Nombre del Establecimiento</label>
                            <input
                                name="name"
                                defaultValue={club.name}
                                placeholder="Nombre del Club"
                                required
                                className="input"
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700, color: '#94a3b8' }}>Porcentaje de Seña (%)</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <input
                                        type="number"
                                        name="depositPercentage"
                                        defaultValue={club.deposit_percentage || 30}
                                        min="0"
                                        max="100"
                                        className="input"
                                        style={{ width: '100px', marginBottom: 0 }}
                                    />
                                    <span style={{ fontWeight: 700, color: '#94a3b8' }}>%</span>
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700, color: '#94a3b8' }}>Precio Base por Hora ($)</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ fontWeight: 700, color: '#94a3b8' }}>$</span>
                                    <input
                                        type="number"
                                        name="defaultPrice"
                                        defaultValue={club.default_price || 16000}
                                        min="0"
                                        step="100"
                                        className="input"
                                        style={{ marginBottom: 0 }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div style={{ marginBottom: '2rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700, color: '#94a3b8' }}>Dirección Física</label>
                            <input
                                name="address"
                                defaultValue={club.address || ''}
                                placeholder="Ej: Av. del Libertador 1234, CABA"
                                className="input"
                            />
                        </div>


                        <div style={{ marginBottom: '2rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700, color: '#94a3b8' }}>URL de Google Maps</label>
                            <input
                                name="googleMapsUrl"
                                defaultValue={club.google_maps_url || ''}
                                placeholder="https://maps.app.goo.gl/..."
                                className="input"
                            />
                            <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>
                                Este enlace se mostrará a los jugadores cuando la cancha esté reservada.
                            </p>
                        </div>

                        <div style={{ marginBottom: '2rem', padding: '1.5rem', border: '1px solid #334155', borderRadius: '0.5rem', backgroundColor: '#1e293b' }}>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.25rem', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                ⏰ Horarios de Apertura por Día
                            </h3>

                            <div style={{ display: 'grid', gap: '0.75rem' }}>
                                {['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].map((day, i) => {
                                    const dayConfig = (club.opening_hours as any)?.[i.toString()] || { open: '18:00', close: '23:00', closed: false };
                                    return (
                                        <div key={i} style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'minmax(100px, 1fr) auto 1fr 1fr',
                                            alignItems: 'center',
                                            gap: '1rem',
                                            padding: '0.75rem',
                                            background: 'rgba(255,255,255,0.02)',
                                            borderRadius: '0.5rem',
                                            border: '1px solid rgba(255,255,255,0.03)'
                                        }}>
                                            <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{day}</span>

                                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', cursor: 'pointer', color: '#94a3b8' }}>
                                                <input
                                                    type="checkbox"
                                                    name={`closed_${i}`}
                                                    defaultChecked={dayConfig.closed}
                                                    value="true"
                                                />
                                                Cerrado
                                            </label>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Abre:</span>
                                                <input
                                                    type="time"
                                                    name={`open_${i}`}
                                                    defaultValue={dayConfig.open}
                                                    className="input"
                                                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem', width: 'auto' }}
                                                />
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Cierra:</span>
                                                <input
                                                    type="time"
                                                    name={`close_${i}`}
                                                    defaultValue={dayConfig.close}
                                                    className="input"
                                                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem', width: 'auto' }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '1rem' }}>
                                Estos horarios definen el rango que el bot ofrecerá a los jugadores y lo que se muestra en la grilla.
                            </p>
                        </div>

                        <div style={{ marginBottom: '2rem', padding: '1.5rem', border: '1px solid #334155', borderRadius: '0.5rem', backgroundColor: '#1e293b' }}>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: '#e2e8f0' }}>Datos Bancarios (Para Transferencias) 💸</h3>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Alias (CBU/CVU)</label>
                                <input
                                    name="alias"
                                    defaultValue={club.alias || ''}
                                    placeholder="Ej: PADEL.FLOW.MP"
                                    className="input"
                                />
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>CBU / CVU</label>
                                <input
                                    name="cbu"
                                    defaultValue={club.cbu || ''}
                                    placeholder="0000003123123..."
                                    className="input"
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Banco / Billetera</label>
                                    <input
                                        name="bankName"
                                        defaultValue={club.bank_name || ''}
                                        placeholder="Ej: Mercado Pago"
                                        className="input"
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Titular</label>
                                    <input
                                        name="accountHolder"
                                        defaultValue={club.account_holder || ''}
                                        placeholder="Nombre del Titular"
                                        className="input"
                                    />
                                </div>
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.125rem' }}>
                            Guardar Cambios
                        </button>
                    </form>
                </div>
            )}

            {tab === 'courts' && (
                <CourtManager clubId={id} courts={courts} />
            )}
        </main>
    );
}
