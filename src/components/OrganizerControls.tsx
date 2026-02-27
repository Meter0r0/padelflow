'use client';

import { useState, useEffect } from 'react';
import { cancelMatchAction } from '@/app/actions';

export default function OrganizerControls({ matchId }: { matchId: string }) {
    const [isOrganizer, setIsOrganizer] = useState(false);

    useEffect(() => {
        // Check if we have the organizer flag for *this* match? 
        // Or just "Identity"? 
        // MVP: The server assigned is_organizer=true to a participant.
        // We need to know if the BROWSING user is that participant.
        // We don't have login.
        // Strategy: When creating match, store `created_matches=[id1, id2]`.
        // Or simpler: We rely on "Honor System" + hidden UI? No.
        // The requirement was: "Identify by LocalStorage".
        // When you JOIN, let's store `myParticipantId`.
        // Then we compare `myParticipantId` with the list of participants?
        // BUT this component is Server Side rendered mostly.

        // Let's assume on "Create" or "Join" we saved `isOrganizer: true` in localStorage for this matchId.
        const role = localStorage.getItem(`match_role_${matchId}`);
        setIsOrganizer(role === 'organizer');
    }, [matchId]);

    if (!isOrganizer) return null;

    return (
        <div style={{
            marginBottom: '1rem',
            padding: '0.5rem',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '0.5rem',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
            <span style={{ fontSize: '0.875rem', color: '#fca5a5' }}>👑 Sos el Organizador</span>
            <form action={cancelMatchAction}>
                <input type="hidden" name="matchId" value={matchId} />
                <button
                    type="submit"
                    className="btn"
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem', background: '#dc2626', color: 'white' }}
                    onClick={(e) => { if (!confirm('¿Cancelar el partido?')) e.preventDefault(); }}
                >
                    Cancelar Partido
                </button>
            </form>
        </div>
    );
}
