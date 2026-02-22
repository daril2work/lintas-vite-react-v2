import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Activity, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { Machine } from '../../types';

const MachineTimer = ({ machine }: { machine: Machine }) => {
    const [progress, setProgress] = useState(0);
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        if (machine.status !== 'running') {
            setProgress(0);
            setTimeLeft('');
            return;
        }

        if (!machine.startTime || !machine.duration) {
            setProgress(0);
            setTimeLeft('Syncing...');
            return;
        }

        const updateTimer = () => {
            try {
                const start = new Date(machine.startTime!).getTime();
                const now = Date.now();
                const totalMs = (machine.duration || 0) * 60 * 1000;

                if (totalMs <= 0 || isNaN(start)) {
                    setTimeLeft('Data Error');
                    return;
                }

                const elapsedMs = now - start;
                const newProgress = Math.min(Math.max((elapsedMs / totalMs) * 100, 0), 100);
                setProgress(newProgress);

                const remainingMs = Math.max(totalMs - elapsedMs, 0);
                const minutes = Math.floor(remainingMs / 60000);
                const seconds = Math.floor((remainingMs % 60000) / 1000);

                if (remainingMs <= 0) {
                    setTimeLeft('Selesai');
                } else {
                    setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
                }
            } catch (err) {
                console.error("Timer calculation error:", err);
                setTimeLeft('Error');
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [machine.startTime, machine.duration, machine.status]);

    if (machine.status !== 'running') return null;

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                <div className="flex items-center gap-2">
                    <span className="text-slate-400">Progress</span>
                    <span className="text-slate-900">{Math.round(progress)}%</span>
                </div>
                <span className={cn(
                    "px-2 py-0.5 rounded-full transition-all",
                    timeLeft === 'Selesai' ? 'bg-accent-emerald text-white animate-pulse' : 'bg-slate-100 text-slate-600'
                )}>
                    {timeLeft}
                </span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                    className={cn(
                        "h-full transition-all duration-1000 ease-linear",
                        timeLeft === 'Selesai' ? "bg-accent-emerald" : "bg-accent-indigo"
                    )}
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
        </div>
    );
};

interface MachineStatusGridProps {
    machines: Machine[];
    statusFilter: 'all' | 'idle' | 'running';
    onStatusFilterChange: (filter: 'all' | 'idle' | 'running') => void;
    onFinishMachine: (machineId: string) => void;
    isFinishing: boolean;
}

export const MachineStatusGrid: React.FC<MachineStatusGridProps> = ({
    machines,
    statusFilter,
    onStatusFilterChange,
    onFinishMachine,
    isFinishing
}) => {
    const [page, setPage] = useState(1);
    const machinesPerPage = 4;

    const filteredMachines = machines.filter(m => {
        if (statusFilter === 'all') return true;
        return m.status === statusFilter;
    });

    const totalPages = Math.ceil(filteredMachines.length / machinesPerPage);
    const paginatedMachines = filteredMachines.slice((page - 1) * machinesPerPage, page * machinesPerPage);

    const counts = {
        all: machines.length,
        idle: machines.filter(m => m.status === 'idle').length,
        running: machines.filter(m => m.status === 'running').length,
    };

    const handleFilterChange = (filter: 'all' | 'idle' | 'running') => {
        onStatusFilterChange(filter);
        setPage(1);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Status Mesin Terkini</h4>
                    <div className="flex gap-2">
                        {(['all', 'idle', 'running'] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => handleFilterChange(f)}
                                className={cn(
                                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all",
                                    statusFilter === f
                                        ? (f === 'running' ? "bg-accent-indigo text-white" : "bg-slate-900 text-white")
                                        : (f === 'running' ? "bg-accent-indigo/10 text-accent-indigo hover:bg-accent-indigo/20" : "bg-slate-100 text-slate-500 hover:bg-slate-200")
                                )}
                            >
                                {f === 'all' ? 'Semua' : f} ({counts[f]})
                            </button>
                        ))}
                    </div>
                </div>
                {totalPages > 1 && (
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronLeft size={16} className="text-slate-600" />
                        </button>
                        <span className="text-xs font-black text-slate-600">
                            {page} / {totalPages}
                        </span>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronRight size={16} className="text-slate-600" />
                        </button>
                    </div>
                )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paginatedMachines.map(machine => (
                    <Card key={machine.id} className="hover:border-slate-200">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "w-10 h-10 rounded-xl flex items-center justify-center",
                                    machine.status === 'running' ? "bg-accent-indigo/10 text-accent-indigo" : "bg-slate-100 text-slate-400"
                                )}>
                                    <Activity size={20} />
                                </div>
                                <div>
                                    <p className="text-sm font-black capitalize">{machine.name}</p>
                                    <p className="text-[10px] text-slate-400 uppercase font-bold">{machine.type}</p>
                                </div>
                            </div>
                            <span className={cn(
                                "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                                machine.status === 'running' ? "bg-accent-indigo text-white" : "bg-slate-100 text-slate-500"
                            )}>
                                {machine.status}
                            </span>
                        </div>
                        <MachineTimer machine={machine} />
                        {machine.status === 'running' && (
                            <Button
                                size="sm"
                                variant="secondary"
                                className="w-full mt-4 h-8 text-[10px] font-black uppercase tracking-widest hover:bg-accent-rose hover:text-white transition-all"
                                onClick={() => onFinishMachine(machine.id)}
                                isLoading={isFinishing}
                            >
                                Selesaikan Sesi
                            </Button>
                        )}
                        {machine.status === 'idle' && (
                            <p className="text-[10px] text-slate-400 italic">Siap untuk digunakan.</p>
                        )}
                    </Card>
                ))}
            </div>
        </div>
    );
};
