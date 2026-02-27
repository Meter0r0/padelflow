'use client';

import { useState, useEffect } from 'react';
import { removeParticipantAction } from '@/app/actions';

export default function OrganizerRemoveButton({ matchId, participantId }: { matchId: string, participantId: string }) {
    const [isOrganizer, setIsOrganizer] = useState(false);

    useEffect(() => {
        const role = localStorage.getItem(`match_role_${matchId}`);
        setIsOrganizer(role === 'organizer');
    }, [matchId]);

    if (!isOrganizer) return null;

    return (
        <form action={removeParticipantAction}>
            <input type="hidden" name="matchId" value={matchId} />
            <input type="hidden" name="participantId" value={participantId} />
            <button
                type="submit"
                style={{
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    color: '#f87171', fontSize: '1.25rem', padding: '0 0.5rem'
                }}
                title="Eliminar jugador"
                onClick={(e) => { if (!confirm('¿Eliminar a este jugador?')) e.preventDefault(); }}
            >
                ×
            </button>
        </form>
    );
}
