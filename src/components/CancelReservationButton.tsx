'use client';

import { cancelMatchAction } from '@/app/actions';
import { useState } from 'react';

export default function CancelReservationButton({ matchId, clubId }: { matchId: string, clubId: string }) {
    const [isPending, setIsPending] = useState(false);

    return (
        <form
            action={async (formData) => {
                if (confirm('¿Estás seguro de que querés cancelar esta pre-reserva? Se liberará el horario inmediatamente.')) {
                    setIsPending(true);
                    try {
                        await cancelMatchAction(formData);
                    } finally {
                        setIsPending(false);
                    }
                }
            }}
        >
            <input type="hidden" name="matchId" value={matchId} />
            <input type="hidden" name="clubId" value={clubId} />
            <button
                type="submit"
                disabled={isPending}
                className="btn btn-secondary"
                style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    color: '#ef4444',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    fontSize: '0.75rem',
                    padding: '0.4rem 0.8rem',
                    width: 'auto',
                    opacity: isPending ? 0.6 : 1
                }}
            >
                {isPending ? 'Cancelando...' : '🗑️ Cancelar'}
            </button>
        </form>
    );
}
