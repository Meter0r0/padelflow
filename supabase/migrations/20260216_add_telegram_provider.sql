-- Add multi-provider support to whatsapp_sessions
ALTER TABLE public.whatsapp_sessions 
ADD COLUMN provider text DEFAULT 'whatsapp',
ADD COLUMN telegram_chat_id text;

-- Optional: Add index for telegram_chat_id lookup
CREATE INDEX idx_sessions_telegram_chat_id ON public.whatsapp_sessions(telegram_chat_id);
