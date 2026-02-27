-- Create enum for WhatsApp session state
CREATE TYPE whatsapp_session_state AS ENUM ('IDLE', 'MATCHING', 'AWAITING_PAYMENT', 'CONFIRMED', 'EXCEPTION');

-- Create whatsapp_sessions table
CREATE TABLE whatsapp_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number TEXT UNIQUE NOT NULL,
    current_state whatsapp_session_state DEFAULT 'IDLE',
    active_booking_id UUID REFERENCES matches(id),
    last_interaction TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add payment_amount_expected to matches table
ALTER TABLE matches 
ADD COLUMN payment_amount_expected NUMERIC(10, 2);

-- Add index for phone number lookup
CREATE INDEX idx_whatsapp_sessions_phone ON whatsapp_sessions(phone_number);
