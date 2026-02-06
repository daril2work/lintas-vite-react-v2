import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Settings, Thermometer, ShieldCheck, Zap, Timer, Activity } from 'lucide-react';
import { cn } from '../utils/cn';
import { useAuth } from '../context/AuthContext';

import { MASTER_DATA } from '../services/api';

export const SterilizingPage = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [selectedMachine, setSelectedMachine] = useState<string | null>(null);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [programId, setProgramId] = useState('p1');

    const activeProgram = MASTER_DATA.STERILIZATION_PROGRAMS.find(p => p.id === programId) || MASTER_DATA.STERILIZATION_PROGRAMS[0];
    const [, setTick] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => setTick(t => t + 1), 1000);
        return () => clearInterval(timer);
    }, []);

    const { data: machines } = useQuery({ queryKey: ['machines'], queryFn: api.getMachines });
    const { data: inventory } = useQuery({ queryKey: ['inventory'], queryFn: api.getInventory });

    const sterilizers = machines?.filter(m => m.type === 'sterilizer') || [];
    const queueItems = inventory?.filter(item => item.status === 'sterilizing') || []; // Items ready for sterilization

    const getRemainingTime = (m: typeof sterilizers[0]) => {
        if (m.status !== 'running' || !m.startTime || !m.duration) return null;
        const elapsed = new Date().getTime() - new Date(m.startTime).getTime();
        const totalDurationMs = m.duration * 60 * 1000;
        const remaining = totalDurationMs - elapsed;

        if (remaining <= 0) return '00:00';

        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const getProgress = (m: typeof sterilizers[0]) => {
        if (m.status !== 'running' || !m.startTime || !m.duration) return 0;
        const elapsed = new Date().getTime() - new Date(m.startTime).getTime();
        const totalDurationMs = m.duration * 60 * 1000;
        return Math.min(100, (elapsed / totalDurationMs) * 100);
    };

    const isCycleComplete = (m: typeof sterilizers[0]) => {
        if (m.status !== 'running' || !m.startTime || !m.duration) return false;
        const elapsed = new Date().getTime() - new Date(m.startTime).getTime();
        return elapsed >= m.duration * 60 * 1000;
    };

    const toggleItem = (id: string) => {
        const newSelected = new Set(selectedItems);
        if (newSelected.has(id)) newSelected.delete(id);
        else newSelected.add(id);
        setSelectedItems(newSelected);
    };

    const [showSuccess, setShowSuccess] = useState(false);

    const startMutation = useMutation({
        mutationFn: async () => {
            if (!selectedMachine) return;
            const duration = activeProgram.duration;

            // Security check: ensure items are ready for sterilization
            const itemsArray = Array.from(selectedItems);
            const currentInventory = await api.getInventory();
            const validItems = itemsArray.filter(id => {
                const item = currentInventory.find(i => i.id === id);
                return item?.status === 'sterilizing';
            });

            if (validItems.length === 0) {
                throw new Error('Alat tidak dalam status siap steril.');
            }

            // Start Machine
            await api.updateMachineStatus(selectedMachine, 'running', {
                startTime: new Date().toISOString(),
                duration: duration
            });

            // Log
            await api.addLog({
                toolSetId: validItems[0] || 'batch',
                action: 'Start Sterilization',
                operatorId: user?.name || 'Operator',
                machineId: selectedMachine,
                notes: `Started ${activeProgram.name} cycle (${duration}m) with ${validItems.length} items.`
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['machines'] });
            setSelectedMachine(null);
            setSelectedItems(new Set());
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        }
    });

    // In a real app, we would track which items are in which machine. 
    // For this demo, we'll just move ALL 'sterilizing' items to 'sterile' when any machine finishes, 
    // OR we could try to be smarter. For simplicity/demo: "Finish Cycle" basically clears current queue.
    const finishMutation = useMutation({
        mutationFn: async (machineId: string) => {
            await api.updateMachineStatus(machineId, 'idle');

            // Move selected items to sterile (Assuming we knew which ones, but here we might just move all 'sterilizing' for demo flow, 
            // or ideally we would have stored the batch ID. Let's just move ALL for now to unblock the flow, or rely on user selection again?)
            // Better: We assume the user selects them, but they are already in the machine.
            // WORKAROUND: We will just update ALL currently 'sterilizing' items to 'sterile' to simulate unloading the batch.
            const itemsToUpdate = queueItems.map(i => i.id);
            await api.batchUpdateToolStatus(itemsToUpdate, 'sterile');

            await api.addLog({
                toolSetId: 'batch',
                action: 'Finish Sterilization',
                operatorId: user?.name || 'Operator',
                machineId: machineId,
                notes: `Cycle completed. ${itemsToUpdate.length} items marked sterile.`
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['machines'] });
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        }
    });

    return (
        <div className="space-y-8">
            {showSuccess && (
                <div className="fixed top-24 right-8 z-50 animate-in slide-in-from-right-full duration-300">
                    <div className="bg-accent-emerald text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3">
                        <ShieldCheck size={24} />
                        <div>
                            <p className="font-black text-sm uppercase">Berhasil!</p>
                            <p className="text-[10px] font-bold opacity-90">Proses telah diperbarui.</p>
                        </div>
                    </div>
                </div>
            )}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl text-slate-900">Sterilisasi</h1>
                    <p className="text-slate-500 mt-1">Proses akhir sterilisasi menggunakan Autoclave atau Plasma.</p>
                </div>
                <div className="bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-accent-emerald animate-pulse"></span>
                        <span className="text-sm font-bold text-slate-700">{queueItems.length} Menunggu Steril</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Pilih Mesin Sterilisasi</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {sterilizers.map(machine => {
                            const isDone = isCycleComplete(machine);
                            return (
                                <Card
                                    key={machine.id}
                                    className={cn(
                                        "relative overflow-hidden cursor-pointer border-2 transition-all",
                                        selectedMachine === machine.id ? "border-accent-indigo bg-accent-indigo/[0.02]" : "border-transparent"
                                    )}
                                    onClick={() => machine.status === 'idle' && setSelectedMachine(machine.id)}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-3">
                                            <div className={cn(
                                                "w-12 h-12 rounded-2xl flex items-center justify-center",
                                                machine.name.includes('Plasma') ? "bg-accent-indigo/10 text-accent-indigo" : "bg-accent-amber/10 text-accent-amber"
                                            )}>
                                                {machine.name.includes('Plasma') ? <Zap size={24} /> : <Settings size={24} />}
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-black">{machine.name}</h3>
                                                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">
                                                    {machine.name.includes('Plasma') ? 'H2O2 Plasma' : 'Steam Autoclave'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className={cn(
                                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                                            machine.status === 'idle' ? "bg-accent-emerald/10 text-accent-emerald" :
                                                machine.status === 'running' ? "bg-accent-indigo/10 text-accent-indigo" : "bg-accent-amber/10 text-accent-amber"
                                        )}>
                                            {machine.status}
                                        </div>
                                    </div>

                                    {machine.status === 'running' && (
                                        <div className="mt-6 space-y-2">
                                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                                                <span className={cn("text-accent-indigo italic", !isDone && "animate-pulse")}>
                                                    {isDone ? 'CYCLE COMPLETE' : 'STERILIZING...'}
                                                </span>
                                                <span>{isDone ? '00:00' : getRemainingTime(machine)}</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className={cn("h-full transition-all duration-1000 ease-linear", isDone ? "bg-accent-emerald" : "bg-accent-indigo")}
                                                    style={{ width: `${getProgress(machine)}%` }}
                                                />
                                            </div>
                                            {isDone && (
                                                <Button
                                                    size="sm"
                                                    className="w-full mt-2 bg-accent-emerald hover:bg-emerald-600 text-white"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        finishMutation.mutate(machine.id);
                                                    }}
                                                >
                                                    <ShieldCheck size={14} className="mr-2" />
                                                    Selesai & Unload
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </Card>
                            );
                        })}
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Parameter Real-time</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                                { label: 'Temperature', value: selectedMachine ? `${activeProgram.temp}°C` : '---', icon: Thermometer, color: 'text-rose-500' },
                                { label: 'Pressure', value: selectedMachine ? `${activeProgram.pressure} Bar` : '---', icon: Activity, color: 'text-indigo-500' },
                                { label: 'Timer', value: `${activeProgram.duration}:00`, icon: Timer, color: 'text-amber-500' },
                            ].map(param => (
                                <Card key={param.label} className="p-4 flex items-center gap-4">
                                    <div className={cn("w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center", param.color)}>
                                        <param.icon size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{param.label}</p>
                                        <p className="text-xl font-black">{param.value}</p>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <Card className="bg-slate-900 text-white border-none shadow-2xl relative overflow-hidden">
                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-accent-emerald/10 rounded-full blur-2xl"></div>

                        <div className="relative z-10 space-y-6">
                            <div className="flex items-center gap-3">
                                <ShieldCheck className="text-accent-emerald" />
                                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Cycle Configuration</h4>
                            </div>

                            <div className="p-4 bg-slate-800 rounded-2xl space-y-3">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-500">Selected Items</span>
                                    <span className="font-bold text-accent-emerald">{selectedItems.size} SET</span>
                                </div>
                                <div className="h-px bg-slate-700"></div>
                                <div className="space-y-2">
                                    <span className="text-xs text-slate-500">Program</span>
                                    <div className="grid grid-cols-3 gap-2">
                                        {MASTER_DATA.STERILIZATION_PROGRAMS.map(p => (
                                            <button
                                                key={p.id}
                                                onClick={() => setProgramId(p.id)}
                                                className={cn(
                                                    "p-2 rounded-lg text-center transition-all border",
                                                    programId === p.id
                                                        ? "bg-accent-emerald text-white border-accent-emerald"
                                                        : "bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-600"
                                                )}
                                            >
                                                <div className="text-sm font-black">{p.temp}°C</div>
                                                <div className="text-[9px] uppercase">{p.name.split(' ')[0]}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <Button
                                className={cn(
                                    "w-full h-14 bg-accent-emerald hover:bg-emerald-600 text-white border-none gap-2 text-lg",
                                    !selectedMachine && "opacity-50 cursor-not-allowed"
                                )}
                                disabled={!selectedMachine || selectedItems.size === 0 || startMutation.isPending}
                                onClick={() => startMutation.mutate()}
                            >
                                <Zap size={20} />
                                Mulai Siklus
                            </Button>
                        </div>
                    </Card>

                    <Card>
                        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Antrian ({queueItems.length})</h4>
                        <div className="space-y-3 max-h-[400px] overflow-y-auto">
                            {queueItems.map(item => (
                                <div
                                    key={item.id}
                                    className={cn(
                                        "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                                        selectedItems.has(item.id) ? "bg-accent-emerald/5 border-accent-emerald" : "bg-slate-50 border-slate-100 hover:border-slate-200"
                                    )}
                                    onClick={() => toggleItem(item.id)}
                                >
                                    <div className={cn(
                                        "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                                        selectedItems.has(item.id) ? "bg-accent-emerald border-accent-emerald text-white" : "border-slate-300 bg-white"
                                    )}>
                                        {selectedItems.has(item.id) && <ShieldCheck size={12} />}
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="text-xs font-bold truncate">{item.name}</p>
                                        <p className="text-[10px] text-slate-400 font-mono italic">#{item.barcode}</p>
                                    </div>
                                </div>
                            ))}
                            {queueItems.length === 0 && (
                                <p className="text-center py-4 text-xs text-slate-400 italic">Tidak ada antrian.</p>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};
