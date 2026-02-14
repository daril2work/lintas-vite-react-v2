import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { Card } from '../components/ui/Card';
import { Download, Filter, Activity, Package, Search, Calendar, User, Settings, Box, History } from 'lucide-react';
import { cn } from '../utils/cn';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import type { UserOptions } from 'jspdf-autotable';

// Extend jsPDF with autotable
interface jsPDFWithPlugin extends jsPDF {
    autoTable: (options: UserOptions) => jsPDF;
}

export const ReportsPage = () => {
    const [search, setSearch] = useState('');
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

    const { data: logs = [] } = useQuery({ queryKey: ['logs'], queryFn: api.getLogs });
    const { data: inventory = [] } = useQuery({ queryKey: ['inventory'], queryFn: api.getInventory });
    const { data: machines = [] } = useQuery({ queryKey: ['machines'], queryFn: api.getMachines });

    const selectedItem = inventory.find(i => i.id === selectedItemId);
    const displayLogs = selectedItemId
        ? logs.filter(l => l.toolSetId === selectedItemId)
        : logs.slice(0, 20);

    const handleExportPDF = () => {
        if (!selectedItem) return;

        const doc = new jsPDF() as jsPDFWithPlugin;

        // Header
        doc.setFontSize(22);
        doc.text('Traceability Report', 14, 20);
        doc.setFontSize(10);
        doc.text(`Generated on: ${new Date().toLocaleString('id-ID')}`, 14, 28);

        // Tool Info
        doc.setFontSize(14);
        doc.text('Informasi Alat', 14, 40);
        doc.setFontSize(10);
        doc.text(`Nama: ${selectedItem.name}`, 14, 48);
        doc.text(`Barcode: ${selectedItem.barcode}`, 14, 54);
        doc.text(`Kategori: ${selectedItem.category}`, 14, 60);
        doc.text(`Status Saat Ini: ${selectedItem.status.toUpperCase()}`, 14, 66);

        // Activity Table
        doc.setFontSize(14);
        doc.text('Riwayat Jejak (Traceability)', 14, 80);

        const tableData = displayLogs.map(log => [
            new Date(log.timestamp).toLocaleString('id-ID'),
            log.action,
            machines.find(m => m.id === log.machineId)?.name || '-',
            log.operatorId,
            log.notes || '-'
        ]);

        doc.autoTable({
            startY: 85,
            head: [['Waktu', 'Aktivitas', 'Mesin', 'Operator', 'Catatan']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [99, 102, 241] }, // accent-indigo
        });

        doc.save(`Traceability_${selectedItem.barcode}_${new Date().getTime()}.pdf`);
    };

    // Filtered inventory for search
    const searchedItems = search.length >= 2
        ? inventory.filter(item =>
            item.name.toLowerCase().includes(search.toLowerCase()) ||
            item.barcode.toLowerCase().includes(search.toLowerCase())
        ).slice(0, 5)
        : [];


    const getLogColor = (action: string) => {
        const a = action.toLowerCase();
        if (a.includes('penerimaan')) return 'bg-accent-rose';
        if (a.includes('cuci')) return 'bg-accent-amber';
        if (a.includes('pack')) return 'bg-accent-indigo';
        if (a.includes('sterilization')) return 'bg-accent-emerald';
        if (a.includes('distri')) return 'bg-slate-900';
        return 'bg-slate-400';
    };

    const getActionIcon = (action: string) => {
        const a = action.toLowerCase();
        if (a.includes('penerimaan')) return <Package size={14} />;
        if (a.includes('cuci')) return <History size={14} />;
        if (a.includes('pack')) return <Box size={14} />;
        if (a.includes('steri')) return <Settings size={14} />;
        if (a.includes('distri')) return <User size={14} />;
        return <Activity size={14} />;
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl text-slate-900">Traceability Report</h1>
                    <p className="text-slate-500 mt-1">Lacak riwayat lengkap setiap alat medis secara mendetail.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="secondary" className="gap-2"><Filter size={18} /> Laporan Bulanan</Button>
                    <Button
                        className="gap-2"
                        disabled={!selectedItemId}
                        onClick={handleExportPDF}
                    >
                        <Download size={18} /> Export PDF Traceability
                    </Button>
                </div>
            </div>

            {/* Traceability Search Bar */}
            <Card className="p-6 border-accent-indigo/20 bg-accent-indigo/5">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Cari Barcode atau Nama Alat (Traceability)</label>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <Input
                                placeholder="Contoh: SET-001 atau Minor Surgery Set..."
                                className="pl-12 h-12 bg-white border-none shadow-soft"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            {searchedItems.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden">
                                    {searchedItems.map(item => (
                                        <button
                                            key={item.id}
                                            onClick={() => {
                                                setSelectedItemId(item.id);
                                                setSearch('');
                                            }}
                                            className="w-full p-4 hover:bg-slate-50 flex items-center justify-between text-left transition-colors border-b border-slate-50 last:border-0"
                                        >
                                            <div>
                                                <p className="font-bold text-slate-900 text-sm">{item.name}</p>
                                                <p className="text-[10px] font-mono text-slate-400 uppercase">{item.barcode} • {item.category}</p>
                                            </div>
                                            <span className={cn(
                                                "px-2 py-0.5 rounded-md text-[8px] font-black uppercase",
                                                item.status === 'sterile' ? "bg-accent-emerald/10 text-accent-emerald" : "bg-accent-amber/10 text-accent-amber"
                                            )}>{item.status}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    {selectedItemId && (
                        <Button
                            variant="ghost"
                            className="h-12 text-slate-400 hover:text-slate-900"
                            onClick={() => setSelectedItemId(null)}
                        >
                            Reset
                        </Button>
                    )}
                </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="md:col-span-1 p-6 space-y-6">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Status Saat Ini</h4>
                    {selectedItem ? (
                        <div className="space-y-4">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Nama Alat</p>
                                <p className="font-black text-slate-900">{selectedItem.name}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Barcode</p>
                                <p className="font-mono text-sm text-accent-indigo">{selectedItem.barcode}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Kategori</p>
                                <p className="text-sm font-bold text-slate-700">{selectedItem.category}</p>
                            </div>
                            <div className="pt-4 border-t border-slate-100">
                                <div className={cn(
                                    "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest text-center",
                                    selectedItem.status === 'sterile' ? "bg-accent-emerald text-white shadow-lg shadow-accent-emerald/20" :
                                        selectedItem.status === 'dirty' ? "bg-accent-rose text-white shadow-lg shadow-accent-rose/20" :
                                            "bg-accent-indigo text-white shadow-lg shadow-accent-indigo/20"
                                )}>
                                    {selectedItem.status}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <Package className="mx-auto text-slate-200 mb-2" size={32} />
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Pilih alat untuk melihat detail</p>
                        </div>
                    )}
                </Card>

                <Card className="md:col-span-3 p-0 overflow-hidden">
                    <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">
                            {selectedItemId ? `Riwayat Jejak: ${selectedItem?.name}` : 'Log Aktivitas Terkini'}
                        </h4>
                        <div className="flex gap-4 text-[10px] font-bold text-slate-400">
                            <span className="flex items-center gap-1.5"><Calendar size={12} /> Real-time tracking</span>
                        </div>
                    </div>
                    <div className="p-8">
                        {displayLogs.length > 0 ? (
                            <div className="space-y-8 relative before:absolute before:inset-0 before:left-4 before:w-0.5 before:bg-slate-100 before:z-0">
                                {displayLogs.map((log, i) => {
                                    const machine = machines.find(m => m.id === log.machineId);
                                    return (
                                        <div key={log.id || i} className="relative z-10 flex gap-8 group">
                                            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0 shadow-lg transition-transform group-hover:scale-110", getLogColor(log.action))}>
                                                {getActionIcon(log.action)}
                                            </div>
                                            <div className="flex-1 bg-white group-hover:bg-slate-50/50 p-4 rounded-2xl border border-transparent group-hover:border-slate-100 transition-all">
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                                                    <div className="flex items-center gap-3">
                                                        <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{log.action}</p>
                                                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[9px] font-bold">
                                                            {new Date(log.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        </span>
                                                    </div>
                                                    <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">
                                                        {new Date(log.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div className="flex items-center gap-2">
                                                        <User size={12} className="text-slate-400" />
                                                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Operator: <span className="text-slate-900">{log.operatorId}</span></span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Settings size={12} className="text-slate-400" />
                                                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Mesin: <span className="text-slate-900">{machine?.name || '-'}</span></span>
                                                    </div>
                                                    {!selectedItemId && (
                                                        <div className="flex items-center gap-2">
                                                            <Box size={12} className="text-slate-400" />
                                                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Alat: <span className="text-slate-900 truncate max-w-[100px]">{inventory.find(inv => inv.id === log.toolSetId)?.name || 'Batch'}</span></span>
                                                        </div>
                                                    )}
                                                </div>
                                                {log.notes && (
                                                    <div className="mt-3 p-2 bg-slate-50 rounded-xl border-l-4 border-slate-200">
                                                        <p className="text-[10px] italic text-slate-500">"{log.notes}"</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-20 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                                <History className="mx-auto text-slate-200 mb-4" size={48} />
                                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Belum ada riwayat jejak untuk alat ini</p>
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
};

