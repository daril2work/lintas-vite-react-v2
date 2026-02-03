import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Box, Printer, CheckSquare, ListChecks, QrCode, Info } from 'lucide-react';
import { cn } from '../utils/cn';

export const PackingPage = () => {
    const queryClient = useQueryClient();
    const [selectedItem, setSelectedItem] = useState<string | null>(null);

    const { data: inventory } = useQuery({
        queryKey: ['inventory'],
        queryFn: api.getInventory,
    });

    const washingItems = inventory?.filter(item => item.status === 'washing') || [];

    const finishPackingMutation = useMutation({
        mutationFn: (id: string) => api.updateToolStatus(id, 'packing'),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
            setSelectedItem(null);
        },
    });

    const selectedTool = inventory?.find(item => item.id === selectedItem);

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl text-slate-900">Pengepakan Alat</h1>
                    <p className="text-slate-500 mt-1">Perakitan set instrumen dan pencetakan label indikator.</p>
                </div>
                <div className="bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-accent-indigo animate-pulse"></span>
                        <span className="text-sm font-bold text-slate-700">{washingItems.length} Siap Pack</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Pilih Item dari Pencucian</h4>
                    <div className="grid grid-cols-1 gap-4">
                        {washingItems.length > 0 ? washingItems.map(item => (
                            <Card
                                key={item.id}
                                className={cn(
                                    "hover:border-accent-indigo cursor-pointer transition-all border-2",
                                    selectedItem === item.id ? "border-accent-indigo" : "border-transparent"
                                )}
                                onClick={() => setSelectedItem(item.id)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                                            <Box size={24} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900">{item.name}</p>
                                            <p className="text-xs text-slate-500 uppercase font-mono tracking-wider">{item.barcode} • {item.category}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="px-3 py-1 bg-accent-indigo/10 text-accent-indigo rounded-full text-[10px] font-black uppercase tracking-widest">
                                            SELESAI CUCI
                                        </span>
                                        <div className={cn(
                                            "w-6 h-6 rounded-full border-2 flex items-center justify-center",
                                            selectedItem === item.id ? "bg-accent-indigo border-accent-indigo text-white" : "border-slate-200"
                                        )}>
                                            {selectedItem === item.id && <CheckSquare size={14} />}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        )) : (
                            <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200">
                                <p className="text-slate-400">Belum ada alat yang selesai dicuci.</p>
                            </div>
                        )}
                    </div>

                    {selectedTool && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Daftar Isi Set (Checklist)</h4>
                            <Card className="p-0 overflow-hidden">
                                <div className="bg-slate-50 px-8 py-4 border-b border-slate-100 flex justify-between items-center">
                                    <span className="text-sm font-black uppercase tracking-tighter">{selectedTool.name}</span>
                                    <span className="text-[10px] font-bold text-slate-500">ISI: 12 INSTRUMEN</span>
                                </div>
                                <div className="p-8 space-y-4">
                                    {[
                                        'Gunting Jaringan (2)',
                                        'Pinset Chirugis (1)',
                                        'Pinset Anatomis (1)',
                                        'Klem Arteri (4)',
                                        'Nald Voerder (2)',
                                        'Handle Scalpel (2)'
                                    ].map((inst, i) => (
                                        <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                                            <div className="flex items-center gap-3">
                                                <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-accent-indigo focus:ring-accent-indigo" />
                                                <span className="text-sm text-slate-700">{inst}</span>
                                            </div>
                                            <span className="text-[10px] font-bold bg-slate-100 px-2 py-0.5 rounded uppercase">Verified</span>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <Card className="bg-white border-2 border-accent-indigo shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-accent-indigo/5 rounded-full -mr-16 -mt-16"></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-accent-indigo/10 flex items-center justify-center text-accent-indigo">
                                    <QrCode size={20} />
                                </div>
                                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">Label Preview</h4>
                            </div>

                            <div className="aspect-[3/2] bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 p-6 flex flex-col justify-between mb-8">
                                <div>
                                    <p className="text-[10px] font-black uppercase text-slate-400 mb-1">SET NAME</p>
                                    <p className="text-lg font-black tracking-tight">{selectedTool?.name || '---'}</p>
                                </div>
                                <div className="flex justify-between items-end">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-slate-400">DATE PACKED</p>
                                        <p className="text-xs font-black">03-02-2026</p>
                                        <p className="text-[10px] font-bold text-slate-400 mt-2">EXPIRE (3 MO)</p>
                                        <p className="text-xs font-black">03-05-2026</p>
                                    </div>
                                    <div className="w-16 h-16 bg-white border border-slate-200 rounded-lg flex items-center justify-center">
                                        <QrCode size={40} className="text-slate-800" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Button
                                    variant="secondary"
                                    className="w-full h-12 gap-2 border-slate-200"
                                    disabled={!selectedItem}
                                >
                                    <Printer size={18} />
                                    Print Label Saja
                                </Button>
                                <Button
                                    className="w-full h-14 gap-2 shadow-lg"
                                    disabled={!selectedItem || finishPackingMutation.isPending}
                                    onClick={() => selectedItem && finishPackingMutation.mutate(selectedItem)}
                                >
                                    <ListChecks size={20} />
                                    Simpan & Selesai Pack
                                </Button>
                            </div>
                        </div>
                    </Card>

                    <Card className="bg-accent-amber/5 border-accent-amber/20">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-accent-amber mb-3 flex items-center gap-2">
                            <Info size={14} />
                            Security Check
                        </h4>
                        <p className="text-[10px] leading-relaxed text-slate-600">
                            Pastikan indikator internal/eksternal sudah disisipkan sebelum packing ditutup. Tanda tangan digital operator akan dicatat dalam history alat.
                        </p>
                    </Card>
                </div>
            </div>
        </div>
    );
};
