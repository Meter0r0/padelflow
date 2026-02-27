'use client';

import { useActionState, useEffect } from 'react';
import { reserveCourtAction } from '@/app/actions';
import { useToast } from './Toast';

export default function ReserveCourtForm({
    matchId,
    clubId,
    courts = []
}: {
    matchId: string,
    clubId: string,
    courts?: any[]
}) {
    const { showToast } = useToast();

    // We use useActionState to handle the server action and its state
    const [state, formAction, isPending] = useActionState(async (prevState: any, formData: FormData) => {
        try {
            await reserveCourtAction(formData);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }, null);

    useEffect(() => {
        if (state?.success) {
            showToast('Cancha reservada con éxito!', 'success');
        } else if (state?.error) {
            showToast(`Error: ${state.error}`, 'error');
        }
    }, [state, showToast]);

    return (
        <form action={formAction} style={{ display: 'flex', gap: '0.5rem', alignItems: 'stretch', width: '100%' }}>
            <input type="hidden" name="matchId" value={matchId} />
            <input type="hidden" name="clubId" value={clubId} />

            {courts.length > 0 ? (
                <select
                    name="courtDetails"
                    required
                    disabled={isPending}
                    className="input"
                    style={{ marginBottom: 0, flex: 1, opacity: isPending ? 0.7 : 1, fontSize: '0.875rem' }}
                >
                    <option value="">Seleccionar Cancha...</option>
                    {courts.map(c => (
                        <option key={c.id} value={c.name}>{c.name} ({c.type})</option>
                    ))}
                </select>
            ) : (
                <input
                    type="text"
                    name="courtDetails"
                    placeholder="Nº Cancha / Info"
                    required
                    disabled={isPending}
                    className="input"
                    style={{ marginBottom: 0, flex: 1, opacity: isPending ? 0.7 : 1, fontSize: '0.875rem' }}
                />
            )}

            <button
                type="submit"
                className="btn btn-primary"
                disabled={isPending}
                style={{ width: 'auto', whiteSpace: 'nowrap', opacity: isPending ? 0.7 : 1, padding: '0 1.25rem' }}
            >
                {isPending ? '⏳' : 'Confirmar'}
            </button>
        </form>
    );
}
