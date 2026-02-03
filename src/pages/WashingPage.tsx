import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Waves, Play, Info, AlertTriangle, Monitor } from 'lucide-react';
import { cn } from '../utils/cn';

export const WashingPage = () => {
    const queryClient = useQueryClient();
    const [selectedMachine, setSelectedMachine] = useState<string | null>(null);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [program, setProgram] = useState<'standard' | 'heavy' | 'delicate'>('standard');

    // Force re-render for timer
    const [, setTick] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => setTick(t => t + 1), 1000); // 1 sec tick
        return () => clearInterval(timer);
    }, []);

    const { data: machines } = useQuery({ queryKey: ['machines'], queryFn: api.getMachines });
    const { data: inventory } = useQuery({ queryKey: ['inventory'], queryFn: api.getInventory });

    const washerMachines = machines?.filter(m => m.type === 'washer') || [];
    const dirtyItems = inventory?.filter(item => item.status === 'dirty') || [];

    const getRemainingTime = (m: typeof washerMachines[0]) => {
        if (m.status !== 'running' || !m.startTime || !m.duration) return null;
        const elapsed = new Date().getTime() - new Date(m.startTime).getTime();
        const totalDurationMs = m.duration * 60 * 1000;
        const remaining = totalDurationMs - elapsed;

        if (remaining <= 0) return '00:00';

        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const getProgress = (m: typeof washerMachines[0]) => {
        if (m.status !== 'running' || !m.startTime || !m.duration) return 0;
        const elapsed = new Date().getTime() - new Date(m.startTime).getTime();
        const totalDurationMs = m.duration * 60 * 1000;
        return Math.min(100, (elapsed / totalDurationMs) * 100);
    };

    const toggleItem = (id: string) => {
        const newSelected = new Set(selectedItems);
        if (newSelected.has(id)) newSelected.delete(id);
        else newSelected.add(id);
        setSelectedItems(newSelected);
    };

    const toggleAll = () => {
        if (selectedItems.size === dirtyItems.length) setSelectedItems(new Set());
        else setSelectedItems(new Set(dirtyItems.map(i => i.id)));
    };

    const startWashingMutation = useMutation({
        mutationFn: async () => {
            if (!selectedMachine) return;

            // 1. Update machine status to running
            await api.updateMachineStatus(selectedMachine, 'running');

            // 2. Update status of selected items
            await api.batchUpdateToolStatus(Array.from(selectedItems), 'washing');

            // 3. Log the action
            await api.addLog({
                toolSetId: Array.from(selectedItems)[0], // Link to first item for ref
                action: 'Start Washing',
                operatorId: 'system-admin',
                machineId: selectedMachine,
                notes: `Started ${program} cycle with ${selectedItems.size} items.`
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
            queryClient.invalidateQueries({ queryKey: ['machines'] });
            setSelectedMachine(null);
            setSelectedItems(new Set());
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
                                        machine.status === 'idle' ? "bg-accent-emerald/10 text-accent-emerald" :
                                            machine.status === 'running' ? "bg-accent-indigo/10 text-accent-indigo" : "bg-accent-amber/10 text-accent-amber"
                                    )}>
                                        {machine.status}
                                    </div>
                                </div>

                                {machine.status === 'running' && (
                                    <div className="mt-4 space-y-2">
                                        <div className="flex justify-between text-xs font-bold">
                                            <span className="text-slate-500">Processing...</span>
                                            <span className="font-mono text-accent-indigo">{getRemainingTime(machine)}</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-accent-indigo transition-all duration-1000 ease-linear"
                                                style={{ width: `${getProgress(machine)}%` }}
                                            />
                                        </div>
                                    </div>
                                )}

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
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Daftar Alat dalam Antrian</h4>
                            {selectedItems.size > 0 && (
                                <span className="text-xs font-bold text-accent-indigo bg-accent-indigo/10 px-2 py-1 rounded-lg">
                                    {selectedItems.size} Selected
                                </span>
                            )}
                        </div>
                        <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-[10px] uppercase tracking-widest font-black text-slate-500">
                                    <tr>
                                        <th className="px-6 py-4 w-10">
                                            <input
                                                type="checkbox"
                                                className="rounded border-slate-300 text-accent-indigo focus:ring-accent-indigo"
                                                checked={selectedItems.size === dirtyItems.length && dirtyItems.length > 0}
                                                onChange={toggleAll}
                                            />
                                        </th>
                                        <th className="px-6 py-4">Nama Alat / Set</th>
                                        <th className="px-6 py-4">Barcode</th>
                                        <th className="px-6 py-4">Unit Asal</th>
                                        <th className="px-6 py-4">Kondisi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {dirtyItems.map(item => (
                                        <tr key={item.id} className={cn("text-sm transition-colors", selectedItems.has(item.id) ? "bg-accent-indigo/[0.02]" : "hover:bg-slate-50")}>
                                            <td className="px-6 py-4">
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-slate-300 text-accent-indigo focus:ring-accent-indigo"
                                                    checked={selectedItems.has(item.id)}
                                                    onChange={() => toggleItem(item.id)}
                                                />
                                            </td>
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
                                            <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
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
                                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Washing Program</p>
                                <div className="grid grid-cols-3 gap-2">
                                    {(['standard', 'heavy', 'delicate'] as const).map(p => (
                                        <button
                                            key={p}
                                            onClick={() => setProgram(p)}
                                            className={cn(
                                                "py-2 rounded-lg text-[10px] font-bold uppercase transition-all border",
                                                program === p
                                                    ? "bg-accent-indigo border-accent-indigo text-white shadow-lg"
                                                    : "bg-transparent border-slate-700 text-slate-400 hover:border-slate-500"
                                            )}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3 pt-4 border-t border-slate-700">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-400">Item Dipilih</span>
                                    <span className="font-bold">{selectedItems.size} Items</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-400">Estimasi Waktu</span>
                                    <span className="font-bold">{program === 'heavy' ? '60' : program === 'delicate' ? '30' : '45'} Menit</span>
                                </div>
                            </div>

                            <Button
                                className="w-full h-14 bg-accent-indigo hover:bg-indigo-600 text-white border-none gap-2"
                                disabled={!selectedMachine || selectedItems.size === 0 || startWashingMutation.isPending}
                                onClick={() => selectedMachine && startWashingMutation.mutate()}
                            >
                                <Play size={20} fill="currentColor" />
                                {startWashingMutation.isPending ? 'Starting...' : 'Mulai Proses Cuci'}
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
