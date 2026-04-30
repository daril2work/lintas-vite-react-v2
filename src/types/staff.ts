export interface Staff {
    id: string;
    name: string;
    role: 'admin' | 'operator_cssd' | 'operator_ruangan';
    department: string;
    employeeId: string;
    username?: string;
    password?: string;
}
