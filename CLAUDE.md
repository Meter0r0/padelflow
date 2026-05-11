# PadelFlow — CLAUDE.md

## ¿Qué es esto?

MVP para eliminar fricción en la organización de partidos de pádel privados. Los jugadores coordinan por WhatsApp, los clubes gestionan disponibilidad por Telegram, y la coordinación ocurre en una interfaz web. Sin registro, sin app.

## Tech stack

| Capa | Tech |
|------|------|
| Framework | Next.js (App Router), React 19, TypeScript 5 |
| Base de datos | Supabase (PostgreSQL + RLS + real-time) |
| Hosting | Vercel |
| Mensajería | WhatsApp Cloud API, Telegram Bot API |
| IA | Google Gemini (conversational AI para bots) |
| Pagos | Mercado Pago (integración parcial) |
| Iconos | lucide-react |

## Estructura de directorios

```
src/
├── app/
│   ├── page.tsx                  # Landing page
│   ├── api/
│   │   ├── telegram/webhook/     # Webhook Telegram bot
│   │   ├── whatsapp/webhook/     # Webhook WhatsApp Cloud API
│   │   └── cron/                 # Jobs de expiración
│   ├── club/[id]/
│   │   ├── dashboard/            # Panel de gestión del club
│   │   └── settings/             # Configuración del club
│   ├── match/[id]/               # Detalle de partido
│   ├── create-match/             # Flujo de creación
│   ├── partidos/                 # Listado de partidos
│   ├── admin/dashboard/          # Panel sistema
│   ├── client/dashboard/         # Panel multi-club
│   └── login/
├── components/
│   ├── JoinMatchForm             # Formulario de respuesta del jugador
│   ├── ScheduleGrid              # Selector de horarios
│   ├── CourtManager              # UI disponibilidad de canchas
│   ├── BookingActionsModal       # Modal de reservas
│   ├── InviteButtons             # Share WhatsApp/Telegram
│   ├── RealtimeMatchSync         # Listener de subscripciones
│   ├── OrganizerControls         # Acciones de admin
│   └── Toast                    # Notificaciones
├── services/
│   ├── match.ts                  # CRUD y lógica de partidos
│   ├── ai.ts                     # Gemini + state machine de sesiones
│   ├── telegram.ts               # Cliente Telegram API
│   ├── whatsapp.ts               # Cliente WhatsApp API
│   ├── client.ts                 # Gestión de clientes/tenants
│   └── admin.ts                  # Operaciones de administración
├── lib/
│   ├── supabase.ts               # Supabase client-side
│   └── supabase-server.ts        # Supabase server-side
├── types/index.ts                # Match, Participant, Club, Reservation
└── db/migrations/                # Migraciones SQL
```

## Modelo de datos (tablas principales)

- **matches** — UUID PK, status (pending → pending_payment → confirmed → cancelled), time options, court status, payment
- **participants** — Vinculados a matches, status (invited/accepted/declined/waitlist), selecciones de horario
- **clubs** — Canchas, Telegram chat IDs, horarios, precios, tokens de pago
- **clients** — Owners multi-tenant (pueden tener múltiples clubes)
- **whatsapp_sessions** — Estado de conversación por número de teléfono (state machine: IDLE, SELECTING_CLUB, etc.)
- **reservations** — Reservas de canchas ligadas a matches, registros de pago
- **courts** — Canchas físicas por club con precios

RLS habilitado. UUIDs como PKs en todas las tablas. Cascading deletes en participants.

## Patrones clave

- **Sin auth de jugadores**: identificación por UUID en URL + localStorage
- **Multi-tenancy**: `client_id` como FK en clubes y recursos
- **Real-time**: Supabase subscriptions para sincronizar participantes en vivo
- **Bots**: webhook-based (WhatsApp Cloud API + Telegram Bot API), procesados por Gemini
- **State machine**: conversaciones de bot gestionadas en `whatsapp_sessions.state`

## Features implementadas

- [x] Creación de partidos con opciones de horario flexibles
- [x] Invitación por WhatsApp (wa.me links)
- [x] Lógica accept/decline/waitlist (se cierra al llegar a 4 jugadores en el mismo horario)
- [x] Dashboard de gestión de club (disponibilidad, reservas, pagos)
- [x] Bot de Telegram para notificaciones proactivas del club
- [x] IA conversacional (Gemini) en WhatsApp y Telegram
- [x] Multi-tenancy (client dashboard)
- [x] Panel de admin del sistema

## Pendiente / en progreso

- [ ] Integración completa de Mercado Pago (endpoints existen, falta completar el flujo)
- [ ] Flujo de confirmación de pago (UI lista, backend parcial)

## Notas importantes

- El proyecto usa `Next.js App Router` (no Pages Router)
- CSS modules para estilos
- TypeScript strict mode activado
- Variables de entorno en `.env.local` (Supabase, WhatsApp, Telegram, Gemini, Mercado Pago)
- Deploy en Vercel — los webhooks de WhatsApp y Telegram apuntan a la URL de producción
