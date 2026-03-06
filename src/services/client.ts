import { createClient } from '@/lib/supabase-server';
import { Client, Club } from '@/types';

export const ClientService = {
    /**
     * Get the client data.
     * Uses the passed clientId, or falls back to the active Supabase session.
     */
    async getClient(clientId?: string): Promise<Client | null> {
        const supabase = await createClient();
        let query = supabase.from('clients').select('*');

        if (clientId) {
            query = query.eq('id', clientId);
        } else {
            // Get from active session using SSR cookies
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) {
                console.warn('[ClientService.getClient] No active session found on server');
                return null;
            }
            query = query.eq('id', session.user.id);
        }

        const { data, error } = await query.maybeSingle();
        if (error) {
            console.error('[ClientService.getClient] Error:', error);
            return null;
        }
        return data;
    },

    /**
     * Update client webhooks and tokens
     */
    async updateClientTokens(clientId: string, updates: Partial<Client>) {
        const supabase = await createClient();
        const { error } = await supabase
            .from('clients')
            .update(updates)
            .eq('id', clientId);

        if (error) {
            console.error('[ClientService.updateClientTokens] Error:', error);
            return false;
        }
        return true;
    },

    /**
     * Get all clubs for a specific client
     */
    async getClientClubs(clientId: string): Promise<Club[]> {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('clubs')
            .select('*')
            .eq('client_id', clientId)
            .order('name');

        if (error) {
            console.error('[ClientService.getClientClubs] Error:', error);
            return [];
        }
        return data || [];
    },

    /**
     * Create a new club for this client
     */
    async createClub(clientId: string, name: string, address: string, defaultPrice: number): Promise<Club | null> {
        const supabase = await createClient();
        const uniquePlaceholder = `PENDING_SETUP_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;

        const { data, error } = await supabase
            .from('clubs')
            .insert([{
                client_id: clientId,
                name,
                address,
                default_price: defaultPrice,
                telegram_chat_id: uniquePlaceholder // Bypass NOT NULL and UNIQUE constraint until configured
            }])
            .select()
            .single();

        if (error) {
            console.error('[ClientService.createClub] Error:', error);
            return null;
        }
        return data;
    }
};
