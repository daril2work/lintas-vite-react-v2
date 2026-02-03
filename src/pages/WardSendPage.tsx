import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Box, Send, PackageSearch, Trash2, Camera, AlertTriangle } from 'lucide-react';
import { cn } from '../utils/cn';
import type { ToolSet } from '../types';

interface SendBasketItem extends ToolSet {
    condition: 'good' | 'damaged';
    photoCaptured: boolean;
    photoUrl?: string;
}

const DEPARTMENTS = ['IGD', 'OK (Bedah)', 'Poli Gigi', 'Poli Umum', 'ICU', 'Radiologi'];

export const WardSendPage = () => {
    const [selectedOrigin, setSelectedOrigin] = useState(DEPARTMENTS[0]);
    const [search, setSearch] = useState('');
    const [basket, setBasket] = useState<SendBasketItem[]>([]);

    const queryClient = useQueryClient();

    const { data: inventory, isLoading } = useQuery({
        queryKey: ['inventory'],
        queryFn: api.getInventory,
    });

    const sendMutation = useMutation({
        mutationFn: async (items: SendBasketItem[]) => {
            for (const item of items) {
                // In a real app, this might just mark it as "sent" or "pending_intake"
                // For now, we simulate the room user initiation
                await api.addLog({
                    toolSetId: item.id,
                    action: `Dikirim dari ${selectedOrigin} ke CSSD`,
                    operatorId: 'RoomUser',
                    notes: item.condition === 'damaged' ? 'Kondisi rusak saat dikirim.' : undefined,
                    photo: item.photoUrl
                });
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
            setBasket([]);
            alert(`Berhasil mengirim ${basket.length} alat ke CSSD.`);
        },
    });

    const availableItems = inventory?.filter(item =>
        (item.name.toLowerCase().includes(search.toLowerCase()) || item.barcode.includes(search)) &&
        (item.status === 'distributed' || item.status === 'sterile') &&
        !basket.find(v => v.id === item.id)
    ) || [];

    const addToBasket = (item: ToolSet) => {
        if (basket.find(v => v.id === item.id)) return;
        setBasket([...basket, { ...item, condition: 'good', photoCaptured: false }]);
    };

    const removeFromBasket = (id: string) => {
        setBasket(basket.filter(item => item.id !== id));
    };

    const handleFileChange = (id: string, file: File | null) => {
        if (!file) return;
        const url = URL.createObjectURL(file);
        setBasket(basket.map(item => item.id === id ? { ...item, photoCaptured: true, photoUrl: url } : item));
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl text-slate-900">Kirim Alat Kotor</h1>
                    <p className="text-slate-500 mt-1">Inisiasi pengiriman alat kotor dari ruangan Anda ke CSSD.</p>
                </div>
                <div className="bg-white px-6 py-3 rounded-2xl shadow-soft border border-slate-100 flex items-center gap-4">
                    <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Ruangan Anda:</span>
                    <select
                        value={selectedOrigin}
                        onChange={(e) => setSelectedOrigin(e.target.value)}
                        className="text-sm font-bold text-accent-indigo bg-transparent focus:outline-none"
                    >
                        {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-accent-indigo/20 bg-accent-indigo/5">
                        <div className="flex flex-col items-center py-8 text-center space-y-4">
                            <div className="w-16 h-16 rounded-full bg-accent-indigo/10 flex items-center justify-center text-accent-indigo">
                                <PackageSearch size={32} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black">Cari Alat Ruangan</h3>
                                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Masukkan nama alat atau scan barcode</p>
                            </div>
                            <div className="w-full max-w-sm">
                                <Input
                                    placeholder="Ketik di sini..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="text-center text-lg font-mono tracking-widest bg-white border-none shadow-soft"
                                />
                            </div>
                        </div>
                    </Card>

                    <div className="space-y-4">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Daftar Inventaris Tersedia</h4>
                        <div className="grid grid-cols-1 gap-4">
                            {isLoading ? (
                                [1, 2, 3].map(i => <div key={i} className="h-24 bg-slate-100 rounded-3xl animate-pulse" />)
                            ) : availableItems.length > 0 ? (
                                availableItems.map(item => (
                                    <Card key={item.id} className="hover:border-accent-indigo/50 cursor-pointer group transition-all">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center">
                                                    <Box size={24} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900">{item.name}</p>
                                                    <p className="text-[10px] font-mono text-slate-400 uppercase font-bold">{item.barcode} • {item.status}</p>
                                                </div>
                                            </div>
                                            <Button size="sm" onClick={() => addToBasket(item)}>Pilih Alat</Button>
                                        </div>
                                    </Card>
                                ))
                            ) : (
                                <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200">
                                    <p className="text-slate-400 italic text-sm">Tidak ada alat yang ditemukan.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <Card className="bg-slate-900 text-white border-none shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                <Send size={14} className="text-accent-indigo" />
                                Siap Kirim ({basket.length})
                            </h4>
                        </div>

                        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                            {basket.map(item => (
                                <div key={item.id} className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-xs font-bold truncate">{item.name}</p>
                                            <p className="text-[10px] text-slate-500 font-mono italic">#{item.barcode}</p>
                                        </div>
                                        <button onClick={() => removeFromBasket(item.id)} className="text-slate-600 hover:text-accent-rose transition-colors">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <label className="h-10 rounded-xl bg-slate-700/30 border border-slate-600 flex items-center justify-center gap-2 text-[8px] font-black uppercase tracking-widest cursor-pointer hover:bg-slate-700 transition-all">
                                            <Camera size={12} />
                                            {item.photoCaptured ? 'Ganti Foto' : 'Foto Alat'}
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={(e) => handleFileChange(item.id, e.target.files ? e.target.files[0] : null)}
                                            />
                                        </label>
                                        <button
                                            onClick={() => setBasket(basket.map(i => i.id === item.id ? { ...i, condition: i.condition === 'good' ? 'damaged' : 'good' } : i))}
                                            className={cn(
                                                "h-10 rounded-xl flex items-center justify-center gap-2 text-[8px] font-black uppercase tracking-widest transition-all",
                                                item.condition === 'good' ? "bg-accent-indigo/20 text-accent-indigo" : "bg-accent-rose/20 text-accent-rose"
                                            )}
                                        >
                                            <AlertTriangle size={12} />
                                            {item.condition === 'good' ? 'Lengkap' : 'Rusak'}
                                        </button>
                                    </div>

                                    {item.photoCaptured && (
                                        <div className="h-16 rounded-xl overflow-hidden grayscale">
                                            <img src={item.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                </div>
                            ))}

                            {basket.length === 0 && (
                                <div className="text-center py-12">
                                    <p className="text-xs text-slate-600 font-bold uppercase tracking-widest">Belum ada alat dipilih</p>
                                </div>
                            )}
                        </div>

                        <div className="mt-8">
                            <Button
                                className="w-full h-12 bg-accent-indigo hover:bg-indigo-600 text-white font-black uppercase tracking-widest"
                                disabled={basket.length === 0 || sendMutation.isPending}
                                onClick={() => sendMutation.mutate(basket)}
                            >
                                {sendMutation.isPending ? 'Mengirim...' : 'Kirim ke CSSD'}
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};
