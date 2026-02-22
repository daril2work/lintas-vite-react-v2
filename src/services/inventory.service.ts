import { supabase } from './supabase';
import type { ToolSet, ToolRequest, ImportantMessage, Room } from '../types';

export const MASTER_DATA = {
    DEPARTMENTS: ['CSSD', 'IGD', 'ICU', 'OK (Bedah)', 'Poli Umum', 'Poli Gigi', 'Logistik'],
    CATEGORIES: ['Bedah', 'Ortopedi', 'Gigi', 'Umum', 'Lainnya'],
    ROLES: ['admin', 'operator_cssd', 'operator_ruangan'],
};

export const inventoryService = {
    // Inventory
    getInventory: async (): Promise<ToolSet[]> => {
        const { data, error } = await supabase.from('inventory').select('*').order('name');
        if (error) throw error;
        return data as ToolSet[];
    },

    updateToolStatus: async (id: string, status: ToolSet['status']): Promise<void> => {
        const { error } = await supabase.from('inventory').update({ status }).eq('id', id);
        if (error) throw error;
    },

    createToolSet: async (tool: Omit<ToolSet, 'id' | 'status'>): Promise<void> => {
        const { error } = await supabase.from('inventory').insert([{ ...tool, status: 'sterile' }]);
        if (error) throw error;
    },

    updateTool: async (id: string, updates: Partial<Omit<ToolSet, 'id'>>): Promise<void> => {
        const { error } = await supabase.from('inventory').update(updates).eq('id', id);
        if (error) throw error;
    },

    deleteTool: async (id: string): Promise<void> => {
        const { error } = await supabase.from('inventory').delete().eq('id', id);
        if (error) throw error;
    },

    batchUpdateToolStatus: async (ids: string[], status: ToolSet['status']): Promise<void> => {
        const { error } = await supabase.from('inventory').update({ status }).in('id', ids);
        if (error) throw error;
    },

    // Requests
    getRequests: async (): Promise<ToolRequest[]> => {
        const { data, error } = await supabase.from('tool_requests').select('*').order('timestamp', { ascending: false });
        if (error) throw error;
        return data.map((r: any) => ({
            id: r.id,
            ward: r.ward,
            items: r.items,
            priority: r.priority,
            status: r.status,
            patientRm: r.patient_rm,
            doctorName: r.doctor_name,
            requiredDate: r.required_date,
            timestamp: r.timestamp,
            notes: r.notes
        }));
    },

    createRequest: async (request: Omit<ToolRequest, 'id' | 'timestamp' | 'status'>): Promise<void> => {
        const { error } = await supabase.from('tool_requests').insert([{
            ward: request.ward,
            items: request.items,
            priority: request.priority,
            patient_rm: request.patientRm,
            doctor_name: request.doctorName,
            required_date: request.requiredDate,
            notes: request.notes,
            status: 'pending'
        }]);
        if (error) throw error;
    },

    updateRequestStatus: async (id: string, status: ToolRequest['status']): Promise<void> => {
        const { error } = await supabase.from('tool_requests').update({ status }).eq('id', id);
        if (error) throw error;
    },

    // Important Messages
    getImportantMessages: async (): Promise<ImportantMessage[]> => {
        const { data, error } = await supabase
            .from('important_messages')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(3);

        if (error) throw error;

        return (data || []).map((m: any) => ({
            id: m.id,
            title: m.title,
            message: m.message,
            type: m.type,
            isActive: m.is_active,
            createdAt: m.created_at,
            expiresAt: m.expires_at
        }));
    },

    // Rooms
    getRooms: async (): Promise<Room[]> => {
        const { data, error } = await supabase
            .from('rooms')
            .select('*, pic:profiles(name)')
            .order('name');

        if (error) throw error;

        return (data || []).map((r: any) => ({
            id: r.id,
            name: r.name,
            picId: r.pic_id,
            picName: r.pic?.name,
            createdAt: r.created_at
        }));
    },

    createRoom: async (room: Omit<Room, 'id' | 'createdAt'>): Promise<void> => {
        const { error } = await supabase.from('rooms').insert([{
            name: room.name,
            pic_id: room.picId  // DB column name
        }]);
        if (error) throw error;
    },

    updateRoom: async (id: string, updates: Partial<Omit<Room, 'id' | 'createdAt'>>): Promise<void> => {
        const { error } = await supabase.from('rooms').update({
            name: updates.name,
            pic_id: updates.picId  // DB column name
        }).eq('id', id);
        if (error) throw error;
    },

    deleteRoom: async (id: string): Promise<void> => {
        const { error } = await supabase.from('rooms').delete().eq('id', id);
        if (error) throw error;
    },

    // Workflow Actions
    receiveTool: async (id: string, roomId: string): Promise<void> => {
        const { error } = await supabase.from('inventory')
            .update({ status: 'in_use', room_id: roomId })
            .eq('id', id);
        if (error) throw error;
    },

    sendDirty: async (id: string): Promise<void> => {
        const { error } = await supabase.from('inventory')
            .update({ status: 'dirty', room_id: null })
            .eq('id', id);
        if (error) throw error;
    },

    updatePackingData: async (id: string, expireDate: string, method: string): Promise<void> => {
        const { error } = await supabase.from('inventory')
            .update({
                status: 'ready_to_sterilize',
                expire_date: expireDate,
                sterilization_method: method
            })
            .eq('id', id);
        if (error) throw error;
    },
};
