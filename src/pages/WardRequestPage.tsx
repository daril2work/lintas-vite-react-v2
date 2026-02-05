import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Send, ListTodo, CheckCircle2, ChevronDown, Plus, Trash2, Clock, AlertTriangle } from 'lucide-react';
import { cn } from '../utils/cn';
import { useAuth } from '../context/AuthContext';

export const WardRequestPage = () => {
    const { user } = useAuth();
    const [basket, setBasket] = useState<{ id: string; name: string; quantity: number }[]>([]);
    const [selectedToolId, setSelectedToolId] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [priority, setPriority] = useState<'normal' | 'urgent'>('normal');
    const [patientRm, setPatientRm] = useState('');
    const [doctorName, setDoctorName] = useState('');
    const [requiredDate, setRequiredDate] = useState(new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState('');
    const [success, setSuccess] = useState(false);

    const queryClient = useQueryClient();

    const { data: inventory } = useQuery({
        queryKey: ['inventory'],
        queryFn: api.getInventory,
    });

    const toolTypes = inventory?.reduce((acc, item) => {
        if (!acc[item.name]) {
            acc[item.name] = { name: item.name, available: 0, total: 0 };
        }
        acc[item.name].total += 1;
        if (item.status === 'sterile') acc[item.name].available += 1;
        return acc;
    }, {} as Record<string, { name: string; available: number; total: number }>) || {};

    const addToBasket = () => {
        if (!selectedToolId) return;
        const tool = Object.values(toolTypes).find(t => t.name === selectedToolId);
        if (!tool) return;

        const existing = basket.find(item => item.name === selectedToolId);
        if (existing) {
            setBasket(basket.map(item =>
                item.name === selectedToolId ? { ...item, quantity: item.quantity + quantity } : item
            ));
        } else {
            setBasket([...basket, { id: selectedToolId, name: selectedToolId, quantity }]);
        }
        setSelectedToolId('');
        setQuantity(1);
    };

    const removeFromBasket = (id: string) => {
        setBasket(basket.filter(item => item.id !== id));
    };

    const requestMutation = useMutation({
        mutationFn: async () => {
            if (basket.length === 0) throw new Error("Keranjang masih kosong");
            await api.createRequest({
                ward: user?.department || 'Umum',
                items: basket,
                priority,
                patientRm,
                doctorName,
                requiredDate,
                notes
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['requests'] });
            setSuccess(true);
            setBasket([]);
            setPatientRm('');
            setDoctorName('');
            setRequiredDate(new Date().toISOString().split('T')[0]);
            setNotes('');
            setPriority('normal');
            setTimeout(() => setSuccess(false), 3000);
        },
    });

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900">Permintaan Alat</h1>
                    <p className="text-slate-500 mt-1">Buat daftar permintaan alat medis untuk ruangan **{user?.department}**.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setPriority('normal')}
                        className={cn(
                            "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2",
                            priority === 'normal' ? "bg-slate-900 text-white shadow-lg" : "bg-white text-slate-400 border border-slate-100"
                        )}
                    >
                        <Clock size={14} /> Normal
                    </button>
                    <button
                        onClick={() => setPriority('urgent')}
                        className={cn(
                            "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2",
                            priority === 'urgent' ? "bg-accent-rose text-white shadow-lg shadow-accent-rose/20" : "bg-white text-slate-400 border border-slate-100"
                        )}
                    >
                        <AlertTriangle size={14} /> Urgent
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <Card className="p-8 space-y-6 border-none shadow-soft">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-accent-indigo mb-2">
                                <Plus size={24} />
                                <h3 className="font-black text-lg text-slate-900">Tambah ke Keranjang</h3>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">
                                    Pilih Alat / Set
                                </label>
                                <div className="relative group">
                                    <select
                                        className="w-full p-4 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-4 focus:ring-accent-indigo/20 focus:border-accent-indigo appearance-none transition-all text-sm font-medium"
                                        value={selectedToolId}
                                        onChange={(e) => setSelectedToolId(e.target.value)}
                                    >
                                        <option value="">-- Pilih Alat --</option>
                                        {Object.values(toolTypes).map(tool => (
                                            <option key={tool.name} value={tool.name}>
                                                {tool.name} {tool.available > 0 ? `(Tersedia: ${tool.available})` : '(Stok Kosong - Antrian)'}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-accent-indigo transition-colors" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="Jumlah (Qty)"
                                    type="number"
                                    min="1"
                                    value={quantity}
                                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                                />
                                <div className="flex items-end">
                                    <Button
                                        onClick={addToBasket}
                                        disabled={!selectedToolId}
                                        className="w-full h-14 bg-slate-900 text-white"
                                    >
                                        Tambah
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-8 space-y-4 border-none shadow-soft">
                        <div className="flex items-center gap-3 text-accent-indigo mb-2">
                            <ListTodo size={24} />
                            <h3 className="font-black text-lg text-slate-900">Data Operasi / Klinis</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="No. Rekam Medis (RM)"
                                placeholder="Masukkan No. RM Pasien..."
                                value={patientRm}
                                onChange={(e) => setPatientRm(e.target.value)}
                            />
                            <Input
                                label="Nama Dokter DPJP"
                                placeholder="Contoh: dr. Budi, Sp.OT"
                                value={doctorName}
                                onChange={(e) => setDoctorName(e.target.value)}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4 items-end">
                            <Input
                                type="date"
                                label="Tanggal Dibutuhkan"
                                value={requiredDate}
                                onChange={(e) => setRequiredDate(e.target.value)}
                            />
                            <div className="space-y-1.5 flex-1">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">
                                    Catatan (Opsional)
                                </label>
                                <Input
                                    placeholder="Instruksi..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                            </div>
                        </div>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="p-8 border-none shadow-soft min-h-[400px] flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3 text-accent-indigo">
                                <ListTodo size={24} />
                                <h3 className="font-black text-lg text-slate-900">Daftar Permintaan</h3>
                            </div>
                            <span className="bg-slate-100 px-3 py-1 rounded-full text-xs font-black text-slate-500">
                                {basket.length} Items
                            </span>
                        </div>

                        <div className="flex-1 space-y-3">
                            {basket.map(item => (
                                <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-xs font-black text-slate-400 border border-slate-100">
                                            {item.quantity}x
                                        </div>
                                        <p className="text-sm font-bold text-slate-900">{item.name}</p>
                                    </div>
                                    <button
                                        onClick={() => removeFromBasket(item.id)}
                                        className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-accent-rose transition-all"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}

                            {basket.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center gap-4 py-20 text-slate-300">
                                    <ListTodo size={48} />
                                    <p className="font-bold text-sm">Keranjang masih kosong</p>
                                </div>
                            )}
                        </div>

                        {success && (
                            <div className="my-4 flex items-center gap-3 p-4 bg-accent-emerald/10 text-accent-emerald rounded-xl border border-accent-emerald/20">
                                <CheckCircle2 size={20} />
                                <span className="text-sm font-bold">Permintaan berhasil dikirim!</span>
                            </div>
                        )}

                        <Button
                            className={cn(
                                "w-full h-14 gap-3 mt-6 shadow-lg transition-all",
                                priority === 'urgent'
                                    ? "bg-accent-rose hover:bg-rose-600 shadow-rose-200"
                                    : "bg-accent-indigo hover:bg-indigo-600 shadow-indigo-200"
                            )}
                            disabled={basket.length === 0 || requestMutation.isPending}
                            onClick={() => requestMutation.mutate()}
                        >
                            {requestMutation.isPending ? 'Mengirim...' : (
                                <>
                                    <Send size={18} />
                                    Kirim Permintaan {priority === 'urgent' ? 'URGENT' : ''}
                                </>
                            )}
                        </Button>
                    </Card>
                </div>
            </div>
        </div>
    );
};
