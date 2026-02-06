export interface Staff {
    id: string;
    name: string;
    role: 'admin' | 'operator_cssd' | 'operator_ruangan';
    department: string;
    employeeId: string;
    username?: string;
    password?: string;
}

export interface Machine {
    id: string;
    name: string;
    type: 'washer' | 'sterilizer';
    status: 'idle' | 'running' | 'maintenance' | 'error';
    lastService?: string;
    nextService?: string;
    startTime?: string;
    duration?: number;
}

export interface ToolSet {
    id: string;
    name: string;
    barcode: string;
    category: string;
    lastSterilized?: string;
    status: 'dirty' | 'washing' | 'packing' | 'sterilizing' | 'sterile' | 'distributed';
}

export interface WorkflowLog {
    id: string;
    toolSetId: string;
    action: string;
    operatorId: string;
    machineId?: string;
    timestamp: string;
    notes?: string;
    photo?: string;
    evidence?: string;
}

export interface ToolRequest {
    id: string;
    ward: string;
    items: { id: string; name: string; quantity: number }[];
    priority: 'normal' | 'urgent';
    status: 'pending' | 'in-progress' | 'fulfilled' | 'unavailable';
    patientRm?: string;
    doctorName?: string;
    requiredDate?: string;
    timestamp: string;
    notes?: string;
}
