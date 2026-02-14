import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Truck, UserCheck, MapPin, ClipboardList, PenTool, ListTodo, AlertCircle, CheckCircle2, Printer } from 'lucide-react';
import { cn } from '../utils/cn';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

export const DistributionPage = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [selectedItem, setSelectedItem] = useState<string | null>(null);
    const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
    const [selectedStaff, setSelectedStaff] = useState('');
    const [showSignature, setShowSignature] = useState(false);
    const [activeTab, setActiveTab] = useState<'ready' | 'requests'>('ready');
    const [verificationMethod, setVerificationMethod] = useState<'signature' | 'photo' | 'print'>('signature');
    const [photoEvidence, setPhotoEvidence] = useState<string | null>(null);

    const { data: inventory } = useQuery({ queryKey: ['inventory'], queryFn: api.getInventory });
    const { data: requests } = useQuery({ queryKey: ['requests'], queryFn: api.getRequests });
    const { data: staffList } = useQuery({ queryKey: ['staff'], queryFn: api.getStaff });

    const sterileItems = inventory?.filter(item => item.status === 'sterile') || [];
    const pendingRequests = requests?.filter(r => r.status === 'pending') || [];

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoEvidence(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const distributeMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.updateToolStatus(id, 'distributed');

            // Log the distribution
            await api.addLog({
                toolSetId: id,
                action: 'Distribution',
                operatorId: user?.name || 'Operator',
                notes: `Distributed to ${selectedStaff}. ${activeTab === 'requests' ? 'Fulfilled request.' : ''}`,
                evidence: verificationMethod === 'photo' ? (photoEvidence ?? undefined) : verificationMethod === 'print' ? 'Handover Form (Printed)' : 'Digital Signature'
            });

            if (activeTab === 'requests' && selectedRequest) {
                await api.updateRequestStatus(selectedRequest, 'fulfilled');
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
            queryClient.invalidateQueries({ queryKey: ['requests'] });
            queryClient.invalidateQueries({ queryKey: ['logs'] });
            setSelectedItem(null);
            setSelectedRequest(null);
            setSelectedStaff('');
            setShowSignature(false);
            setPhotoEvidence(null);
            toast.success('Distribusi Berhasil!', {
                description: `Alat telah diserahkan ke ${selectedStaff}.`,
            });
        },
    });

    const requestStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string, status: 'unavailable' }) =>
            api.updateRequestStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['requests'] });
            setSelectedRequest(null);
            toast.info('Permintaan Diperbarui', {
                description: 'Status permintaan telah ditandai sebagai stok kosong.',
            });
        },
    });

    const selectedTool = inventory?.find(item => item.id === selectedItem);
    const selectedReqObj = requests?.find(r => r.id === selectedRequest);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl text-slate-900">Distribusi Alat</h1>
                    <p className="text-slate-500 mt-1">Serah terima alat steril ke unit pelayanan.</p>
                </div>
                {/* ... (Tabs) ... */}
                <div className="flex gap-4">
                    <button
                        onClick={() => setActiveTab('ready')}
                        className={cn(
                            "px-6 py-3 rounded-2xl font-bold text-sm transition-all border",
                            activeTab === 'ready'
                                ? "bg-slate-900 text-white shadow-lg"
                                : "bg-white text-slate-500 border-slate-100"
                        )}
                    >
                        Siap Kirim ({sterileItems.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('requests')}
                        className={cn(
                            "px-6 py-3 rounded-2xl font-bold text-sm transition-all border relative",
                            activeTab === 'requests'
                                ? "bg-accent-indigo text-white shadow-lg shadow-accent-indigo/20"
                                : "bg-white text-slate-500 border-slate-100"
                        )}
                    >
                        Permintaan ({pendingRequests.length})
                        {pendingRequests.length > 0 && (
                            <span className="absolute -top-2 -right-2 w-5 h-5 bg-accent-rose text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-slate-50">
                                {pendingRequests.length}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column (Lists) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* ... (Existing List Logic) ... */}
                    {activeTab === 'requests' ? (
                        <>
                            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Daftar Permintaan dari Unit</h4>
                            <div className="space-y-4">
                                {pendingRequests.map(req => (
                                    <Card
                                        key={req.id}
                                        className={cn(
                                            "hover:border-accent-indigo cursor-pointer transition-all border-2",
                                            selectedRequest === req.id ? "border-accent-indigo bg-accent-indigo/5" : "border-transparent"
                                        )}
                                        onClick={() => setSelectedRequest(req.id)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "w-12 h-12 rounded-2xl flex items-center justify-center",
                                                    req.priority === 'urgent' ? "bg-accent-rose/10 text-accent-rose" : "bg-accent-indigo/10 text-accent-indigo"
                                                )}>
                                                    <ListTodo size={24} />
                                                </div>
                                                <div>
                                                    <div className="flex flex-wrap gap-2 mb-1">
                                                        {req.items.map((item, idx) => (
                                                            <span key={idx} className="px-2 py-0.5 bg-slate-100 text-[10px] font-bold rounded text-slate-700">
                                                                {item.quantity}x {item.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                    <p className="text-xs text-slate-500 font-black uppercase tracking-wider flex items-center gap-2">
                                                        {req.ward}
                                                        {req.priority === 'urgent' && (
                                                            <span className="text-[8px] bg-accent-rose text-white px-1 rounded animate-pulse">URGENT</span>
                                                        )}
                                                    </p>
                                                    {(req.patientRm || req.doctorName || req.requiredDate) && (
                                                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
                                                            {req.requiredDate && (
                                                                <div className="flex flex-col">
                                                                    <span className="text-[8px] uppercase font-bold text-slate-400">Dibutuhkan</span>
                                                                    <span className="text-[10px] font-bold text-accent-indigo">{new Date(req.requiredDate).toLocaleDateString()}</span>
                                                                </div>
                                                            )}
                                                            {req.patientRm && (
                                                                <div className="flex flex-col">
                                                                    <span className="text-[8px] uppercase font-bold text-slate-400">No. RM</span>
                                                                    <span className="text-[10px] font-bold text-slate-700 font-mono">{req.patientRm}</span>
                                                                </div>
                                                            )}
                                                            {req.doctorName && (
                                                                <div className="flex flex-col">
                                                                    <span className="text-[8px] uppercase font-bold text-slate-400">Dokter</span>
                                                                    <span className="text-[10px] font-bold text-slate-700">{req.doctorName}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">{new Date(req.timestamp).toLocaleTimeString()}</p>
                                                <div className="flex gap-2 mt-2">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-accent-rose hover:bg-accent-rose/10 h-8"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            requestStatusMutation.mutate({ id: req.id, status: 'unavailable' });
                                                        }}
                                                    >
                                                        Stok Kosong
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                        {req.notes && (
                                            <div className="mt-4 p-3 bg-slate-100/50 rounded-xl text-[10px] text-slate-500 italic">
                                                " {req.notes} "
                                            </div>
                                        )}
                                    </Card>
                                ))}
                                {pendingRequests.length === 0 && (
                                    <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                                        <CheckCircle2 size={40} className="mx-auto text-slate-200 mb-4" />
                                        <h3 className="text-lg font-black text-slate-900">Semua Permintaan Terpenuhi</h3>
                                        <p className="text-sm text-slate-400 mt-1">Tidak ada permintaan pending saat ini.</p>
                                    </div>
                                )}
                            </div>

                            {selectedRequest && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                    <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 text-center">Pilih Alat Steril Yang Sesuai Untuk Dikirim</h4>
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
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-accent-emerald/10 text-accent-emerald flex items-center justify-center">
                                                        <Truck size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900">{item.name}</p>
                                                        <p className="text-[10px] text-slate-400 font-mono">{item.barcode}</p>
                                                    </div>
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Daftar Alat Steril Siap Kirim</h4>
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
                                    <div className="col-span-full text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                                        <Truck size={40} className="mx-auto text-slate-200 mb-4" />
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
                        </>
                    )}
                </div>

                {/* Right Column (Handover Form) */}
                <div className="space-y-6">
                    <Card className="bg-white shadow-xl">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                            <ClipboardList size={16} />
                            Handover Form
                        </h4>

                        <div className="space-y-6">
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 block">Penerima (Staff Unit)</label>
                                <select
                                    className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-4 focus:ring-slate-900/5 transition-all"
                                    value={selectedStaff}
                                    onChange={(e) => setSelectedStaff(e.target.value)}
                                >
                                    <option value="">Pilih Staff...</option>
                                    {staffList?.map(s => (
                                        <option key={s.id} value={s.name}>{s.name} ({s.department})</option>
                                    ))}
                                    {selectedReqObj && !staffList?.find(s => s.department === selectedReqObj.ward) && (
                                        <option value={`Staff ${selectedReqObj.ward}`}>Staff {selectedReqObj.ward}</option>
                                    )}
                                </select>
                            </div>

                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Item summary</p>
                                <p className="text-sm font-black text-slate-900">{selectedItem ? selectedTool?.name : '-- Belum Dipilih --'}</p>
                                <p className="text-[10px] text-slate-500 mt-1">
                                    {activeTab === 'requests' && selectedRequest
                                        ? `Memenuhi Permintaan: ${selectedReqObj?.items.map(i => `${i.quantity}x ${i.name}`).join(', ')} (${selectedReqObj?.ward})`
                                        : 'Status: Sterile & Ready'}
                                </p>
                            </div>

                            {!showSignature ? (
                                <Button
                                    className="w-full h-14 bg-slate-900 text-white gap-2 shadow-lg shadow-slate-900/20"
                                    disabled={!selectedItem || !selectedStaff}
                                    onClick={() => setShowSignature(true)}
                                >
                                    <UserCheck size={20} />
                                    Verifikasi Serah Terima
                                </Button>
                            ) : (
                                <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                                    <div className="flex p-1 bg-slate-100 rounded-lg">
                                        <button
                                            className={cn("flex-1 py-1.5 text-xs font-bold rounded-md transition-all", verificationMethod === 'signature' ? "bg-white shadow-sm text-slate-900" : "text-slate-400 hover:text-slate-600")}
                                            onClick={() => setVerificationMethod('signature')}
                                        >
                                            Digital Sign
                                        </button>
                                        <button
                                            className={cn("flex-1 py-1.5 text-xs font-bold rounded-md transition-all", verificationMethod === 'photo' ? "bg-white shadow-sm text-slate-900" : "text-slate-400 hover:text-slate-600")}
                                            onClick={() => setVerificationMethod('photo')}
                                        >
                                            Upload Foto
                                        </button>
                                        <button
                                            className={cn("flex-1 py-1.5 text-xs font-bold rounded-md transition-all", verificationMethod === 'print' ? "bg-white shadow-sm text-slate-900" : "text-slate-400 hover:text-slate-600")}
                                            onClick={() => setVerificationMethod('print')}
                                        >
                                            Cetak Form
                                        </button>
                                    </div>

                                    {verificationMethod === 'signature' ? (
                                        <div className="aspect-video bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center text-slate-300 relative group overflow-hidden">
                                            <PenTool size={32} className="group-hover:scale-110 transition-transform" />
                                            <span className="text-[10px] mt-2 font-bold uppercase">Sign Here</span>
                                            <div className="absolute inset-0 bg-white/20 opacity-0 active:opacity-100 transition-opacity flex items-center justify-center cursor-crosshair">
                                                <span className="text-slate-900 font-serif italic text-2xl">Accepted</span>
                                            </div>
                                        </div>
                                    ) : verificationMethod === 'photo' ? (
                                        <div className="space-y-3">
                                            <div className="relative aspect-video bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center overflow-hidden">
                                                {photoEvidence ? (
                                                    <img src={photoEvidence} alt="Bukti Serah Terima" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="text-center p-4">
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                            onChange={handlePhotoUpload}
                                                        />
                                                        <div className="flex flex-col items-center gap-2 text-slate-400">
                                                            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                                                                <Truck size={20} />
                                                            </div>
                                                            <span className="text-[10px] font-bold uppercase">Upload / Ambil Foto</span>
                                                        </div>
                                                    </div>
                                                )}
                                                {photoEvidence && (
                                                    <button
                                                        onClick={() => setPhotoEvidence(null)}
                                                        className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70"
                                                    >
                                                        <AlertCircle size={14} />
                                                    </button>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-slate-400 text-center">
                                                Ambil foto alat yang diserahterimakan sebagai bukti validasi.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="p-8 bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center text-center space-y-4">
                                            <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-400">
                                                <Printer size={24} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-900">Form Serah Terima (PDF)</p>
                                                <p className="text-[10px] text-slate-500 mt-1">Gunakan form cetak jika tidak memungkinkan tanda tangan digital.</p>
                                            </div>
                                            <Button variant="secondary" size="sm" className="bg-white border-slate-200 text-slate-600 h-9 gap-2">
                                                <Printer size={14} />
                                                Cetak Sekarang
                                            </Button>
                                        </div>
                                    )}

                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="sm" onClick={() => { setShowSignature(false); setPhotoEvidence(null); }} className="flex-1">Batal</Button>
                                        <Button
                                            size="sm"
                                            className="bg-accent-emerald text-white flex-1 shadow-lg shadow-accent-emerald/20"
                                            onClick={() => distributeMutation.mutate(selectedItem!)}
                                            disabled={distributeMutation.isPending || (verificationMethod === 'photo' && !photoEvidence)}
                                        >
                                            {distributeMutation.isPending ? 'Mengirim...' : 'Konfirmasi & Kirim'}
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
                            Logistik CSSD akan mencatat waktu serah terima secara otomatis. Pastikan unit tujuan sudah sesuai dengan permintaan.
                        </p>
                    </Card>
                </div>
            </div>
        </div>
    );
};
