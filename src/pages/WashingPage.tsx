import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Waves, Play, Info, AlertTriangle, Monitor } from 'lucide-react';
import { cn } from '../utils/cn';

export const WashingPage = () => {
    const queryClient = useQueryClient();
    const [selectedMachine, setSelectedMachine] = useState<string | null>(null);

    const { data: machines } = useQuery({
        queryKey: ['machines'],
        queryFn: api.getMachines,
    });

    const { data: inventory } = useQuery({
        queryKey: ['inventory'],
        queryFn: api.getInventory,
    });

    const washerMachines = machines?.filter(m => m.type === 'washer') || [];
    const dirtyItems = inventory?.filter(item => item.status === 'dirty') || [];

    const startWashingMutation = useMutation({
        mutationFn: async () => {
            // In a real app, we'd create a batch and link dirty items to it.
            // For now, we update all dirty items to 'washing'.
            for (const item of dirtyItems) {
                await api.updateToolStatus(item.id, 'washing');
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
            setSelectedMachine(null);
        },
    });

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl text-slate-900">Pencucian Alat</h1>
                    <p className="text-slate-500 mt-1">Kelola mesin pencuci dan proses dekontaminasi.</p>
                </div>
                <div className="bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-accent-rose animate-pulse"></span>
                        <span className="text-sm font-bold text-slate-700">{dirtyItems.length} Alat Antri</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Pilih Mesin Pencuci</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {washerMachines.map(machine => (
                            <Card
                                key={machine.id}
                                className={cn(
                                    "relative overflow-hidden group cursor-pointer border-2 transition-all",
                                    selectedMachine === machine.id ? "border-accent-indigo bg-accent-indigo/[0.02]" : "border-transparent"
                                )}
                                onClick={() => machine.status === 'idle' && setSelectedMachine(machine.id)}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="space-y-3">
                                        <div className={cn(
                                            "w-12 h-12 rounded-2xl flex items-center justify-center",
                                            machine.status === 'idle' ? "bg-accent-emerald/10 text-accent-emerald" : "bg-accent-amber/10 text-accent-amber"
                                        )}>
                                            <Waves size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black">{machine.name}</h3>
                                            <p className="text-xs text-slate-400 uppercase tracking-widest">Model: WM-2024-X</p>
                                        </div>
                                    </div>
                                    <div className={cn(
                                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                                        machine.status === 'idle' ? "bg-accent-emerald/10 text-accent-emerald" : "bg-accent-amber/10 text-accent-amber"
                                    )}>
                                        {machine.status}
                                    </div>
                                </div>

                                <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <Info size={14} />
                                        <span>Siklus terakhir: 10:30</span>
                                    </div>
                                    {machine.status === 'idle' && (
                                        <div className={cn(
                                            "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                                            selectedMachine === machine.id ? "bg-accent-indigo border-accent-indigo text-white" : "border-slate-200"
                                        )}>
                                            {selectedMachine === machine.id && <CheckCircle2 size={14} />}
                                        </div>
                                    )}
                                </div>
                            </Card>
                        ))}
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Daftar Alat dalam Antrian</h4>
                        <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-[10px] uppercase tracking-widest font-black text-slate-500">
                                    <tr>
                                        <th className="px-6 py-4">Nama Alat / Set</th>
                                        <th className="px-6 py-4">Barcode</th>
                                        <th className="px-6 py-4">Unit Asal</th>
                                        <th className="px-6 py-4">Kondisi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {dirtyItems.map(item => (
                                        <tr key={item.id} className="text-sm">
                                            <td className="px-6 py-4 font-bold text-slate-900">{item.name}</td>
                                            <td className="px-6 py-4 font-mono text-xs text-slate-500">{item.barcode}</td>
                                            <td className="px-6 py-4 text-slate-600">Bedah Sentral</td>
                                            <td className="px-6 py-4">
                                                <span className="flex items-center gap-1.5 text-accent-rose font-bold">
                                                    <AlertTriangle size={14} />
                                                    Kotor
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {dirtyItems.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                                                Tidak ada antrian alat kotor.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <Card className="bg-primary text-white border-none shadow-2xl">
                        <div className="flex items-center gap-3 mb-6">
                            <Monitor className="text-accent-indigo" />
                            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Control Panel</h4>
                        </div>

                        <div className="space-y-6">
                            <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700">
                                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-1">Selected Machine</p>
                                <p className="text-lg font-black">{selectedMachine ? washerMachines.find(m => m.id === selectedMachine)?.name : 'Tidak ada'}</p>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-400">Total untuk dicuci</span>
                                    <span className="font-bold">{dirtyItems.length} Items</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-400">Estimasi Waktu</span>
                                    <span className="font-bold">45 Menit</span>
                                </div>
                            </div>

                            <Button
                                className="w-full h-14 bg-accent-indigo hover:bg-indigo-600 text-white border-none gap-2"
                                disabled={!selectedMachine || dirtyItems.length === 0 || startWashingMutation.isPending}
                                onClick={() => selectedMachine && startWashingMutation.mutate()}
                            >
                                <Play size={20} fill="currentColor" />
                                Mulai Proses Cuci
                            </Button>
                        </div>
                    </Card>

                    <Card>
                        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">SOP Pencucian</h4>
                        <ul className="space-y-3">
                            {[
                                'Pastikan alat sudah dibersihkan dari sisa organik.',
                                'Tata alat di tray tanpa menumpuk.',
                                'Cek level deterjen dan desinfektan.',
                                'Pilih program sesuai material alat.'
                            ].map((step, i) => (
                                <li key={i} className="flex gap-3 text-xs text-slate-600">
                                    <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[10px] shrink-0">{i + 1}</span>
                                    {step}
                                </li>
                            ))}
                        </ul>
                    </Card>
                </div>
            </div>
        </div>
    );
};

const CheckCircle2 = ({ className, size }: { className?: string, size?: number }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size || 24}
        height={size || 24}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M20 6 9 17l-5-5" />
    </svg>
);
