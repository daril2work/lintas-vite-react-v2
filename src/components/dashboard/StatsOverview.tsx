import React from 'react';
import { Card } from '../ui/Card';
import { cn } from '../../utils/cn';
import { ArrowRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Stat {
    label: string;
    count: number;
    icon: LucideIcon;
    color: string;
    bg: string;
    path: string;
}

interface StatsOverviewProps {
    stats: Stat[];
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ stats }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {stats.map((stat) => (
                <a key={stat.label} href={stat.path}>
                    <Card className="hover:scale-[1.02] cursor-pointer transition-all border-none shadow-soft hover:shadow-xl group overflow-hidden">
                        <div className={cn("absolute top-0 right-0 w-16 h-16 rounded-bl-full opacity-20 transition-all group-hover:w-full group-hover:h-full group-hover:rounded-none", stat.bg)}></div>
                        <div className="relative z-10 space-y-4">
                            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", stat.bg, stat.color)}>
                                <stat.icon size={24} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                                <h3 className="text-3xl font-black text-slate-900">{stat.count}</h3>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 group-hover:text-accent-indigo transition-colors uppercase">
                                Lihat Detail <ArrowRight size={10} />
                            </div>
                        </div>
                    </Card>
                </a>
            ))}
        </div>
    );
};
