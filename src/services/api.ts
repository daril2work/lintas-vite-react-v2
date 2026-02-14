import { supabase } from './supabase';
import type { Staff, Machine, ToolSet, WorkflowLog, ToolRequest } from '../types';

export const MASTER_DATA = {
    DEPARTMENTS: ['CSSD', 'IGD', 'ICU', 'OK (Bedah)', 'Poli Umum', 'Poli Gigi', 'Logistik'],
    CATEGORIES: ['Bedah', 'Ortopedi', 'Gigi', 'Umum', 'Lainnya'],
    ROLES: ['admin', 'operator_cssd', 'operator_ruangan'],
    MACHINE_TYPES: ['washer', 'sterilizer', 'plasma'],
    WASHING_PROGRAMS: [
        { id: 'standard', name: 'Standard Cycle', duration: 45, temp: 60 },
        { id: 'heavy', name: 'Heavy Duty', duration: 60, temp: 90 },
        { id: 'delicate', name: 'Delicate', duration: 30, temp: 40 },
    ],
    STERILIZATION_PROGRAMS: [
        { id: 'p1', name: 'Standard 134°C', duration: 45, temp: 134, pressure: 2.1 },
        { id: 'p2', name: 'Delicate 121°C', duration: 60, temp: 121, pressure: 1.1 },
        { id: 'p3', name: 'Flash Cycle', duration: 20, temp: 134, pressure: 2.2 },
    ]
};

export const api = {
    // Staff
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
            email: staff.username, // Map username to email
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
        // Deleting from profiles might be restricted or cascade from auth.users
        const { error } = await supabase.from('profiles').delete().eq('id', id);
        if (error) throw error;
    },

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

    // Machines
    getMachines: async (): Promise<Machine[]> => {
        const { data, error } = await supabase.from('machines').select('*').order('name');
        if (error) throw error;
        return data.map((m: any) => ({
            id: m.id,
            name: m.name,
            type: m.type,
            status: m.status,
            lastService: m.last_service,
            nextService: m.next_service
        }));
    },

    createMachine: async (machine: Omit<Machine, 'id' | 'status'>): Promise<void> => {
        const { error } = await supabase.from('machines').insert([{ ...machine, status: 'idle' }]);
        if (error) throw error;
    },

    updateMachine: async (id: string, updates: Partial<Omit<Machine, 'id'>>): Promise<void> => {
        const { error } = await supabase.from('machines').update({
            name: updates.name,
            type: updates.type,
            // Map camelCase to snake_case if needed, but schema uses minimal mapping
        }).eq('id', id);
        if (error) throw error;
    },

    deleteMachine: async (id: string): Promise<void> => {
        const { error } = await supabase.from('machines').delete().eq('id', id);
        if (error) throw error;
    },

    updateMachineStatus: async (id: string, status: Machine['status'], meta?: { startTime?: string, duration?: number }): Promise<void> => {
        // Meta (startTime, duration) handling might need column adjustments or JSONB if strictly typed
        // For now, assuming standard columns or handled elsewhere
        if (meta) console.log("Meta data update:", meta); // Suppress unused warning
        const { error } = await supabase.from('machines').update({ status }).eq('id', id);
        if (error) throw error;
    },

    batchUpdateToolStatus: async (ids: string[], status: ToolSet['status']): Promise<void> => {
        const { error } = await supabase.from('inventory').update({ status }).in('id', ids);
        if (error) throw error;
    },

    // Logs
    addLog: async (log: Omit<WorkflowLog, 'id' | 'timestamp'>): Promise<void> => {
        const { error } = await supabase.from('workflow_logs').insert([{
            tool_set_id: log.toolSetId,
            action: log.action,
            operator_id: log.operatorId,
            machine_id: log.machineId,
            notes: log.notes,
            photo_url: log.photo
        }]);
        if (error) throw error;
    },

    getLogs: async (): Promise<WorkflowLog[]> => {
        const { data, error } = await supabase.from('workflow_logs').select('*').order('timestamp', { ascending: false });
        if (error) throw error;
        return data.map((l: any) => ({
            id: l.id,
            toolSetId: l.tool_set_id,
            action: l.action,
            operatorId: l.operator_id,
            machineId: l.machine_id,
            timestamp: l.timestamp,
            notes: l.notes,
            photo: l.photo_url
        }));
    },

    // Requests
    getRequests: async (): Promise<ToolRequest[]> => {
        const { data, error } = await supabase.from('tool_requests').select('*').order('timestamp', { ascending: false });
        if (error) throw error;
        return data.map((r: any) => ({
            id: r.id,
            ward: r.ward,
            items: r.items, // JSONB
            priority: r.priority,
            status: r.status,
            patientRm: r.patient_rm,
            doctorName: r.doctor_name,
            requiredDate: r.required_date,
            timestamp: r.timestamp,
            notes: r.notes
        }));
    },

    getEfficiency: async (): Promise<number> => {
        // Mock calculation for now or aggregate query
        return 92.5;
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

    // Master Data Getters (Fase 1)
    getDepartments: async (): Promise<string[]> => {
        return MASTER_DATA.DEPARTMENTS;
    },

    getCategories: async (): Promise<string[]> => {
        return MASTER_DATA.CATEGORIES;
    },

    // App Config
    getAppConfigs: async (): Promise<Record<string, string>> => {
        const { data, error } = await supabase.from('app_config').select('key, value');
        if (error) throw error;
        return data.reduce((acc: any, curr: any) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});
    },

    updateAppConfig: async (key: string, value: string): Promise<void> => {
        const { error } = await supabase.from('app_config').update({ value, updated_at: new Date().toISOString() }).eq('key', key);
        if (error) throw error;
    }
};
