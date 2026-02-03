import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { PackageSearch, Camera, History, AlertCircle } from 'lucide-react';
import { cn } from '../utils/cn';

export const IntakePage = () => {
    const [search, setSearch] = useState('');
    const queryClient = useQueryClient();

    const { data: inventory, isLoading } = useQuery({
        queryKey: ['inventory'],
        queryFn: api.getInventory,
    });

    const intakeMutation = useMutation({
        mutationFn: (id: string) => api.updateToolStatus(id, 'dirty'),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
        },
    });

    const filteredItems = inventory?.filter(item =>
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.barcode.includes(search)
    ).filter(item => item.status === 'distributed' || item.status === 'dirty') || [];

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl text-slate-900">Penerimaan Alat</h1>
                    <p className="text-slate-500 mt-1">Scan atau pilih alat kotor dari unit untuk diproses.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="secondary" className="gap-2">
                        <History size={18} />
                        History
                    </Button>
                    <Button variant="accent" className="gap-2">
                        <PackageSearch size={18} />
                        Batch Baru
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Scanning & Search */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-accent-indigo/20 bg-accent-indigo/5">
                        <div className="flex flex-col items-center py-8 text-center space-y-4">
                            <div className="w-20 h-20 rounded-full bg-accent-indigo/10 flex items-center justify-center text-accent-indigo">
                                <PackageSearch size={40} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black">Scan Barcode / QR</h3>
                                <p className="text-sm text-slate-500">Gunakan scanner atau ketik nomor seri alat</p>
                            </div>
                            <div className="w-full max-w-sm">
                                <Input
                                    placeholder="Contoh: SET-001..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="text-center text-lg font-mono tracking-widest"
                                />
                            </div>
                        </div>
                    </Card>

                    <div className="space-y-4">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Daftar Alat (Incoming)</h4>
                        {isLoading ? (
                            <div className="animate-pulse space-y-4">
                                {[1, 2, 3].map(i => <div key={i} className="h-24 bg-slate-100 rounded-3xl" />)}
                            </div>
                        ) : filteredItems.length > 0 ? (
                            <div className="grid grid-cols-1 gap-4">
                                {filteredItems.map(item => (
                                    <Card key={item.id} className="hover:border-accent-indigo/50 cursor-pointer group transition-all">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "w-12 h-12 rounded-2xl flex items-center justify-center",
                                                    item.status === 'dirty' ? "bg-accent-rose/10 text-accent-rose" : "bg-slate-100 text-slate-400"
                                                )}>
                                                    <PackageSearch size={24} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900">{item.name}</p>
                                                    <p className="text-xs font-mono text-slate-500 uppercase">{item.barcode} • {item.category}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className={cn(
                                                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                                                    item.status === 'dirty' ? "bg-accent-rose/10 text-accent-rose" : "bg-slate-100 text-slate-500"
                                                )}>
                                                    {item.status}
                                                </span>
                                                <Button
                                                    size="sm"
                                                    variant={item.status === 'dirty' ? 'accent' : 'secondary'}
                                                    disabled={intakeMutation.isPending}
                                                    onClick={() => intakeMutation.mutate(item.id)}
                                                >
                                                    {item.status === 'dirty' ? 'Terima' : 'Sudah Diterima'}
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200">
                                <AlertCircle size={48} className="mx-auto text-slate-300 mb-4" />
                                <p className="text-slate-500">Tidak ada alat yang ditemukan.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Evidence & Summary */}
                <div className="space-y-6">
                    <Card className="h-full">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6">Bukti Kondisi (Photo)</h4>
                        <div className="aspect-square rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center p-8 space-y-4 hover:bg-slate-100 transition-all cursor-pointer group">
                            <div className="w-16 h-16 rounded-full bg-white shadow-soft flex items-center justify-center text-slate-400 group-hover:text-accent-indigo">
                                <Camera size={32} />
                            </div>
                            <p className="text-sm font-semibold text-slate-600">Ambil Foto Alat</p>
                            <p className="text-[10px] text-slate-400">Pastikan label terlihat jelas dan alat dalam keadaan sesuai laporan.</p>
                        </div>

                        <div className="mt-8 space-y-6">
                            <div>
                                <h5 className="text-sm font-bold text-slate-900 mb-2">Summary Batch</h5>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-500">Total Alat</span>
                                        <span className="font-bold">0</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-500">Status</span>
                                        <span className="text-accent-amber font-bold">Draft</span>
                                    </div>
                                </div>
                            </div>
                            <Button className="w-full h-14 text-lg">Konfirmasi Penerimaan</Button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};
