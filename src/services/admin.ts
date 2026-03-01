import { supabase } from '@/lib/supabase';
import { Client } from '@/types';

export interface ClientStats extends Client {
    clubs_count: number;
    courts_count?: number; // Optional until we establish relationship easily
}

export const AdminService = {
    /**
     * Get all clients with their club counts
     */
    async getClientsWithStats(): Promise<ClientStats[]> {
        // Fetch clients
        const { data: clients, error: clientErr } = await supabase
            .from('clients')
            .select('*')
            .order('name');

        if (clientErr || !clients) {
            console.error('[AdminService.getClientsWithStats] Error fetching clients:', clientErr);
            return [];
        }

        // Fetch club counts per client
        const { data: clubs, error: clubsErr } = await supabase
            .from('clubs')
            .select('client_id');

        if (clubsErr) {
             console.error('[AdminService.getClientsWithStats] Error fetching clubs:', clubsErr);
        }

        // Map counts
        return clients.map(client => {
            const clientClubs = clubs ? clubs.filter(c => c.client_id === client.id) : [];
            return {
                ...client,
                clubs_count: clientClubs.length
            };
        });
    },

    /**
     * Create a new SaaS client
     */
    async createClient(name: string): Promise<Client | null> {
        const { data, error } = await supabase
            .from('clients')
            .insert([{ name }])
            .select()
            .single();

        if (error) {
            console.error('[AdminService.createClient] Error:', error);
            return null;
        }
        return data;
    },

    /**
     * Update an existing client
     */
    async updateClient(clientId: string, updates: Partial<Client>): Promise<boolean> {
        const { error } = await supabase
            .from('clients')
            .update(updates)
            .eq('id', clientId);

        if (error) {
            console.error('[AdminService.updateClient] Error:', error);
            return false;
        }
        return true;
    },

    /**
     * Delete a client (and all their data via cascade if RLS/DB allows)
     */
    async deleteClient(clientId: string): Promise<boolean> {
        const { error } = await supabase
            .from('clients')
            .delete()
            .eq('id', clientId);

        if (error) {
            console.error('[AdminService.deleteClient] Error:', error);
            return false;
        }
        return true;
    }
};
