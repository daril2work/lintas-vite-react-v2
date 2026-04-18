import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { cn } from '../utils/cn';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { 
    X, 
    ClipboardCheck, 
    Package, 
    Crosshair, 
    ChevronRight, 
    AlertCircle, 
    CheckCircle2,
    XCircle,
    Settings,
    Thermometer,
    ShieldCheck,
    Zap,
    Timer,
    Activity,
    Printer,
    Table,
    Plus,
    Trash2,
    UploadCloud,
    FileText
} from 'lucide-react';
import { MASTER_DATA } from '../services/api';
import type { SterilizationProcessLog } from '../types';
import { Modal } from '../components/ui/Modal';
import { handlePrintPlasma, handlePrintSteam } from '../utils/printHelpers';

export const SterilizingPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [selectedMachine, setSelectedMachine] = useState<string | null>(null);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [programId, setProgramId] = useState('p1');
    const [machinePage, setMachinePage] = useState(0);
    const [activeTab, setActiveTab] = useState<'queue' | 'processing'>('queue');
    const [isPlasmaModalOpen, setIsPlasmaModalOpen] = useState(false);
    const [isSteamModalOpen, setIsSteamModalOpen] = useState(false);
    const [isFinishModalOpen, setIsFinishModalOpen] = useState(false);
    const [pendingMachineId, setPendingMachineId] = useState<string | null>(null);
    const [proofFile, setProofFile] = useState<File | null>(null);
    const [plasmaFormData, setPlasmaFormData] = useState({
        shift: 'Pagi',
        packaging_type: 'Kontainer',
        process_status: 'Cito',
        load_number: '',
        temperature: 45,
        cycles: 1,
        jam_start: '',
        waktu_steril: '',
        waktu_end_steril: '',
        lama_steril: 15,
        lama_proses: 35,
        notes: ''
    });
    const [steamFormData, setSteamFormData] = useState({
        shift: 'Pagi',
        packaging_type: 'Kontainer',
        process_status: 'Cito',
        load_number: '',
        program_temp: '134',
        cycles: 1,
        jam_start: '',
        waktu_steril: '',
        waktu_end_steril: '',
        lama_steril: 15,
        lama_proses: 35,
        notes: ''
    });
    const [finishData, setFinishData] = useState({
        indicator_internal: 'Lolos',
        indicator_external: 'Lolos',
        indicator_biological_control: 'Positif',
        indicator_biological_test: 'Negatif',
        indicator_chemical_class_4: 'Lolos',
        indicator_chemical_class_5: 'Lolos',
        result: 'passed' as 'passed' | 'failed'
    });
    const machinesPerPage = 2;

    const activeProgram = MASTER_DATA.STERILIZATION_PROGRAMS.find(p => p.id === programId) || MASTER_DATA.STERILIZATION_PROGRAMS[0];
    const [, setTick] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => setTick(t => t + 1), 1000);
        return () => clearInterval(timer);
    }, []);

    const { data: machines } = useQuery({ queryKey: ['machines'], queryFn: api.getMachines });
    const { data: inventory } = useQuery({ queryKey: ['inventory'], queryFn: api.getInventory });

    const sterilizers = machines?.filter(m => m.type === 'sterilizer' || m.type === 'plasma') || [];

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

    const isCycleComplete = (m: typeof sterilizers[0] | undefined) => {
        if (!m || m.status !== 'running' || !m.startTime || !m.duration) return false;
        const elapsed = new Date().getTime() - new Date(m.startTime).getTime();
        return elapsed >= m.duration * 60 * 1000;
    };

    const isBowieDickValid = (m: typeof sterilizers[0]) => {
        if (!m.lastBowieDickDate) return false;
        const today = new Date().toISOString().split('T')[0];
        return m.lastBowieDickDate === today && m.bowieDickStatus === 'passed';
    };

    const toggleItem = (id: string) => {
        const newSelected = new Set(selectedItems);
        if (newSelected.has(id)) newSelected.delete(id);
        else newSelected.add(id);
        setSelectedItems(newSelected);
    };

    const startMutation = useMutation({
        mutationFn: async (plasmaData?: any) => {
            if (!selectedMachine) return;
            const machine = sterilizers.find(m => m.id === selectedMachine);
            const duration = activeProgram.duration;
            const itemsArray = Array.from(selectedItems);

            // 1. If Plasma, create process log first
            if (machine?.type === 'plasma' && plasmaData) {
                const instrumentList = queueItems
                    .filter(item => selectedItems.has(item.id))
                    .map(item => ({
                        name: item.name,
                        origin: item.room_id || 'CSSD',
                        qty: 1,
                        weight: 0
                    }));

                await api.createProcessLog({
                    machineId: selectedMachine,
                    operator_name: user?.name || 'Operator',
                    ...plasmaData,
                    instrument_list: instrumentList,
                    result: 'pending'
                });
            }

            // 2. Start Machine
            await api.updateMachineStatus(selectedMachine, 'running', {
                startTime: new Date().toISOString(),
                duration: duration
            });

            // 3. Update items to 'sterilizing' and link to machine
            await api.startMachineBatch(selectedMachine, itemsArray);

            // 4. Logs
            const logPromises = itemsArray.map(itemId =>
                api.addLog({
                    toolSetId: itemId,
                    action: 'Start Sterilization',
                    operatorId: user?.name || 'Operator',
                    machineId: selectedMachine,
                    notes: `${machine?.type === 'plasma' ? 'Plasma' : 'Steam'} ${activeProgram.name} cycle (${duration}m).`
                })
            );
            await Promise.all(logPromises);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['machines'] });
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
            setSelectedMachine(null);
            setSelectedItems(new Set());
            setIsPlasmaModalOpen(false);
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
        mutationFn: async ({ machineId, plasmaResults, pFile }: { machineId: string, plasmaResults?: any, pFile?: File | null }) => {
            const machine = sterilizers.find(m => m.id === machineId);

            // 1. If Plasma, update the latest process log with results and file
            if (machine?.type === 'plasma' && plasmaResults) {
                const latestLog = await api.getProcessLogByMachine(machineId);
                if (latestLog) {
                    await api.updateProcessLogResults(latestLog.id, plasmaResults, pFile);
                }
            }

            // 2. Unload all items in this machine to 'stored'
            await api.finishMachineBatch(machineId);

            // 3. Reset Machine
            await api.updateMachineStatus(machineId, 'idle');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['machines'] });
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
            setIsFinishModalOpen(false);
            setPendingMachineId(null);
            setProofFile(null);
            toast.success('Selesai!', {
                description: 'Mesin kembali Idle dan alat telah dipindahkan ke Penyimpanan.',
            });
        },
        onError: (error: any) => {
            console.error('Sterilization Finish Error:', error);
            toast.error('Gagal!', {
                description: `Gagal menyelesaikan sterilisasi: ${error.message || 'Unknown error'}`,
            });
        }
    });

    const finishIndividualMutation = useMutation({
        mutationFn: (toolId: string) => api.finishIndividualTool(toolId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
            queryClient.invalidateQueries({ queryKey: ['machines'] });
            toast.success('Alat dipindahkan ke Penyimpanan');
        },
        onError: (error: any) => {
            console.error('Individual finish error:', error);
            toast.error('Gagal memindahkan alat');
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
                                                        if (machine.type === 'plasma' || machine.type === 'sterilizer') {
                                                            setPendingMachineId(machine.id);
                                                            setIsFinishModalOpen(true);
                                                        } else {
                                                            finishMutation.mutate({ machineId: machine.id });
                                                        }
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
                                    (!selectedMachine || selectedItems.size === 0) && "opacity-50 cursor-not-allowed"
                                )}
                                disabled={!selectedMachine || selectedItems.size === 0 || startMutation.isPending}
                                onClick={() => {
                                    const machine = sterilizers.find(m => m.id === selectedMachine);
                                    if (machine?.type === 'plasma') {
                                        setIsPlasmaModalOpen(true);
                                    } else if (machine?.type === 'sterilizer') {
                                        setIsSteamModalOpen(true);
                                    } else {
                                        startMutation.mutate(undefined);
                                    }
                                }}
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
                                                <div className="flex flex-col items-end gap-2 shrink-0">
                                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-accent-amber/10 text-accent-amber rounded-full">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-accent-amber animate-pulse" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest">Sterilizing</span>
                                                    </div>
                                                    {(!machine || isCycleComplete(machine as any)) && (
                                                        <Button
                                                            size="sm"
                                                            variant="secondary"
                                                            className="h-8 text-[10px] font-bold uppercase tracking-tight gap-1.5 border-accent-emerald text-accent-emerald hover:bg-accent-emerald/5"
                                                            disabled={finishIndividualMutation.isPending}
                                                            onClick={() => finishIndividualMutation.mutate(item.id)}
                                                        >
                                                            <CheckCircle2 size={12} />
                                                            Selesai & Unload
                                                        </Button>
                                                    )}
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

            {/* Steam Process Modal */}
            <Modal
                isOpen={isSteamModalOpen}
                onClose={() => setIsSteamModalOpen(false)}
                className="max-w-4xl max-h-[90vh] overflow-y-auto"
            >
                <div className="p-8 space-y-8">
                    <div className="flex items-center justify-between border-b pb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-accent-amber/10 rounded-2xl flex items-center justify-center text-accent-amber shadow-sm">
                                <ClipboardCheck size={28} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-slate-900 leading-tight">Formulir Proses Sterilisasi STEAM</h2>
                                <p className="text-xs text-slate-400 font-medium uppercase tracking-widest mt-0.5">Pendataan Load Steam (RS MENUR)</p>
                            </div>
                        </div>
                        <button onClick={() => setIsSteamModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 border-b-2 border-slate-100 pb-2">Identitas & Pengemasan</h3>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Shift</label>
                                    <select className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-sm" value={steamFormData.shift} onChange={e => setSteamFormData({...steamFormData, shift: e.target.value})}>
                                        <option value="Pagi">Pagi</option>
                                        <option value="Siang">Siang</option>
                                        <option value="Malam">Malam</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Nomor Load</label>
                                    <input type="text" className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-sm" placeholder="L-..." value={steamFormData.load_number} onChange={e => setSteamFormData({...steamFormData, load_number: e.target.value})} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Program Steril (°C)</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['121', '134'].map(temp => (
                                        <button
                                            key={temp}
                                            className={cn(
                                                "p-3 rounded-xl border-2 text-sm font-black transition-all",
                                                steamFormData.program_temp === temp ? "bg-accent-amber text-white border-accent-amber" : "bg-white border-slate-100 text-slate-400"
                                            )}
                                            onClick={() => setSteamFormData({...steamFormData, program_temp: temp})}
                                        >
                                            {temp}°C
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Proses Pengemasan</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['Kontainer', 'Pouches', 'Wrapping'].map(type => (
                                        <button
                                            key={type}
                                            className={cn(
                                                "p-3 rounded-xl border-2 text-[10px] font-black uppercase transition-all",
                                                steamFormData.packaging_type === type ? "bg-accent-amber text-white border-accent-amber" : "bg-white border-slate-100 text-slate-400"
                                            )}
                                            onClick={() => setSteamFormData({...steamFormData, packaging_type: type})}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Status Proses</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['Cito', 'Implant'].map(type => (
                                        <button
                                            key={type}
                                            className={cn(
                                                "p-3 rounded-xl border-2 text-[10px] font-black uppercase transition-all",
                                                steamFormData.process_status === type ? "bg-accent-amber text-white border-accent-amber" : "bg-white border-slate-100 text-slate-400"
                                            )}
                                            onClick={() => setSteamFormData({...steamFormData, process_status: type})}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 border-b-2 border-slate-100 pb-2">Parameter Waktu</h3>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Jam Start</label>
                                    <input type="time" className="w-full p-2 rounded-xl border" value={steamFormData.jam_start} onChange={e => setSteamFormData({...steamFormData, jam_start: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Waktu Steril</label>
                                    <input type="time" className="w-full p-2 rounded-xl border" value={steamFormData.waktu_steril} onChange={e => setSteamFormData({...steamFormData, waktu_steril: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Waktu End</label>
                                    <input type="time" className="w-full p-2 rounded-xl border" value={steamFormData.waktu_end_steril} onChange={e => setSteamFormData({...steamFormData, waktu_end_steril: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Siklus</label>
                                    <input type="number" className="w-full p-2 rounded-xl border" value={steamFormData.cycles} onChange={e => setSteamFormData({...steamFormData, cycles: parseInt(e.target.value)})} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Lama Steril (mnt)</label>
                                    <input type="number" className="w-full p-2 rounded-xl border" value={steamFormData.lama_steril} onChange={e => setSteamFormData({...steamFormData, lama_steril: parseInt(e.target.value)})} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Lama Proses (mnt)</label>
                                    <input type="number" className="w-full p-2 rounded-xl border" value={steamFormData.lama_proses} onChange={e => setSteamFormData({...steamFormData, lama_proses: parseInt(e.target.value)})} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Kendala / Catatan</label>
                                <textarea className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs" rows={3} placeholder="Masukkan kendala jika ada..." value={steamFormData.notes} onChange={e => setSteamFormData({...steamFormData, notes: e.target.value})} />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 border-b-2 border-slate-100 pb-2 flex items-center gap-2">
                            <Table size={16} /> Daftar Instrumen
                        </h3>
                        <div className="rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50 font-black uppercase tracking-widest text-[9px] text-slate-400">
                                    <tr>
                                        <th className="px-6 py-3">Nama Instrumen</th>
                                        <th className="px-6 py-3">Asal Barang</th>
                                        <th className="px-6 py-3">Jml</th>
                                        <th className="px-6 py-3">Berat</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {queueItems.filter(item => selectedItems.has(item.id)).map(item => (
                                        <tr key={item.id}>
                                            <td className="px-6 py-4 font-bold text-slate-700">{item.name}</td>
                                            <td className="px-6 py-4 text-slate-500 italic">{item.room_id || 'CSSD'}</td>
                                            <td className="px-6 py-4 font-black">1</td>
                                            <td className="px-6 py-4 text-slate-400">---</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4 border-t">
                        <button className="flex-1 h-14 rounded-2xl border-2 font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all" onClick={() => setIsSteamModalOpen(false)}>BATAL</button>
                        <button 
                            className="flex-[2] h-14 bg-accent-amber hover:bg-amber-600 text-white rounded-2xl shadow-xl shadow-amber-100 text-lg font-black tracking-tight flex items-center justify-center gap-3 transition-all"
                            onClick={() => startMutation.mutate(steamFormData)}
                            disabled={startMutation.isPending}
                        >
                            <Zap size={20} /> SIMPAN & MULAI STEAM
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Plasma Process Modal */}
            <Modal
                isOpen={isPlasmaModalOpen}
                onClose={() => setIsPlasmaModalOpen(false)}
                className="max-w-4xl max-h-[90vh] overflow-y-auto"
            >
                <div className="p-8 space-y-8">
                    <div className="flex items-center justify-between border-b pb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-accent-indigo/10 rounded-2xl flex items-center justify-center text-accent-indigo shadow-sm">
                                <ClipboardCheck size={28} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-slate-900 leading-tight">Formulir Proses Sterilisasi Plasma</h2>
                                <p className="text-xs text-slate-400 font-medium uppercase tracking-widest mt-0.5">Pendataan Load Per-Siklus</p>
                            </div>
                        </div>
                        <button onClick={() => setIsPlasmaModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 border-b-2 border-slate-100 pb-2">Identitas & Pengemasan</h3>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Shift</label>
                                    <select className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-sm" value={plasmaFormData.shift} onChange={e => setPlasmaFormData({...plasmaFormData, shift: e.target.value})}>
                                        <option value="Pagi">Pagi</option>
                                        <option value="Siang">Siang</option>
                                        <option value="Malam">Malam</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Nomor Load</label>
                                    <input type="text" className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-sm" placeholder="Contoh: L001" value={plasmaFormData.load_number} onChange={e => setPlasmaFormData({...plasmaFormData, load_number: e.target.value})} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Proses Pengemasan</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['Kontainer', 'Pouches', 'Wrapping'].map(type => (
                                        <button
                                            key={type}
                                            className={cn(
                                                "p-3 rounded-xl border-2 text-[10px] font-black uppercase transition-all",
                                                plasmaFormData.packaging_type === type ? "bg-accent-indigo text-white border-accent-indigo" : "bg-white border-slate-100 text-slate-400"
                                            )}
                                            onClick={() => setPlasmaFormData({...plasmaFormData, packaging_type: type})}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Status Proses</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['Cito', 'Implant'].map(type => (
                                        <button
                                            key={type}
                                            className={cn(
                                                "p-3 rounded-xl border-2 text-[10px] font-black uppercase transition-all",
                                                plasmaFormData.process_status === type ? "bg-accent-indigo text-white border-accent-indigo" : "bg-white border-slate-100 text-slate-400"
                                            )}
                                            onClick={() => setPlasmaFormData({...plasmaFormData, process_status: type})}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 border-b-2 border-slate-100 pb-2">Parameter Teknis</h3>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Suhu (°C)</label>
                                    <input type="number" className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-sm" value={plasmaFormData.temperature} onChange={e => setPlasmaFormData({...plasmaFormData, temperature: parseInt(e.target.value)})} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Siklus</label>
                                    <input type="number" className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-sm" value={plasmaFormData.cycles} onChange={e => setPlasmaFormData({...plasmaFormData, cycles: parseInt(e.target.value)})} />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Jam Start</label>
                                    <input type="time" className="w-full p-2 rounded-xl border" value={plasmaFormData.jam_start} onChange={e => setPlasmaFormData({...plasmaFormData, jam_start: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Waktu Steril</label>
                                    <input type="time" className="w-full p-2 rounded-xl border" value={plasmaFormData.waktu_steril} onChange={e => setPlasmaFormData({...plasmaFormData, waktu_steril: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Waktu End</label>
                                    <input type="time" className="w-full p-2 rounded-xl border" value={plasmaFormData.waktu_end_steril} onChange={e => setPlasmaFormData({...plasmaFormData, waktu_end_steril: e.target.value})} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Kendala / Catatan</label>
                                <textarea className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs" rows={3} placeholder="Masukkan kendala jika ada..." value={plasmaFormData.notes} onChange={e => setPlasmaFormData({...plasmaFormData, notes: e.target.value})} />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 border-b-2 border-slate-100 pb-2 flex items-center gap-2">
                            <Table size={16} /> Daftar Instrumen
                        </h3>
                        <div className="rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50 font-black uppercase tracking-widest text-[9px] text-slate-400">
                                    <tr>
                                        <th className="px-6 py-3">Nama Instrumen</th>
                                        <th className="px-6 py-3">Asal Barang</th>
                                        <th className="px-6 py-3">Jml</th>
                                        <th className="px-6 py-3">Berat</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {queueItems.filter(item => selectedItems.has(item.id)).map(item => (
                                        <tr key={item.id}>
                                            <td className="px-6 py-4 font-bold text-slate-700">{item.name}</td>
                                            <td className="px-6 py-4 text-slate-500 italic">{item.room_id || 'CSSD'}</td>
                                            <td className="px-6 py-4 font-black">1</td>
                                            <td className="px-6 py-4 text-slate-400">---</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4 border-t">
                        <Button variant="secondary" className="flex-1 h-14 rounded-2xl" onClick={() => setIsPlasmaModalOpen(false)}>BATAL</Button>
                        <Button 
                            className="flex-[2] h-14 bg-accent-indigo hover:bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-100 text-lg font-black tracking-tight flex items-center justify-center gap-3"
                            onClick={() => startMutation.mutate(plasmaFormData)}
                            disabled={startMutation.isPending}
                        >
                            <Zap size={20} /> SIMPAN & MULAI PROSES
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Finish Plasma Modal (Results) */}
            <Modal
                isOpen={isFinishModalOpen}
                onClose={() => setIsFinishModalOpen(false)}
                className="max-w-xl"
            >
                <div className="p-8 space-y-8">
                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className="w-20 h-20 bg-accent-emerald/10 rounded-full flex items-center justify-center text-accent-emerald mb-2">
                            <ShieldCheck size={40} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900">Siklus Plasma Selesai</h2>
                            <p className="text-slate-500 text-sm mt-1">Silakan masukkan hasil indikator sebelum unload mesin.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        {sterilizers.find(m => m.id === pendingMachineId)?.type === 'plasma' ? (
                            <>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Indikator Internal</label>
                                    <select className="w-full p-3 rounded-xl border-2 font-bold text-sm" value={finishData.indicator_internal} onChange={e => setFinishData({...finishData, indicator_internal: e.target.value})}>
                                        <option value="Lolos">Lolos</option>
                                        <option value="Tidak">Tidak</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Indikator Eksternal</label>
                                    <select className="w-full p-3 rounded-xl border-2 font-bold text-sm" value={finishData.indicator_external} onChange={e => setFinishData({...finishData, indicator_external: e.target.value})}>
                                        <option value="Lolos">Lolos</option>
                                        <option value="Tidak">Tidak</option>
                                    </select>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Ind Kimia Eksternal</label>
                                    <select className="w-full p-3 rounded-xl border-2 font-bold text-sm" value={finishData.indicator_external} onChange={e => setFinishData({...finishData, indicator_external: e.target.value})}>
                                        <option value="Lolos">Lolos</option>
                                        <option value="Tidak">Tidak</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Ind Kimia Kelas 4</label>
                                    <select className="w-full p-3 rounded-xl border-2 font-bold text-sm" value={finishData.indicator_chemical_class_4} onChange={e => setFinishData({...finishData, indicator_chemical_class_4: e.target.value})}>
                                        <option value="Lolos">Lolos</option>
                                        <option value="Tidak">Tidak</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Ind Kimia Kelas 5</label>
                                    <select className="w-full p-3 rounded-xl border-2 font-bold text-sm" value={finishData.indicator_chemical_class_5} onChange={e => setFinishData({...finishData, indicator_chemical_class_5: e.target.value})}>
                                        <option value="Lolos">Lolos</option>
                                        <option value="Tidak">Tidak</option>
                                    </select>
                                </div>
                                <div className="hidden"></div> {/* Grid spacer */}
                            </>
                        )}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Biologi: Kontrol</label>
                            <select className="w-full p-3 rounded-xl border-2 font-bold text-sm" value={finishData.indicator_biological_control} onChange={e => setFinishData({...finishData, indicator_biological_control: e.target.value})}>
                                <option value="Positif">Positif (+)</option>
                                <option value="Negatif">Negatif (-)</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Biologi: Uji</label>
                            <select className="w-full p-3 rounded-xl border-2 font-bold text-sm" value={finishData.indicator_biological_test} onChange={e => setFinishData({...finishData, indicator_biological_test: e.target.value})}>
                                <option value="Negatif">Negatif (-)</option>
                                <option value="Positif">Positif (+)</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2 pt-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Hasil Akhir Siklus</label>
                        <div className="grid grid-cols-2 gap-4">
                            <button 
                                className={cn(
                                    "p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all",
                                    finishData.result === 'passed' ? "bg-emerald-50 border-accent-emerald text-accent-emerald" : "bg-white border-slate-100 text-slate-300"
                                )}
                                onClick={() => setFinishData({...finishData, result: 'passed'})}
                            >
                                <CheckCircle2 size={24} />
                                <span className="font-black text-xs uppercase tracking-widest">NORMAL / PASSED</span>
                            </button>
                            <button 
                                className={cn(
                                    "p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all",
                                    finishData.result === 'failed' ? "bg-rose-50 border-rose-500 text-rose-500" : "bg-white border-slate-100 text-slate-300"
                                )}
                                onClick={() => setFinishData({...finishData, result: 'failed'})}
                            >
                                <XCircle size={24} />
                                <span className="font-black text-xs uppercase tracking-widest">ERROR / FAILED</span>
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Upload Form Fisik / Foto Indikator</label>
                        {!proofFile ? (
                            <div className="w-full relative group">
                                <input 
                                    type="file" 
                                    accept="image/jpeg,image/png,application/pdf"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        if (file.size > 500 * 1024) {
                                            toast.error('Ukuran file terlalu besar', { description: 'Maksimal ukuran file adalah 500 KB' });
                                            return;
                                        }
                                        setProofFile(file);
                                    }}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                <div className="flex flex-col items-center justify-center w-full min-h-[100px] p-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 group-hover:border-accent-indigo group-hover:bg-accent-indigo/5 transition-all">
                                    <UploadCloud className="w-6 h-6 text-slate-400 group-hover:text-accent-indigo mb-1 transition-colors" />
                                    <p className="text-[10px] font-bold text-slate-600">Klik atau Drag bukti ke sini</p>
                                    <p className="text-[9px] text-slate-400 mt-0.5 uppercase tracking-wider font-medium">Max 500 KB (JPG, PNG, PDF)</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between p-3 rounded-xl border-2 border-accent-indigo/20 bg-accent-indigo/5 transition-all">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="p-1.5 bg-white rounded-lg shadow-sm">
                                        <FileText className="w-5 h-5 text-accent-indigo" />
                                    </div>
                                    <div className="truncate">
                                        <p className="text-[10px] font-bold text-slate-700 truncate">{proofFile.name}</p>
                                        <p className="text-[9px] text-slate-500 font-medium">{(proofFile.size / 1024).toFixed(1)} KB</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setProofFile(null)}
                                    className="p-1.5 hover:bg-white rounded-full transition-colors text-slate-400 hover:text-rose-500 flex-shrink-0"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-4 pt-4 border-t">
                        <Button variant="secondary" className="flex-1 h-12 rounded-xl" onClick={() => setIsFinishModalOpen(false)}>BATAL</Button>
                        <Button 
                            className="bg-accent-indigo hover:bg-indigo-600 text-white flex-[2] h-12 rounded-xl font-black uppercase tracking-widest gap-2"
                            onClick={async () => {
                                await finishMutation.mutateAsync({ 
                                    machineId: pendingMachineId!, 
                                    plasmaResults: finishData,
                                    pFile: proofFile
                                });
                                
                                // Automatic Print choice after success
                                const machine = sterilizers.find(m => m.id === pendingMachineId);
                                if (machine?.type === 'plasma') {
                                    handlePrintPlasma(machine, plasmaFormData, finishData, queueItems, selectedItems, user);
                                } else {
                                    handlePrintSteam(machine, steamFormData, finishData, queueItems, selectedItems, user);
                                }
                            }}
                            disabled={finishMutation.isPending}
                        >
                            {finishMutation.isPending ? 'Processing...' : 'Simpan & Cetak Bukti'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
