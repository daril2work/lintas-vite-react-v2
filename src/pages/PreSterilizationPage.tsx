import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import {
    ClipboardCheck,
    Settings,
    Thermometer,
    Activity,
    Timer,
    Printer,
    CheckCircle2,
    XCircle,
    AlertCircle,
    ShieldCheck
} from 'lucide-react';
import { cn } from '../utils/cn';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

export const PreSterilizationPage = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [selectedMachineId, setSelectedMachineId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        temperature: 134,
        pressure: 2.1,
        holding_time: 3.5,
        result: 'passed',
        notes: ''
    });

    const { data: machines } = useQuery({ queryKey: ['machines'], queryFn: api.getMachines });
    const sterilizers = machines?.filter(m => m.type === 'sterilizer') || [];
    const selectedMachine = sterilizers.find(m => m.id === selectedMachineId);

    const isBowieDickValid = (m: any) => {
        if (!m.last_bowie_dick_date) return false;
        const today = new Date().toISOString().split('T')[0];
        return m.last_bowie_dick_date === today && m.bowie_dick_status === 'passed';
    };

    const approveMutation = useMutation({
        mutationFn: async (machineId: string) => {
            // 1. Create Log Entry
            await api.createBowieDickLog({
                machineId,
                temperature: formData.temperature,
                pressure: formData.pressure,
                holding_time: Math.round(formData.holding_time * 60), // Store in seconds if needed, or minutes. Log uses Integer. I'll use minutes.
                result: formData.result,
                operator_name: user?.name || 'Operator',
                notes: formData.notes
            });

            // 2. Approve Machine if passed
            if (formData.result === 'passed') {
                await api.approveBowieDick(machineId);
            } else {
                // If failed, just mark status
                await api.updateMachineStatus(machineId, 'error');
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['machines'] });
            toast.success('Bowie Dick Test Berhasil Dicatat', {
                description: formData.result === 'passed' ? 'Mesin sekarang siap digunakan.' : 'Mesin telah ditandai bermasalah.'
            });
            handlePrint();
        },
        onError: (error: any) => {
            toast.error('Gagal mencatat test', { description: error.message });
        }
    });

    const handlePrint = () => {
        if (!selectedMachine) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const content = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <title>Bowie Dick Test Certificate - ${selectedMachine.name}</title>
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
    .doc-info p { font-size: 14px; font-weight: 700; color: #64748b; margin-top: 4px; }
    
    .divider { height: 4px; background: #0f172a; margin: 20px 0 30px 0; border: none; }
    
    .result-banner { text-align: center; padding: 25px; border-radius: 16px; margin-bottom: 30px; border: 2px solid; }
    .result-banner.passed { background: #f0fdf4; color: #16a34a; border-color: #bbf7d0; }
    .result-banner.failed { background: #fef2f2; color: #dc2626; border-color: #fecaca; }
    .result-banner h3 { font-size: 24px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; }
    
    .content-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
    .info-card { padding: 15px; border: 1px solid #e2e8f0; border-radius: 12px; }
    .label { font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 1.2px; color: #94a3b8; margin-bottom: 5px; }
    .value { font-size: 14px; font-weight: 800; color: #0f172a; }
    
    .notes-box { padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background: #f8fafc; margin-bottom: 30px; }
    .notes-text { font-size: 12px; color: #334155; font-style: italic; }
    
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
        <h2>Bowie Dick Certificate</h2>
        <p>Daily Sterilizer Validation</p>
      </div>
    </div>
    
    <hr class="divider" />
    
    <div class="result-banner ${formData.result}">
      <h3>${formData.result === 'passed' ? 'PASSED / NORMAL' : 'FAILED / ERROR'}</h3>
    </div>
    
    <div class="content-grid">
      <div class="info-card">
        <p class="label">Unit / Machine</p>
        <p class="value">${selectedMachine.name}</p>
      </div>
      <div class="info-card">
        <p class="label">Date & Time</p>
        <p class="value">${new Date().toLocaleString('id-ID')}</p>
      </div>
      <div class="info-card">
        <p class="label">Temperature</p>
        <p class="value">${formData.temperature}°C</p>
      </div>
      <div class="info-card">
        <p class="label">Pressure</p>
        <p class="value">${formData.pressure} Bar</p>
      </div>
      <div class="info-card">
        <p class="label">Holding Time</p>
        <p class="value">${formData.holding_time} Minutes</p>
      </div>
      <div class="info-card">
        <p class="label">Operator</p>
        <p class="value">${user?.name || 'Operator CSSD'}</p>
      </div>
    </div>
    
    <div class="notes-box">
      <p class="label">Technical Notes</p>
      <p class="notes-text">${formData.notes || 'No additional technical notes provided.'}</p>
    </div>
    
    <div class="signature-section">
      <div class="sig-box">
        <p class="sig-label">Machine Operator</p>
        <div class="sig-line"></div>
        <p class="sig-name">(${user?.name || '________________'})</p>
      </div>
      <div class="sig-box">
        <p class="sig-label">CSSD Supervisor</p>
        <div class="sig-line"></div>
        <p class="sig-name">(________________)</p>
      </div>
    </div>
    
    <div class="footer">
      <p>Dokumen ini dihasilkan secara otomatis oleh sistem LINTAS CSSD sebagai bukti validasi harian mesin sterilisasi.</p>
    </div>
  </div>
  <script>window.print();</script>
</body>
</html>`;

        printWindow.document.write(content);
        printWindow.document.close();
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Pre-sterilisasi</h1>
                    <p className="text-slate-500 mt-1 italic">Validasi harian (Bowie Dick Test) untuk memastikan performa Autoclave.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-accent-amber animate-pulse"></span>
                            <span className="text-sm font-bold text-slate-700">Harian: {sterilizers.filter(isBowieDickValid).length} / {sterilizers.length} Mesin Siap</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Machine Selection List */}
                <div className="lg:col-span-1 space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Pilih Sterilizer</h4>
                    <div className="grid gap-3">
                        {sterilizers.map(machine => {
                            const isValid = isBowieDickValid(machine);
                            const isSelected = selectedMachineId === machine.id;

                            return (
                                <Card
                                    key={machine.id}
                                    className={cn(
                                        "cursor-pointer transition-all border-2",
                                        isSelected ? "border-accent-indigo ring-2 ring-accent-indigo/10 shadow-lg" : "border-slate-100 hover:border-slate-200",
                                        isValid ? "bg-emerald-50/30" : "bg-white"
                                    )}
                                    onClick={() => setSelectedMachineId(machine.id)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                                                isSelected ? "bg-accent-indigo text-white" : "bg-slate-50 text-slate-400"
                                            )}>
                                                <Settings size={20} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black truncate">{machine.name}</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                                    {machine.status}
                                                </p>
                                            </div>
                                        </div>
                                        {isValid ? (
                                            <div className="bg-accent-emerald/10 p-1.5 rounded-full">
                                                <CheckCircle2 size={16} className="text-accent-emerald" />
                                            </div>
                                        ) : (
                                            <div className="bg-accent-amber/10 p-1.5 rounded-full animate-pulse">
                                                <AlertCircle size={16} className="text-accent-amber" />
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                </div>

                {/* Technical Form */}
                <div className="lg:col-span-2 space-y-6">
                    {selectedMachineId ? (
                        <Card className="p-8 space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-accent-amber/10 rounded-2xl flex items-center justify-center text-accent-amber shadow-sm border border-accent-amber/5">
                                        <ClipboardCheck size={28} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-slate-900 leading-tight">Sheet Test Bowie Dick</h2>
                                        <p className="text-xs text-slate-400 font-medium uppercase tracking-widest mt-0.5">{selectedMachine?.name}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Status Hari Ini</p>
                                    <span className={cn(
                                        "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm",
                                        isBowieDickValid(selectedMachine) ? "bg-accent-emerald text-white" : "bg-accent-amber text-white"
                                    )}>
                                        {isBowieDickValid(selectedMachine) ? 'Terverifikasi' : 'Butuh Validasi'}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-slate-600">
                                                <Thermometer size={16} className="text-rose-500" />
                                                <label className="text-xs font-black uppercase tracking-widest italic">Temperature (°C)</label>
                                            </div>
                                            <span className="text-xs font-black text-slate-900 bg-slate-100 px-2 py-1 rounded-md">{formData.temperature}°C</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="100"
                                            max="140"
                                            step="0.5"
                                            className="w-full accent-rose-500"
                                            value={formData.temperature}
                                            onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-slate-600">
                                                <Activity size={16} className="text-accent-indigo" />
                                                <label className="text-xs font-black uppercase tracking-widest italic">Pressure (Bar)</label>
                                            </div>
                                            <span className="text-xs font-black text-slate-900 bg-slate-100 px-2 py-1 rounded-md">{formData.pressure} Bar</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="3.5"
                                            step="0.1"
                                            className="w-full accent-accent-indigo"
                                            value={formData.pressure}
                                            onChange={(e) => setFormData({ ...formData, pressure: parseFloat(e.target.value) })}
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-slate-600">
                                                <Timer size={16} className="text-accent-amber" />
                                                <label className="text-xs font-black uppercase tracking-widest italic">Holding Time (Min)</label>
                                            </div>
                                            <span className="text-xs font-black text-slate-900 bg-slate-100 px-2 py-1 rounded-md">{formData.holding_time} Menit</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="1"
                                            max="10"
                                            step="0.5"
                                            className="w-full accent-accent-amber"
                                            value={formData.holding_time}
                                            onChange={(e) => setFormData({ ...formData, holding_time: parseFloat(e.target.value) })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-slate-500">Hasil Indikator</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                className={cn(
                                                    "flex items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all group",
                                                    formData.result === 'passed' ? "bg-emerald-50 border-accent-emerald text-accent-emerald font-black shadow-md shadow-emerald-100/50" : "border-slate-100 hover:border-emerald-200 text-slate-400"
                                                )}
                                                onClick={() => setFormData({ ...formData, result: 'passed' })}
                                            >
                                                <CheckCircle2 size={20} className={cn("transition-transform group-hover:scale-110", formData.result === 'passed' ? "text-accent-emerald" : "text-slate-300")} />
                                                NORMAL
                                            </button>
                                            <button
                                                className={cn(
                                                    "flex items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all group",
                                                    formData.result === 'failed' ? "bg-rose-50 border-rose-500 text-rose-500 font-black shadow-md shadow-rose-100/50" : "border-slate-100 hover:border-rose-200 text-slate-400"
                                                )}
                                                onClick={() => setFormData({ ...formData, result: 'failed' })}
                                            >
                                                <XCircle size={20} className={cn("transition-transform group-hover:scale-110", formData.result === 'failed' ? "text-rose-500" : "text-slate-300")} />
                                                ERROR
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-widest text-slate-500">Catatan Tambahan</label>
                                        <textarea
                                            className="w-full h-24 p-4 rounded-2xl border-2 border-slate-100 focus:border-accent-indigo focus:ring-4 focus:ring-accent-indigo/5 bg-slate-50/50 resize-none text-sm transition-all"
                                            placeholder="Tuliskan catatan teknis jika ada..."
                                            value={formData.notes}
                                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
                                <Button
                                    className="flex-1 h-16 bg-slate-900 hover:bg-black text-white rounded-2xl shadow-xl shadow-slate-200 flex items-center justify-center gap-3 group transition-all"
                                    onClick={() => approveMutation.mutate(selectedMachineId!)}
                                    disabled={approveMutation.isPending}
                                >
                                    <ShieldCheck className="group-hover:scale-110 transition-transform" />
                                    <span className="text-base font-black tracking-tight">SIMPAN & APPROVE MESIN</span>
                                </Button>
                                <Button
                                    variant="secondary"
                                    className="h-16 px-8 rounded-2xl border-2 border-slate-100 hover:bg-slate-50 flex items-center justify-center gap-2 group transition-all"
                                    onClick={handlePrint}
                                >
                                    <Printer size={20} className="text-slate-400 group-hover:text-slate-900 group-hover:scale-110 transition-transform" />
                                    <span className="text-xs font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-900">Cetak Bukti</span>
                                </Button>
                            </div>
                        </Card>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center space-y-4 text-slate-400 py-20 grayscale opacity-50 border-4 border-dashed border-slate-100 rounded-[2rem]">
                            <div className="p-8 bg-slate-50 rounded-full border-2 border-white shadow-inner">
                                <Activity size={64} className="animate-pulse" />
                            </div>
                            <p className="font-black uppercase tracking-widest text-sm italic">Pilih mesin untuk memulai validasi harian.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PreSterilizationPage;
