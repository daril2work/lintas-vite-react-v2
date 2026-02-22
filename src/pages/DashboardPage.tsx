import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { Card } from '../components/ui/Card';
import {
    PackageSearch,
    Waves,
    Box,
    Settings,
    Truck,
    TrendingUp,
    Activity,
    ArrowRight,
    ChevronLeft,
    ChevronRight,
    Info,
    TriangleAlert
} from 'lucide-react';
import { cn } from '../utils/cn';
import { Button } from '../components/ui/Button';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import type { Machine } from '../types';

const MachineTimer = ({ machine }: { machine: Machine }) => {
    const [progress, setProgress] = useState(0);
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        if (machine.status !== 'running') {
            setProgress(0);
            setTimeLeft('');
            return;
        }

        // Defensive: if machine is running but no start time data yet
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

export const DashboardPage = () => {
    const queryClient = useQueryClient();

    // Machine pagination & filter state
    const [machineStatusFilter, setMachineStatusFilter] = useState<'all' | 'idle' | 'running'>('all');
    const [selectedRoomFilter, setSelectedRoomFilter] = useState<string>('all');
    const [machinePage, setMachinePage] = useState(1);
    const machinesPerPage = 4;

    // IMPORTANT MESSAGES SLIDER STATE
    const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
    const { data: inventory } = useQuery({
        queryKey: ['inventory'],
        queryFn: api.getInventory,
    });

    const { data: machines } = useQuery({
        queryKey: ['machines'],
        queryFn: api.getMachines,
        refetchInterval: 5000, // Sync with server every 5 seconds
    });

    const finishMachineMutation = useMutation({
        mutationFn: async (machineId: string) => {
            await api.updateMachineStatus(machineId, 'idle');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['machines'] });
            toast.success('Mesin dikembalikan ke status Idle');
        }
    });

    const { data: requests } = useQuery({
        queryKey: ['requests'],
        queryFn: api.getRequests,
    });

    const { data: staffList } = useQuery({
        queryKey: ['staff'],
        queryFn: api.getStaff,
    });

    const { data: efficiency } = useQuery({
        queryKey: ['efficiency'],
        queryFn: api.getEfficiency,
        refetchInterval: 30000, // Sync every 30s
    });

    const { data: messages } = useQuery({
        queryKey: ['messages'],
        queryFn: api.getImportantMessages,
        refetchInterval: 60000, // Sync every 1m
    });

    const { data: rooms } = useQuery({
        queryKey: ['rooms'],
        queryFn: api.getRooms,
    });

    // Auto-slide logic for messages
    useEffect(() => {
        if (!messages || messages.length === 0) return;
        const interval = setInterval(() => {
            setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
        }, 5000); // Change slides every 5 seconds
        return () => clearInterval(interval);
    }, [messages]);

    const stats = [
        { label: 'Penerimaan', count: inventory?.filter(i => i.status === 'dirty' && (selectedRoomFilter === 'all' || i.room_id === selectedRoomFilter)).length || 0, icon: PackageSearch, color: 'text-accent-rose', bg: 'bg-accent-rose/10', path: '/intake' },
        { label: 'Pencucian', count: inventory?.filter(i => i.status === 'washing' && (selectedRoomFilter === 'all' || i.room_id === selectedRoomFilter)).length || 0, icon: Waves, color: 'text-accent-amber', bg: 'bg-accent-amber/10', path: '/washing' },
        { label: 'Pengepakan', count: inventory?.filter(i => i.status === 'packing' && (selectedRoomFilter === 'all' || i.room_id === selectedRoomFilter)).length || 0, icon: Box, color: 'text-accent-indigo', bg: 'bg-accent-indigo/10', path: '/packing' },
        { label: 'Sterilisasi', count: inventory?.filter(i => (i.status === 'ready_to_sterilize' || i.status === 'sterilizing') && (selectedRoomFilter === 'all' || i.room_id === selectedRoomFilter)).length || 0, icon: Settings, color: 'text-indigo-400', bg: 'bg-indigo-400/10', path: '/sterilizing' },
        { label: 'Siap Kirim', count: inventory?.filter(i => i.status === 'sterile' && (selectedRoomFilter === 'all' || i.room_id === selectedRoomFilter)).length || 0, icon: Truck, color: 'text-accent-emerald', bg: 'bg-accent-emerald/10', path: '/distribution' },
        { label: 'Di Ruangan', count: inventory?.filter(i => i.status === 'in_use' && (selectedRoomFilter === 'all' || i.room_id === selectedRoomFilter)).length || 0, icon: Activity, color: 'text-slate-600', bg: 'bg-slate-100', path: '/ward/receive' },
    ];

    // Machine filtering and pagination
    const filteredMachines = (machines || []).filter(m => {
        if (machineStatusFilter === 'all') return true;
        return m.status === machineStatusFilter;
    });

    const totalMachinePages = Math.ceil(filteredMachines.length / machinesPerPage);
    const paginatedMachines = filteredMachines.slice(
        (machinePage - 1) * machinesPerPage,
        machinePage * machinesPerPage
    );

    const machineStatusCounts = {
        all: machines?.length || 0,
        idle: machines?.filter(m => m.status === 'idle').length || 0,
        running: machines?.filter(m => m.status === 'running').length || 0,
    };

    const handleMachineFilterChange = (filter: 'all' | 'idle' | 'running') => {
        setMachineStatusFilter(filter);
        setMachinePage(1); // Reset to first page
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl text-slate-900 font-black">Dashboard Utama</h1>
                    <p className="text-slate-500 mt-1">Pantau status alat medis dan antrian mesin secara real-time.</p>
                </div>
                <div className="flex gap-3">
                    <div className="bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-r border-slate-100 pr-3">Filter Ruangan</span>
                        <select
                            value={selectedRoomFilter}
                            onChange={(e) => setSelectedRoomFilter(e.target.value)}
                            className="text-xs font-black text-slate-900 bg-transparent focus:outline-none"
                        >
                            <option value="all">SEMUA RUANGAN</option>
                            {rooms?.map(r => <option key={r.id} value={r.id}>{r.name.toUpperCase()}</option>)}
                        </select>
                    </div>
                    <div className="bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent-emerald/10 text-accent-emerald flex items-center justify-center">
                            <TrendingUp size={16} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Efficiency</p>
                            <p className="text-sm font-black text-slate-900">{efficiency || 0}%</p>
                        </div>
                    </div>
                </div>
            </div>

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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Status Mesin Terkini</h4>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleMachineFilterChange('all')}
                                    className={cn(
                                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all",
                                        machineStatusFilter === 'all'
                                            ? "bg-slate-900 text-white"
                                            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                    )}
                                >
                                    Semua ({machineStatusCounts.all})
                                </button>
                                <button
                                    onClick={() => handleMachineFilterChange('idle')}
                                    className={cn(
                                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all",
                                        machineStatusFilter === 'idle'
                                            ? "bg-slate-900 text-white"
                                            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                    )}
                                >
                                    Idle ({machineStatusCounts.idle})
                                </button>
                                <button
                                    onClick={() => handleMachineFilterChange('running')}
                                    className={cn(
                                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all",
                                        machineStatusFilter === 'running'
                                            ? "bg-accent-indigo text-white"
                                            : "bg-accent-indigo/10 text-accent-indigo hover:bg-accent-indigo/20"
                                    )}
                                >
                                    Running ({machineStatusCounts.running})
                                </button>
                            </div>
                        </div>
                        {totalMachinePages > 1 && (
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setMachinePage(p => Math.max(1, p - 1))}
                                    disabled={machinePage === 1}
                                    className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                >
                                    <ChevronLeft size={16} className="text-slate-600" />
                                </button>
                                <span className="text-xs font-black text-slate-600">
                                    {machinePage} / {totalMachinePages}
                                </span>
                                <button
                                    onClick={() => setMachinePage(p => Math.min(totalMachinePages, p + 1))}
                                    disabled={machinePage === totalMachinePages}
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
                                        onClick={() => finishMachineMutation.mutate(machine.id)}
                                        isLoading={finishMachineMutation.isPending}
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

                    <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Permintaan Alat (Antrian Ruangan)</h4>
                    <Card className="p-0 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                    <tr>
                                        <th className="px-6 py-4">Prioritas</th>
                                        <th className="px-6 py-4">Unit</th>
                                        <th className="px-6 py-4">Item</th>
                                        <th className="px-6 py-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 text-slate-900">
                                    {(requests || []).slice(0, 5).map((req) => (
                                        <tr key={req.id} className="text-sm">
                                            <td className="px-6 py-4">
                                                <span className={cn(
                                                    "px-2 py-0.5 rounded-md text-[10px] font-black uppercase",
                                                    req.priority === 'urgent' ? "bg-accent-rose/10 text-accent-rose" : "bg-slate-100 text-slate-500"
                                                )}>
                                                    {req.priority}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-bold capitalize">{req.ward}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {req.items?.map((it, idx) => (
                                                        <span key={idx} className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">{it.name}</span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 uppercase font-black text-[10px]">
                                                {req.status}
                                            </td>
                                        </tr>
                                    ))}
                                    {(!requests || requests.length === 0) && (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-8 text-center text-slate-400 italic text-sm">Tidak ada antrian permintaan.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="bg-primary text-white border-none shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
                        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6">Pesan Penting</h4>
                        <div className="space-y-4">
                            {(messages || []).length === 0 ? (
                                <p className="text-[10px] text-slate-400 italic">Tidak ada pesan baru.</p>
                            ) : (
                                <div className="space-y-4">
                                    {messages && messages.length > 0 && (
                                        <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-4 transition-all duration-500 ease-in-out">
                                            <div className="flex gap-4">
                                                {messages[currentMessageIndex].type === 'warning' && <TriangleAlert className="text-accent-amber shrink-0" size={20} />}
                                                {messages[currentMessageIndex].type === 'alert' && <TriangleAlert className="text-accent-rose shrink-0" size={20} />}
                                                {messages[currentMessageIndex].type === 'info' && <Info className="text-accent-indigo shrink-0" size={20} />}
                                                <div>
                                                    <p className="text-xs font-bold mb-1">{messages[currentMessageIndex].title}</p>
                                                    <p className="text-[10px] text-slate-400 leading-relaxed min-h-[40px]">{messages[currentMessageIndex].message}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Navigation Dots */}
                                    <div className="flex justify-center gap-1.5 pt-2">
                                        {(messages || []).map((_, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setCurrentMessageIndex(idx)}
                                                className={cn(
                                                    "w-1.5 h-1.5 rounded-full transition-all",
                                                    currentMessageIndex === idx ? "bg-accent-indigo w-3" : "bg-slate-700 hover:bg-slate-600"
                                                )}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>

                    <Card>
                        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6">Staff Terdaftar</h4>
                        <div className="space-y-4">
                            {(staffList || []).slice(0, 5).map(staff => (
                                <div key={staff.id} className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 uppercase font-black text-xs">
                                        {staff.name.charAt(0)}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-black text-slate-900">{staff.name}</p>
                                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{staff.role} • {staff.department}</p>
                                    </div>
                                    <div className="w-2 h-2 rounded-full bg-accent-emerald"></div>
                                </div>
                            ))}
                        </div>
                        <a href="/admin">
                            <Button variant="secondary" className="w-full mt-6 text-xs uppercase tracking-widest h-10">Manajemen Staff</Button>
                        </a>
                    </Card>
                </div>
            </div>
        </div>
    );
};

