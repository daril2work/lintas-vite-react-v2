import { supabase } from './supabase';
import type { Staff, Machine, ToolSet, WorkflowLog, ToolRequest, ImportantMessage, Room, BowieDickLog } from '../types';

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
        { id: 'p1', name: 'Standard 134°C', duration: 45, temp: 134, pressure: 2.1, expire_days: 30 },
        { id: 'p2', name: 'Delicate 121°C', duration: 60, temp: 121, pressure: 1.1, expire_days: 14 },
        { id: 'p3', name: 'Flash Cycle', duration: 20, temp: 134, pressure: 2.2, expire_days: 1 },
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
            nextService: m.next_service,
            last_bowie_dick_date: m.last_bowie_dick_date,
            bowie_dick_status: m.bowie_dick_status,
            startTime: m.start_time,
            duration: m.duration
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
        }).eq('id', id);
        if (error) throw error;
    },

    deleteMachine: async (id: string): Promise<void> => {
        const { error } = await supabase.from('machines').delete().eq('id', id);
        if (error) throw error;
    },

    updateMachineStatus: async (id: string, status: Machine['status'], meta?: { startTime?: string, duration?: number }): Promise<void> => {
        const updateData: any = { status };
        if (meta?.startTime) updateData.start_time = meta.startTime;
        if (meta?.duration) updateData.duration = meta.duration;

        if (status === 'idle') {
            updateData.start_time = null;
            updateData.duration = null;
        }

        const { error } = await supabase.from('machines').update(updateData).eq('id', id);
        if (error) throw error;
    },

    approveBowieDick: async (id: string): Promise<void> => {
        const { error } = await supabase.from('machines').update({
            last_bowie_dick_date: new Date().toISOString().split('T')[0],
            bowie_dick_status: 'passed',
            status: 'idle'
        }).eq('id', id);
        if (error) throw error;
    },

    batchUpdateToolStatus: async (ids: string[], status: ToolSet['status']): Promise<void> => {
        const { error } = await supabase.from('inventory').update({ status }).in('id', ids);
        if (error) throw error;
    },

    // Bowie Dick Logs
    createBowieDickLog: async (log: Omit<BowieDickLog, 'id' | 'timestamp'>): Promise<BowieDickLog> => {
        const { data, error } = await supabase
            .from('bowie_dick_logs')
            .insert([{
                machine_id: log.machineId,
                temperature: log.temperature,
                pressure: log.pressure,
                holding_time: log.holding_time,
                result: log.result,
                operator_name: log.operator_name,
                notes: log.notes
            }])
            .select('*')
            .single();

        if (error) throw error;
        return {
            id: data.id,
            machineId: data.machine_id,
            temperature: Number(data.temperature),
            pressure: Number(data.pressure),
            holding_time: data.holding_time,
            result: data.result,
            operator_name: data.operator_name,
            notes: data.notes,
            timestamp: data.timestamp
        };
    },

    getBowieDickLogs: async (): Promise<BowieDickLog[]> => {
        const { data, error } = await supabase
            .from('bowie_dick_logs')
            .select('*')
            .order('timestamp', { ascending: false });

        if (error) throw error;
        return (data || []).map(d => ({
            id: d.id,
            machineId: d.machine_id,
            temperature: Number(d.temperature),
            pressure: Number(d.pressure),
            holding_time: d.holding_time,
            result: d.result,
            operator_name: d.operator_name,
            notes: d.notes,
            timestamp: d.timestamp
        }));
    },

    // Workflow Logs
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

    // Analytics
    getEfficiency: async (): Promise<number> => {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const { data: logs, error } = await supabase
                .from('workflow_logs')
                .select('*')
                .gte('timestamp', today.toISOString());

            if (error) throw error;

            const completedCycles = logs?.filter(log =>
                log.action.includes('Finish') || log.action.includes('Selesai')
            ).length || 0;

            const dailyTarget = 50;
            const efficiency = Math.min((completedCycles / dailyTarget) * 100, 100);

            return Math.round(efficiency * 10) / 10;
        } catch (error) {
            console.error('Efficiency calculation error:', error);
            return 0;
        }
    },

    // Master Data Helpers
    getDepartments: async (): Promise<string[]> => MASTER_DATA.DEPARTMENTS,
    getCategories: async (): Promise<string[]> => MASTER_DATA.CATEGORIES,

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
            pic_id: r.pic_id,
            pic_name: r.pic?.name,
            createdAt: r.created_at
        }));
    },

    createRoom: async (room: Omit<Room, 'id' | 'createdAt'>): Promise<void> => {
        const { error } = await supabase.from('rooms').insert([{
            name: room.name,
            pic_id: room.pic_id
        }]);
        if (error) throw error;
    },

    updateRoom: async (id: string, updates: Partial<Omit<Room, 'id' | 'createdAt'>>): Promise<void> => {
        const { error } = await supabase.from('rooms').update({
            name: updates.name,
            pic_id: updates.pic_id
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

    startMachineBatch: async (machineId: string, itemIds: string[]): Promise<void> => {
        const { error } = await supabase.from('inventory')
            .update({
                status: 'sterilizing',
                machine_id: machineId
            })
            .in('id', itemIds);
        if (error) throw error;
    },

    finishMachineBatch: async (machineId: string): Promise<void> => {
        const { error } = await supabase.from('inventory')
            .update({
                status: 'stored',
                machine_id: null
            })
            .eq('machine_id', machineId)
            .eq('status', 'sterilizing');
        if (error) throw error;
    }
};
