import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '@/lib/supabase';
import { MatchService } from './match';
import { TelegramService } from './telegram';

// Initialize Gemini
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.warn("⚠️  WARNING: GEMINI_API_KEY is not set in environment variables.");
}
const genAI = new GoogleGenerativeAI(apiKey || 'dummy_key_to_avoid_crash');

export const AIService = {
    async processMessage(contactId: string, messageBody: string, provider: 'whatsapp' | 'telegram' = 'whatsapp', userName?: string, clientId?: string) {
        console.log(`[AIService] Processing message from ${contactId} (${provider}) for Client ${clientId}: ${messageBody}`);

        try {
            // 1. Get/Create Session
            let session = await this.getSession(contactId, provider, clientId);
            if (!session) {
                // We MUST have a clientId to create a valid multi-tenant session
                if (!clientId) {
                    console.error('[AIService] Cannot create new session without clientId');
                    return "El sistema se está actualizando. Por favor intenta más tarde.";
                }
                session = await this.createSession(contactId, provider, clientId, userName);
            } else {
                // Update user_name if provided and not present
                if (userName && !session.user_name) {
                    await supabase.from('whatsapp_sessions').update({ user_name: userName }).eq('id', session.id);
                    session.user_name = userName;
                }
            }

            // 2. Get existing user_data early so we can persist state
            const userData = session.user_data || {};
            const history = userData.history || [];

            // 2b. Global Reset Commands
            const lowerMessage = messageBody.trim().toLowerCase();
            if (['chau', 'reiniciar', 'reset', 'cancelar', 'salir'].includes(lowerMessage)) {
                await supabase.from('whatsapp_sessions').update({ 
                    current_state: 'IDLE', 
                    club_id: null, 
                    user_data: {} 
                }).eq('id', session.id);
                
                const replyText = "¡Sesión reiniciada! 👋 Escribime 'Hola' cuando quieras volver a empezar.";
                if (provider === 'telegram') {
                    if (clientId) await TelegramService.sendMessage(clientId, contactId, replyText);
                }
                return replyText;
            }

            // 3. Extract potential date from message to shift context
            let targetDate = this.extractDateFromMessage(messageBody);

            if (targetDate) {
                // If the message contains a date, save it
                userData.current_target_date = targetDate;
            } else {
                // If no date in message, fallback to what was discussed previously in this flow
                targetDate = userData.current_target_date;
            }

            // 3b. Intercept multi-club selection if missing
            if (!session.club_id && session.current_state === 'IDLE') {
                const { count } = await supabase.from('clubs')
                    .select('*', { count: 'exact', head: true })
                    .eq('client_id', clientId);
                    
                if (count && count > 1) {
                    session.current_state = 'SELECTING_CLUB';
                    await supabase.from('whatsapp_sessions').update({ current_state: 'SELECTING_CLUB' }).eq('id', session.id);
                }
            }

            // 4. Build Context
            const context = await this.buildContext(session, targetDate);

            // 5. Generate Response & Determine Action
            const aiResponse = await this.generateAIResponse(messageBody, context, history);
            console.log('[AIService] AI Response:', aiResponse);

            // 6. Execute Action (if any)
            let appendedReply = "";
            if (aiResponse.action && aiResponse.action !== 'NONE') {
                try {
                    await this.executeAction(aiResponse.action, session, aiResponse.action_params);
                    // No follow-up call needed: AWAITING_PAYMENT state in the prompt already handles banking info.
                } catch (actionError: any) {
                    console.error('[AIService] Action execution failed:', actionError);
                    // If action fails (e.g. double booking), we use the error message as the reply
                    const errorReply = actionError.message || "Lo siento, hubo un problema al procesar tu solicitud. ¿Podrías intentar de nuevo?";

                    if (provider === 'telegram') {
                        if (clientId) await TelegramService.sendMessage(clientId, contactId, errorReply);
                    }
                    return errorReply;
                }
            }

            const replyText = (aiResponse.reply || aiResponse.response || "") + appendedReply;

            // 7. Update Session State & Save History
            const updatedHistory = [
                ...history,
                { role: 'user', parts: [{ text: messageBody }] },
                { role: 'model', parts: [{ text: JSON.stringify({ ...aiResponse, reply: replyText }) }] }
            ].slice(-10); // Keep last 10 messages

            const updateData: any = {
                last_interaction: new Date().toISOString(),
                user_data: { ...userData, history: updatedHistory }
            };

            if (aiResponse.next_state && aiResponse.next_state !== session.current_state) {
                updateData.current_state = aiResponse.next_state;
                if (aiResponse.next_state === 'IDLE') {
                    delete updateData.user_data.current_target_date;
                }
            }

            await supabase.from('whatsapp_sessions').update(updateData).eq('id', session.id);

            // 8. Send Response via appropriate provider
            if (provider === 'telegram') {
                if (clientId) await TelegramService.sendMessage(clientId, contactId, replyText);
            } else {
                return replyText;
            }
            return replyText;

        } catch (globalError: any) {
            console.error('[AIService] Global processing error:', globalError);
            const fallback = "Tuve un error procesando tu mensaje por un problema técnico. ¿Podés intentar de nuevo?";
            if (provider === 'telegram') {
                if (clientId) await TelegramService.sendMessage(clientId, contactId, fallback);
            }
            return fallback;
        }
    },

    async getSession(contactId: string, provider: 'whatsapp' | 'telegram', clientId?: string) {
        let query = supabase.from('whatsapp_sessions').select('*, user_data');

        if (provider === 'telegram') {
            query = query.eq('telegram_chat_id', contactId).eq('provider', 'telegram');
        } else {
            query = query.eq('phone_number', contactId).eq('provider', 'whatsapp');
        }

        if (clientId) {
            query = query.eq('client_id', clientId);
        }

        const { data } = await query.single();
        return data;
    },

    async createSession(contactId: string, provider: 'whatsapp' | 'telegram', clientId: string, userName?: string) {
        const payload: any = {
            current_state: 'IDLE',
            provider: provider,
            client_id: clientId,
            user_name: userName // Pre-fill name if available (e.g. from Telegram profile)
        };

        if (provider === 'telegram') {
            payload.telegram_chat_id = contactId;
            payload.phone_number = `TG-${contactId}`; // Placeholder to satisfy unique constraint or just logic
        } else {
            payload.phone_number = contactId;
        }

        const { data, error } = await supabase
            .from('whatsapp_sessions')
            .insert([payload])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async updateSessionState(sessionId: string, newState: string) {
        await supabase
            .from('whatsapp_sessions')
            .update({ current_state: newState, last_interaction: new Date() })
            .eq('id', sessionId);
    },

    async buildContext(session: any, forcedDate?: string) {
        // Basic context: Session state
        // Helper to get raw YYYY-MM-DD in Argentina Time
        const getArgentinaISO = (date: Date = new Date()) => {
            const options: Intl.DateTimeFormatOptions = {
                timeZone: 'America/Argentina/Buenos_Aires',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            };
            const formatter = new Intl.DateTimeFormat('en-CA', options);
            return formatter.format(date);
        };

        // Helper to get weekday name in Argentina Time
        const getWeekday = (dateStr: string) => {
            // Force -03:00 offset to avoid shifting if the server is in a different TZ
            const date = new Date(dateStr + 'T12:00:00-03:00');
            return new Intl.DateTimeFormat('es-AR', {
                weekday: 'long',
                timeZone: 'America/Argentina/Buenos_Aires'
            }).format(date);
        };

        // Helper to get day-of-week NUMBER (0=Sun, 6=Sat) always in Argentina TZ
        // This is the ONLY safe way to get the weekday number when the server may be in UTC
        const getDayOfWeekAR = (dateStr: string): number => {
            const date = new Date(dateStr + 'T12:00:00-03:00');
            const dayName = new Intl.DateTimeFormat('en-US', {
                weekday: 'long',
                timeZone: 'America/Argentina/Buenos_Aires'
            }).format(date);
            const map: Record<string, number> = {
                Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3,
                Thursday: 4, Friday: 5, Saturday: 6
            };
            return map[dayName] ?? 0;
        };

        // Helper to format date as DD/MM for display (e.g. "01/03")
        const formatDDMM = (dateStr: string): string => {
            const [, m, d] = dateStr.split('-');
            return `${d}/${m}`;
        };

        const todayRaw = getArgentinaISO();
        const contextDateRaw = forcedDate || todayRaw;
        const todayDisplay = `${getWeekday(todayRaw)} ${todayRaw}`;
        const contextDateDisplay = `${getWeekday(contextDateRaw)} ${contextDateRaw}`;
        // Pre-formatted display for AI to use directly — prevents model from self-computing weekday
        const contextDateForDisplay = `${getWeekday(contextDateRaw)} ${formatDDMM(contextDateRaw)}`;

        let context: any = {
            role: 'system_context',
            session_state: session.current_state,
            user_phone: session.phone_number,
            user_name: session.user_name || null,
            todays_date: todayDisplay,
            context_date: contextDateRaw,
            context_date_display: contextDateDisplay,
            // Use this EXACT string in summaries — do NOT recompute the weekday
            context_date_for_display: contextDateForDisplay
        };

        // If active booking, get details
        if (session.active_booking_id) {
            const match = await MatchService.getMatch(session.active_booking_id);
            if (match) {
                context.active_booking = {
                    id: match.id,
                    status: match.status,
                    payment_amount_expected: match.payment_amount_expected || 'Not set',
                    is_deposit_paid: match.is_deposit_paid || false,
                    court_status: match.court_status,
                    proposed_time: match.proposed_time
                };
            }
        }

        // If IDLE or MATCHING or CONFIRMED, get availabilities and club info
        if (session.current_state === 'IDLE' || session.current_state === 'MATCHING' || context.active_booking?.status === 'confirmed') {
            // 1. Fetch Club Info based on session.client_id and optional session.club_id
            let query = supabase.from('clubs').select('id, name, address, alias, cbu, bank_name, account_holder, opening_hours, deposit_percentage').eq('client_id', session.client_id);
            if (session.club_id) {
                query = query.eq('id', session.club_id);
            }

            const { data: clubs } = await query;
            const clubList = clubs || [];

            // If a specific club is selected (or there is only one), we provide its extended info
            // Otherwise, we provide the list of clubs for the user to choose from
            const activeClub = session.club_id ? clubList.find(c => c.id === session.club_id) : (clubList.length === 1 ? clubList[0] : null);

            context.client_clubs = clubList.map(c => ({ id: c.id, name: c.name, address: c.address }));

            if (activeClub) {
                const { data: clubCourts } = await supabase.from('courts').select('name, type, price, is_active').eq('club_id', activeClub.id).eq('is_active', true);

                context.club_info = {
                    id: activeClub.id,
                    name: activeClub.name || 'Padel Club',
                    address: activeClub.address || 'Calle Falsa 123',
                    courts: clubCourts || [],
                    opening_hours: activeClub.opening_hours,
                    deposit_percentage: activeClub.deposit_percentage || 30
                };

                // Availability is now scoped to the active club
                context.availability_info = `Disponibilidad para el día ${context.context_date_display}: ${await MatchService.getAvailability(context.context_date, activeClub.id)}`;
            } else {
                context.club_info = null;
                context.availability_info = "Primero debe seleccionar una sede.";
            }

            // 3. Dynamic Business Hours based on context date — MUST use AR-TZ safe helper
            if (activeClub) {
                const dayOfWeek = getDayOfWeekAR(context.context_date).toString();
                const dayConfig = (activeClub.opening_hours as any)?.[dayOfWeek] || { open: '18:00', close: '23:00', closed: false };
                context.business_hours = dayConfig.closed
                    ? `El club está CERRADO el día ${context.context_date_display}.`
                    : `Horario del club para el día ${context.context_date_display}: ${dayConfig.open} a ${dayConfig.close} hs.`;

                context.banking_info = {
                    alias: activeClub.alias || 'PADEL.FLOW.MP (Default)',
                    cbu: activeClub.cbu,
                    bank: activeClub.bank_name || 'Mercado Pago',
                    holder: activeClub.account_holder
                };
            }
        }

        // If SELECTING_CLUB is the current state
        if (session.current_state === 'SELECTING_CLUB') {
            const { data: clubs } = await supabase.from('clubs').select('id, name').eq('client_id', session.client_id);
            context.client_clubs = clubs || [];
        }

        return context;
    },

    extractDateFromMessage(text: string): string | undefined {
        const lowerText = text.toLowerCase();

        // Helper to get Argentina Date Object
        const getArgentinaDateObj = () => {
            const now = new Date();
            // Convert current UTC time to Argentina time components
            const options: Intl.DateTimeFormatOptions = { timeZone: 'America/Argentina/Buenos_Aires', year: 'numeric', month: 'numeric', day: 'numeric' };
            const formatter = new Intl.DateTimeFormat('en-US', options);
            const parts = formatter.formatToParts(now);
            const year = parseInt(parts.find(p => p.type === 'year')!.value);
            const month = parseInt(parts.find(p => p.type === 'month')!.value) - 1; // 0-indexed
            const day = parseInt(parts.find(p => p.type === 'day')!.value);
            return new Date(year, month, day);
        };

        const nowArgentina = getArgentinaDateObj();

        // Helper string format YYYY-MM-DD
        const formatDate = (date: Date) => {
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const d = String(date.getDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
        }

        const returnIfValid = (targetDate: Date) => {
            // Strip time for comparison just in case
            const todayStr = formatDate(nowArgentina);
            const targetStr = formatDate(targetDate);
            if (targetStr < todayStr) {
                return todayStr; // Snap to today if in the past
            }
            return targetStr;
        };

        // 1. Regex for DD/MM (Highest Priority)
        const dateMatch = text.match(/(\d{1,2})\/(\d{1,2})/);
        if (dateMatch) {
            const day = parseInt(dateMatch[1]);
            const month = parseInt(dateMatch[2]) - 1;
            const targetDate = new Date(nowArgentina.getFullYear(), month, day);

            // If the date passed already this year (e.g. asking for Jan in Dec), assume next year
            const sixMonthsAgo = new Date(nowArgentina);
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

            if (targetDate < sixMonthsAgo) {
                targetDate.setFullYear(nowArgentina.getFullYear() + 1);
            }
            return returnIfValid(targetDate);
        }

        // 2. Relative Terms
        if (lowerText.includes('hoy')) return formatDate(nowArgentina);

        if (lowerText.includes('mañana')) {
            const tomorrow = new Date(nowArgentina);
            tomorrow.setDate(nowArgentina.getDate() + 1);
            return returnIfValid(tomorrow);
        }

        // 3. Weekdays
        const weekdays: { [key: string]: number } = {
            'lunes': 1, 'martes': 2, 'miercoles': 3, 'miércoles': 3,
            'jueves': 4, 'viernes': 5, 'sabado': 6, 'sábado': 6, 'domingo': 0
        };

        for (const [dayName, dayIndex] of Object.entries(weekdays)) {
            if (lowerText.includes(dayName)) {
                const targetDate = new Date(nowArgentina);
                // Use AR-TZ safe day-of-week: formatDate(nowArgentina) gives YYYY-MM-DD in local,
                // which for the date components is correct; we just need to get its AR weekday.
                const argDateStr = formatDate(nowArgentina);
                const currentDay: number = (() => {
                    const d = new Date(argDateStr + 'T12:00:00-03:00');
                    const dayEnglish = new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: 'America/Argentina/Buenos_Aires' }).format(d);
                    const m: Record<string, number> = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 };
                    return m[dayEnglish] ?? 0;
                })();
                let daysToAdd = dayIndex - currentDay;
                if (daysToAdd <= 0) daysToAdd += 7; // Next occurrence
                targetDate.setDate(nowArgentina.getDate() + daysToAdd);
                return returnIfValid(targetDate);
            }
        }

        return undefined;
    },

    async generateAIResponse(message: string, context: any, history: any[] = []) {
        const systemPrompt = `
Eres el asistente virtual oficial de reservas para **${context.club_info?.name || 'nuestro cliente'}**. 
TU ÚNICO PROPÓSITO Y RESPONSABILIDAD es gestionar las reservas de canchas de pádel con los clientes.

REGLAS DE COMPORTAMIENTO ESTRICTAS:
1. ENFOQUE EXCLUSIVO: Bajo ninguna circunstancia debes responder a preguntas, hablar de temas o realizar tareas que no estén directamente relacionadas con la reserva de canchas. Si un usuario intenta cambiar de tema, responde cortésmente que eres un bot exclusivo de reservas y vuelve a encauzar la conversación.
2. BREVEDAD Y CLARIDAD: Tus respuestas deben ser cortas, directas y amables. No des explicaciones largas.
3. RECOLECCIÓN PROGRESIVA: No pidas todos los datos de golpe. Pregunta de forma natural según el flujo de la conversación.
4. TONO PROFESIONAL: Argentino EXTREMADAMENTE PROFESIONAL y EXACTO. Usá el tratamiento de "Usted" o un voseo profesional de alta gama.
5. CONCISIÓN EXTREMA: NO uses frases de relleno como "dale", "dejame ver", "un momento". Respondé directamente con la información pedida.

DATOS OBLIGATORIOS A RECOLECTAR:
1. Horario (Día y hora de inicio)
2. Duración (Ej. 60, 90, 120 minutos)
3. Cancha (Selección de cancha específica)
4. Nombre del jugador
5. Teléfono

REGLAS CRÍTICAS DE TIEMPO Y FORMATO:
- ZONA HORARIA: Todo sucede en ARGENTINA (GMT-3).
- FORMATO DE HORA: Usá SIEMPRE formato de 24hs (ej: "19:30hs", "22:00hs").
- FORMATO DE FECHA: DD/MM (ej: "18/02").
- ACCIONES (JSON): "date_time" DEBE ser ISO LOCAL SIN OFFSET (Ej: "2026-02-18T22:00:00").

MÁQUINA DE ESTADOS (Tu cerebro):
Estás en el estado: ${context.active_booking?.status === 'confirmed' ? 'CONFIRMED' : context.session_state}
Usuario: ${context.user_name || 'DESCONOCIDO'} (Tel: ${context.user_phone})

REGLA ANTI-BLOQUEO (CRÍTICA - LEÉ ESTO PRIMERO):
- TODA TU INFORMACIÓN YA ESTÁ EN EL CONTEXTO. Nunca uses "un momento", "permítame verificar", "voy a chequear" u otras frases de transición con action NONE. Eso bloquea la conversación.
- Tenés 'availability_info' en el contexto - ya sabés qué hay disponible. Respondé DIRECTAMENTE.
- CADA MENSAJE TUYO debe avanzar la conversación: responder con datos, hacer una pregunta concreta, o ejecutar una acción.
- Si tenés fecha + hora + duración, revisá 'availability_info' ahora mismo y respondé en este mismo mensaje con lo que encontraste.

FLUJO DE TRABAJO:

0. SELECCIÓN DE SEDE (SELECTING_CLUB):
   - Si el estado es SELECTING_CLUB, tenés un listado de sucursales en 'client_clubs'.
   - Aún NO tenés 'availability_info' porque el usuario debe elegir sede.
   - Preguntá amablemente en qué sede de las disponibles quiere jugar.
   - Una vez que confirme una de las sedes, ejecutá la Acción 'SELECT_CLUB'.
     action_params.club_id debe ser el ID de la sede elegida de 'client_clubs'.
     next_state: 'IDLE'.
   - REGLA: Si el usuario ya te dijo qué sede quiere en su saludo, seleccionála directamente.

1. CONSULTA/IDLE (Ya con sede seleccionada):
   - Si pregunta DISPONIBILIDAD: Usá 'availability_info' e informá TODAS las opciones libres de forma clara. Mencioná cada cancha y sus huecos.
2. MATCHING (Reservando):
   - Paso 1: Obtené FECHA y HORA.
   - Paso 2: Obtené DURACIÓN.
   - Paso 3: VALIDA DISPONIBILIDAD Y AUTO-SELECCIÓN: 
     - Si el horario está libre en UNA SOLA CANCHA, SELECCIONÁ ESA CANCHA AUTOMÁTICAMENTE.
     - Si hay MÚLTIPLES libres, preguntá cuál prefiere.
   - Paso 4: VALIDACIÓN DE IDENTIDAD OBLIGATORIA: 
     - REGLA ESTRICTA: NUNCA ejecutes la acción 'CREATE_BOOKING' ni envíes el resumen si no sabés el NOMBRE del jugador. 
     - Si falta NOMBRE o TELÉFONO, pedilos explícitamente y esperá su respuesta antes de continuar.  
     - Si el teléfono es "TG-...", DEBÉS pedir el teléfono real antes del resumen.
   - Paso 5: RESUMEN FINAL (Solo si ya tenés el Nombre de la persona):
     Calculá el monto de SEÑA (incluyendo centavos aleatorios) y presentá EXACTAMENTE este formato:
     REGLA CRITICA DE FECHA: El campo Fecha del resumen es SIEMPRE "${context.context_date_for_display}". Copialo literalmente. NUNCA lo recalcules.

     "✨ *PRE-RESERVA REGISTRADA* ✨

      📍 *${context.club_info?.name || 'Padel Club'}*
      ━━━━━━━━━━━━━━━━━━
      📅 *Fecha:*  ${context.context_date_for_display}
      ⏰ *Hora:*   [HH:MM] hs ([Duración] min)
      🎾 *Cancha:* [Nombre EXACTO]
      ━━━━━━━━━━━━━━━━━━
      👤 *[Nombre]*
      📞 [Teléfono]
      ━━━━━━━━━━━━━━━━━━
      💳 *Seña a transferir:* $[Monto con centavos]

      *¿Confirmás? Respondé SÍ para reservar.*"
   - Paso 6: Con la confirmación del usuario ejecutá la Acción 'CREATE_BOOKING'.
     REGLA CRITICA DE date_time: El campo action_params.date_time DEBE ser "${context.context_date}T[HH:MM]:00" donde [HH:MM] es la hora solicitada por el usuario. NUNCA uses otra fecha. El año/mes/día SIEMPRE viene de context_date ("${context.context_date}").
     IMPORTANTE: Tu 'reply' de confirmación DEBE incluir inmediatamente los datos bancarios y cerrar con "quedamos a la espera de la transferencia". No esperes un turno extra. Usá EXACTAMENTE este formato:

     "✅ ¡Pre-reserva registrada!

      🏦 *Datos para la transferencia:*
      🏛️ *Banco:* [bank]
      🔑 *Alias:* [alias]
      👤 *Titular:* [holder]
      💰 *Monto exacto:* $[monto con centavos, el mismo del resumen]

      ⏳ Tu lugar está reservado por *60 minutos*.
      Quedamos a la espera de la transferencia. 🙏"

     Datos bancarios disponibles: ${context.banking_info ? JSON.stringify(context.banking_info) : 'PADEL.FLOW.MP'}.
     next_state: 'AWAITING_PAYMENT'.

3. AWAITING_PAYMENT (si el usuario vuelve a escribir en este estado):
   - Recordale el monto y los datos bancarios con el mismo formato de arriba.
   - NO pidas comprobante. Solo aguardá.
   - next_state: 'AWAITING_PAYMENT'.

4. MATCH_JOIN (Invitando jugadores):
   - El pago de la seña ya fue confirmado por el club. Indícale que su pre-reserva está garantizada.
   - Pedile que comparta el link de inscripción con los demás jugadores para que se sumen al partido.
   - next_state: 'MATCH_JOIN'.

5. CONFIRMED:
   - Generá un resumen para compartir:
     "✅ *RESERVA CONFIRMADA* ✅
      🏠 *Club:* ${context.club_info?.name || 'Padel Club'}
      📅 *Fecha:* [Día] DD/MM
      ⏰ *Hora:* HH:mm hs
      🎾 *Cancha:* ${context.active_booking?.court_status || ''}
      ¡Nos vemos!"

6. CANCELACIÓN:
   - Si el usuario quiere CANCELAR su reserva, pedile que confirme escribiendo "SÍ" o "CONFIRMAR".
   - Nunca uses "presione" ni "botón". Todo es por texto. Usá "escribí", "respondé", "confirmá".
   - Una vez que confirma: ejecutá la Acción 'CANCEL_BOOKING'.
   - Si 'is_deposit_paid' es true, informale que para el reembolso tiene que contactar al club directamente.

TU CONTEXTO ACTUAL:
${JSON.stringify(context, null, 2)}

SALIDA ESPERADA (JSON):
{
    "reply": "Texto plano de respuesta",
    "next_state": "SELECTING_CLUB | IDLE | MATCHING | AWAITING_PAYMENT | MATCH_JOIN | CONFIRMED",
    "action": "SELECT_CLUB | CREATE_BOOKING | REGISTER_IDENTITY | CANCEL_BOOKING | NONE",
    "action_params": {
        "club_id": "UUID (Solo para SELECT_CLUB)",
        "date_time": "ISO_LOCAL_STRING",
        "duration_minutes": number,
        "court_name": "Nombre EXACTO",
        "payment_amount": number,
        "name": "Nombre",
        "phone": "Teléfono",
        "match_id": "UUID"
    }
}
`;

        // Use 'gemini-2.0-flash' as it is explicitly available for this API key.
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            systemInstruction: systemPrompt
        });

        const chat = model.startChat({
            history: history,
            generationConfig: {
                responseMimeType: "application/json"
            }
        });

        try {
            const result = await chat.sendMessage(message);
            const responseText = result.response.text();
            return JSON.parse(responseText);
        } catch (e) {
            console.error("AI Generation Error:", e);
            return {
                reply: "Tuve un error procesando tu mensaje. ¿Podés intentar de nuevo?",
                next_state: context.session_state,
                action: "NONE"
            };
        }
    },

    async executeAction(action: string, session: any, params: any) {
        console.log(`[AIService] Executing action: ${action} `, params);

        if (action === 'SELECT_CLUB') {
            const updateData: any = { club_id: params.club_id, current_state: 'IDLE' };
            await supabase
                .from('whatsapp_sessions')
                .update(updateData)
                .eq('id', session.id);
            console.log(`[AIService] Sede seleccionada: `, params.club_id);
            session.club_id = params.club_id;
        }

        if (action === 'REGISTER_IDENTITY') {
            const updateData: any = {};
            if (params.name) updateData.user_name = params.name;
            if (params.phone) updateData.phone_number = params.phone;

            if (Object.keys(updateData).length > 0) {
                await supabase
                    .from('whatsapp_sessions')
                    .update(updateData)
                    .eq('id', session.id);
                console.log(`[AIService] Identidad actualizada: `, updateData);
            }
        }

        if (action === 'CREATE_BOOKING') {
            // Logic to create a booking
            // 1. Calculate final amount based on club settings and court price
            let clubIdForPrice = session.club_id;
            if (!clubIdForPrice) {
                const { data: club } = await supabase.from('clubs').select('id').eq('client_id', session.client_id).limit(1).maybeSingle();
                if (club) {
                    clubIdForPrice = club.id;
                    session.club_id = club.id;
                    await supabase.from('whatsapp_sessions').update({ club_id: club.id }).eq('id', session.id);
                }
            }

            let basePrice = 16000;
            let depositPercent = 0.30;

            const { data: clubData } = await supabase.from('clubs')
                .select('deposit_percentage, default_price')
                .eq('id', clubIdForPrice)
                .maybeSingle();

            if (clubData?.deposit_percentage !== undefined) {
                depositPercent = Number(clubData.deposit_percentage) / 100;
            }
            if (clubData?.default_price) {
                basePrice = Number(clubData.default_price);
            }

            const courtSearch = params.court_details || params.court_name;
            if (courtSearch) {
                const { data: court } = await supabase.from('courts')
                    .select('price')
                    .eq('club_id', clubIdForPrice)
                    .ilike('name', `%${courtSearch}%`)
                    .limit(1)
                    .maybeSingle();
                if (court?.price) basePrice = court.price;
            }

            let depositAmount = basePrice * depositPercent;
            depositAmount = Math.floor(depositAmount); // Ensure base is an integer (e.g., 4800)

            let finalAmount = depositAmount;

            if (params.payment_amount) {
                finalAmount = Number(params.payment_amount);
            } else {
                // Determine unique cents for the last 48 hours for this club
                const twoDaysAgo = new Date();
                twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

                const { data: recentMatches } = await supabase
                    .from('matches')
                    .select('payment_amount_expected')
                    .eq('club_id', clubIdForPrice)
                    .gte('created_at', twoDaysAgo.toISOString())
                    .not('payment_amount_expected', 'is', null);

                const usedDecimals = new Set(
                    (recentMatches || []).map(m => {
                        const amount = Number(m.payment_amount_expected);
                        if (isNaN(amount)) return -1;
                        return Math.round((amount - Math.floor(amount)) * 100);
                    }).filter(d => d >= 0)
                );

                let cents = 0;
                let attempts = 0;
                do {
                    cents = Math.floor(Math.random() * 99) + 1; // 1 to 99
                    attempts++;
                } while (usedDecimals.has(cents) && attempts < 100);

                finalAmount = Number((depositAmount + (cents / 100)).toFixed(2));
            }

            console.log(`[AIService] Creating booking for ${params.date_time} with duration ${params.duration_minutes} and expected payment: $${finalAmount} `);

            let clubId = clubIdForPrice;

            // Ensure date_time is a valid ISO string before creating match
            // FORCE ARGENTINA TIMEZONE (-03:00) logic
            let targetDateTime = params.date_time;

            // If it comes like "2026-02-18 22:00", make it ISO
            if (!targetDateTime.includes('T')) {
                // Assuming YYYY-MM-DD HH:mm format
                targetDateTime = targetDateTime.replace(' ', 'T');
            }
            // Ensure seconds
            if (targetDateTime.split(':').length === 2) {
                targetDateTime += ':00';
            }

            // If it doesn't have an offset or Z, append Argentina Offset (-03:00)
            // This interprets the AI's "22:00:00" as "22:00:00 Argentina Time"
            if (!targetDateTime.endsWith('Z') && !targetDateTime.match(/[+-]\d{2}:?\d{2}$/)) {
                targetDateTime += '-03:00';
            }

            console.log(`[AIService] Normalized DateTime with Offset: ${targetDateTime} `);

            // NEW: Anti-double-booking check
            const duration = params.duration_minutes || 90;
            let courtName = params.court_name;

            if (!courtName) {
                const { data: firstCourt } = await supabase.from('courts')
                    .select('name')
                    .eq('club_id', clubId)
                    .eq('is_active', true)
                    .order('name', { ascending: true })
                    .limit(1)
                    .maybeSingle();
                courtName = firstCourt?.name || 'Cancha a designar';
            }

            const isAvailable = await MatchService.isCourtAvailable(clubId, courtName, targetDateTime, duration);

            if (!isAvailable) {
                console.warn(`[AIService] DOUBLE BOOKING DETECTED for ${courtName} at ${targetDateTime} `);
                throw new Error(`¡Ups! La ${courtName} ya está ocupada para las ${targetDateTime.split('T')[1].substring(0, 5)} hs.Por favor elegí otro horario o cancha.`);
            }

            const match = await MatchService.createMatch(session.club_id, params.options || [targetDateTime], duration);
            if (!match) throw new Error("No se pudo crear el partido.");
            if (match) {
                // IMPORTANT: Calculate total price based on duration
                const totalPrice = (basePrice * duration) / 60;

                // Set initial consolidated data
                try {
                    const updatePayload: any = {
                        club_id: clubId,
                        court_status: 'reserved',
                        court_details: courtName,
                        payment_amount_expected: finalAmount,
                        confirmed_option: targetDateTime,
                        status: 'pending' // Initial status for awaiting payment
                    };

                    // Only add payment_amount_total if we are sure it won't crash 
                    // or catch the error if the column is missing
                    try {
                        updatePayload.payment_amount_total = totalPrice;
                    } catch (e) {
                        console.warn("[AIService] Could not set payment_amount_total, column might be missing");
                    }

                    const { error: updateError } = await supabase.from('matches').update(updatePayload).eq('id', match.id);

                    if (updateError) {
                        console.error('[AIService] Error updating match details:', updateError);
                        // If it fails because of missing columns, try a fallback update without the total
                        if (updateError.message?.includes('payment_amount_total')) {
                            console.log('[AIService] Retrying update without payment_amount_total...');
                            delete updatePayload.payment_amount_total;
                            await supabase.from('matches').update(updatePayload).eq('id', match.id);
                        } else {
                            throw updateError;
                        }
                    }
                } catch (dbError: any) {
                    console.error('[AIService] Critical error updating match:', dbError);
                    throw new Error("No pudimos guardar los detalles de la reserva. Por favor contactá al club.");
                }

                // Re-fetch session to get the latest name/phone
                const { data: updatedSession } = await supabase.from('whatsapp_sessions').select('user_name, phone_number, club_id').eq('id', session.id).single();

                const userName = params.name || updatedSession?.user_name || "Jugador PadelFlow";
                const userPhone = params.phone || updatedSession?.phone_number || session.phone_number;

                // Update session identity if it was missing or different
                if ((params.name && params.name !== updatedSession?.user_name) || (params.phone && params.phone !== updatedSession?.phone_number)) {
                    await supabase.from('whatsapp_sessions').update({
                        user_name: userName,
                        phone_number: userPhone
                    }).eq('id', session.id);
                }

                // Add Creator as Participant (Organizer)
                await MatchService.joinMatch(match.id, userName, [0], true);

                // Update phone_number in participants
                await supabase.from('participants')
                    .update({ phone_number: userPhone })
                    .eq('match_id', match.id)
                    .eq('name', userName);

                // Court is already assigned in court_details.


                // Update session
                await supabase.from('whatsapp_sessions').update({
                    active_booking_id: match.id,
                    current_state: 'AWAITING_PAYMENT'
                }).eq('id', session.id);
            }
        }

        if (action === 'CANCEL_BOOKING') {
            const matchId = params.match_id || session.active_booking_id;
            if (matchId) {
                await MatchService.cancelMatch(matchId);
                // Clear active booking from session if it was the one cancelled
                if (matchId === session.active_booking_id) {
                    await supabase.from('whatsapp_sessions').update({
                        active_booking_id: null,
                        current_state: 'IDLE'
                    }).eq('id', session.id);
                }
                console.log(`[AIService] Reserva cancelada: ${matchId} `);
            }
        }
    }
};
