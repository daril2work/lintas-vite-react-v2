import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Settings, Thermometer, ShieldCheck, Zap, Timer, Activity, Box } from 'lucide-react';
import { cn } from '../utils/cn';

export const SterilizingPage = () => {
    const queryClient = useQueryClient();
    const [selectedMachine, setSelectedMachine] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);

    const { data: machines } = useQuery({
        queryKey: ['machines'],
        queryFn: api.getMachines,
    });

    const { data: inventory } = useQuery({
        queryKey: ['inventory'],
        queryFn: api.getInventory,
    });

    const sterilizers = machines?.filter(m => m.type === 'sterilizer') || [];
    const packedItems = inventory?.filter(item => item.status === 'packing') || [];

    const startSterilizingMutation = useMutation({
        mutationFn: async () => {
            setIsProcessing(true);
            // Simulate cycle progress
            for (let i = 0; i <= 100; i += 10) {
                setProgress(i);
                await new Promise(r => setTimeout(r, 400));
            }

            for (const item of packedItems) {
                await api.updateToolStatus(item.id, 'sterile');
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
            setIsProcessing(false);
            setProgress(0);
            setSelectedMachine(null);
        },
    });

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl text-slate-900">Sterilisasi</h1>
                    <p className="text-slate-500 mt-1">Proses akhir sterilisasi menggunakan Autoclave atau Plasma.</p>
                </div>
                <div className="flex gap-3">
                    <div className="bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-accent-emerald animate-pulse"></span>
                            <span className="text-sm font-bold text-slate-700">{packedItems.length} Menunggu Steril</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Pilih Mesin Sterilisasi</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {sterilizers.map(machine => (
                            <Card
                                key={machine.id}
                                className={cn(
                                    "relative overflow-hidden cursor-pointer border-2 transition-all",
                                    selectedMachine === machine.id ? "border-accent-indigo bg-accent-indigo/[0.02]" : "border-transparent",
                                    isProcessing && selectedMachine !== machine.id && "opacity-50 pointer-events-none"
                                )}
                                onClick={() => !isProcessing && machine.status === 'idle' && setSelectedMachine(machine.id)}
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
                                                Type: {machine.name.includes('Plasma') ? 'H2O2 Plasma' : 'Steam Autoclave'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className={cn(
                                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                                        machine.status === 'idle' ? "bg-accent-emerald/10 text-accent-emerald" : "bg-accent-amber/10 text-accent-amber"
                                    )}>
                                        {machine.status}
                                    </div>
                                </div>

                                {isProcessing && selectedMachine === machine.id && (
                                    <div className="mt-6 space-y-2">
                                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                                            <span className="text-accent-indigo italic animate-pulse">Processing Cycle...</span>
                                            <span>{progress}%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-accent-indigo transition-all duration-300"
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </Card>
                        ))}
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Parameter Real-time</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                                { label: 'Temperature', value: isProcessing ? '134.5°C' : '0.0°C', icon: Thermometer, color: 'text-rose-500' },
                                { label: 'Pressure', value: isProcessing ? '2.1 Bar' : '0.0 Bar', icon: Activity, color: 'text-indigo-500' },
                                { label: 'Duration', value: isProcessing ? '12:45' : '00:00', icon: Timer, color: 'text-amber-500' },
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
                                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Cycle Validation</h4>
                            </div>

                            <div className="p-4 bg-slate-800 rounded-2xl space-y-3">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-500">Items to Sterilize</span>
                                    <span className="font-bold text-accent-emerald">{packedItems.length} SET</span>
                                </div>
                                <div className="h-px bg-slate-700"></div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-500">Method</span>
                                    <span className="font-bold">Steam 134°C</span>
                                </div>
                            </div>

                            <Button
                                className={cn(
                                    "w-full h-14 bg-accent-emerald hover:bg-emerald-600 text-white border-none gap-2 text-lg",
                                    isProcessing && "opacity-80"
                                )}
                                disabled={!selectedMachine || packedItems.length === 0 || isProcessing}
                                onClick={() => selectedMachine && startSterilizingMutation.mutate()}
                            >
                                {isProcessing ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Sterilizing...
                                    </>
                                ) : (
                                    <>
                                        <ShieldCheck size={20} />
                                        Mulai Sterilisasi
                                    </>
                                )}
                            </Button>
                        </div>
                    </Card>

                    <Card>
                        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Daftar Muatan</h4>
                        <div className="space-y-3">
                            {packedItems.map(item => (
                                <div key={item.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-400">
                                        <Box size={16} />
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="text-xs font-bold truncate">{item.name}</p>
                                        <p className="text-[10px] text-slate-400 font-mono italic">#{item.barcode}</p>
                                    </div>
                                </div>
                            ))}
                            {packedItems.length === 0 && (
                                <p className="text-center py-4 text-xs text-slate-400 italic">Antrian kosong.</p>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};
