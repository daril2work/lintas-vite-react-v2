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

export interface PostSterilizationLog {
    id: string;
    machineId: string;
    date: string;
    operator_name: string;
    notes?: string;
    proof_file_url?: string;
    timestamp: string;
}
