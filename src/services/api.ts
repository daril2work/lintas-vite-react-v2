import { storage, delay } from './storage';
import type { Staff, Machine, ToolSet, WorkflowLog, ToolRequest } from '../types';

const KEYS = {
    STAFF: 'lintas_staff',
    MACHINES: 'lintas_machines',
    INVENTORY: 'lintas_inventory',
    LOGS: 'lintas_logs',
    REQUESTS: 'lintas_requests',
};

// Initial Sample Data
const INITIAL_DATA = {
    STAFF: [
        {
            id: 'admin-1',
            name: 'Super Admin',
            role: 'admin',
            department: 'CSSD',
            employeeId: 'ADM001',
            username: 'daril2work@gmail.com',
            password: '123456'
        },
        {
            id: '2',
            name: 'Siti Aminah',
            role: 'operator',
            department: 'CSSD',
            employeeId: 'EMP002',
            username: 'siti.aminah',
            password: 'password123'
        },
        {
            id: '3',
            name: 'Ani Perawat',
            role: 'nurse',
            department: 'IGD',
            employeeId: 'NRS001',
            username: 'ani.perawat',
            password: 'password123'
        }
    ] as Staff[],
    MACHINES: [
        { id: 'm1', name: 'Washer 01', type: 'washer', status: 'idle' },
        { id: 'm2', name: 'Autoclave A', type: 'sterilizer', status: 'idle' },
    ] as Machine[],
    INVENTORY: [
        { id: 't1', name: 'Set Bedah Dasar A', barcode: 'SET-001', category: 'Bedah', status: 'sterile' },
        { id: 't2', name: 'Set Ortopedi 05', barcode: 'SET-002', category: 'Ortopedi', status: 'dirty' },
    ] as ToolSet[],
};

export const MASTER_DATA = {
    DEPARTMENTS: ['CSSD', 'IGD', 'ICU', 'OK (Bedah)', 'Poli Umum', 'Poli Gigi', 'Logistik'],
    CATEGORIES: ['Bedah', 'Ortopedi', 'Gigi', 'Umum', 'Lainnya'],
    ROLES: ['admin', 'operator', 'nurse'],
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
        await delay();
        const stored = storage.get<Staff[]>(KEYS.STAFF) || [];
        // Merge initial staff if not already in storage by ID
        const merged = [...stored];
        INITIAL_DATA.STAFF.forEach(initialStaff => {
            if (!merged.find(s => s.id === initialStaff.id)) {
                merged.push(initialStaff);
            }
        });
        return merged;
    },

    createStaff: async (staff: Omit<Staff, 'id'>): Promise<void> => {
        await delay();
        const items = storage.get<Staff[]>(KEYS.STAFF) || INITIAL_DATA.STAFF;
        const newStaff: Staff = {
            ...staff,
            id: Math.random().toString(36).substr(2, 9),
        };
        storage.set(KEYS.STAFF, [newStaff, ...items]);
    },

    updateStaff: async (id: string, updates: Partial<Omit<Staff, 'id'>>): Promise<void> => {
        await delay();
        const items = storage.get<Staff[]>(KEYS.STAFF) || INITIAL_DATA.STAFF;
        const updated = items.map(item => item.id === id ? { ...item, ...updates } : item);
        storage.set(KEYS.STAFF, updated);
    },

    deleteStaff: async (id: string): Promise<void> => {
        await delay();
        const items = storage.get<Staff[]>(KEYS.STAFF) || INITIAL_DATA.STAFF;
        const filtered = items.filter(item => item.id !== id);
        storage.set(KEYS.STAFF, filtered);
    },

    // Inventory
    getInventory: async (): Promise<ToolSet[]> => {
        await delay();
        return storage.get<ToolSet[]>(KEYS.INVENTORY) || INITIAL_DATA.INVENTORY;
    },

    updateToolStatus: async (id: string, status: ToolSet['status']): Promise<void> => {
        await delay();
        const items = storage.get<ToolSet[]>(KEYS.INVENTORY) || INITIAL_DATA.INVENTORY;
        const updated = items.map(item => item.id === id ? { ...item, status } : item);
        storage.set(KEYS.INVENTORY, updated);
    },

    createToolSet: async (tool: Omit<ToolSet, 'id' | 'status'>): Promise<void> => {
        await delay();
        const items = storage.get<ToolSet[]>(KEYS.INVENTORY) || INITIAL_DATA.INVENTORY;
        const newTool: ToolSet = {
            ...tool,
            id: Math.random().toString(36).substr(2, 9),
            status: 'sterile', // Default to sterile so it can be 'distributed' then 'intake'
        };
        storage.set(KEYS.INVENTORY, [newTool, ...items]);
    },

    updateTool: async (id: string, updates: Partial<Omit<ToolSet, 'id'>>): Promise<void> => {
        await delay();
        const items = storage.get<ToolSet[]>(KEYS.INVENTORY) || INITIAL_DATA.INVENTORY;
        const updated = items.map(item => item.id === id ? { ...item, ...updates } : item);
        storage.set(KEYS.INVENTORY, updated);
    },

    deleteTool: async (id: string): Promise<void> => {
        await delay();
        const items = storage.get<ToolSet[]>(KEYS.INVENTORY) || INITIAL_DATA.INVENTORY;
        const filtered = items.filter(item => item.id !== id);
        storage.set(KEYS.INVENTORY, filtered);
    },

    // Machines
    getMachines: async (): Promise<Machine[]> => {
        await delay();
        return storage.get<Machine[]>(KEYS.MACHINES) || INITIAL_DATA.MACHINES;
    },

    createMachine: async (machine: Omit<Machine, 'id' | 'status'>): Promise<void> => {
        await delay();
        const items = storage.get<Machine[]>(KEYS.MACHINES) || INITIAL_DATA.MACHINES;
        const newMachine: Machine = {
            ...machine,
            id: Math.random().toString(36).substr(2, 9),
            status: 'idle',
        };
        storage.set(KEYS.MACHINES, [newMachine, ...items]);
    },

    updateMachine: async (id: string, updates: Partial<Omit<Machine, 'id'>>): Promise<void> => {
        await delay();
        const items = storage.get<Machine[]>(KEYS.MACHINES) || INITIAL_DATA.MACHINES;
        const updated = items.map(item => item.id === id ? { ...item, ...updates } : item);
        storage.set(KEYS.MACHINES, updated);
    },

    deleteMachine: async (id: string): Promise<void> => {
        await delay();
        const items = storage.get<Machine[]>(KEYS.MACHINES) || INITIAL_DATA.MACHINES;
        const filtered = items.filter(item => item.id !== id);
        storage.set(KEYS.MACHINES, filtered);
    },

    updateMachineStatus: async (id: string, status: Machine['status'], meta?: { startTime?: string, duration?: number, progress?: number, timeRemaining?: string }): Promise<void> => {
        await delay();
        const items = storage.get<Machine[]>(KEYS.MACHINES) || INITIAL_DATA.MACHINES;
        const updated = items.map(m => m.id === id ? { ...m, status, ...meta } : m);
        storage.set(KEYS.MACHINES, updated);
    },

    batchUpdateToolStatus: async (ids: string[], status: ToolSet['status']): Promise<void> => {
        await delay();
        const items = storage.get<ToolSet[]>(KEYS.INVENTORY) || INITIAL_DATA.INVENTORY;
        const setIds = new Set(ids);
        const updated = items.map(item => setIds.has(item.id) ? { ...item, status } : item);
        storage.set(KEYS.INVENTORY, updated);
    },

    // Logs
    addLog: async (log: Omit<WorkflowLog, 'id' | 'timestamp'>): Promise<void> => {
        await delay();
        const logs = storage.get<WorkflowLog[]>(KEYS.LOGS) || [];
        const newLog: WorkflowLog = {
            ...log,
            id: Math.random().toString(36).substr(2, 9),
            timestamp: new Date().toISOString(),
        };
        storage.set(KEYS.LOGS, [newLog, ...logs]);
    },

    getLogs: async (): Promise<WorkflowLog[]> => {
        await delay();
        return storage.get<WorkflowLog[]>(KEYS.LOGS) || [];
    },

    // Requests
    getRequests: async (): Promise<ToolRequest[]> => {
        await delay();
        return storage.get<ToolRequest[]>(KEYS.REQUESTS) || [];
    },

    getEfficiency: async (): Promise<number> => {
        await delay();
        const logs = storage.get<WorkflowLog[]>(KEYS.LOGS) || [];
        if (logs.length === 0) return 0;
        // Simple logic: total completed tools today vs yesterday (mock)
        return 92.5;
    },

    createRequest: async (request: Omit<ToolRequest, 'id' | 'timestamp' | 'status'>): Promise<void> => {
        await delay();
        const requests = storage.get<ToolRequest[]>(KEYS.REQUESTS) || [];
        const newRequest: ToolRequest = {
            ...request,
            id: Math.random().toString(36).substr(2, 9),
            status: 'pending',
            timestamp: new Date().toISOString(),
        };
        storage.set(KEYS.REQUESTS, [newRequest, ...requests]);
    },

    updateRequestStatus: async (id: string, status: ToolRequest['status']): Promise<void> => {
        await delay();
        const requests = storage.get<ToolRequest[]>(KEYS.REQUESTS) || [];
        const updated = requests.map(req => req.id === id ? { ...req, status } : req);
        storage.set(KEYS.REQUESTS, updated);
    },

    // Master Data Getters (Fase 1)
    getDepartments: async (): Promise<string[]> => {
        await delay();
        return MASTER_DATA.DEPARTMENTS;
    },

    getCategories: async (): Promise<string[]> => {
        await delay();
        return MASTER_DATA.CATEGORIES;
    }
};
