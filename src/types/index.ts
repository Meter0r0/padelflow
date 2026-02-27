export type MatchStatus = 'pending' | 'pending_payment' | 'confirmed' | 'cancelled';
export type ParticipantStatus = 'invited' | 'accepted' | 'declined' | 'waitlist';
export type CourtStatus = 'none' | 'requested' | 'reserved';
export type ReservationStatus = 'pending_payment' | 'confirmed' | 'cancelled' | 'admin_blocked';

export interface Match {
    id: string;
    created_at: string;
    status: MatchStatus;
    proposed_time?: string;
    options: string[];
    club_id?: string;
    confirmed_option?: string;
    duration_minutes: number;
    court_status: CourtStatus;
    court_details?: string;
    is_regular?: boolean;
    is_deposit_paid?: boolean;
    payment_amount_expected?: number;
    payment_amount_total?: number;
    payment_proof_url?: string;
}

export interface Club {
    id: string;
    name: string;
    address?: string;
    google_maps_url?: string; // New
    telegram_id?: string;
    opening_hours?: Record<string, { open: string, close: string, closed: boolean }>;
    mp_access_token?: string;
    reservation_timeout_minutes?: number;
    requires_deposit_percent?: number;
    default_price?: number;
}

export interface Participant {
    id: string;
    match_id: string;
    name: string;
    is_organizer: boolean;
    status: ParticipantStatus;
    created_at: string;
    selected_options?: number[];
    phone_number?: string;
}

export interface MatchWithParticipants extends Match {
    participants: Participant[];
    club?: Club; // New
}

export interface Reservation {
    id: string;
    court_id: string;
    club_id: string;
    player_id?: string;
    player_name?: string;
    start_time: string;
    end_time: string;
    status: ReservationStatus;
    payment_id?: string;
    payment_amount_expected?: number;
    payment_amount_paid?: number;
    created_at: string;
    updated_at: string;
}

export interface ReservationWithDetails extends Reservation {
    club?: Club;
    /* Optional joined fields */
}
