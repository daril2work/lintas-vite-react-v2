import { supabase } from './supabase';
import type { Staff } from '../types';

export const staffService = {
    getStaff: async (): Promise<Staff[]> => {
        const { data, error } = await supabase.from('profiles').select('*');
        if (error) throw error;
        return data.map((s: any) => ({
            id: s.id,
            name: s.name,
            role: s.role,
            department: s.department,
            employeeId: s.employee_id,
            username: s.email,
            password: s.password
        }));
    },

    createStaff: async (staff: Omit<Staff, 'id'>): Promise<void> => {
        const { error } = await supabase.from('profiles').insert([{
            name: staff.name,
            role: staff.role,
            department: staff.department,
            employee_id: staff.employeeId,
            email: staff.username,
            password: staff.password
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
            password: updates.password
        }).eq('id', id);
        if (error) throw error;
    },

    deleteStaff: async (id: string): Promise<void> => {
        const { error } = await supabase.from('profiles').delete().eq('id', id);
        if (error) throw error;
    },
};
