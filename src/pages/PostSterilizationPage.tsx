import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { postSterilizationService } from '../services/postSterilization.service';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import {
    ClipboardCheck,
    UploadCloud,
    FileText,
    X,
    Settings,
    ShieldCheck,
    History,
    Trash2,
    Eye
} from 'lucide-react';
import { cn } from '../utils/cn';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

export const PostSterilizationPage = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    
    const [selectedMachineId, setSelectedMachineId] = useState<string>('');
    const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [proofFile, setProofFile] = useState<File | null>(null);
    const [notes, setNotes] = useState('');
    
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [logToDelete, setLogToDelete] = useState<string | null>(null);

    const { data: machines } = useQuery({ queryKey: ['machines'], queryFn: api.getMachines });
    const { data: logs, isLoading: isLoadingLogs } = useQuery({ 
        queryKey: ['post_sterilization_logs'], 
        queryFn: postSterilizationService.getLogs 
    });

    const createMutation = useMutation({
        mutationFn: async () => {
            if (!selectedMachineId) throw new Error('Pilih mesin terlebih dahulu');
            
            await postSterilizationService.createLog({
                machineId: selectedMachineId,
                date: date,
                operator_name: user?.name || 'Operator',
                notes: notes,
            }, proofFile);
        },
        onSuccess: () => {
            setProofFile(null);
            setNotes('');
            setSelectedMachineId('');
            setDate(new Date().toISOString().split('T')[0]);
            queryClient.invalidateQueries({ queryKey: ['post_sterilization_logs'] });
            toast.success('Bukti pasca sterilisasi berhasil diunggah');
        },
        onError: (error: any) => {
            toast.error('Gagal mengunggah bukti', { description: error.message });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await postSterilizationService.deleteLog(id);
        },
        onSuccess: () => {
            setIsDeleteModalOpen(false);
            setLogToDelete(null);
            queryClient.invalidateQueries({ queryKey: ['post_sterilization_logs'] });
            toast.success('Data berhasil dihapus');
        },
        onError: (error: any) => {
            toast.error('Gagal menghapus data', { description: error.message });
        }
    });

    const handleDeleteClick = (id: string) => {
        setLogToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (logToDelete) {
            deleteMutation.mutate(logToDelete);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Pasca Sterilisasi</h1>
                    <p className="text-slate-500 mt-1 italic">Unggah bukti pasca sterilisasi dan riwayat dokumen.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Upload */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="p-6 space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                            <div className="w-10 h-10 bg-accent-indigo/10 rounded-xl flex items-center justify-center text-accent-indigo">
                                <UploadCloud size={20} />
                            </div>
                            <h2 className="text-lg font-black text-slate-900 tracking-tight">Upload Bukti</h2>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-500">Pilih Mesin</label>
                                <select 
                                    className="w-full p-3 rounded-xl border-2 border-slate-100 bg-slate-50 font-bold text-sm text-slate-700 focus:border-accent-indigo focus:ring-2 focus:ring-accent-indigo/20 outline-none transition-all"
                                    value={selectedMachineId}
                                    onChange={(e) => setSelectedMachineId(e.target.value)}
                                >
                                    <option value="" disabled>-- Pilih Mesin --</option>
                                    {machines?.map(m => (
                                        <option key={m.id} value={m.id}>{m.name} ({m.type})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-500">Tanggal</label>
                                <input
                                    type="date"
                                    className="w-full p-3 rounded-xl border-2 border-slate-100 bg-slate-50 font-bold text-sm text-slate-700 focus:border-accent-indigo focus:ring-2 focus:ring-accent-indigo/20 outline-none transition-all"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-500">Catatan / Keterangan</label>
                                <textarea
                                    className="w-full p-3 rounded-xl border-2 border-slate-100 bg-slate-50 font-medium text-sm text-slate-700 focus:border-accent-indigo focus:ring-2 focus:ring-accent-indigo/20 outline-none transition-all"
                                    placeholder="Masukkan keterangan tambahan jika ada..."
                                    rows={3}
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-500">File Bukti Fisik</label>
                                {!proofFile ? (
                                    <div className="w-full relative group">
                                        <input 
                                            type="file" 
                                            accept="image/jpeg,image/png,application/pdf"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;
                                                if (file.size > 2 * 1024 * 1024) {
                                                    toast.error('Ukuran file terlalu besar', { description: 'Maksimal ukuran file adalah 2 MB' });
                                                    return;
                                                }
                                                setProofFile(file);
                                            }}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        />
                                        <div className="flex flex-col items-center justify-center w-full min-h-[120px] p-6 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 group-hover:border-accent-indigo group-hover:bg-accent-indigo/5 transition-all">
                                            <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-accent-indigo mb-2 transition-colors" />
                                            <p className="text-xs font-bold text-slate-600">Klik atau Drag file ke sini</p>
                                            <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-medium">Max 2 MB (JPG, PNG, PDF)</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between p-4 rounded-2xl border-2 border-accent-indigo/20 bg-accent-indigo/5 transition-all">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="p-2 bg-white rounded-lg shadow-sm">
                                                <FileText className="w-6 h-6 text-accent-indigo" />
                                            </div>
                                            <div className="truncate">
                                                <p className="text-sm font-bold text-slate-700 truncate">{proofFile.name}</p>
                                                <p className="text-xs text-slate-500 font-medium">{(proofFile.size / 1024).toFixed(1)} KB</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => setProofFile(null)}
                                            className="p-2 hover:bg-white rounded-full transition-colors text-slate-400 hover:text-rose-500 flex-shrink-0"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <Button
                                className="w-full h-14 bg-slate-900 hover:bg-black text-white rounded-2xl shadow-lg flex items-center justify-center gap-2 group transition-all mt-4"
                                onClick={() => createMutation.mutate()}
                                disabled={createMutation.isPending || !selectedMachineId || !proofFile}
                            >
                                <ShieldCheck className="group-hover:scale-110 transition-transform" />
                                <span className="text-sm font-black tracking-tight">UNGGAH BUKTI</span>
                            </Button>
                        </div>
                    </Card>
                </div>

                {/* History Table */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="p-6 space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600">
                                <History size={20} />
                            </div>
                            <h2 className="text-lg font-black text-slate-900 tracking-tight">Riwayat Unggahan</h2>
                        </div>

                        <div className="overflow-x-auto rounded-xl border border-slate-100">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100">
                                        <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Waktu</th>
                                        <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Mesin</th>
                                        <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Operator</th>
                                        <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoadingLogs ? (
                                        <tr>
                                            <td colSpan={4} className="p-8 text-center text-slate-400 font-medium text-sm">
                                                Memuat data...
                                            </td>
                                        </tr>
                                    ) : logs?.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="p-8 text-center text-slate-400 font-medium text-sm">
                                                Belum ada riwayat unggahan.
                                            </td>
                                        </tr>
                                    ) : (
                                        logs?.map(log => {
                                            const machine = machines?.find(m => m.id === log.machineId);
                                            return (
                                                <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                                    <td className="p-4">
                                                        <p className="text-sm font-bold text-slate-700">
                                                            {new Date(log.date).toLocaleDateString('id-ID')}
                                                        </p>
                                                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest mt-0.5">
                                                            {new Date(log.timestamp).toLocaleTimeString('id-ID')}
                                                        </p>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-2">
                                                            <Settings size={14} className="text-slate-400" />
                                                            <span className="text-sm font-bold text-slate-700">{machine?.name || 'Unknown'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-sm font-medium text-slate-600">
                                                        {log.operator_name}
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-2">
                                                            {log.proof_file_url && (
                                                                <a 
                                                                    href={log.proof_file_url} 
                                                                    target="_blank" 
                                                                    rel="noopener noreferrer"
                                                                    className="p-2 text-accent-indigo bg-accent-indigo/10 rounded-lg hover:bg-accent-indigo hover:text-white transition-colors"
                                                                    title="Lihat Dokumen"
                                                                >
                                                                    <Eye size={16} />
                                                                </a>
                                                            )}
                                                            <button 
                                                                className="p-2 text-rose-500 bg-rose-50 rounded-lg hover:bg-rose-500 hover:text-white transition-colors"
                                                                title="Hapus"
                                                                onClick={() => handleDeleteClick(log.id)}
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            </div>

            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
            >
                <div className="p-6 space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center text-rose-500">
                                <Trash2 size={20} />
                            </div>
                            <h3 className="text-lg font-black text-slate-900 tracking-tight">Hapus Data</h3>
                        </div>
                        <button 
                            onClick={() => setIsDeleteModalOpen(false)}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <p className="text-sm text-slate-600 font-medium">
                        Apakah Anda yakin ingin menghapus data bukti ini? Tindakan ini tidak dapat dibatalkan.
                    </p>
                    
                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>
                            Batal
                        </Button>
                        <Button 
                            className="bg-rose-500 hover:bg-rose-600 text-white" 
                            onClick={confirmDelete}
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending ? 'Menghapus...' : 'Ya, Hapus'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default PostSterilizationPage;
