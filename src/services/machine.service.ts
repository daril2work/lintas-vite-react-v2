import { supabase } from './supabase';
import { APP_CONFIG } from '../constants/config';
import type { Machine, BowieDickLog, WorkflowLog } from '../types';

export const MACHINE_DATA = {
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

export const machineService = {
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
            lastBowieDickDate: m.last_bowie_dick_date,
            bowieDickStatus: m.bowie_dick_status,
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

            // Automatically finish any batch associated with this machine
            // 1. Check for sterilizing items (moves to stored)
            const { data: sItems } = await supabase
                .from('inventory')
                .select('id')
                .eq('machine_id', id)
                .eq('status', 'sterilizing');

            if (sItems && sItems.length > 0) {
                await supabase.from('inventory')
                    .update({ status: 'stored', machine_id: null })
                    .eq('machine_id', id)
                    .eq('status', 'sterilizing');

                await Promise.all(sItems.map(item =>
                    supabase.from('workflow_logs').insert([{
                        tool_set_id: item.id,
                        action: 'Sterilization Finished (Auto)',
                        operator_id: 'System',
                        machine_id: id,
                        notes: 'Siklus sterilisasi selesai (Auto-transition).'
                    }])
                ));
            }

            // 2. Check for washing items (moves to packing)
            const { data: wItems } = await supabase
                .from('inventory')
                .select('id')
                .eq('machine_id', id)
                .eq('status', 'washing');

            if (wItems && wItems.length > 0) {
                await supabase.from('inventory')
                    .update({ status: 'packing', machine_id: null })
                    .eq('machine_id', id)
                    .eq('status', 'washing');

                await Promise.all(wItems.map(item =>
                    supabase.from('workflow_logs').insert([{
                        tool_set_id: item.id,
                        action: 'Washing Finished (Auto)',
                        operator_id: 'System',
                        machine_id: id,
                        notes: 'Siklus pencucian selesai (Auto-transition).'
                    }])
                ));
            }
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

    // Workflow Actions
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
        // 1. Get items currently in this machine (both sterilizing and washing)
        const { data: items, error: fetchError } = await supabase
            .from('inventory')
            .select('id, name, status')
            .eq('machine_id', machineId)
            .in('status', ['sterilizing', 'washing']);

        if (fetchError) throw fetchError;
        if (!items || items.length === 0) return;

        // 2. Process each item based on current status
        const sterilizingItems = items.filter(i => i.status === 'sterilizing');
        const washingItems = items.filter(i => i.status === 'washing');

        if (sterilizingItems.length > 0) {
            await supabase.from('inventory')
                .update({ status: 'stored', machine_id: null })
                .eq('machine_id', machineId)
                .eq('status', 'sterilizing');

            await Promise.all(sterilizingItems.map(item =>
                supabase.from('workflow_logs').insert([{
                    tool_set_id: item.id,
                    action: 'Sterilization Finished',
                    operator_id: 'System',
                    machine_id: machineId,
                    notes: 'Siklus sterilisasi selesai. Alat dipindahkan ke Penyimpanan.'
                }])
            ));
        }

        if (washingItems.length > 0) {
            await supabase.from('inventory')
                .update({ status: 'packing', machine_id: null })
                .eq('machine_id', machineId)
                .eq('status', 'washing');

            await Promise.all(washingItems.map(item =>
                supabase.from('workflow_logs').insert([{
                    tool_set_id: item.id,
                    action: 'Washing Finished',
                    operator_id: 'System',
                    machine_id: machineId,
                    notes: 'Siklus pencucian selesai. Alat siap untuk Pengepakan.'
                }])
            ));
        }
    },

    finishIndividualTool: async (toolId: string): Promise<void> => {
        const { error } = await supabase.from('inventory')
            .update({
                status: 'stored',
                machine_id: null
            })
            .eq('id', toolId);

        if (error) throw error;

        await supabase.from('workflow_logs').insert([{
            tool_set_id: toolId,
            action: 'Individually Unloaded',
            operator_id: 'System',
            notes: 'Alat dipindahkan ke Penyimpanan secara individual.'
        }]);
    },

    // Analytics
    /** Action strings written by this service's own functions — keep in sync if action names change */
    getEfficiency: async (): Promise<number> => {
        const COMPLETION_ACTIONS = [
            'Sterilization Finished',
            'Washing Finished',
            'Individually Unloaded',
        ];
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const { data: logs, error } = await supabase
                .from('workflow_logs')
                .select('*')
                .gte('timestamp', today.toISOString());

            if (error) throw error;

            const completedCycles = logs?.filter(log =>
                COMPLETION_ACTIONS.some(keyword => log.action.startsWith(keyword))
            ).length || 0;

            const efficiency = Math.min((completedCycles / APP_CONFIG.EFFICIENCY_DAILY_TARGET) * 100, 100);

            return Math.round(efficiency * 10) / 10;
        } catch (error) {
            console.error('Efficiency calculation error:', error);
            return 0;
        }
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
};
