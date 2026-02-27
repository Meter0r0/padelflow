'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function RealtimeMatchSync({ matchId }: { matchId: string }) {
    const router = useRouter();

    useEffect(() => {
        const matchChannel = supabase
            .channel(`match-${matchId}`)
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'matches', filter: `id=eq.${matchId}` },
                () => router.refresh()
            )
            .subscribe();

        const participantsChannel = supabase
            .channel(`participants-${matchId}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'participants', filter: `match_id=eq.${matchId}` },
                () => router.refresh()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(matchChannel);
            supabase.removeChannel(participantsChannel);
        };
    }, [matchId, router]);

    return null; // This component doesn't render anything
}
