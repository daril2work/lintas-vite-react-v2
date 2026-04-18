import React, { useEffect } from 'react';
import { cn } from '../../utils/cn';
import { Card } from './Card';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    className?: string;
}

export const Modal = ({ isOpen, onClose, children, className }: ModalProps) => {
    // Close on escape key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleEsc);
        }
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div 
                className="absolute inset-0" 
                onClick={onClose}
            />
            <Card className={cn("relative w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200 p-0 overflow-hidden", className)}>
                {children}
            </Card>
        </div>
    );
};
