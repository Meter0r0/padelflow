'use client';

import { useActionState, useEffect } from 'react';
import { confirmManualDepositAction } from '@/app/actions';
import { useToast } from './Toast';

export default function ConfirmPaymentButton({
    matchId,
    clubId
}: {
    matchId: string,
    clubId: string
}) {
    const { showToast } = useToast();

    const [state, formAction, isPending] = useActionState(async (prevState: any, formData: FormData) => {
        try {
            await confirmManualDepositAction(formData);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }, null);

    useEffect(() => {
        if (state?.success) {
            showToast('Seña confirmada con éxito!', 'success');
        } else if (state?.error) {
            showToast(`Error: ${state.error}`, 'error');
        }
    }, [state, showToast]);

    return (
        <form action={formAction}>
            <input type="hidden" name="matchId" value={matchId} />
            <input type="hidden" name="clubId" value={clubId} />
            <button
                type="submit"
                disabled={isPending}
                className="btn btn-secondary"
                style={{
                    fontSize: '0.75rem',
                    padding: '0.4rem 0.8rem',
                    width: 'auto',
                    background: 'rgba(34, 197, 94, 0.1)',
                    color: '#22c55e',
                    border: '1px solid rgba(34, 197, 94, 0.2)'
                }}
            >
                {isPending ? '⏳' : '💰 Confirmar Seña'}
            </button>
        </form>
    );
}
