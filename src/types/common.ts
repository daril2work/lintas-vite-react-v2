export interface ImportantMessage {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'alert';
    isActive: boolean;
    createdAt: string;
    expiresAt?: string;
}
