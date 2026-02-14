import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { PackageSearch, Camera, History, AlertCircle, Trash2, CheckCircle2, AlertTriangle, Box, X } from 'lucide-react';
import { cn } from '../utils/cn';
import type { ToolSet } from '../types';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

interface BasketItem extends ToolSet {
    condition: 'good' | 'damaged';
    photoCaptured: boolean;
    photoUrl?: string;
    origin?: string;
}

export const IntakePage = () => {
    const { user } = useAuth();
    const [search, setSearch] = useState('');
    const [basket, setBasket] = useState<BasketItem[]>([]);
    const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
    const [selectedOrigin, setSelectedOrigin] = useState('');
    const [selectedTools, setSelectedTools] = useState<string[]>([]);
    const queryClient = useQueryClient();

    const { data: inventory, isLoading } = useQuery({
        queryKey: ['inventory'],
        queryFn: api.getInventory,
    });

    const { data: staff } = useQuery({
        queryKey: ['staff'],
        queryFn: api.getStaff,
    });

    const departments = Array.from(new Set(staff?.map(s => s.department) || []));

    // Auto-select first department when data loads
    useEffect(() => {
        if (departments.length > 0 && !selectedOrigin) {
            setSelectedOrigin(departments[0]);
        }
    }, [departments, selectedOrigin]);

    const intakeMutation = useMutation({
        mutationFn: async (items: BasketItem[]) => {
            for (const item of items) {
                // Security check: ensure item is not already in a CSSD process
                const currentItem = inventory?.find(i => i.id === item.id);
                if (currentItem?.status === 'washing' || currentItem?.status === 'sterilizing' || currentItem?.status === 'dirty') {
                    console.warn(`Alat ${item.name} sedang dalam proses lain.`);
                    continue;
                }

                await api.updateToolStatus(item.id, 'dirty');
                await api.addLog({
                    toolSetId: item.id,
                    action: `Penerimaan dari ${item.origin || 'Unit'} - Kondisi: ${item.condition === 'good' ? 'Lengkap' : 'Rusak'}`,
                    operatorId: user?.name || 'Operator', // Use auth user
                    notes: item.condition === 'damaged' ? 'Alat dilaporkan bermasalah saat diterima.' : undefined,
                    photo: item.photoUrl
                });
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
            setBasket([]);
            setSearch('');
            toast.success('Berhasil!', {
                description: 'Alat telah diterima di sistem.',
            });
        },
        onError: (error: any) => {
            console.error('Intake Error:', error);
            toast.error('Gagal!', {
                description: `Gagal menerima alat: ${error.message || 'Unknown error'}`,
            });
        }
    });

    const addToBasket = (item: ToolSet, origin?: string) => {
        if (basket.find(v => v.id === item.id)) return;
        setBasket([...basket, { ...item, condition: 'good', photoCaptured: false, origin }]);
    };

    const handleBatchTransfer = () => {
        const toolsToMove = availableItems.filter(item => selectedTools.includes(item.id));
        const newBasketItems: BasketItem[] = toolsToMove.map(item => ({
            ...item,
            condition: 'good',
            photoCaptured: false,
            origin: selectedOrigin
        }));
        setBasket([...basket, ...newBasketItems]);
        setSelectedTools([]);
        setIsDeliveryModalOpen(false);
    };

    const removeFromBasket = (id: string) => {
        setBasket(basket.filter(item => item.id !== id));
    };

    const updateItemCondition = (id: string, condition: 'good' | 'damaged') => {
        setBasket(basket.map(item => item.id === id ? { ...item, condition } : item));
    };

    const handleFileChange = (id: string, file: File | null) => {
        if (!file) return;
        const url = URL.createObjectURL(file);
        setBasket(basket.map(item => item.id === id ? { ...item, photoCaptured: true, photoUrl: url } : item));
    };

    const triggerFileInput = (id: string) => {
        const input = document.getElementById(`file-input-${id}`) as HTMLInputElement;
        if (input) input.click();
    };

    const availableItems = inventory?.filter(item =>
        (item.name.toLowerCase().includes(search.toLowerCase()) || item.barcode.includes(search)) &&
        (item.status === 'distributed' || item.status === 'sterile') &&
        !basket.find(v => v.id === item.id)
    ) || [];

    const isAllPhotosCaptured = basket.length > 0 && basket.every(item => item.photoCaptured);

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl text-slate-900">Penerimaan Alat</h1>
                    <p className="text-slate-500 mt-1">Kelola serah terima alat kotor dari ruangan ke CSSD.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="accent" className="gap-2" onClick={() => setIsDeliveryModalOpen(true)}>
                        <Box size={18} />
                        Input Pengiriman Ruangan
                    </Button>
                    <Button variant="secondary" className="gap-2">
                        <History size={18} />
                        History
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Search & Available Items */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-accent-indigo/20 bg-accent-indigo/5">
                        <div className="flex flex-col items-center py-8 text-center space-y-4">
                            <div className="w-16 h-16 rounded-full bg-accent-indigo/10 flex items-center justify-center text-accent-indigo">
                                <PackageSearch size={32} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black">Scan Barcode / QR</h3>
                                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Gunakan scanner atau ketik nomor seri alat</p>
                            </div>
                            <div className="w-full max-w-sm">
                                <Input
                                    placeholder="SET-001..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="text-center text-lg font-mono tracking-widest bg-white border-none shadow-soft"
                                />
                            </div>
                        </div>
                    </Card>

                    <div className="space-y-4">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Hasil Pencarian Alat</h4>
                        <div className="grid grid-cols-1 gap-4">
                            {isLoading ? (
                                [1, 2].map(i => <div key={i} className="h-24 bg-slate-100 rounded-3xl animate-pulse" />)
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
                                                    <p className="text-[10px] font-mono text-slate-400 uppercase font-bold">{item.barcode} • {item.category}</p>
                                                </div>
                                            </div>
                                            <Button size="sm" onClick={() => addToBasket(item)}>Tambahkan</Button>
                                        </div>
                                    </Card>
                                ))
                            ) : (
                                <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200">
                                    <p className="text-slate-400 italic text-sm">Cari alat atau pilih dari tombol 'Input Pengiriman Ruangan'</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Basket (Keranjang) */}
                <div className="space-y-6">
                    <Card className="bg-slate-900 text-white border-none shadow-2xl sticky top-24">
                        <div className="flex items-center justify-between mb-6">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-accent-indigo/20 flex items-center justify-center text-accent-indigo">
                                    {basket.length}
                                </div>
                                Keranjang Intake
                            </h4>
                            {basket.length > 0 && (
                                <button onClick={() => setBasket([])} className="text-[10px] uppercase font-bold text-slate-500 hover:text-white transition-colors">Kosongkan</button>
                            )}
                        </div>

                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {basket.map(item => (
                                <div key={item.id} className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div className="overflow-hidden">
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className="text-xs font-bold truncate">{item.name}</p>
                                                {item.origin && (
                                                    <span className="px-1.5 py-0.5 rounded-md bg-accent-indigo/20 text-accent-indigo text-[8px] font-black uppercase">
                                                        {item.origin}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-slate-500 font-mono italic">#{item.barcode}</p>
                                        </div>
                                        <input
                                            type="file"
                                            id={`file-input-${item.id}`}
                                            className="hidden"
                                            accept="image/*"
                                            capture="environment"
                                            onChange={(e) => handleFileChange(item.id, e.target.files ? e.target.files[0] : null)}
                                        />
                                        <button onClick={() => removeFromBasket(item.id)} className="text-slate-600 hover:text-accent-rose transition-colors">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => triggerFileInput(item.id)}
                                            className={cn(
                                                "h-16 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all",
                                                item.photoCaptured
                                                    ? "bg-accent-emerald/10 border-accent-emerald/20 text-accent-emerald"
                                                    : "bg-slate-700/30 border-slate-600 text-slate-400 hover:bg-slate-700"
                                            )}
                                        >
                                            <Camera size={16} />
                                            <span className="text-[8px] font-bold uppercase tracking-widest">{item.photoCaptured ? 'Photo Ready' : 'Take Photo/Upload'}</span>
                                        </button>
                                        <div className="flex flex-col gap-2">
                                            <button
                                                onClick={() => updateItemCondition(item.id, 'good')}
                                                className={cn(
                                                    "flex-1 rounded-xl flex items-center justify-center gap-2 text-[8px] font-bold uppercase transition-all",
                                                    item.condition === 'good' ? "bg-accent-indigo text-white shadow-lg shadow-accent-indigo/20" : "bg-slate-700/30 text-slate-500"
                                                )}
                                            >
                                                <CheckCircle2 size={10} /> Lengkap
                                            </button>
                                            <button
                                                onClick={() => updateItemCondition(item.id, 'damaged')}
                                                className={cn(
                                                    "flex-1 rounded-xl flex items-center justify-center gap-2 text-[8px] font-bold uppercase transition-all",
                                                    item.condition === 'damaged' ? "bg-accent-rose text-white shadow-lg shadow-accent-rose/20" : "bg-slate-700/30 text-slate-500"
                                                )}
                                            >
                                                <AlertTriangle size={10} /> Rusak
                                            </button>
                                        </div>
                                    </div>

                                    {item.photoCaptured && item.photoUrl && (
                                        <div className="relative h-20 rounded-xl overflow-hidden border border-slate-700">
                                            <img src={item.photoUrl} alt="Preview" className="w-full h-full object-cover opacity-60" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
                                            <CheckCircle2 size={12} className="absolute bottom-2 right-2 text-accent-emerald" />
                                        </div>
                                    )}
                                </div>
                            ))}

                            {basket.length === 0 && (
                                <div className="text-center py-8">
                                    <AlertCircle className="mx-auto text-slate-700 mb-2" size={32} />
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Keranjang Kosong</p>
                                </div>
                            )}
                        </div>

                        <div className="mt-8 pt-6 border-t border-slate-800 space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest">
                                    <span className="text-slate-500">Items Pending</span>
                                    <span>{basket.length} unit</span>
                                </div>
                                <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest">
                                    <span className="text-slate-500">Documentation</span>
                                    <span className={isAllPhotosCaptured ? 'text-accent-emerald' : 'text-accent-rose'}>
                                        {basket.filter(i => i.photoCaptured).length}/{basket.length} Photos
                                    </span>
                                </div>
                            </div>
                            <Button
                                className="w-full h-12 bg-accent-emerald hover:bg-emerald-600 text-white border-none text-xs font-black uppercase tracking-widest shadow-lg shadow-accent-emerald/20"
                                disabled={basket.length === 0 || !isAllPhotosCaptured || intakeMutation.isPending}
                                onClick={() => intakeMutation.mutate(basket)}
                            >
                                {intakeMutation.isPending ? 'Processing...' : 'Konfirmasi Penerimaan Batch'}
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
            {/* Modal Input Pengiriman Ruangan */}
            {isDeliveryModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-xl font-black text-slate-900">Input Pengiriman dari Ruangan</h3>
                                <p className="text-xs text-slate-500 mt-1">Pilih ruangan asal dan daftar alat yang dikirim.</p>
                            </div>
                            <button onClick={() => setIsDeliveryModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest ml-1">Ruangan Asal</label>
                                <div className="flex flex-wrap gap-2">
                                    {departments.map(dept => (
                                        <button
                                            key={dept}
                                            onClick={() => setSelectedOrigin(dept)}
                                            className={cn(
                                                "px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                                                selectedOrigin === dept
                                                    ? "bg-accent-indigo border-accent-indigo text-white shadow-lg shadow-accent-indigo/20"
                                                    : "bg-slate-50 border-slate-100 text-slate-500 hover:border-slate-300"
                                            )}
                                        >
                                            {dept}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest ml-1">Pilih Alat (Inventory/Distributed)</label>
                                <div className="max-h-[300px] overflow-y-auto border border-slate-100 rounded-2xl divide-y divide-slate-50">
                                    {availableItems.length > 0 ? availableItems.map(item => (
                                        <div
                                            key={item.id}
                                            className={cn(
                                                "p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors",
                                                selectedTools.includes(item.id) ? "bg-accent-indigo/5" : ""
                                            )}
                                            onClick={() => {
                                                setSelectedTools(prev =>
                                                    prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id]
                                                );
                                            }}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs transition-colors",
                                                    selectedTools.includes(item.id) ? "bg-accent-indigo text-white" : "bg-slate-100 text-slate-400"
                                                )}>
                                                    <Box size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900">{item.name}</p>
                                                    <p className="text-[10px] font-mono text-slate-400 font-bold uppercase">{item.barcode}</p>
                                                </div>
                                            </div>
                                            <div className={cn(
                                                "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                                                selectedTools.includes(item.id) ? "border-accent-indigo bg-accent-indigo text-white" : "border-slate-200"
                                            )}>
                                                {selectedTools.includes(item.id) && <CheckCircle2 size={14} />}
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="p-8 text-center text-slate-400 text-xs italic">
                                            Tidak ada alat tersedia untuk dipilih.
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <Button variant="secondary" className="flex-1" onClick={() => setIsDeliveryModalOpen(false)}>Batal</Button>
                                <Button
                                    className="flex-1"
                                    disabled={selectedTools.length === 0}
                                    onClick={handleBatchTransfer}
                                >
                                    Pindahkan ke Keranjang ({selectedTools.length})
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};
