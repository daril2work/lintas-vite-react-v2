import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Settings, Thermometer, ShieldCheck, Zap, Timer, Activity, ChevronRight, AlertCircle } from 'lucide-react';
import { cn } from '../utils/cn';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

import { MASTER_DATA } from '../services/api';

export const SterilizingPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [selectedMachine, setSelectedMachine] = useState<string | null>(null);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [programId, setProgramId] = useState('p1');
    const [machinePage, setMachinePage] = useState(0);
    const [activeTab, setActiveTab] = useState<'queue' | 'processing'>('queue');
    const machinesPerPage = 2;

    const activeProgram = MASTER_DATA.STERILIZATION_PROGRAMS.find(p => p.id === programId) || MASTER_DATA.STERILIZATION_PROGRAMS[0];
    const [, setTick] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => setTick(t => t + 1), 1000);
        return () => clearInterval(timer);
    }, []);

    const { data: machines } = useQuery({ queryKey: ['machines'], queryFn: api.getMachines });
    const { data: inventory } = useQuery({ queryKey: ['inventory'], queryFn: api.getInventory });

    const sterilizers = machines?.filter(m => m.type === 'sterilizer') || [];

    // Items waiting to be put into machine
    const queueItems = inventory?.filter(item => item.status === 'ready_to_sterilize') || [];

    // Items currently inside machines
    const processingItems = inventory?.filter(item => item.status === 'sterilizing') || [];

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

    const isBowieDickValid = (m: typeof sterilizers[0]) => {
        if (!m.last_bowie_dick_date) return false;
        const today = new Date().toISOString().split('T')[0];
        return m.last_bowie_dick_date === today && m.bowie_dick_status === 'passed';
    };

    const toggleItem = (id: string) => {
        const newSelected = new Set(selectedItems);
        if (newSelected.has(id)) newSelected.delete(id);
        else newSelected.add(id);
        setSelectedItems(newSelected);
    };

    const startMutation = useMutation({
        mutationFn: async () => {
            if (!selectedMachine) return;
            const duration = activeProgram.duration;
            const itemsArray = Array.from(selectedItems);

            // Start Machine
            await api.updateMachineStatus(selectedMachine, 'running', {
                startTime: new Date().toISOString(),
                duration: duration
            });

            // Update items to 'sterilizing' and link to machine
            await api.startMachineBatch(selectedMachine, itemsArray);

            // Logs
            const logPromises = itemsArray.map(itemId =>
                api.addLog({
                    toolSetId: itemId,
                    action: 'Start Sterilization',
                    operatorId: user?.name || 'Operator',
                    machineId: selectedMachine,
                    notes: `Started ${activeProgram.name} cycle (${duration}m).`
                })
            );
            await Promise.all(logPromises);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['machines'] });
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
            setSelectedMachine(null);
            setSelectedItems(new Set());
            toast.success('Berhasil!', {
                description: 'Proses sterilisasi telah dimulai.',
            });
        },
        onError: (error: any) => {
            console.error('Sterilization Start Error:', error);
            toast.error('Gagal!', {
                description: `Gagal memulai sterilisasi: ${error.message || 'Unknown error'}`,
            });
        }
    });

    const finishMutation = useMutation({
        mutationFn: async (machineId: string) => {
            // Unload all items in this machine to 'stored'
            await api.finishMachineBatch(machineId);

            // Reset Machine
            await api.updateMachineStatus(machineId, 'idle');

            // Log entry (simplified for the whole machine)
            // In a real scenario, you might want individual logs for each item,
            // but for brevity we'll just log the action.
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['machines'] });
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
            toast.success('Selesai!', {
                description: 'Proses unload berhasil. Alat dipindahkan ke Penyimpanan.',
            });
        },
        onError: (error: any) => {
            console.error('Sterilization Finish Error:', error);
            toast.error('Gagal!', {
                description: `Gagal menyelesaikan sterilisasi: ${error.message || 'Unknown error'}`,
            });
        }
    });

    return (
        <div className="space-y-8">
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
                    <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Pilih Mesin Sterilisasi</h4>
                        {sterilizers.length > machinesPerPage && (
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 rounded-lg text-slate-400 hover:text-slate-900"
                                    onClick={() => setMachinePage(p => Math.max(0, p - 1))}
                                    disabled={machinePage === 0}
                                >
                                    <ChevronRight size={16} className="rotate-180" />
                                </Button>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    Page {machinePage + 1} / {Math.ceil(sterilizers.length / machinesPerPage)}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 rounded-lg text-slate-400 hover:text-slate-900"
                                    onClick={() => setMachinePage(p => Math.min(Math.ceil(sterilizers.length / machinesPerPage) - 1, p + 1))}
                                    disabled={machinePage >= Math.ceil(sterilizers.length / machinesPerPage) - 1}
                                >
                                    <ChevronRight size={16} />
                                </Button>
                            </div>
                        )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {sterilizers.slice(machinePage * machinesPerPage, (machinePage + 1) * machinesPerPage).map(machine => {
                            const isDone = isCycleComplete(machine);
                            return (
                                <Card
                                    key={machine.id}
                                    className={cn(
                                        "relative overflow-hidden cursor-pointer border-2 transition-all",
                                        selectedMachine === machine.id ? "border-accent-indigo bg-accent-indigo/[0.02]" : "border-transparent"
                                    )}
                                    onClick={() => {
                                        if (machine.status === 'idle') {
                                            if (isBowieDickValid(machine)) {
                                                setSelectedMachine(machine.id);
                                            } else {
                                                toast.error('Bowie Dick Belum Approved', {
                                                    description: 'Mesin harus dipastikan berfungsi (Bowie Dick) setiap hari.'
                                                });
                                            }
                                        }
                                    }}
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
                                            machine.status === 'idle' ? (isBowieDickValid(machine) ? "bg-accent-emerald/10 text-accent-emerald" : "bg-accent-amber/10 text-accent-amber") :
                                                machine.status === 'running' ? "bg-accent-indigo/10 text-accent-indigo" : "bg-accent-amber/10 text-accent-amber"
                                        )}>
                                            {machine.status === 'idle' ? (isBowieDickValid(machine) ? 'READY' : 'NOT READY') : machine.status}
                                        </div>
                                    </div>

                                    {machine.status === 'idle' && !isBowieDickValid(machine) && (
                                        <div className="mt-4 p-4 bg-accent-amber/5 border border-accent-amber/20 rounded-2xl space-y-3 shadow-inner">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-accent-amber/10 p-2 rounded-lg">
                                                    <AlertCircle size={14} className="text-accent-amber" />
                                                </div>
                                                <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest leading-relaxed">
                                                    Daily Test Diperlukan
                                                </p>
                                            </div>
                                            <p className="text-[10px] text-slate-400 italic">Validasi mesin harus dilakukan di menu Pre-sterilisasi sebelum memulai siklus pertama hari ini.</p>
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                className="w-full border-accent-amber/30 text-accent-amber hover:bg-accent-amber hover:text-white h-9 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate('/pre-sterilization');
                                                }}
                                            >
                                                Ke Menu Validasi
                                                <ChevronRight size={14} className="ml-1" />
                                            </Button>
                                        </div>
                                    )}

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
                                                    className="w-full mt-2 bg-accent-emerald hover:bg-emerald-600 text-white shadow-lg shadow-accent-emerald/20"
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
                                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Konfigurasi Siklus</h4>
                            </div>

                            <div className="p-4 bg-slate-800 rounded-2xl space-y-3">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-500">Alat Terpilih</span>
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

                    <Card className="p-0 overflow-hidden">
                        <div className="flex">
                            <button
                                className={cn(
                                    "flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all",
                                    activeTab === 'queue' ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-400 hover:text-slate-600"
                                )}
                                onClick={() => setActiveTab('queue')}
                            >
                                Menunggu ({queueItems.length})
                            </button>
                            <button
                                className={cn(
                                    "flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all",
                                    activeTab === 'processing' ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-400 hover:text-slate-600"
                                )}
                                onClick={() => setActiveTab('processing')}
                            >
                                Sedang Proses ({processingItems.length})
                            </button>
                        </div>

                        <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
                            {activeTab === 'queue' ? (
                                <>
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
                                        <div className="text-center py-8">
                                            <AlertCircle size={24} className="mx-auto text-slate-200 mb-2" />
                                            <p className="text-[10px] text-slate-400 italic">Belum ada alat siap steril.</p>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <>
                                    {processingItems.map(item => {
                                        const machine = sterilizers.find(m => m.id === item.machine_id);
                                        return (
                                            <div
                                                key={item.id}
                                                className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-white"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-accent-indigo/5 text-accent-indigo flex items-center justify-center shrink-0">
                                                    <Activity size={16} />
                                                </div>
                                                <div className="flex-1 overflow-hidden">
                                                    <p className="text-xs font-bold truncate">{item.name}</p>
                                                    <p className="text-[9px] text-slate-500 font-medium">
                                                        Di Mesin: <span className="text-accent-indigo font-bold">{machine?.name || '---'}</span>
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {processingItems.length === 0 && (
                                        <div className="text-center py-8">
                                            <Settings size={24} className="mx-auto text-slate-200 mb-2 animate-spin-slow" />
                                            <p className="text-[10px] text-slate-400 italic">Tidak ada proses berjalan.</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};
