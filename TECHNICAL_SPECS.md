# Documentación Técnica: PadelFlow (MVP)

## 1. Visión del Producto
**PadelFlow** es una solución de logística liviana diseñada para eliminar la fricción en la organización de partidos de pádel privados. El sistema automatiza la búsqueda de coincidencia horaria entre jugadores y la disponibilidad de canchas sin requerir registros ni descargas.

## 2. Arquitectura de Procesos (Flujo Híbrido)
El sistema opera sobre tres pilares de comunicación:
1.  **Jugadores (WhatsApp)**: Canal de invitación y cierre mediante links dinámicos (`wa.me`).
2.  **Coordinación (Web-App)**: Interfaz sin registro que utiliza LocalStorage para identificar a los invitados y gestionar votos.
3.  **Clubes (Telegram)**: Canal de negociación proactiva y gratuita mediante un Bot con botones interactivos.

## 3. Especificaciones Técnicas (Stack)
*   **Frontend**: Next.js alojado en Vercel (Costo $0).
*   **Base de Datos**: Supabase con funciones en tiempo real para el conteo de votos.
*   **Identidad**: Identificación por UUID en URL y persistencia en navegador (Sin Login).
*   **Backend**: Edge Functions para el motor de "Match" (coincidencia de 4 jugadores).

## 4. Lógica de Negocio
*   **Regla de Cupo**: El sistema cierra la reserva en cuanto los primeros 4 invitados coinciden en un horario disponible.
*   **Gestión de Suplentes**: Los invitados adicionales (5to en adelante) quedan en cola de espera automática.
*   **Cancelación Proactiva**: El organizador dispone de un panel de control para dar de baja a un jugador o el partido completo, disparando un mensaje automático al Club vía Telegram para liberar la cancha.

## 5. Modelo de Datos
*   **Partidos**: Almacena ID único, horarios propuestos y estado de la reserva.
*   **Participantes**: Almacena nombres declarados y sus disponibilidades vinculadas al ID del partido.
*   **Directorio de Clubes**: IDs de chat de Telegram para envío de propuestas.

## 6. Análisis de Viabilidad
*   **Costo Operativo**: Aproximadamente $1 USD/mes (Dominio).
*   **Fricción del Usuario**: Nula (No requiere emails, passwords ni instalaciones).
