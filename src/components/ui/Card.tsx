import React from 'react';
import { cn } from '../../utils/cn';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'white' | 'glass';
}

export const Card = ({ className, variant = 'white', ...props }: CardProps) => {
    return (
        <div
            className={cn(
                'rounded-3xl shadow-soft p-6 border border-slate-100 transition-all',
                variant === 'white' ? 'bg-white' : 'glass bg-white/70 backdrop-blur-md',
                className
            )}
            {...props}
        />
    );
};
