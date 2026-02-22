import { useState, useRef, useCallback } from 'react';
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
    const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
    const [selectedStaff, setSelectedStaff] = useState('');
    const [showSignature, setShowSignature] = useState(false);
    const [activeTab, setActiveTab] = useState<'ready' | 'requests'>('ready');
    const [verificationMethod, setVerificationMethod] = useState<'signature' | 'photo' | 'print'>('signature');
    const [photoEvidence, setPhotoEvidence] = useState<string | null>(null);
    const [showPrintModal, setShowPrintModal] = useState(false);
    const [hasSignature, setHasSignature] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isDrawingRef = useRef(false);

    const getCanvasPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current!;
        const rect = canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) * (canvas.width / rect.width),
            y: (e.clientY - rect.top) * (canvas.height / rect.height)
        };
    };

    const startDraw = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
        isDrawingRef.current = true;
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext('2d')!;
        const pos = getCanvasPos(e);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
    }, []);

    const draw = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!isDrawingRef.current) return;
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext('2d')!;
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#1e293b';
        const pos = getCanvasPos(e);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        setHasSignature(true);
    }, []);

    const endDraw = useCallback(() => {
        isDrawingRef.current = false;
    }, []);

    const clearSignature = useCallback(() => {
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext('2d')!;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasSignature(false);
    }, []);

    const { data: inventory } = useQuery({ queryKey: ['inventory'], queryFn: api.getInventory });
    const { data: requests } = useQuery({ queryKey: ['requests'], queryFn: api.getRequests });
    const { data: staffList } = useQuery({ queryKey: ['staff'], queryFn: api.getStaff });
    const { data: rooms } = useQuery({ queryKey: ['rooms'], queryFn: api.getRooms });

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
            const roomName = rooms?.find(r => r.id === selectedRoom)?.name || 'Unknown Room';
            await api.addLog({
                toolSetId: id,
                action: 'Distribution',
                operatorId: user?.name || 'Operator',
                notes: `Distributed to ${selectedStaff} (${roomName}). ${activeTab === 'requests' ? 'Fulfilled request.' : ''}`,
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
            setSelectedRoom(null);
            setSelectedStaff('');
            setShowSignature(false);
            setPhotoEvidence(null);
            clearSignature();
            setHasSignature(false);
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
                                        onClick={() => {
                                            setSelectedRequest(req.id);
                                            // Auto-select room and staff if request unit matches a room
                                            const matchingRoom = rooms?.find(r => r.name.toLowerCase() === req.ward.toLowerCase());
                                            if (matchingRoom) {
                                                setSelectedRoom(matchingRoom.id);
                                                if (matchingRoom.picName) {
                                                    setSelectedStaff(matchingRoom.picName);
                                                }
                                            }
                                        }}
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
                                                    <span className="px-2 py-0.5 bg-slate-100 text-[10px] font-black rounded uppercase">
                                                        {item.expire_date
                                                            ? `Exp: ${new Date(item.expire_date).toLocaleDateString('id-ID')}`
                                                            : 'Exp: -'}
                                                    </span>
                                                    {item.sterilization_method && (
                                                        <span className="px-2 py-0.5 bg-accent-indigo/10 text-accent-indigo text-[10px] font-black rounded uppercase">
                                                            {item.sterilization_method.split(' ')[0]}
                                                        </span>
                                                    )}
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
                                        {(rooms || []).map(room => (
                                            <Card
                                                key={room.id}
                                                className={cn(
                                                    "hover:border-accent-indigo cursor-pointer group transition-all border-2",
                                                    selectedRoom === room.id ? "border-accent-indigo bg-accent-indigo/5" : "border-transparent"
                                                )}
                                                onClick={() => {
                                                    setSelectedRoom(room.id);
                                                    if (room.picName) {
                                                        setSelectedStaff(room.picName);
                                                    }
                                                }}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={cn(
                                                        "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                                                        selectedRoom === room.id ? "bg-accent-indigo text-white" : "bg-slate-100 text-slate-400 group-hover:text-accent-indigo"
                                                    )}>
                                                        <MapPin size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900">{room.name}</p>
                                                        <p className="text-[10px] text-slate-500 uppercase font-bold">PIC: {room.picName || 'Belum Diatur'}</p>
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
                                    onChange={(e) => {
                                        const staffName = e.target.value;
                                        setSelectedStaff(staffName);
                                        // Auto-select room based on PIC
                                        const roomForStaff = rooms?.find(r => r.picName === staffName);
                                        if (roomForStaff) {
                                            setSelectedRoom(roomForStaff.id);
                                        }
                                    }}
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
                                        <div className="space-y-2">
                                            <div
                                                className="aspect-video bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl overflow-hidden relative"
                                                style={{ touchAction: 'none' }}
                                            >
                                                <canvas
                                                    ref={canvasRef}
                                                    width={600}
                                                    height={280}
                                                    className="w-full h-full cursor-crosshair"
                                                    onPointerDown={startDraw}
                                                    onPointerMove={draw}
                                                    onPointerUp={endDraw}
                                                    onPointerLeave={endDraw}
                                                />
                                                {!hasSignature && (
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-slate-300">
                                                        <PenTool size={28} />
                                                        <span className="text-[10px] mt-2 font-bold uppercase">Tanda Tangan Di Sini</span>
                                                    </div>
                                                )}
                                            </div>
                                            {hasSignature && (
                                                <button
                                                    onClick={clearSignature}
                                                    className="text-[10px] text-slate-400 hover:text-accent-rose transition-colors font-bold uppercase tracking-widest"
                                                >
                                                    Hapus Tanda Tangan
                                                </button>
                                            )}
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
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                className="bg-white border-slate-200 text-slate-600 h-9 gap-2"
                                                onClick={() => setShowPrintModal(true)}
                                            >
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
                                            disabled={distributeMutation.isPending || (verificationMethod === 'photo' && !photoEvidence) || (verificationMethod === 'signature' && !hasSignature)}
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
            {/* Handover Form Print Modal */}
            {showPrintModal && selectedTool && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm print:p-0 print:bg-white print:static cursor-pointer"
                    onClick={() => setShowPrintModal(false)}
                >
                    <div
                        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden print:shadow-none print:w-full print:max-w-none print:rounded-none cursor-default"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center print:hidden">
                            <h3 className="font-bold text-slate-800 text-lg uppercase tracking-tight flex items-center gap-2">
                                <Printer size={20} className="text-accent-indigo" />
                                Preview Form Serah Terima
                            </h3>
                            <button onClick={() => setShowPrintModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-100 rounded-full">
                                <span className="sr-only">Close</span>
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="p-10 bg-slate-100 print:bg-white print:p-0 flex justify-center max-h-[70vh] overflow-y-auto print:max-h-none">
                            {/* Document Layout */}
                            <div id="print-handover-form" className="handover-document w-[21cm] min-h-[14.8cm] bg-white p-[1.2cm] shadow-sm print:shadow-none print:w-full">
                                {/* Letterhead */}
                                <div className="border-b-4 border-slate-900 pb-4 mb-6 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-xl">L</div>
                                        <div>
                                            <h1 className="text-xl font-black tracking-tighter text-slate-900">LINTAS CSSD</h1>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-tight">Digital Sterilization System</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <h2 className="text-base font-black text-slate-900 uppercase">Form Serah Terima</h2>
                                        <p className="text-[10px] font-mono text-slate-500">REF: {new Date().getTime().toString(16).toUpperCase()}</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {/* Info Grid */}
                                    <div className="grid grid-cols-2 gap-6 text-sm">
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Unit Pengirim</p>
                                                <p className="font-bold text-slate-900 text-xs">INSTALASI CSSD</p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Unit Tujuan</p>
                                                <p className="font-bold text-slate-900 text-xs uppercase">
                                                    {rooms?.find(r => r.id === selectedRoom)?.name || 'Unit Pelayanan'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="space-y-3 text-right">
                                            <div>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Tanggal & Waktu</p>
                                                <p className="font-bold text-slate-900 text-xs">{new Date().toLocaleString('id-ID')}</p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Petugas CSSD (Operator)</p>
                                                <p className="font-bold text-slate-900 text-xs capitalize">{user?.name || '---'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Item Table */}
                                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                                        <table className="w-full text-left text-xs border-collapse">
                                            <thead className="bg-slate-50 border-b border-slate-200">
                                                <tr>
                                                    <th className="px-3 py-2 font-black text-[9px] uppercase text-slate-500 border-r border-slate-200">No.</th>
                                                    <th className="px-3 py-2 font-black text-[9px] uppercase text-slate-500 border-r border-slate-200">Nama Alat / Set</th>
                                                    <th className="px-3 py-2 font-black text-[9px] uppercase text-slate-500 border-r border-slate-200">Barcode / ID</th>
                                                    <th className="px-3 py-2 font-black text-[9px] uppercase text-slate-500">Jumlah</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                <tr>
                                                    <td className="px-3 py-3 text-slate-500 border-r border-slate-100">1.</td>
                                                    <td className="px-3 py-3 font-bold text-slate-900">{selectedTool.name}</td>
                                                    <td className="px-3 py-3 font-mono text-slate-600">{selectedTool.barcode}</td>
                                                    <td className="px-3 py-3 font-bold text-slate-900 text-center">1 SET</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Signatures - Compacted for A4 */}
                                    <div className="grid grid-cols-2 mt-6 gap-8">
                                        <div className="text-center">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-12">Petugas Penyerah (CSSD)</p>
                                            <div className="space-y-1 inline-block w-40 border-t border-slate-900 pt-1">
                                                <p className="text-[10px] font-bold text-slate-900 uppercase">({user?.name || 'Operator'})</p>
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-12">Petugas Penerima (Unit)</p>
                                            <div className="space-y-1 inline-block w-40 border-t border-slate-900 pt-1">
                                                <p className="text-[10px] font-bold text-slate-900 uppercase">({selectedStaff || '...............'})</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 pt-4 border-t border-slate-100 text-[8px] text-center text-slate-400 font-mono italic">
                                    Dokumen ini dihasilkan secara otomatis oleh sistem LINTAS CSSD pada {new Date().toISOString()} • Cetakan Sah Handover Form.
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-white border-t border-slate-100 flex gap-4">
                            <button
                                className="flex-1 h-12 rounded-xl font-bold uppercase tracking-wider transition-all bg-slate-100 text-slate-600 hover:bg-slate-200 active:scale-95"
                                onClick={() => setShowPrintModal(false)}
                            >
                                Tutup
                            </button>
                            <button
                                className="flex-[2] h-12 rounded-xl font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 bg-slate-900 text-white shadow-xl shadow-slate-900/10 hover:bg-slate-800 active:scale-95"
                                onClick={() => {
                                    const roomName = rooms?.find(r => r.id === selectedRoom)?.name || 'Unit Pelayanan';
                                    const refCode = new Date().getTime().toString(16).toUpperCase();
                                    const dateStr = new Date().toLocaleString('id-ID');
                                    const isoStr = new Date().toISOString();
                                    const operatorName = user?.name || '---';

                                    const htmlContent = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <title>Form Serah Terima - ${refCode}</title>
  <style>
    @page { size: A4 portrait; margin: 1cm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; background: white; padding: 20px; line-height: 1.4; }
    .page-container { max-width: 800px; margin: 0 auto; border: 1px solid #f1f5f9; padding: 40px; }
    
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .brand { display: flex; align-items: center; gap: 15px; }
    .logo-circle { width: 60px; height: 60px; background: #000000; border-radius: 18px; display: flex; align-items: center; justify-content: center; color: white; font-size: 28px; font-weight: 900; }
    .org-details h1 { font-size: 24px; font-weight: 900; letter-spacing: -0.5px; color: #0f172a; }
    .org-details p { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #64748b; }
    
    .doc-info { text-align: right; }
    .doc-info h2 { font-size: 20px; font-weight: 900; color: #0f172a; text-transform: uppercase; }
    .doc-info p { font-size: 10px; font-family: monospace; color: #94a3b8; }
    
    .divider { height: 4px; background: #0f172a; margin: 20px 0 30px 0; border: none; }
    
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 30px; }
    .meta-group { display: flex; flex-direction: column; gap: 15px; }
    .meta-item { display: flex; flex-direction: column; }
    .label { font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 1.2px; color: #94a3b8; margin-bottom: 4px; }
    .value { font-size: 13px; font-weight: 800; color: #0f172a; }
    .info-right { text-align: right; }
    
    table { width: 100%; border-collapse: separate; border-spacing: 0; margin-bottom: 40px; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
    th { background: #f8fafc; padding: 12px 15px; font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; color: #64748b; border-bottom: 1px solid #e2e8f0; text-align: left; }
    th:not(:last-child) { border-right: 1px solid #e2e8f0; }
    td { padding: 15px; border-bottom: 1px solid #f1f5f9; font-size: 12px; color: #334155; }
    td:not(:last-child) { border-right: 1px solid #f1f5f9; }
    .row-no { width: 60px; color: #94a3b8; }
    .weight-bold { font-weight: 800; color: #0f172a; }
    .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
    tr:last-child td { border-bottom: none; }
    
    .signature-section { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 40px; padding: 0 40px; }
    .sig-box { text-align: center; display: flex; flex-direction: column; align-items: center; }
    .sig-label { font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 1.2px; color: #94a3b8; margin-bottom: 60px; }
    .sig-line { width: 220px; height: 1.5px; background: #0f172a; margin-bottom: 8px; }
    .sig-name { font-size: 11px; font-weight: 900; text-transform: uppercase; color: #0f172a; }
    
    .footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #f1f5f9; text-align: center; }
    .footer p { font-size: 8px; color: #94a3b8; font-style: italic; font-family: ui-monospace, monospace; }
    
    @media print {
      body { padding: 0; }
      .page-container { border: none; padding: 0; }
    }
  </style>
</head>
<body>
  <div class="page-container">
    <div class="header">
      <div class="brand">
        <div class="logo-circle">L</div>
        <div class="org-details">
          <h1>LINTAS CSSD</h1>
          <p>Digital Sterilization System</p>
        </div>
      </div>
      <div class="doc-info">
        <h2>Form Serah Terima</h2>
        <p>REF: ${refCode}</p>
      </div>
    </div>
    
    <hr class="divider" />
    
    <div class="meta-grid">
      <div class="meta-group">
        <div class="meta-item">
          <p class="label">Unit Pengirim</p>
          <p class="value">INSTALASI CSSD</p>
        </div>
        <div class="meta-item">
          <p class="label">Unit Tujuan</p>
          <p class="value">${roomName}</p>
        </div>
      </div>
      <div class="meta-group info-right">
        <div class="meta-item">
          <p class="label">Tanggal & Waktu</p>
          <p class="value">${dateStr}</p>
        </div>
        <div class="meta-item">
          <p class="label">Petugas CSSD (Operator)</p>
          <p class="value">${operatorName}</p>
        </div>
      </div>
    </div>
    
    <table>
      <thead>
        <tr>
          <th class="row-no">No.</th>
          <th>Nama Alat / Set</th>
          <th>Barcode / ID</th>
          <th style="text-align: right">Jumlah</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="row-no">1.</td>
          <td class="weight-bold">${selectedTool.name}</td>
          <td class="font-mono text-slate-500">${selectedTool.barcode}</td>
          <td class="weight-bold" style="text-align: right">1 SET</td>
        </tr>
      </tbody>
    </table>
    
    <div class="signature-section">
      <div class="sig-box">
        <p class="sig-label">Petugas Penyerah (CSSD)</p>
        <div class="sig-line"></div>
        <p class="sig-name">(${operatorName})</p>
      </div>
      <div class="sig-box">
        <p class="sig-label">Petugas Penerima (Unit)</p>
        <div class="sig-line"></div>
        <p class="sig-name">(${selectedStaff || 'BATMAN'})</p>
      </div>
    </div>
    
    <div class="footer">
      <p>Dokumen ini dihasilkan secara otomatis oleh sistem LINTAS CSSD pada ${isoStr} • Cetakan Sah Handover Form.</p>
    </div>
  </div>
</body>
</html>`;

                                    const printWindow = window.open('', '_blank', 'width=800,height=900');
                                    if (printWindow) {
                                        printWindow.document.write(htmlContent);
                                        printWindow.document.close();
                                        printWindow.focus();
                                        setTimeout(() => {
                                            printWindow.print();
                                            printWindow.close();
                                        }, 500);
                                    }
                                }}
                            >
                                <Printer size={18} />
                                Cetak Form Sekarang
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
