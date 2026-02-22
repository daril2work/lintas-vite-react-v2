import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, MASTER_DATA } from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Box, Printer, CheckSquare, ListChecks, QrCode, Info, Calendar } from 'lucide-react';
import { cn } from '../utils/cn';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

export const PackingPage = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [selectedItem, setSelectedItem] = useState<string | null>(null);
    const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());
    const [programId, setProgramId] = useState('p1');
    const [overrideExpire, setOverrideExpire] = useState(false);
    const [overrideDate, setOverrideDate] = useState('');

    const { data: inventory } = useQuery({ queryKey: ['inventory'], queryFn: api.getInventory });

    const washingItems = inventory?.filter(item => item.status === 'washing') || [];
    const selectedTool = inventory?.find(item => item.id === selectedItem);

    const activeProgram = MASTER_DATA.STERILIZATION_PROGRAMS.find(p => p.id === programId)
        || MASTER_DATA.STERILIZATION_PROGRAMS[0];

    // ---- Date Helpers ----
    const getPackDate = () => new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });

    // Returns the effective expire date (override or auto)
    const getExpireDate = (days: number = activeProgram.expire_days) => {
        if (overrideExpire && overrideDate) {
            return new Date(overrideDate).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
        }
        const d = new Date();
        d.setDate(d.getDate() + days);
        return d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const getExpireDateISO = (days: number = activeProgram.expire_days) => {
        if (overrideExpire && overrideDate) {
            return new Date(overrideDate).toISOString();
        }
        const d = new Date();
        d.setDate(d.getDate() + days);
        return d.toISOString();
    };

    // Build the default date string for the date input (yyyy-mm-dd)
    const getDefaultInputDate = () => {
        const d = new Date();
        d.setDate(d.getDate() + activeProgram.expire_days);
        return d.toISOString().slice(0, 10);
    };

    // ---- Checklist ----
    const checklistItems = [
        'Gunting Jaringan (2)', 'Pinset Chirugis (1)', 'Pinset Anatomis (1)',
        'Klem Arteri (4)', 'Nald Voerder (2)', 'Handle Scalpel (2)'
    ];
    const isChecklistComplete = checkedItems.size === checklistItems.length;

    const toggleCheck = (index: number) => {
        const newChecked = new Set(checkedItems);
        if (newChecked.has(index)) newChecked.delete(index);
        else newChecked.add(index);
        setCheckedItems(newChecked);
    };

    const handleSelect = (id: string) => {
        setSelectedItem(id);
        setCheckedItems(new Set());
        setOverrideExpire(false);
        setOverrideDate('');

        // Auto-select program based on tool's default method
        const item = inventory?.find(i => i.id === id);
        if (item?.default_sterilization_method) {
            const program = MASTER_DATA.STERILIZATION_PROGRAMS.find(p => p.name === item.default_sterilization_method);
            if (program) {
                setProgramId(program.id);
            }
        }
    };

    // ---- Mutation ----
    const finishPackingMutation = useMutation({
        mutationFn: async (id: string) => {
            const expIso = getExpireDateISO();
            await api.updatePackingData(id, expIso, activeProgram.name);
            await api.addLog({
                toolSetId: id,
                action: 'Packing & Labeling',
                operatorId: user?.name || 'Operator',
                notes: `Dikemas dengan metode ${activeProgram.name}. Kadaluarsa: ${getExpireDate()}`
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
            setSelectedItem(null);
            setCheckedItems(new Set());
            toast.success('Pengepakan Selesai!', { description: 'Item siap untuk proses sterilisasi.' });
        },
        onError: (err: any) => {
            toast.error('Gagal menyimpan', { description: err.message });
        }
    });

    // ---- Popup Print ----
    const handlePrintLabel = () => {
        if (!selectedTool) return;

        const packDate = getPackDate();
        const expDate = getExpireDate();
        const barcode = selectedTool.barcode;
        const name = selectedTool.name;
        const operator = user?.name?.toUpperCase() || 'OPERATOR';
        const method = activeProgram.name;

        const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8"/>
  <title>Label ${name}</title>
  <style>
    @page { size: 10cm 6cm; margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { width: 10cm; height: 6cm; font-family: 'Courier New', monospace; background: white; display: flex; align-items: stretch; }
    .label {
      width: 100%; padding: 6mm; display: flex; flex-direction: column;
      justify-content: space-between; border: 2px solid #111;
    }
    .top { display: flex; justify-content: space-between; align-items: flex-start; gap: 4mm; }
    .name { font-size: 13pt; font-weight: 900; text-transform: uppercase; line-height: 1.2; }
    .sub  { font-size: 7pt; color: #666; margin-top: 1mm; }
    .qr   { width: 18mm; height: 18mm; border: 1px solid #ccc; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .qr svg { width: 16mm; height: 16mm; }
    .mid  { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 2mm; border-top: 1px solid #ccc; padding-top: 2mm; }
    .field label { font-size: 6pt; font-weight: 700; text-transform: uppercase; color: #888; }
    .field p     { font-size: 8pt; font-weight: 900; margin-top: 0.5mm; }
    .expire p    { color: #c00; }
    .bot  { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #ccc; padding-top: 1.5mm; }
    .bot span { font-size: 6.5pt; color: #555; }
    .dot  { width: 5mm; height: 5mm; border-radius: 50%; background: #e00; }
    @media print { @page { size: 10cm 6cm; margin:0; } }
  </style>
</head>
<body>
  <div class="label">
    <div class="top">
      <div>
        <div class="name">${name}</div>
        <div class="sub">CSSD UNIT INTERNAL</div>
      </div>
      <div class="qr">
        <svg viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="2" y="2" width="20" height="20" fill="none" stroke="#111" stroke-width="3"/>
          <rect x="8" y="8" width="8" height="8" fill="#111"/>
          <rect x="28" y="2" width="20" height="20" fill="none" stroke="#111" stroke-width="3"/>
          <rect x="34" y="8" width="8" height="8" fill="#111"/>
          <rect x="2" y="28" width="20" height="20" fill="none" stroke="#111" stroke-width="3"/>
          <rect x="8" y="34" width="8" height="8" fill="#111"/>
          <rect x="28" y="28" width="4" height="4" fill="#111"/>
          <rect x="34" y="28" width="4" height="4" fill="#111"/>
          <rect x="40" y="28" width="4" height="4" fill="#111"/>
          <rect x="46" y="28" width="4" height="4" fill="#111"/>
          <rect x="28" y="34" width="4" height="4" fill="#111"/>
          <rect x="34" y="40" width="4" height="4" fill="#111"/>
          <rect x="40" y="34" width="4" height="4" fill="#111"/>
          <rect x="46" y="40" width="4" height="4" fill="#111"/>
          <rect x="28" y="46" width="4" height="4" fill="#111"/>
          <rect x="40" y="46" width="4" height="4" fill="#111"/>
        </svg>
      </div>
    </div>
    <div class="mid">
      <div class="field">
        <label>Date Packed</label>
        <p>${packDate}</p>
      </div>
      <div class="field expire">
        <label>Expire Date</label>
        <p>${expDate}</p>
      </div>
      <div class="field">
        <label>Metode</label>
        <p>${method.split(' ')[0]}</p>
      </div>
    </div>
    <div class="bot">
      <span>ID: ${barcode} | BY: ${operator}</span>
      <div class="dot"></div>
    </div>
  </div>
  <script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); }</script>
</body>
</html>`;

        const popup = window.open('', '_blank', 'width=400,height=300,menubar=no,toolbar=no,location=no,status=no');
        if (popup) {
            popup.document.write(html);
            popup.document.close();
        } else {
            toast.error('Popup diblokir browser', { description: 'Izinkan popup di browser Anda untuk mencetak label.' });
        }
    };

    // ---- Render ----
    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl text-slate-900">Pengepakan Alat</h1>
                    <p className="text-slate-500 mt-1">Perakitan set instrumen dan pencetakan label indikator.</p>
                </div>
                <div className="bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-accent-indigo animate-pulse"></span>
                        <span className="text-sm font-bold text-slate-700">{washingItems.length} Siap Pack</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Item list + Checklist */}
                <div className="lg:col-span-2 space-y-6">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Pilih Item dari Pencucian</h4>
                    <div className="grid grid-cols-1 gap-4">
                        {washingItems.length > 0 ? washingItems.map(item => (
                            <Card
                                key={item.id}
                                className={cn(
                                    "hover:border-accent-indigo cursor-pointer transition-all border-2",
                                    selectedItem === item.id ? "border-accent-indigo" : "border-transparent"
                                )}
                                onClick={() => handleSelect(item.id)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                                            <Box size={24} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900">{item.name}</p>
                                            <p className="text-xs text-slate-500 uppercase font-mono tracking-wider">{item.barcode} • {item.category}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="px-3 py-1 bg-accent-indigo/10 text-accent-indigo rounded-full text-[10px] font-black uppercase tracking-widest">
                                            SELESAI CUCI
                                        </span>
                                        <div className={cn(
                                            "w-6 h-6 rounded-full border-2 flex items-center justify-center",
                                            selectedItem === item.id ? "bg-accent-indigo border-accent-indigo text-white" : "border-slate-200"
                                        )}>
                                            {selectedItem === item.id && <CheckSquare size={14} />}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        )) : (
                            <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200">
                                <p className="text-slate-400">Belum ada alat yang selesai dicuci.</p>
                            </div>
                        )}
                    </div>

                    {selectedTool && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Daftar Isi Set (Checklist)</h4>
                            <Card className="p-0 overflow-hidden">
                                <div className="bg-slate-50 px-8 py-4 border-b border-slate-100 flex justify-between items-center">
                                    <span className="text-sm font-black uppercase tracking-tighter">{selectedTool.name}</span>
                                    <span className="text-[10px] font-bold text-slate-500">ISI: {checklistItems.length} INSTRUMEN</span>
                                </div>
                                <div className="p-8 space-y-4">
                                    {checklistItems.map((inst, i) => (
                                        <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0 cursor-pointer hover:bg-slate-50 px-2 rounded -mx-2" onClick={() => toggleCheck(i)}>
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                                                    checkedItems.has(i) ? "bg-accent-indigo border-accent-indigo text-white" : "border-slate-300 bg-white"
                                                )}>
                                                    {checkedItems.has(i) && <CheckSquare size={12} />}
                                                </div>
                                                <span className={cn("text-sm", checkedItems.has(i) ? "text-slate-900 font-bold" : "text-slate-700")}>{inst}</span>
                                            </div>
                                            <span className={cn(
                                                "text-[10px] font-bold px-2 py-0.5 rounded uppercase transition-colors",
                                                checkedItems.has(i) ? "bg-accent-emerald/10 text-accent-emerald" : "bg-slate-100 text-slate-400"
                                            )}>
                                                {checkedItems.has(i) ? 'Verified' : 'Unchecked'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                <div className="bg-slate-50 px-8 py-4 border-t border-slate-100 flex justify-between items-center">
                                    <span className="text-xs text-slate-500">{checkedItems.size} / {checklistItems.length} Verified</span>
                                    {!isChecklistComplete && <span className="text-xs font-bold text-accent-rose">Wajib Check Semua!</span>}
                                </div>
                            </Card>
                        </div>
                    )}
                </div>

                {/* Right: Label Preview + Method Selector + Actions */}
                <div className="space-y-6">
                    {/* Sterilization Method Selector */}
                    <Card className="border-2 border-accent-indigo/30">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                            <Calendar size={14} className="text-accent-indigo" />
                            Metode &amp; Expire Date
                        </h4>
                        <div className="space-y-3">
                            {MASTER_DATA.STERILIZATION_PROGRAMS.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => { setProgramId(p.id); setOverrideExpire(false); setOverrideDate(''); }}
                                    className={cn(
                                        "w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all text-left",
                                        programId === p.id
                                            ? "border-accent-indigo bg-accent-indigo/5"
                                            : "border-slate-100 hover:border-slate-200 bg-white"
                                    )}
                                >
                                    <div>
                                        <p className={cn("text-sm font-black", programId === p.id ? "text-accent-indigo" : "text-slate-700")}>{p.name}</p>
                                        <p className="text-[10px] text-slate-400">{p.temp}°C • {p.duration} min</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] text-slate-400 uppercase font-bold">Expire</p>
                                        <p className={cn("text-xs font-black", programId === p.id ? "text-accent-rose" : "text-slate-500")}>
                                            {p.expire_days === 1 ? '24 Jam' : p.expire_days < 14 ? `${p.expire_days} Hari` : p.expire_days === 14 ? '2 Minggu' : '1 Bulan'}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Override Toggle */}
                        <div className="mt-4 pt-4 border-t border-slate-100">
                            <label className="flex items-center gap-3 cursor-pointer select-none group">
                                <div
                                    className={cn(
                                        "w-9 h-5 rounded-full transition-colors relative flex-shrink-0",
                                        overrideExpire ? "bg-accent-rose" : "bg-slate-200"
                                    )}
                                    onClick={() => {
                                        const next = !overrideExpire;
                                        setOverrideExpire(next);
                                        if (next && !overrideDate) setOverrideDate(getDefaultInputDate());
                                        if (!next) setOverrideDate('');
                                    }}
                                >
                                    <span className={cn(
                                        "absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform",
                                        overrideExpire && "translate-x-4"
                                    )} />
                                </div>
                                <div>
                                    <p className="text-xs font-black text-slate-700">Override Expire Date</p>
                                    <p className="text-[10px] text-slate-400">Atur tanggal kadaluarsa secara manual</p>
                                </div>
                            </label>

                            {overrideExpire && (
                                <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <input
                                        type="date"
                                        value={overrideDate}
                                        min={new Date().toISOString().slice(0, 10)}
                                        onChange={(e) => setOverrideDate(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border-2 border-accent-rose/50 bg-accent-rose/5 text-sm font-bold text-slate-900 focus:outline-none focus:border-accent-rose transition-colors"
                                    />
                                    <p className="text-[10px] text-accent-rose mt-1.5 font-bold">
                                        ⚠ Tanggal ini akan menggantikan kalkulasi otomatis
                                    </p>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Label Preview */}
                    <Card className="bg-white border-2 border-slate-200 shadow-xl relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-accent-indigo/10 flex items-center justify-center text-accent-indigo">
                                    <QrCode size={20} />
                                </div>
                                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">Label Preview</h4>
                            </div>

                            <div className="aspect-[5/3] bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 p-5 flex flex-col justify-between mb-5">
                                <div>
                                    <p className="text-[10px] font-black uppercase text-slate-400 mb-0.5">SET NAME</p>
                                    <p className="text-base font-black tracking-tight leading-tight">{selectedTool?.name || '---'}</p>
                                    <p className="text-[9px] text-slate-400 mt-0.5">CSSD UNIT INTERNAL</p>
                                </div>
                                <div className="flex justify-between items-end border-t border-slate-200 pt-3">
                                    <div className="grid grid-cols-3 gap-3 flex-1">
                                        <div>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase">Packed</p>
                                            <p className="text-[10px] font-black">{selectedTool ? getPackDate() : '---'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-bold text-accent-rose uppercase">Expire</p>
                                            <p className="text-[10px] font-black text-accent-rose">{selectedTool ? getExpireDate() : '---'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase">Metode</p>
                                            <p className="text-[10px] font-black">{activeProgram.name.split(' ')[0]}</p>
                                        </div>
                                    </div>
                                    <QrCode size={32} className="text-slate-800 ml-3 shrink-0" />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Button
                                    variant="secondary"
                                    className="w-full h-12 gap-2 border-slate-200"
                                    disabled={!selectedItem}
                                    onClick={handlePrintLabel}
                                >
                                    <Printer size={18} />
                                    Print Label Saja
                                </Button>
                                <Button
                                    className="w-full h-14 gap-2 shadow-lg"
                                    disabled={!selectedItem || !isChecklistComplete || finishPackingMutation.isPending}
                                    onClick={() => selectedItem && finishPackingMutation.mutate(selectedItem)}
                                >
                                    <ListChecks size={20} />
                                    Simpan &amp; Selesai Pack
                                </Button>
                            </div>
                        </div>
                    </Card>

                    <Card className="bg-accent-amber/5 border-accent-amber/20">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-accent-amber mb-3 flex items-center gap-2">
                            <Info size={14} />
                            Security Check
                        </h4>
                        <p className="text-[10px] leading-relaxed text-slate-600">
                            Pastikan indikator internal/eksternal sudah disisipkan sebelum packing ditutup. Tanda tangan digital operator akan dicatat dalam history alat.
                        </p>
                    </Card>
                </div>
            </div>
        </div>
    );
};
