-- Habilitar extensión para Exclude Constraints
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Actualizar tabla clubs con columnas para Mercado Pago y configuración
ALTER TABLE public.clubs
ADD COLUMN IF NOT EXISTS mp_access_token TEXT,
ADD COLUMN IF NOT EXISTS reservation_timeout_minutes INTEGER DEFAULT 15,
ADD COLUMN IF NOT EXISTS requires_deposit_percent INTEGER DEFAULT 100;

-- Crear enum para el estado de la reserva
CREATE TYPE reservation_status AS ENUM ('pending_payment', 'confirmed', 'cancelled', 'admin_blocked');

-- Crear tabla reservations
CREATE TABLE IF NOT EXISTS public.reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    court_id UUID NOT NULL REFERENCES public.courts(id) ON DELETE CASCADE,
    club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    player_id UUID REFERENCES public.participants(id) ON DELETE SET NULL, -- Puede ser null si la carga el admin (o vinculada a auth)
    player_name TEXT, -- Por si es una reserva manual y no un usuario del bot
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status reservation_status DEFAULT 'pending_payment',
    payment_id TEXT, -- ID de pago de MP
    payment_amount_expected NUMERIC,
    payment_amount_paid NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Constraint para evitar double booking usando btree_gist
    CONSTRAINT prevent_double_booking 
    EXCLUDE USING gist (
        court_id WITH =, 
        tstzrange(start_time, end_time) WITH &&
    ) WHERE (status IN ('pending_payment', 'confirmed', 'admin_blocked'))
);

-- Habilitar RLS
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- Políticas permisivas (ajustar en prod)
CREATE POLICY "Allow all on reservations" ON public.reservations FOR ALL USING (true) WITH CHECK (true);

-- Función RPC para que el cliente inserte y falle amigablemente (opcional pero util para capturar el error sin abortar fuerte desde PostgREST)
CREATE OR REPLACE FUNCTION create_reservation(
    p_court_id UUID,
    p_club_id UUID,
    p_player_name TEXT,
    p_start_time TIMESTAMPTZ,
    p_end_time TIMESTAMPTZ,
    p_amount NUMERIC
) RETURNS UUID AS $$
DECLARE
    new_res_id UUID;
BEGIN
    INSERT INTO public.reservations (
        court_id, club_id, player_name, start_time, end_time, status, payment_amount_expected
    ) VALUES (
        p_court_id, p_club_id, p_player_name, p_start_time, p_end_time, 'pending_payment', p_amount
    ) RETURNING id INTO new_res_id;
    
    RETURN new_res_id;
EXCEPTION
    WHEN exclusion_violation THEN
        RAISE EXCEPTION 'Court is already booked for this time period.';
END;
$$ LANGUAGE plpgsql;
