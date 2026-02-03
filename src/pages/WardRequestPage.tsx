import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Send, ListTodo, AlertCircle, CheckCircle2, ChevronDown } from 'lucide-react';
import { cn } from '../utils/cn';

const DEPARTMENTS = ['IGD', 'OK (Bedah)', 'Poli Gigi', 'Poli Umum', 'ICU', 'Radiologi'];

export const WardRequestPage = () => {
    const [selectedRoom, setSelectedRoom] = useState(DEPARTMENTS[0]);
    const [toolName, setToolName] = useState('');
    const [toolCode, setToolCode] = useState('');
    const [notes, setNotes] = useState('');
    const [success, setSuccess] = useState(false);

    const queryClient = useQueryClient();

    const { data: inventory } = useQuery({
        queryKey: ['inventory'],
        queryFn: api.getInventory,
    });

    const handleToolSelect = (name: string) => {
        setToolName(name);
        if (!name || name === 'custom') {
            setToolCode('');
            return;
        }
        const tool = inventory?.find(t => t.name === name);
        if (tool) {
            setToolCode(tool.barcode);
        } else {
            setToolCode('');
        }
    };

    const requestMutation = useMutation({
        mutationFn: async () => {
            if (!toolName) throw new Error("Nama alat harus diisi");
            await api.createRequest({
                toolName,
                toolCode,
                requestingRoom: selectedRoom,
                notes
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['requests'] });
            setSuccess(true);
            setToolName('');
            setToolCode('');
            setNotes('');
            setTimeout(() => setSuccess(false), 3000);
        },
    });

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl text-slate-900">Permintaan Alat</h1>
                    <p className="text-slate-500 mt-1">Minta alat medis dari CSSD untuk kebutuhan ruangan Anda.</p>
                </div>
                <div className="bg-white px-6 py-3 rounded-2xl shadow-soft border border-slate-100 flex items-center gap-4">
                    <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Ruangan:</span>
                    <select
                        value={selectedRoom}
                        onChange={(e) => setSelectedRoom(e.target.value)}
                        className="text-sm font-bold text-accent-indigo bg-transparent focus:outline-none"
                    >
                        {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="p-8 space-y-6 border-none shadow-soft">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 text-accent-indigo mb-2">
                            <ListTodo size={24} />
                            <h3 className="font-black text-lg text-slate-900">Formulir Permintaan</h3>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">
                                Pilih Alat / Set (Wajib)
                            </label>
                            <div className="relative group">
                                <select
                                    className="w-full p-4 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-4 focus:ring-accent-indigo/20 focus:border-accent-indigo appearance-none transition-all text-sm font-medium"
                                    value={toolName}
                                    onChange={(e) => handleToolSelect(e.target.value)}
                                >
                                    <option value="">-- Pilih Alat --</option>
                                    {inventory?.map(tool => (
                                        <option key={tool.id} value={tool.name}>{tool.name}</option>
                                    ))}
                                    <option value="custom">+ Alat Lainnya (Input Manual)</option>
                                </select>
                                <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-accent-indigo transition-colors" />
                            </div>
                        </div>

                        {toolName === 'custom' && (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                                <Input
                                    label="Nama Alat Manual"
                                    placeholder="Masukkan nama alat..."
                                    onChange={(e) => setToolName(e.target.value)}
                                />
                            </div>
                        )}

                        <Input
                            label="Kode Alat"
                            placeholder="Terisi otomatis..."
                            value={toolCode}
                            readOnly={toolName !== 'custom'}
                            onChange={(e) => setToolCode(e.target.value)}
                            className={cn(toolName !== 'custom' && "bg-slate-50 text-slate-500 cursor-not-allowed")}
                        />

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">
                                Catatan Tambahan (Opsional)
                            </label>
                            <textarea
                                className="w-full p-4 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-accent-indigo/20 focus:border-accent-indigo transition-all min-h-[100px] text-sm"
                                placeholder="Tuliskan alasan permintaan atau instruksi khusus..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </div>
                    </div>

                    {success && (
                        <div className="flex items-center gap-3 p-4 bg-accent-emerald/10 text-accent-emerald rounded-xl border border-accent-emerald/20 animate-in fade-in zoom-in-95 duration-200">
                            <CheckCircle2 size={20} />
                            <span className="text-sm font-bold">Permintaan berhasil dikirim ke CSSD!</span>
                        </div>
                    )}

                    <Button
                        className="w-full h-14 gap-3 bg-accent-indigo hover:bg-indigo-600 shadow-lg shadow-accent-indigo/20"
                        disabled={!toolName || requestMutation.isPending}
                        onClick={() => requestMutation.mutate()}
                    >
                        {requestMutation.isPending ? 'Mengirim...' : (
                            <>
                                <Send size={18} />
                                Kirim Permintaan
                            </>
                        )}
                    </Button>
                </Card>

                <div className="space-y-6">
                    <Card className="bg-slate-900 text-white border-none shadow-2xl overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-accent-indigo/10 rounded-full -mr-16 -mt-16"></div>
                        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                            <AlertCircle size={14} className="text-accent-amber" />
                            Informasi Alur
                        </h4>
                        <div className="space-y-4 relative z-10">
                            {[
                                { step: '1', text: 'Input nama atau kode alat yang dibutuhkan.' },
                                { step: '2', text: 'Admin CSSD akan menerima notifikasi permintaan Anda.' },
                                { step: '3', text: 'Jika stok tersedia, admin akan langsung mendistribusikan.' },
                                { step: '4', text: 'Konfirmasi penerimaan di halaman "Terima Distribusi" jika alat sudah sampai.' },
                            ].map(item => (
                                <div key={item.step} className="flex gap-4">
                                    <span className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center text-[10px] font-black">{item.step}</span>
                                    <p className="text-sm text-slate-400 flex-1">{item.text}</p>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card className="flex flex-col items-center justify-center p-8 text-center gap-4 bg-accent-indigo/5 border-dashed border-accent-indigo/30">
                        <div className="w-16 h-16 rounded-full bg-accent-indigo/10 flex items-center justify-center text-accent-indigo">
                            <ListTodo size={32} />
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-900">Butuh Alat Segera?</h4>
                            <p className="text-xs text-slate-500 max-w-[200px] mt-1">Permintaan Anda akan diprioritaskan oleh tim CSSD.</p>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};
