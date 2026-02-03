import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Truck, UserCheck, MapPin, ClipboardList, PenTool } from 'lucide-react';
import { cn } from '../utils/cn';

export const DistributionPage = () => {
    const queryClient = useQueryClient();
    const [selectedItem, setSelectedItem] = useState<string | null>(null);
    const [showSignature, setShowSignature] = useState(false);

    const { data: inventory } = useQuery({
        queryKey: ['inventory'],
        queryFn: api.getInventory,
    });

    const sterileItems = inventory?.filter(item => item.status === 'sterile') || [];

    const distributeMutation = useMutation({
        mutationFn: (id: string) => api.updateToolStatus(id, 'distributed'),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
            setSelectedItem(null);
            setShowSignature(false);
        },
    });

    const selectedTool = inventory?.find(item => item.id === selectedItem);

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl text-slate-900">Distribusi Alat</h1>
                    <p className="text-slate-500 mt-1">Serah terima alat steril ke unit pelayanan.</p>
                </div>
                <div className="bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-900 animate-pulse"></span>
                        <span className="text-sm font-bold text-slate-700">{sterileItems.length} Siap Kirim</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Daftar Alat Steril</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {sterileItems.map(item => (
                            <Card
                                key={item.id}
                                className={cn(
                                    "hover:border-slate-900 cursor-pointer transition-all border-2",
                                    selectedItem === item.id ? "border-slate-900 bg-slate-50" : "border-transparent"
                                )}
                                onClick={() => setSelectedItem(item.id)}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-accent-emerald/10 text-accent-emerald flex items-center justify-center shrink-0">
                                        <Truck size={24} />
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="font-bold text-slate-900 truncate">{item.name}</p>
                                        <p className="text-xs text-slate-500 uppercase font-mono tracking-wider">{item.barcode}</p>
                                        <div className="mt-3 flex items-center gap-2">
                                            <span className="px-2 py-0.5 bg-slate-100 text-[10px] font-black rounded uppercase">Exp: 03-05-2026</span>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                        {sterileItems.length === 0 && (
                            <div className="col-span-full text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200">
                                <p className="text-slate-400">Tidak ada alat steril yang siap didistribusikan.</p>
                            </div>
                        )}
                    </div>

                    {selectedTool && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Tujuan Pengiriman</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    { name: 'Instalasi Bedah Sentral', floor: 'Lantai 3', icon: MapPin },
                                    { name: 'IGD / Trauma Center', floor: 'Lantai 1', icon: MapPin },
                                ].map(unit => (
                                    <Card key={unit.name} className="hover:border-accent-indigo cursor-pointer group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:text-accent-indigo">
                                                <unit.icon size={20} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">{unit.name}</p>
                                                <p className="text-[10px] text-slate-500 uppercase font-bold">{unit.floor}</p>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <Card className="bg-white shadow-xl">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                            <ClipboardList size={16} />
                            Handover Form
                        </h4>

                        <div className="space-y-6">
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 block">Penerima (Staff Unit)</label>
                                <select className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-4 focus:ring-slate-900/5 transition-all">
                                    <option>Pilih Staff...</option>
                                    <option>Ns. Sarah (IBS)</option>
                                    <option>Ns. Ahmad (IGD)</option>
                                </select>
                            </div>

                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Item summary</p>
                                <p className="text-sm font-black text-slate-900">{selectedItem ? selectedTool?.name : '-- Belum Dipilih --'}</p>
                                <p className="text-[10px] text-slate-500 mt-1">Status: Sterile & Ready</p>
                            </div>

                            {!showSignature ? (
                                <Button
                                    className="w-full h-14 bg-slate-900 text-white gap-2"
                                    disabled={!selectedItem}
                                    onClick={() => setShowSignature(true)}
                                >
                                    <UserCheck size={20} />
                                    Siapkan Tanda Tangan
                                </Button>
                            ) : (
                                <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">Digital Signature</label>
                                    <div className="aspect-video bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center text-slate-300 relative group overflow-hidden">
                                        <PenTool size={32} className="group-hover:scale-110 transition-transform" />
                                        <span className="text-[10px] mt-2 font-bold uppercase">Sign Here</span>
                                        {/* Simulate drawing with a simple overlay if clicked */}
                                        <div className="absolute inset-0 bg-white/20 opacity-0 active:opacity-100 transition-opacity flex items-center justify-center cursor-crosshair">
                                            <span className="text-slate-900 font-serif italic text-2xl">Accepted</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="sm" onClick={() => setShowSignature(false)} className="flex-1">Batal</Button>
                                        <Button
                                            size="sm"
                                            className="bg-accent-emerald text-white flex-1"
                                            onClick={() => distributeMutation.mutate(selectedItem!)}
                                            disabled={distributeMutation.isPending}
                                        >
                                            Konfirmasi & Kirim
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>

                    <Card className="bg-slate-900 text-white border-none overflow-hidden relative">
                        <div className="absolute left-0 bottom-0 w-full h-1 bg-accent-amber opacity-50"></div>
                        <div className="flex items-center gap-3 mb-4">
                            <Truck className="text-accent-amber" />
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Tracking Info</h4>
                        </div>
                        <p className="text-xs leading-relaxed text-slate-300">
                            Logistik CSSD akan mencatat waktu serah terima secara otomatis. Pastikan unit tujuan sudah sesuai dengan permintaan di Dashboard.
                        </p>
                    </Card>
                </div>
            </div>
        </div>
    );
};
