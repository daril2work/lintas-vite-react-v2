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
    type: 'washer' | 'sterilizer' | 'plasma';
    status: 'idle' | 'running' | 'maintenance' | 'error';
    lastService?: string;
    nextService?: string;
    lastBowieDickDate?: string;
    bowieDickStatus?: 'passed' | 'failed' | 'pending';
    startTime?: string;
    duration?: number;
}

export interface ToolSet {
    id: string;
    name: string;
    barcode: string;
    category: string;
    lastSterilized?: string;
    status: 'sent' | 'dirty' | 'washing' | 'packing' | 'ready_to_sterilize' | 'sterilizing' | 'stored' | 'sterile' | 'distributed' | 'in_use';
    room_id?: string;
    machine_id?: string;
    expire_date?: string;
    sterilization_method?: string;
    default_sterilization_method?: string;
    is_active?: boolean;
    is_validated?: boolean;
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

export interface ImportantMessage {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'alert';
    isActive: boolean;
    createdAt: string;
    expiresAt?: string;
}

export interface Room {
    id: string;
    name: string;
    picId: string;
    picName?: string;
    createdAt?: string;
}

export interface BowieDickLog {
    id: string;
    machineId: string;
    temperature?: number;
    pressure?: number;
    holding_time?: number;
    shift?: string;
    program?: string;
    siklus_mesin?: number;
    jam_start?: string;
    waktu_steril?: string;
    waktu_end_steril?: string;
    lama_steril?: number;
    lama_proses?: number;
    sterilisasi?: string;
    indikator_shift?: string;
    result: string;
    operator_name: string;
    notes?: string;
    timestamp: string;
    proof_file_url?: string;
}

export interface SterilizationProcessLog {
    id: string;
    machineId: string;
    operator_name: string;
    shift?: string;
    packaging_type?: string;
    process_status?: string;
    load_number?: string;
    temperature?: number;
    cycles?: number;
    jam_start?: string;
    waktu_steril?: string;
    waktu_end_steril?: string;
    lama_steril?: number;
    lama_proses?: number;
    indicator_internal?: string;
    indicator_external?: string;
    indicator_biological_control?: string;
    indicator_biological_test?: string;
    indicator_chemical_class_4?: string;
    indicator_chemical_class_5?: string;
    program_temp?: string;
    instrument_list: Array<{
        name: string;
        origin: string;
        qty: number;
        weight: number;
    }>;
    notes?: string;
    result: 'passed' | 'failed' | 'pending';
    proof_file_url?: string;
    timestamp: string;
}
