export interface OperatingSchedule {
    id: string;
    room_id?: string;
    patient_name: string;
    patient_rm: string;
    surgeon_name: string;
    operation_type: string;
    operation_date: string;
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
    notes?: string;
    created_by?: string;
    created_at?: string;
    updated_at?: string;
    room?: { name: string };
}
