'use client';

import { useEffect } from 'react';

import { useSearchParams, useRouter } from 'next/navigation';

interface MatchIdentityHandlerProps {
    matchId: string;
}

export default function MatchIdentityHandler({ matchId }: MatchIdentityHandlerProps) {
    const searchParams = useSearchParams();
    const router = useRouter();

    useEffect(() => {
        const joinedId = searchParams.get('joined');
        const role = searchParams.get('role');

        if (joinedId) {
            localStorage.setItem(`match_pid_${matchId}`, joinedId);
            if (role === 'organizer') {
                localStorage.setItem(`match_role_${matchId}`, 'organizer');
            }

            // Cleanup URL
            const newUrl = window.location.pathname;
            router.replace(newUrl);
        }
    }, [matchId, searchParams, router]);

    return null;
}
