import { supabase } from './supabase';
import type { Staff } from '../types';

export interface InviteToken {
    id: string;
    token: string;
    email: string;
    name: string;
    role: string;
    department: string | null;
    employee_id: string | null;
    created_at: string;
    expires_at: string;
    used_at: string | null;
}

export const staffService = {
    getStaff: async (): Promise<Staff[]> => {
        const { data, error } = await supabase.from('profiles').select('*').eq('is_active', true);
        if (error) throw error;
        return data.map((s: any) => ({
            id: s.id,
            name: s.name,
            role: s.role,
            department: s.department,
            employeeId: s.employee_id,
            username: s.email,
        }));
    },

    createStaff: async (staff: Omit<Staff, 'id'>): Promise<void> => {
        const { error } = await supabase.from('profiles').insert([{
            name: staff.name,
            role: staff.role,
            department: staff.department,
            employee_id: staff.employeeId,
            email: staff.username,
        }]);
        if (error) throw error;
    },

    updateStaff: async (id: string, updates: Partial<Omit<Staff, 'id'>>): Promise<void> => {
        const { error } = await supabase.from('profiles').update({
            name: updates.name,
            role: updates.role,
            department: updates.department,
            employee_id: updates.employeeId,
            email: updates.username,
        }).eq('id', id);
        if (error) throw error;
    },

    deleteStaff: async (id: string): Promise<void> => {
        const { error } = await supabase.from('profiles').update({ is_active: false }).eq('id', id);
        if (error) throw error;
    },

    // Dynamic Invite Token System
    createInviteToken: async (staff: Omit<Staff, 'id'>): Promise<string> => {
        const token = crypto.randomUUID();
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 48); // 48 hours expiry

        const { error } = await supabase.from('invite_tokens').insert([{
            token,
            email: staff.username,
            name: staff.name,
            role: staff.role,
            department: staff.department,
            employee_id: staff.employeeId,
            expires_at: expiresAt.toISOString()
        }]);

        if (error) throw error;
        return token;
    },

    validateToken: async (token: string): Promise<InviteToken> => {
        const { data, error } = await supabase
            .from('invite_tokens')
            .select('*')
            .eq('token', token)
            .single();

        if (error || !data) throw new Error('Token tidak valid atau tidak ditemukan.');
        
        if (data.used_at) throw new Error('Token ini sudah pernah digunakan.');
        
        const isExpired = new Date(data.expires_at) < new Date();
        if (isExpired) throw new Error('Token ini sudah kadaluarsa.');

        return data;
    },

    useToken: async (tokenId: string): Promise<void> => {
        const { error } = await supabase
            .from('invite_tokens')
            .update({ used_at: new Date().toISOString() })
            .eq('id', tokenId);
        
        if (error) throw error;
    }
};
