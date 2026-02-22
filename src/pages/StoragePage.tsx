import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import {
    Box,
    CheckCircle2,
    ClipboardCheck,
    ShieldCheck,
    Droplets,
    Eye,
    AlertCircle,
    UserCircle,
    RotateCcw,
    Search
} from 'lucide-react';
import { cn } from '../utils/cn';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

export const StoragePage = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [selectedItem, setSelectedItem] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Validation Checklist State
    const [checklist, setChecklist] = useState({
        sealIntegrity: false,
        noHumidity: false,
        indicatorPassed: false,
        packagingIntact: false
    });

    const { data: inventory } = useQuery({
        queryKey: ['inventory'],
        queryFn: api.getInventory
    });

    // Items waiting for validation in storage
    const storedItems = inventory?.filter(item =>
        item.status === 'stored' &&
        (item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.barcode.toLowerCase().includes(searchTerm.toLowerCase()))
    ) || [];

    const validateMutation = useMutation({
        mutationFn: async ({ id, result, notes }: { id: string, result: 'approve' | 'reject', notes: string }) => {
            if (result === 'approve') {
                // Move to sterile (Ready for Distribution)
                await api.updateToolStatus(id, 'sterile');
                await api.addLog({
                    toolSetId: id,
                    action: 'Storage Validation Approved',
                    operatorId: user?.name || 'Operator',
                    notes: `Physical validation passed. Checklist: Seal=${checklist.sealIntegrity}, Dry=${checklist.noHumidity}, Indicator=${checklist.indicatorPassed}, Pack=${checklist.packagingIntact}. ${notes}`
                });
            } else {
                // Reject back to Packing
                await api.updateToolStatus(id, 'packing');
                await api.addLog({
                    toolSetId: id,
                    action: 'Storage Validation Rejected',
                    operatorId: user?.name || 'Operator',
                    notes: `Validation failed. Sent back to Packing. Reason: ${notes}`
                });
            }
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
            setSelectedItem(null);
            setChecklist({
                sealIntegrity: false,
                noHumidity: false,
                indicatorPassed: false,
                packagingIntact: false
            });
            toast.success(variables.result === 'approve' ? 'Validasi Disetujui' : 'Barang Direject', {
                description: variables.result === 'approve'
                    ? 'Alat sekarang siap didistribusikan.'
                    : 'Alat dikirim kembali ke bagian Packing.',
            });
        },
        onError: (error: any) => {
            toast.error('Gagal!', {
                description: `Gagal memproses validasi: ${error.message}`,
            });
        }
    });

    const isChecklistComplete = Object.values(checklist).every(v => v === true);
    const selectedTool = inventory?.find(i => i.id === selectedItem);

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl text-slate-900">Penyimpanan & Validasi</h1>
                    <p className="text-slate-500 mt-1">Validasi kelayakan fisik alat sebelum didistribusikan ke unit.</p>
                </div>
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-accent-indigo transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Cari barcode atau nama alat..."
                        className="pl-11 pr-6 py-3 bg-white border border-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-accent-indigo/5 focus:border-accent-indigo transition-all w-full md:w-80 shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Stored Items List */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Barang Menunggu Validasi ({storedItems.length})</h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {storedItems.map(item => (
                            <Card
                                key={item.id}
                                className={cn(
                                    "cursor-pointer border-2 transition-all hover:border-accent-indigo",
                                    selectedItem === item.id ? "border-accent-indigo bg-accent-indigo/[0.02]" : "border-transparent"
                                )}
                                onClick={() => setSelectedItem(item.id)}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-accent-amber/10 text-accent-amber flex items-center justify-center shrink-0">
                                        <Box size={24} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-slate-900 truncate">{item.name}</h3>
                                        <p className="text-xs text-slate-400 font-mono tracking-wider">{item.barcode}</p>
                                        <div className="mt-3 flex items-center gap-2">
                                            <span className="px-2 py-0.5 bg-slate-100 text-[10px] font-black rounded uppercase text-slate-500">
                                                Stored: {new Date().toLocaleDateString('id-ID')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}

                        {storedItems.length === 0 && (
                            <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                                <Box size={48} className="mx-auto text-slate-100 mb-4" />
                                <p className="text-slate-400 font-medium">Tidak ada barang yang menunggu di penyimpanan.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Validation Form */}
                <div className="space-y-6">
                    <Card className="sticky top-8">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                            <ClipboardCheck size={16} />
                            Checklist Kelayakan
                        </h4>

                        {!selectedItem ? (
                            <div className="py-12 text-center">
                                <AlertCircle size={32} className="mx-auto text-slate-200 mb-3" />
                                <p className="text-sm text-slate-400 italic px-6">Pilih alat dari daftar untuk memulai proses validasi fisik.</p>
                            </div>
                        ) : (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                {/* Selected Tool Info */}
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm text-accent-indigo">
                                            <UserCircle size={18} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">Operator</p>
                                            <p className="text-xs font-black text-slate-900">{user?.name || 'Operator CSSD'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Checklist Items */}
                                <div className="space-y-3">
                                    {[
                                        { id: 'sealIntegrity', label: 'Integritas Segel Baik', icon: ShieldCheck },
                                        { id: 'noHumidity', label: 'Tidak Ada Kelembapan (Kering)', icon: Droplets },
                                        { id: 'indicatorPassed', label: 'Indikator Steril Berubah Warna', icon: Eye },
                                        { id: 'packagingIntact', label: 'Kemasan Tidak Robek/Rusak', icon: CheckCircle2 },
                                    ].map(check => (
                                        <button
                                            key={check.id}
                                            className={cn(
                                                "w-full p-4 rounded-xl border flex items-center justify-between transition-all group",
                                                checklist[check.id as keyof typeof checklist]
                                                    ? "bg-accent-emerald/5 border-accent-emerald text-accent-emerald shadow-sm shadow-accent-emerald/5"
                                                    : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                                            )}
                                            onClick={() => setChecklist(prev => ({ ...prev, [check.id]: !prev[check.id as keyof typeof checklist] }))}
                                        >
                                            <div className="flex items-center gap-3">
                                                <check.icon size={18} className={cn(
                                                    "transition-transform group-active:scale-90",
                                                    checklist[check.id as keyof typeof checklist] ? "text-accent-emerald" : "text-slate-300"
                                                )} />
                                                <span className="text-xs font-bold">{check.label}</span>
                                            </div>
                                            {checklist[check.id as keyof typeof checklist] && <CheckCircle2 size={16} fill="currentColor" className="text-white bg-accent-emerald rounded-full" />}
                                        </button>
                                    ))}
                                </div>

                                {/* Actions */}
                                <div className="pt-4 space-y-3">
                                    <Button
                                        className={cn(
                                            "w-full h-12 gap-2 shadow-lg transition-transform active:scale-[0.98]",
                                            isChecklistComplete
                                                ? "bg-accent-emerald text-white shadow-accent-emerald/20"
                                                : "bg-slate-100 text-slate-400 cursor-not-allowed"
                                        )}
                                        disabled={!isChecklistComplete || validateMutation.isPending}
                                        onClick={() => validateMutation.mutate({
                                            id: selectedItem,
                                            result: 'approve',
                                            notes: 'Lolos validasi fisik.'
                                        })}
                                    >
                                        <CheckCircle2 size={18} />
                                        {validateMutation.isPending ? 'Memproses...' : 'Lolos Validasi & Simpan'}
                                    </Button>

                                    <Button
                                        variant="ghost"
                                        className="w-full h-12 gap-2 text-accent-rose hover:bg-accent-rose/10 hover:text-accent-rose"
                                        onClick={() => {
                                            const reason = prompt("Alasan penolakan/reject:");
                                            if (reason) {
                                                validateMutation.mutate({
                                                    id: selectedItem,
                                                    result: 'reject',
                                                    notes: reason
                                                });
                                            }
                                        }}
                                        disabled={validateMutation.isPending}
                                    >
                                        <RotateCcw size={18} />
                                        Reject (Kembali ke Packing)
                                    </Button>
                                </div>

                                <div className="p-4 bg-accent-amber/5 border border-accent-amber/20 rounded-2xl flex items-start gap-3">
                                    <AlertCircle size={16} className="text-accent-amber shrink-0 mt-0.5" />
                                    <p className="text-[10px] text-accent-amber/80 italic leading-relaxed">
                                        Pastikan memeriksa tanggal kadaluarsa <strong>(${selectedTool?.expire_date ? new Date(selectedTool.expire_date).toLocaleDateString('id-ID') : '-'})</strong> sebelum menyetujui.
                                    </p>
                                </div>
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
};
