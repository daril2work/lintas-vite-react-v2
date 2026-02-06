import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Box, ClipboardCheck, CheckCircle2, Search, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const WardReceivePage = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const { data: departments = [] } = useQuery({
        queryKey: ['departments'],
        queryFn: api.getDepartments,
    });

    const [selectedRoom, setSelectedRoom] = useState('');
    const [search, setSearch] = useState('');

    // Set initial department
    useEffect(() => {
        if (departments.length > 0 && !selectedRoom) {
            setSelectedRoom(departments[0]);
        }
    }, [departments, selectedRoom]);

    const { data: inventory, isLoading } = useQuery({
        queryKey: ['inventory'],
        queryFn: api.getInventory,
    });

    const receiveMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.addLog({
                toolSetId: id,
                action: `Diterima di ${selectedRoom}`,
                operatorId: user?.name || 'RoomUser',
                notes: 'Alat diterima dalam kondisi steril dan kemasan utuh.'
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
        },
    });

    const pendingArrivals = inventory?.filter(item =>
        item.status === 'distributed' &&
        (item.name.toLowerCase().includes(search.toLowerCase()) || item.barcode.includes(search))
    ) || [];

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl text-slate-900">Terima Distribusi</h1>
                    <p className="text-slate-500 mt-1">Konfirmasi penerimaan alat steril dari CSSD ke ruangan Anda.</p>
                </div>
                <div className="bg-white px-6 py-3 rounded-2xl shadow-soft border border-slate-100 flex items-center gap-4">
                    <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Ruangan:</span>
                    <select
                        value={selectedRoom}
                        onChange={(e) => setSelectedRoom(e.target.value)}
                        className="text-sm font-bold text-accent-emerald bg-transparent focus:outline-none"
                    >
                        {departments.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>
            </div>

            <Card className="p-0 overflow-hidden border-none shadow-soft">
                <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Cari alat steril yang dikirim..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-white rounded-xl border-none shadow-inner text-sm focus:ring-2 focus:ring-accent-emerald/20 transition-all font-medium"
                        />
                    </div>
                </div>

                <div className="divide-y divide-slate-100 bg-white">
                    {isLoading ? (
                        [1, 2, 3].map(i => <div key={i} className="p-8 animate-pulse bg-slate-50/50" />)
                    ) : pendingArrivals.length > 0 ? (
                        pendingArrivals.map(item => (
                            <div key={item.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-all">
                                <div className="flex items-center gap-6">
                                    <div className="w-14 h-14 rounded-2xl bg-accent-emerald/10 text-accent-emerald flex items-center justify-center">
                                        <Box size={28} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <h4 className="font-bold text-slate-900">{item.name}</h4>
                                            <span className="px-2 py-0.5 rounded-lg bg-accent-emerald text-white text-[8px] font-black uppercase tracking-widest">Sterile</span>
                                        </div>
                                        <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                            <span>#{item.barcode}</span>
                                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                                            <span>Cat: {item.category}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Button
                                        variant="secondary"
                                        className="border-accent-emerald/30 text-accent-emerald hover:bg-accent-emerald hover:text-white gap-2 h-11"
                                        onClick={() => receiveMutation.mutate(item.id)}
                                        disabled={receiveMutation.isPending}
                                    >
                                        <ClipboardCheck size={18} />
                                        Konfirmasi Terima
                                    </Button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-20 text-center space-y-4">
                            <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mx-auto text-slate-200">
                                <AlertCircle size={40} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900">Tidak Ada Kiriman Pending</h3>
                                <p className="text-sm text-slate-500">Semua alat steril untuk ruangan ini sudah diterima.</p>
                            </div>
                        </div>
                    )}
                </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-accent-emerald/5 border-accent-emerald/10 p-6 flex flex-col items-center text-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-accent-emerald/20 text-accent-emerald flex items-center justify-center">
                        <CheckCircle2 size={24} />
                    </div>
                    <div>
                        <h4 className="text-2xl font-black text-slate-900">{pendingArrivals.length}</h4>
                        <p className="text-[10px] uppercase font-black text-slate-500 tracking-tighter">Dalam Perjalanan</p>
                    </div>
                </Card>
                {/* Placeholder cards for stats */}
            </div>
        </div>
    );
};
