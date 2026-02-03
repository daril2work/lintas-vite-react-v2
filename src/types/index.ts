export interface Staff {
    id: string;
    name: string;
    role: 'admin' | 'operator' | 'nurse';
    department: string;
    employeeId: string;
}

export interface Machine {
    id: string;
    name: string;
    type: 'washer' | 'sterilizer';
    status: 'idle' | 'running' | 'maintenance' | 'error';
    lastService?: string;
    nextService?: string;
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
}
