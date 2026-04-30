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
