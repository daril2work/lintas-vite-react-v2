import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import {
    PackageSearch,
    Waves,
    Box,
    Settings,
    Truck,
    TrendingUp,
    Activity,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { StatsOverview } from '../components/dashboard/StatsOverview';
import { MachineStatusGrid } from '../components/dashboard/MachineStatusGrid';
import { RequestQueueTable } from '../components/dashboard/RequestQueueTable';
import { MessageSlider } from '../components/dashboard/MessageSlider';
import { StaffList } from '../components/dashboard/StaffList';

export const DashboardPage = () => {
    const queryClient = useQueryClient();

    // Filters
    const [machineStatusFilter, setMachineStatusFilter] = useState<'all' | 'idle' | 'running'>('all');
    const [selectedRoomFilter, setSelectedRoomFilter] = useState<string>('all');

    // Queries
    const { data: inventory } = useQuery({ queryKey: ['inventory'], queryFn: api.getInventory });
    const { data: machines } = useQuery({ queryKey: ['machines'], queryFn: api.getMachines, refetchInterval: 5000 });
    const { data: requests } = useQuery({ queryKey: ['requests'], queryFn: api.getRequests });
    const { data: staffList } = useQuery({ queryKey: ['staff'], queryFn: api.getStaff });
    const { data: efficiency } = useQuery({ queryKey: ['efficiency'], queryFn: api.getEfficiency, refetchInterval: 30000 });
    const { data: messages } = useQuery({ queryKey: ['messages'], queryFn: api.getImportantMessages, refetchInterval: 60000 });
    const { data: rooms } = useQuery({ queryKey: ['rooms'], queryFn: api.getRooms });

    const finishMachineMutation = useMutation({
        mutationFn: async (machineId: string) => {
            await api.updateMachineStatus(machineId, 'idle');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['machines'] });
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
            toast.success('Selesai!', { description: 'Proses unload berhasil.' });
        },
    });

    const stats = [
        { label: 'Penerimaan', count: inventory?.filter(i => i.status === 'dirty' && (selectedRoomFilter === 'all' || i.room_id === selectedRoomFilter)).length || 0, icon: PackageSearch, color: 'text-accent-rose', bg: 'bg-accent-rose/10', path: '/intake' },
        { label: 'Pencucian', count: inventory?.filter(i => i.status === 'washing' && (selectedRoomFilter === 'all' || i.room_id === selectedRoomFilter)).length || 0, icon: Waves, color: 'text-accent-amber', bg: 'bg-accent-amber/10', path: '/washing' },
        { label: 'Pengepakan', count: inventory?.filter(i => i.status === 'packing' && (selectedRoomFilter === 'all' || i.room_id === selectedRoomFilter)).length || 0, icon: Box, color: 'text-accent-indigo', bg: 'bg-accent-indigo/10', path: '/packing' },
        { label: 'Sterilisasi', count: inventory?.filter(i => (i.status === 'ready_to_sterilize' || i.status === 'sterilizing') && (selectedRoomFilter === 'all' || i.room_id === selectedRoomFilter)).length || 0, icon: Settings, color: 'text-indigo-400', bg: 'bg-indigo-400/10', path: '/sterilizing' },
        { label: 'Siap Kirim', count: inventory?.filter(i => i.status === 'sterile' && (selectedRoomFilter === 'all' || i.room_id === selectedRoomFilter)).length || 0, icon: Truck, color: 'text-accent-emerald', bg: 'bg-accent-emerald/10', path: '/distribution' },
        { label: 'Di Ruangan', count: inventory?.filter(i => i.status === 'in_use' && (selectedRoomFilter === 'all' || i.room_id === selectedRoomFilter)).length || 0, icon: Activity, color: 'text-slate-600', bg: 'bg-slate-100', path: '/ward/receive' },
    ];

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

            <StatsOverview stats={stats} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <MachineStatusGrid
                        machines={machines || []}
                        statusFilter={machineStatusFilter}
                        onStatusFilterChange={setMachineStatusFilter}
                        onFinishMachine={(id) => finishMachineMutation.mutate(id)}
                        isFinishing={finishMachineMutation.isPending}
                    />
                    <RequestQueueTable requests={requests || []} />
                </div>

                <div className="space-y-6">
                    <MessageSlider messages={messages || []} />
                    <StaffList staff={staffList || []} />
                </div>
            </div>
        </div>
    );
};

