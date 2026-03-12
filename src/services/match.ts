import { supabase } from '@/lib/supabase';
import { Match, MatchWithParticipants, Participant } from '@/types';
import { TelegramService } from './telegram';

export const MatchService = {
    // --- PLAYER METHODS ---

    async createMatch(clubId: string, options: string[], durationMinutes: number = 90, isRegular: boolean = false): Promise<Match | null> {
        console.log('[MatchService.createMatch] Iniciando creación:', { clubId, options, durationMinutes, isRegular });
        const { data, error } = await supabase
            .from('matches')
            .insert([
                {
                    club_id: clubId,
                    proposed_time: options[0],
                    options: options,
                    duration_minutes: durationMinutes,
                    status: 'pending',
                    court_status: 'none',
                    is_regular: isRegular
                }
            ])
            .select()
            .single();

        if (error) {
            console.error('[MatchService.createMatch] ERROR CRÍTICO:', error);
            // If the error is 'column is_regular does not exist', we might want to tell the user
            if (error.message?.includes('is_regular')) {
                console.error('>>> ATENCIÓN: No has ejecutado la migración add_is_regular.sql');
            }
            return null;
        }
        return data;
    },

    async getMatch(id: string): Promise<MatchWithParticipants | null> {
        console.log(`[MatchService.getMatch] Buscando partido: ${id}`);
        // Base match query (Simple select to avoid join failures if schema is not ready)
        const { data: match, error: matchError } = await supabase
            .from('matches')
            .select('*')
            .eq('id', id)
            .single();

        if (matchError || !match) {
            console.error('[MatchService.getMatch] Error al obtener partido:', matchError);
            return null;
        }

        // Separate Club query (Fail-safe)
        let clubData = null;
        if (match.club_id) {
            const { data: club, error: clubError } = await supabase
                .from('clubs')
                .select('id, name, address, google_maps_url, telegram_chat_id')
                .eq('id', match.club_id)
                .single();

            if (clubError) {
                console.warn('[MatchService.getMatch] Aviso: No se pudieron cargar detalles del club (¿faltan columnas address/google_maps_url?):', clubError.message);
            } else {
                clubData = club;
            }
        }

        const { data: participants, error: participantsError } = await supabase
            .from('participants')
            .select('*')
            .eq('match_id', id)
            .order('created_at', { ascending: true });

        if (participantsError) {
            console.error('[MatchService.getMatch] Error al obtener participantes:', participantsError);
            return null;
        }

        // Defaults for compatibility
        if (!match.options && match.proposed_time) match.options = [match.proposed_time];
        if (!match.duration_minutes) match.duration_minutes = 90;
        if (!match.court_status) match.court_status = 'none';

        return {
            ...match,
            club: clubData,
            participants: participants || []
        };
    },

    async addOption(matchId: string, newTime: string, isRegular: boolean = false) {
        const match = await this.getMatch(matchId);
        if (!match) return null;

        const currentOptions = match.options || [];
        const isAlreadyThere = currentOptions.includes(newTime);
        const updatedOptions = isAlreadyThere ? currentOptions : [...currentOptions, newTime];

        // Update options AND is_regular (if it's true, we set it)
        const updateData: any = { options: updatedOptions };
        if (isRegular) updateData.is_regular = true;

        const { error } = await supabase.from('matches').update(updateData).eq('id', matchId);
        if (error) return null;

        return updatedOptions.indexOf(newTime);
    },

    async joinMatch(matchId: string, name: string, selectedOptions: number[], isOrganizer: boolean = false): Promise<Participant | null> {
        const match = await this.getMatch(matchId);
        if (!match) return null;

        let status = 'accepted';
        if (match.status === 'confirmed') {
            const confirmedCount = match.participants.filter(p => p.status === 'accepted').length;
            if (confirmedCount >= 4) status = 'waitlist';
        }

        const finalIsOrganizer = isOrganizer || match.participants.length === 0;

        const { data: participant, error } = await supabase
            .from('participants')
            .insert([{ match_id: matchId, name, is_organizer: finalIsOrganizer, status, selected_options: selectedOptions }])
            .select().single();

        if (error) return null;

        await this.checkAndConfirmMatch(matchId);
        return participant;
    },

    async checkAndConfirmMatch(matchId: string) {
        // 1. Fetch fresh match data with participants
        const match = await this.getMatch(matchId);
        if (!match) {
            console.error(`[checkAndConfirmMatch] Error: Match ${matchId} no encontrado.`);
            return;
        }

        if (match.status === 'confirmed') {
            console.log(`[checkAndConfirmMatch] Match ${matchId} ya está confirmado.`);
            return;
        }

        console.log(`[checkAndConfirmMatch] --- Auditoría de Votos: Partido ${matchId} ---`);

        const optionsVotes = new Array(match.options.length).fill(0);

        // Rigorous deduplication using normalized names
        const uniqueParticipants = new Map<string, Participant>();
        match.participants.forEach(p => {
            const normalizedName = p.name.trim().toLowerCase();
            // We keep the first instance of each name
            if (!uniqueParticipants.has(normalizedName)) {
                uniqueParticipants.set(normalizedName, p);
            }
        });

        console.log(`[checkAndConfirmMatch] Jugadores únicos detectados: ${uniqueParticipants.size} de ${match.participants.length}`);

        uniqueParticipants.forEach(p => {
            // Only count 'accepted' (and 'invited' for legacy)
            const isValidStatus = p.status === 'accepted' || p.status === 'invited';

            if (isValidStatus && Array.isArray(p.selected_options)) {
                console.log(`  > Voto válido: ${p.name} | Opciones: ${JSON.stringify(p.selected_options)}`);
                // Normalize each option index to Number
                p.selected_options.forEach(optVal => {
                    const idx = Number(optVal);
                    if (!isNaN(idx) && idx >= 0 && idx < optionsVotes.length) {
                        optionsVotes[idx]++;
                    }
                });
            } else {
                console.log(`  > Voto IGNORADO (status/no-options): ${p.name} | Status: ${p.status}`);
            }
        });

        console.log(`[checkAndConfirmMatch] Recuento final por índice:`, optionsVotes);

        const winningOptionIndex = optionsVotes.findIndex(count => count >= 4);

        if (winningOptionIndex !== -1) {
            const winningTime = match.options[winningOptionIndex];
            const winningVotes = optionsVotes[winningOptionIndex];

            console.log(`[checkAndConfirmMatch] ¡QUÓRUM ALCANZADO! Opción ${winningOptionIndex} tiene ${winningVotes} votos reales.`);

            const { error: updateError } = await supabase
                .from('matches')
                .update({
                    status: 'confirmed',
                    confirmed_option: winningTime,
                    proposed_time: winningTime,
                    court_status: 'requested'
                })
                .eq('id', matchId);

            if (updateError) {
                console.error('[checkAndConfirmMatch] Error al actualizar estado en DB:', updateError);
                return;
            }

            console.log(`[checkAndConfirmMatch] 🎉 Partido ${matchId} CONFIRMADO.`);
        } else {
            console.log(`[checkAndConfirmMatch] No se alcanzó el quórum de 4 votos únicos en ninguna opción.`);
        }
    },

    // --- CLUB / ADMIN METHODS ---

    async getClubDashboard(clubId: string) {
        // 1. Get Club Info
        const { data: club } = await supabase.from('clubs').select('*').eq('id', clubId).maybeSingle();

        // 2. Get Matches: 
        // - Any match assigned to this club (pending or reserved)
        // - Any match waiting for court (requested)
        const { data: matches, error } = await supabase
            .from('matches')
            .select('*, participants(*)')
            .or(`club_id.eq.${clubId},court_status.eq.requested`)
            .order('created_at', { ascending: false });

        return { club, matches: matches || [] };
    },

    async reserveCourt(matchId: string, clubId: string, courtDetails: string) {
        // 1. Get duration and club fallback price
        const { data: match } = await supabase.from('matches').select('duration_minutes').eq('id', matchId).single();
        const { data: club } = await supabase.from('clubs').select('default_price').eq('id', clubId).single();

        const duration = match?.duration_minutes || 90;
        const clubDefaultPrice = club?.default_price || 16000;

        // 2. Get price from court (robust search)
        const { data: court } = await supabase.from('courts')
            .select('price')
            .eq('club_id', clubId)
            .ilike('name', `%${courtDetails.trim()}%`) // Fuzzy match
            .limit(1)
            .maybeSingle();

        const basePrice = court?.price || clubDefaultPrice;
        const totalPrice = (basePrice * duration) / 60;

        const { error } = await supabase
            .from('matches')
            .update({
                club_id: clubId,
                court_status: 'reserved',
                court_details: courtDetails,
                payment_amount_total: totalPrice
            })
            .eq('id', matchId);

        return !error;
    },

    // Organizer Actions
    async cancelMatch(matchId: string) {
        const { error } = await supabase.from('matches').update({
            status: 'cancelled',
            court_status: 'none',
            confirmed_option: null
        }).eq('id', matchId);
        if (error) {
            console.error('[MatchService.cancelMatch] Error:', error);
            return false;
        }
        return true;
    },

    async rescheduleMatch(matchId: string, newDateTime: string): Promise<boolean> {
        console.log(`[MatchService.rescheduleMatch] Rescheduling match ${matchId} to ${newDateTime}`);
        const { error } = await supabase.from('matches').update({
            confirmed_option: newDateTime,
            proposed_time: newDateTime,
            options: [newDateTime]
        }).eq('id', matchId);
        if (error) {
            console.error('[MatchService.rescheduleMatch] Error:', error);
            return false;
        }
        return true;
    },

    async removeParticipant(participantId: string) {
        // 1. Get participant details before deleting
        const { data: participant } = await supabase
            .from('participants')
            .select('status, match_id')
            .eq('id', participantId)
            .single();

        if (!participant) return false;

        const { error: deleteError } = await supabase.from('participants').delete().eq('id', participantId);
        if (deleteError) {
            console.error('[MatchService.removeParticipant] Error deleting:', deleteError);
            return false;
        }

        // 2. Promote substitute if needed
        if (participant.status === 'accepted' || participant.status === 'invited') {
            const { data: nextPlayer } = await supabase
                .from('participants')
                .select('id')
                .eq('match_id', participant.match_id)
                .eq('status', 'waitlist')
                .order('created_at', { ascending: true })
                .limit(1)
                .single();

            if (nextPlayer) {
                await supabase.from('participants').update({ status: 'accepted' }).eq('id', nextPlayer.id);
            }
        }

        // 3. Quorum Check: If match was confirmed, does it still have 4+ players?
        const match = await this.getMatch(participant.match_id);
        if (match && match.status === 'confirmed') {
            const acceptedCount = match.participants.filter(p => p.status === 'accepted').length;
            if (acceptedCount < 4) {
                console.log(`[MatchService.removeParticipant] Quorum lost (${acceptedCount}/4). Reverting match ${match.id} to pending.`);
                await supabase.from('matches').update({
                    status: 'pending',
                    court_status: 'none',
                    confirmed_option: null
                }).eq('id', match.id);
            }
        }

        return true;
    },

    // --- GLOBAL ADMIN METHODS ---

    async getAdminDashboard() {
        // 1. Get All Matches with Participants
        const { data: matches, error: matchesError } = await supabase
            .from('matches')
            .select(`
                *,
                participants (
                    id,
                    name,
                    status
                )
            `)
            .order('created_at', { ascending: false });

        if (matchesError) {
            console.error('[MatchService.getAdminDashboard] Error fetching matches:', matchesError.message || matchesError);
        }

        // 2. Get All Clubs
        const { data: clubs, error: clubsError } = await supabase
            .from('clubs')
            .select('*')
            .order('name', { ascending: true });

        if (clubsError) {
            console.error('[MatchService.getAdminDashboard] Error fetching clubs:', clubsError.message || clubsError);
        }

        // 3. Join in memory
        const clubsMap = new Map((clubs || []).map(c => [c.id, c]));
        const matchesWithClubs = (matches || []).map(m => ({
            ...m,
            club: m.club_id ? clubsMap.get(m.club_id) : null
        }));

        return {
            matches: matchesWithClubs as (Match & { club: any; participants: any[] })[],
            clubs: clubs || []
        };
    },

    // --- COURT MANAGEMENT METHODS ---

    async getClubCourts(clubId: string) {
        const { data, error } = await supabase
            .from('courts')
            .select('*')
            .eq('club_id', clubId)
            .order('name', { ascending: true });

        if (error) {
            console.error('[MatchService.getClubCourts] Error:', error);
            return [];
        }
        return data || [];
    },

    async addCourt(clubId: string, name: string, type: string = 'Cristal', price: number = 0) {
        // Check for uniqueness within the club
        const { data: existing } = await supabase
            .from('courts')
            .select('id')
            .eq('club_id', clubId)
            .eq('name', name)
            .maybeSingle();

        if (existing) {
            throw new Error(`Ya existe una cancha con el nombre "${name}" en este club.`);
        }

        const { data, error } = await supabase
            .from('courts')
            .insert({ club_id: clubId, name, type, price, is_active: true })
            .select()
            .single();

        if (error) {
            console.error('[MatchService.addCourt] Error:', error);
            return null;
        }
        return data;
    },

    async deleteCourt(courtId: string) {
        const { error } = await supabase
            .from('courts')
            .delete()
            .eq('id', courtId);

        if (error) {
            console.error('[MatchService.deleteCourt] Error:', error);
            return false;
        }
        return true;
    },

    async updateCourt(courtId: string, data: { name?: string, type?: string, price?: number, is_active?: boolean }) {
        if (data.name) {
            // Get the clubId for this court first
            const { data: currentCourt } = await supabase.from('courts').select('club_id').eq('id', courtId).single();
            if (currentCourt) {
                // Check if another court in the same club has this name
                const { data: existing } = await supabase
                    .from('courts')
                    .select('id')
                    .eq('club_id', currentCourt.club_id)
                    .eq('name', data.name)
                    .neq('id', courtId)
                    .maybeSingle();

                if (existing) {
                    throw new Error(`Ya existe otra cancha con el nombre "${data.name}" en este club.`);
                }
            }
        }

        const { data: updatedCourt, error } = await supabase
            .from('courts')
            .update(data)
            .eq('id', courtId)
            .select()
            .single();

        if (error) {
            console.error('[MatchService.updateCourt] Error:', error);
            return null;
        }
        return updatedCourt;
    },

    async updateClub(clubId: string, data: {
        name?: string,
        address?: string,
        google_maps_url?: string,
        alias?: string,
        cbu?: string,
        bank_name?: string,
        account_holder?: string,
        opening_hours?: Record<string, { open: string, close: string, closed: boolean }>,
        deposit_percentage?: number,
        default_price?: number
    }) {
        console.log(`[MatchService.updateClub] Updating club ${clubId} with payload:`, JSON.stringify(data, null, 2));

        const { data: updatedClub, error } = await supabase
            .from('clubs')
            .update(data)
            .eq('id', clubId)
            .select()
            .maybeSingle();

        if (error) {
            console.error('[MatchService.updateClub] Error from Supabase:', error);
            return null;
        }

        console.log(`[MatchService.updateClub] Successfully updated club:`, updatedClub?.name);
        return updatedClub;
    },

    async toggleDeposit(matchId: string, isPaid: boolean) {
        const { error } = await supabase
            .from('matches')
            .update({ is_deposit_paid: isPaid })
            .eq('id', matchId);

        if (error) {
            console.error('[MatchService.toggleDeposit] Error:', error);
            return false;
        }

        // If newly paid, notify the organizer
        if (isPaid) {
            await this.notifyOrganizerOfPayment(matchId);
        }

        return true;
    },

    async confirmManualDeposit(matchId: string) {
        const { error } = await supabase
            .from('matches')
            .update({
                is_deposit_paid: true,
                status: 'pending' // Keep it pending if it still needs court assignment, but marked as paid
            })
            .eq('id', matchId);

        if (error) {
            console.error('[MatchService.confirmManualDeposit] Error:', error);
            return false;
        }

        await this.notifyOrganizerOfPayment(matchId);

        return true;
    },

    /**
     * Helper to notify the match organizer when the club confirms their deposit
     */
    async notifyOrganizerOfPayment(matchId: string) {
        try {
            // 1. Get Match and Organizer
            const match = await this.getMatch(matchId);
            if (!match) return;

            const organizer = match.participants.find(p => p.is_organizer);
            if (!organizer || !organizer.phone_number) return;

            // 2. Find their session
            const { data: session } = await supabase
                .from('whatsapp_sessions')
                .select('*')
                .eq('phone_number', organizer.phone_number)
                .single();

            if (!session) return;

            // 3. Update AI State to push them past AWAITING_PAYMENT
            // If they are alone, they probably need to share the link (MATCH_JOIN). If not, maybe just IDLE.
            const newState = 'MATCH_JOIN';
            await supabase
                .from('whatsapp_sessions')
                .update({ current_state: newState })
                .eq('id', session.id);

            // 4. Send Message via Telegram (if applicable)
            if (session.provider === 'telegram' && session.telegram_chat_id && session.client_id) {
                const text = `✅ <b>¡Seña Confirmada!</b>\n\nTu club nos avisó que recibió el pago. Tu partido quedó registrado correctamente.\n\nPodés compartir el link de inscripción con tus amigos o revisar los detalles cuando quieras.`;
                await TelegramService.sendMessage(session.client_id, session.telegram_chat_id, text);
            }
            // Note: WhatsApp outbound messaging would be integrated here in the future

        } catch (e) {
            console.error('[MatchService.notifyOrganizerOfPayment] Error:', e);
        }
    },

    /**
     * Recycles a regular match after it has finished.
     * - Deletes all participants
     * - Resets status to 'pending'
     * - Updates all time options by adding 7 days
     * - Clears confirmation and court details
     */
    async recycleRegularMatch(matchId: string): Promise<boolean> {
        console.log(`[MatchService.recycleRegularMatch] Reciclando partido regular: ${matchId}`);

        try {
            // 1. Delete all participants
            const { error: deleteError } = await supabase
                .from('participants')
                .delete()
                .eq('match_id', matchId);

            if (deleteError) {
                console.error('[MatchService.recycleRegularMatch] Error al eliminar participantes:', deleteError);
                return false;
            }

            // 2. Get current match to update options
            const match = await this.getMatch(matchId);
            if (!match) {
                console.error('[MatchService.recycleRegularMatch] Partido no encontrado');
                return false;
            }

            // 3. Add 7 days to all options
            const updatedOptions = (match.options || []).map(optionStr => {
                const date = new Date(optionStr);
                date.setDate(date.getDate() + 7);
                return date.toISOString();
            });

            // 4. Add 7 days to proposed_time
            const proposedDate = new Date(match.proposed_time || match.options[0]);
            proposedDate.setDate(proposedDate.getDate() + 7);

            // 5. Update match
            const { error: updateError } = await supabase
                .from('matches')
                .update({
                    status: 'pending',
                    options: updatedOptions,
                    proposed_time: proposedDate.toISOString(),
                    confirmed_option: null,
                    court_status: 'none',
                    court_details: null,
                    club_id: null // Clear club_id to make it a sterile recycled match
                })
                .eq('id', matchId);

            if (updateError) {
                console.error('[MatchService.recycleRegularMatch] Error al actualizar partido:', updateError);
                return false;
            }

            console.log(`[MatchService.recycleRegularMatch] ✅ Partido reciclado exitosamente`);
            return true;
        } catch (error) {
            console.error('[MatchService.recycleRegularMatch] Error inesperado:', error);
            return false;
        }
    },

    /**
     * Checks if a regular match needs to be recycled and does it automatically.
     * Returns true if the match was recycled.
     */
    async checkAndRecycleIfNeeded(matchId: string): Promise<boolean> {
        const match = await this.getMatch(matchId);
        if (!match) return false;

        // Only recycle if:
        // 1. It's a regular match
        // 2. It's confirmed
        // 3. The confirmed time has passed
        if (!match.is_regular || match.status !== 'confirmed' || !match.confirmed_option) {
            return false;
        }

        const confirmedTime = new Date(match.confirmed_option);
        const now = new Date();

        // Add duration to confirmed time to check if match has finished
        const matchEndTime = new Date(confirmedTime.getTime() + (match.duration_minutes || 90) * 60000);

        if (now > matchEndTime) {
            console.log(`[MatchService.checkAndRecycleIfNeeded] Partido regular finalizado, reciclando...`);
            return await this.recycleRegularMatch(matchId);
        }

        return false;
    },

    /**
     * Gets available 90-minute slots for all active courts of a specific club on a given date.
     * Checks overlapping with existing 'reserved' matches.
     */
    async getAvailability(dateStr: string, clubId: string): Promise<string> {
        if (!dateStr || !clubId) return "Necesito saber la fecha y el club para consultar.";
        // Force Argentina Time for parsing the date string
        const d = new Date(dateStr + 'T12:00:00-03:00');

        // 1. Get all potentially relevant matches
        const { data: matches } = await supabase
            .from('matches')
            .select('proposed_time, confirmed_option, duration_minutes, status, court_status, court_details, is_regular')
            .eq('club_id', clubId) // Added clubId filter
            .or(`status.in.("confirmed","pending"),court_status.eq.reserved`);

        const getArDate = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
        const targetDateStrRaw = getArDate(d);

        const filteredMatches = (matches || []).filter(m => {
            const mTimeStr = m.confirmed_option || m.proposed_time;
            if (!mTimeStr) return false;
            const mDate = new Date(mTimeStr);
            const isExactDate = getArDate(mDate) === targetDateStrRaw;
            if (isExactDate) return true;
            if (m.is_regular) {
                const isFuture = d.getTime() >= mDate.getTime();
                return mDate.getDay() === d.getDay() && isFuture;
            }
            return false;
        });

        // 2. Get club opening hours
        const { data: club } = await supabase.from('clubs').select('opening_hours').eq('id', clubId).single();
        if (!club) return "Club no encontrado.";

        const dayOfWeek = d.getDay().toString();
        const dayConfig = (club?.opening_hours as any)?.[dayOfWeek] || { open: '18:00', close: '23:00', closed: false };

        if (dayConfig.closed) {
            return `El club está CERRADO el día ${dateStr}. No se pueden realizar reservas.`;
        }

        // 3. Get all ACTIVE courts for this club
        const { data: courts } = await supabase.from('courts').select('*').eq('club_id', clubId).eq('is_active', true).order('name');
        if (!courts || courts.length === 0) return "No hay canchas configuradas en este club.";

        // 4. Calculate available 90-min slots for each court
        const results = courts.map(court => {
            const courtMatches = filteredMatches.filter(m =>
                (m.court_details || '').trim().toLowerCase() === (court.name || '').trim().toLowerCase()
            );

            // Generate possible start times (every 30 mins)
            const availableSlots: string[] = [];
            let current = new Date(`${targetDateStrRaw}T${dayConfig.open}:00-03:00`);
            const closeTime = new Date(`${targetDateStrRaw}T${dayConfig.close}:00-03:00`);

            // Calculate minimum allowed start time (now + 30 mins)
            const now = new Date();
            const minStartTime = new Date(now.getTime() + 30 * 60000);

            while (current < closeTime) {
                const start = new Date(current);
                const end = new Date(start.getTime() + 90 * 60000); // Check for 90-min duration

                // Skip this slot if it's in the past or starts in less than 30 mins
                if (start < minStartTime) {
                    current.setMinutes(current.getMinutes() + 30);
                    continue;
                }

                // Check if this slot overlaps with any match
                const isOverlap = courtMatches.some(m => {
                    const mTimeStr = m.confirmed_option || m.proposed_time;
                    const mDate = new Date(mTimeStr!);
                    let mStart = mDate;
                    if (getArDate(mDate) !== targetDateStrRaw) {
                        // Reposition for recurring
                        const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Argentina/Buenos_Aires', hour: '2-digit', minute: '2-digit', hour12: false }).format(mDate);
                        mStart = new Date(`${targetDateStrRaw}T${parts}-03:00`);
                    }
                    const mEnd = new Date(mStart.getTime() + (m.duration_minutes || 90) * 60000);
                    return start < mEnd && mStart < end;
                });

                if (!isOverlap && end <= closeTime) {
                    const startTimeStr = start.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Argentina/Buenos_Aires' });
                    const endTimeStr = end.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Argentina/Buenos_Aires' });
                    availableSlots.push(`${court.name} (${court.type || 'Padel'}), a las ${startTimeStr}hs hasta las ${endTimeStr}hs.`);
                }
                current.setMinutes(current.getMinutes() + 30);
            }

            return availableSlots;
        });

        // Flatten slots and format output
        const allSlots = results.flat();

        if (allSlots.length === 0) {
            return `Para el ${dateStr} no hay canchas disponibles.`;
        }

        return `Para el ${dateStr} las canchas disponibles son:\n${allSlots.join('\n')}`;
    },

    /**
     * Checks if a court is available for a given time and duration.
     */
    async isCourtAvailable(clubId: string, courtName: string, time: string, durationMinutes: number): Promise<boolean> {
        const startTime = new Date(time);

        // Reject if the requested time is in the past or less than 30 mins away
        const now = new Date();
        const minAllowedTime = new Date(now.getTime() + 30 * 60000);
        if (startTime < minAllowedTime) {
            console.warn(`[isCourtAvailable] Rejected request for ${time}. Too close or in the past.`);
            return false;
        }

        const endTime = new Date(startTime.getTime() + durationMinutes * 60000);
        const courtLower = courtName.trim().toLowerCase();

        // Query potentially overlapping matches assigned to this club
        // We look for any match in status 'confirmed' or 'pending' assigned to this court
        const { data: matches } = await supabase
            .from('matches')
            .select('id, confirmed_option, proposed_time, duration_minutes, is_regular, status, court_status')
            .eq('club_id', clubId)
            .or(`status.in.("confirmed","pending"),court_status.eq.reserved`)
            .ilike('court_details', `%${courtName.trim()}%`);

        if (!matches || matches.length === 0) return true;

        const getArDate = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
        const targetDateStrRaw = getArDate(startTime);

        for (const m of matches) {
            const mTimeStr = m.confirmed_option || m.proposed_time;
            if (!mTimeStr) continue;
            const mDate = new Date(mTimeStr);

            // Check if match applies to target date
            const isExactDate = getArDate(mDate) === targetDateStrRaw;
            let applies = isExactDate;
            if (!applies && m.is_regular) {
                const isFuture = startTime.getTime() >= mDate.getTime();
                applies = mDate.getDay() === startTime.getDay() && isFuture;
            }

            if (applies) {
                // Time Overlap check (normalized to the same base day if recurring)
                let mStart = mDate;
                if (!isExactDate) {
                    // Reposition mStart to the target day for overlap comparison
                    // We extract hours/minutes/seconds from match date in Argentina Time
                    const parts = new Intl.DateTimeFormat('en-GB', {
                        timeZone: 'America/Argentina/Buenos_Aires',
                        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
                    }).formatToParts(mDate);

                    const h = parts.find(p => p.type === 'hour')?.value || '00';
                    const min = parts.find(p => p.type === 'minute')?.value || '00';
                    const sec = parts.find(p => p.type === 'second')?.value || '00';

                    // Create date string for target day with match time and Argentina offset
                    mStart = new Date(`${targetDateStrRaw}T${h}:${min}:${sec}-03:00`);
                }

                const mEnd = new Date(mStart.getTime() + (m.duration_minutes || 90) * 60000);

                if (startTime < mEnd && mStart < endTime) {
                    console.warn(`[isCourtAvailable] Overlap found for court ${courtName} at ${time}. Overlapping match: ${m.id}`);
                    return false;
                }
            }
        }

        return true;
    }
};
