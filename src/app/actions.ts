'use server'

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { MatchService } from '@/services/match';

export async function createMatchAction(formData: FormData) {
    const dates = formData.getAll('proposedDate') as string[];
    const times = formData.getAll('proposedTime') as string[];
    const duration = parseInt(formData.get('duration') as string || '90');
    const isRegular = formData.get('isRegular') === 'on' || formData.get('isRegular') === 'true';
    const clubId = formData.get('clubId') as string;

    // Combine Date + Time into ISO-like string
    const combinedTimes = dates.map((date, i) => {
        if (!date || !times[i]) return null;
        return `${date}T${times[i]}`;
    }).filter(t => t !== null) as string[];

    if (combinedTimes.length === 0) {
        throw new Error('Se requiere al menos un horario completo (Fecha y Hora)');
    }

    if (!clubId) {
        throw new Error('No se ha proporcionado un Club ID.');
    }

    const match = await MatchService.createMatch(clubId, combinedTimes, duration, isRegular);

    if (match) {
        revalidatePath(`/match/${match.id}`);
        redirect(`/match/${match.id}`);
    }
}

export async function joinMatchAction(formData: FormData) {
    const matchId = formData.get('matchId') as string;
    const name = formData.get('name') as string;
    const isOrganizer = formData.get('isOrganizer') === 'true';

    // Process suggestion of new time (may be split or empty)
    const newDate = formData.get('newOptionDate') as string;
    const newTime = formData.get('newOptionTime') as string;
    const isRegular = formData.get('isRegular') === 'on' || formData.get('isRegular') === 'true';

    let newOptionDateTime = '';
    if (newDate && newTime) {
        newOptionDateTime = `${newDate}T${newTime}`;
    }

    const selectedOptionsRaw = formData.getAll('selectedOptions') as string[];
    let selectedOptions = selectedOptionsRaw.map(Number);

    if (!matchId || !name) {
        throw new Error('Faltan campos obligatorios (Nombre e ID de partido)');
    }

    // NEW Logic: If it's a confirmed match, we can assume the player accepts the confirmed time
    const match = await MatchService.getMatch(matchId);
    if (match && match.status === 'confirmed' && selectedOptions.length === 0) {
        // Find the index of the confirmed option in the options array
        const confirmedIdx = match.options?.findIndex(opt =>
            match.confirmed_option && new Date(opt).getTime() === new Date(match.confirmed_option).getTime()
        );
        if (confirmedIdx !== undefined && confirmedIdx !== -1) {
            selectedOptions = [confirmedIdx];
        }
    }

    // If user proposed a NEW time, add it to the match options first
    if (newOptionDateTime) {
        const newIndex = await MatchService.addOption(matchId, newOptionDateTime, isRegular);
        if (newIndex !== null) {
            selectedOptions.push(newIndex);
        }
    }

    // RIGOROUS VALIDATION: Player MUST vote for something if NOT confirmed
    if (selectedOptions.length === 0) {
        throw new Error('Debes seleccionar al menos un horario o proponer uno nuevo para anotarte. ¡No podés ir al partido sin decir cuándo podés jugar!');
    }

    const participant = await MatchService.joinMatch(matchId, name, selectedOptions, isOrganizer);

    if (participant) {
        console.log(`[joinMatchAction] Participant joined: ${participant.id}. Revalidating and redirecting...`);
        revalidatePath(`/match/${matchId}`);
        const roleParam = participant.is_organizer ? '&role=organizer' : '';
        redirect(`/match/${matchId}?joined=${participant.id}${roleParam}`);
    }
}

// New Actions for Organizer
export async function cancelMatchAction(formData: FormData) {
    const matchId = formData.get('matchId') as string;
    const clubId = formData.get('clubId') as string;

    if (matchId) {
        console.log(`[cancelMatchAction] Attempting to cancel match: ${matchId}`);
        const success = await MatchService.cancelMatch(matchId);
        if (!success) {
            throw new Error('No se pudo cancelar el partido. Verifica tu conexión o permisos.');
        }
        if (clubId) revalidatePath(`/club/${clubId}/dashboard`);
        revalidatePath(`/match/${matchId}`);
    }
}

export async function removeParticipantAction(formData: FormData) {
    const participantId = formData.get('participantId') as string;
    const matchId = formData.get('matchId') as string;
    if (participantId) {
        console.log(`[removeParticipantAction] Removing participant: ${participantId} from match: ${matchId}`);
        const success = await MatchService.removeParticipant(participantId);
        if (!success) {
            throw new Error('No se pudo eliminar al jugador. Verifica los permisos de la base de datos.');
        }
        if (matchId) revalidatePath(`/match/${matchId}`);
    }
}

export async function reserveCourtAction(formData: FormData) {
    const matchId = formData.get('matchId') as string;
    const clubId = formData.get('clubId') as string;
    const courtDetails = formData.get('courtDetails') as string;

    if (!matchId || !clubId || !courtDetails) {
        throw new Error('Missing reservation details');
    }

    const success = await MatchService.reserveCourt(matchId, clubId, courtDetails);

    if (success) {
        revalidatePath(`/club/${clubId}/dashboard`);
        revalidatePath(`/match/${matchId}`);
    }
}

export async function addCourtAction(formData: FormData) {
    const clubId = formData.get('clubId') as string;
    const name = formData.get('name') as string;
    const type = formData.get('type') as string;
    const price = parseFloat(formData.get('price') as string || '0');

    if (!clubId || !name) return;

    const court = await MatchService.addCourt(clubId, name, type, price);
    if (court) {
        revalidatePath(`/club/${clubId}/settings`);
        revalidatePath(`/club/${clubId}/dashboard`);
    }
}

export async function updateCourtAction(formData: FormData) {
    const courtId = formData.get('courtId') as string;
    const clubId = formData.get('clubId') as string;
    const name = formData.get('name') as string;
    const type = formData.get('type') as string;
    const price = parseFloat(formData.get('price') as string || '0');
    const isActive = formData.get('isActive') === 'on' || formData.get('isActive') === 'true';

    if (!courtId) return;

    const court = await MatchService.updateCourt(courtId, { name, type, price, is_active: isActive });
    if (court && clubId) {
        revalidatePath(`/club/${clubId}/settings`);
        revalidatePath(`/club/${clubId}/dashboard`);
    }
}

export async function deleteCourtAction(formData: FormData) {
    const courtId = formData.get('courtId') as string;
    const clubId = formData.get('clubId') as string;

    if (!courtId) return;

    const success = await MatchService.deleteCourt(courtId);
    if (success && clubId) {
        revalidatePath(`/club/${clubId}/settings`);
        revalidatePath(`/club/${clubId}/dashboard`);
    }
}

export async function updateClubAction(formData: FormData) {
    const clubId = formData.get('clubId') as string;
    const name = formData.get('name') as string;
    const address = formData.get('address') as string;
    const googleMapsUrl = formData.get('googleMapsUrl') as string;
    const alias = formData.get('alias') as string;
    const cbu = formData.get('cbu') as string;
    const bankName = formData.get('bankName') as string;
    const accountHolder = formData.get('accountHolder') as string;
    const depositPercentage = parseFloat(formData.get('depositPercentage') as string || '30');
    const defaultPrice = parseFloat(formData.get('defaultPrice') as string || '16000');

    console.log(`[updateClubAction] Received Form Data for ${clubId}:`, {
        name,
        address,
        googleMapsUrl,
        alias,
        depositPercentage
    });

    // Opening Hours Logic
    const opening_hours: any = {};
    for (let i = 0; i < 7; i++) {
        opening_hours[i.toString()] = {
            open: formData.get(`open_${i}`) as string || '18:00',
            close: formData.get(`close_${i}`) as string || '23:00',
            closed: formData.get(`closed_${i}`) === 'on' || formData.get(`closed_${i}`) === 'true'
        };
    }

    if (!clubId) return;

    const result = await MatchService.updateClub(clubId, {
        name,
        address,
        google_maps_url: googleMapsUrl,
        alias,
        cbu,
        bank_name: bankName,
        account_holder: accountHolder,
        opening_hours,
        deposit_percentage: depositPercentage,
        default_price: defaultPrice
    });

    if (result) {
        console.log(`[updateClubAction] Club ${clubId} updated successfully.`);
    } else {
        console.error(`[updateClubAction] Failed to update club ${clubId}.`);
    }

    revalidatePath(`/club/${clubId}/dashboard`);
    revalidatePath(`/club/${clubId}/settings`);
    redirect(`/club/${clubId}/settings?success=true`);
}

export async function toggleDepositAction(formData: FormData) {
    const matchId = formData.get('matchId') as string;
    const isPaid = formData.get('isPaid') === 'true';
    const clubId = formData.get('clubId') as string;

    if (!matchId) return;

    await MatchService.toggleDeposit(matchId, isPaid);
    if (clubId) revalidatePath(`/club/${clubId}/dashboard`);
    revalidatePath(`/match/${matchId}`);
}

export async function confirmManualDepositAction(formData: FormData) {
    const matchId = formData.get('matchId') as string;
    const clubId = formData.get('clubId') as string;

    if (!matchId) return;

    await MatchService.confirmManualDeposit(matchId);
    if (clubId) revalidatePath(`/club/${clubId}/dashboard`);
    revalidatePath(`/match/${matchId}`);
}

export async function rescheduleMatchAction(formData: FormData) {
    const matchId = formData.get('matchId') as string;
    const clubId = formData.get('clubId') as string;
    const newDate = formData.get('newDate') as string;
    const newTime = formData.get('newTime') as string;

    if (!matchId || !newDate || !newTime) {
        throw new Error('Faltan datos para reprogramar la reserva.');
    }

    // Build ISO local string with Argentina offset
    const newDateTime = `${newDate}T${newTime}:00-03:00`;

    const success = await MatchService.rescheduleMatch(matchId, newDateTime);
    if (!success) {
        throw new Error('No se pudo mover la reserva. Intentá de nuevo.');
    }

    if (clubId) revalidatePath(`/club/${clubId}/dashboard`);
    revalidatePath(`/match/${matchId}`);
}
