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
