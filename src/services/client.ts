import { supabase } from '@/lib/supabase';
import { Client, Club } from '@/types';

export const ClientService = {
    /**
     * Get the client data including tokens.
     * In a real auth flow, this ID comes from the JWT.
     * Here we fetch it explicitly or default to the first one.
     */
    async getClient(clientId?: string): Promise<Client | null> {
        let query = supabase.from('clients').select('*');
        if (clientId) {
            query = query.eq('id', clientId);
        } else {
            // Fallback for demo purposes: get the first client
            query = query.limit(1);
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
        const { data, error } = await supabase
            .from('clubs')
            .insert([{
                client_id: clientId,
                name,
                address,
                default_price: defaultPrice,
                telegram_chat_id: 'PENDING_SETUP' // Bypass NOT NULL constraint until configured
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
