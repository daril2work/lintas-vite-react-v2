import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { Card } from '../components/ui/Card';
import { Download, Activity, Package, Search, Calendar, User, Settings, Box, History } from 'lucide-react';
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
    const [activeTab, setActiveTab] = useState<'traceability' | 'sterilization' | 'bowie-dick' | 'distribution'>('traceability');
    const [search, setSearch] = useState('');
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    const { data: logs = [] } = useQuery({ queryKey: ['logs'], queryFn: api.getLogs });
    const { data: inventory = [] } = useQuery({ queryKey: ['inventory'], queryFn: api.getInventory });
    const { data: machines = [] } = useQuery({ queryKey: ['machines'], queryFn: api.getMachines });
    const { data: bdLogs = [] } = useQuery({ queryKey: ['bowie-dick-logs'], queryFn: api.getBowieDickLogs });

    const searchedItemSelector = search.length >= 2
        ? inventory.filter(item =>
            item.name.toLowerCase().includes(search.toLowerCase()) ||
            item.barcode.toLowerCase().includes(search.toLowerCase())
        ).slice(0, 5)
        : [];

    const filterByDate = <T extends { timestamp: string | Date }>(items: T[]) => {
        if (!startDate && !endDate) return items;
        return items.filter(item => {
            const date = new Date(item.timestamp);
            const start = startDate ? new Date(startDate) : new Date(0);
            const end = endDate ? new Date(endDate) : new Date();
            if (endDate) end.setHours(23, 59, 59, 999);
            return date >= start && date <= end;
        });
    };

    const filterBySearch = <T extends any>(items: T[], fields: (keyof T | string)[]) => {
        if (!search || activeTab === 'traceability') return items;
        const s = search.toLowerCase();
        return items.filter(item => {
            return fields.some(field => {
                const val = (item as any)[field];
                if (typeof val === 'string') return val.toLowerCase().includes(s);
                return false;
            });
        });
    };

    const filteredLogs = filterByDate(logs);
    const filteredBdLogs = filterByDate(bdLogs);

    const sterilizationLogs = filterBySearch(
        filteredLogs.filter(l => l.action.toLowerCase().includes('sterilization')),
        ['operatorId', 'notes']
    ).filter(l => {
        if (!search || activeTab === 'traceability') return true;
        const s = search.toLowerCase();
        const itemName = inventory.find(inv => inv.id === l.toolSetId)?.name.toLowerCase() || '';
        const machineName = machines.find(m => m.id === l.machineId)?.name.toLowerCase() || '';
        return itemName.includes(s) || machineName.includes(s);
    });

    const bowieDickLogs = filterBySearch(filteredBdLogs, ['operator_name', 'notes']).filter(l => {
        if (!search || activeTab === 'traceability') return true;
        const s = search.toLowerCase();
        const machineName = machines.find(m => m.id === l.machineId)?.name.toLowerCase() || '';
        return machineName.includes(s);
    });

    const distributionLogs = filterBySearch(
        filteredLogs.filter(l => l.action.toLowerCase().includes('distri')),
        ['operatorId', 'notes']
    ).filter(l => {
        if (!search || activeTab === 'traceability') return true;
        const s = search.toLowerCase();
        const itemName = inventory.find(inv => inv.id === l.toolSetId)?.name.toLowerCase() || '';
        return itemName.includes(s);
    });

    const selectedItem = inventory.find(i => i.id === selectedItemId);
    const displayLogs = selectedItemId
        ? filterByDate(logs.filter(l => l.toolSetId === selectedItemId))
        : filteredLogs.slice(0, 50);

    const handleExportPDF = () => {
        const doc = new jsPDF() as jsPDFWithPlugin;
        doc.setFontSize(22);

        let title = 'Report';
        let body: any[] = [];
        let head: string[][] = [];

        if (activeTab === 'traceability') {
            if (!selectedItem) return;
            title = `Traceability Report: ${selectedItem.name}`;
            doc.text(title, 14, 20);
            doc.setFontSize(10);
            doc.text(`Barcode: ${selectedItem.barcode}`, 14, 28);
            doc.text(`Kategori: ${selectedItem.category}`, 14, 34);
            if (startDate || endDate) doc.text(`Periode: ${startDate || 'Awal'} - ${endDate || 'Sekarang'}`, 14, 40);

            head = [['Waktu', 'Aktivitas', 'Mesin', 'Operator', 'Catatan']];
            body = displayLogs.map(log => [
                new Date(log.timestamp).toLocaleString('id-ID'),
                log.action,
                machines.find(m => m.id === log.machineId)?.name || '-',
                log.operatorId,
                log.notes || '-'
            ]);
        } else if (activeTab === 'sterilization') {
            title = 'Daily Sterilization Register';
            doc.text(title, 14, 20);
            if (startDate || endDate) doc.text(`Periode: ${startDate || 'Awal'} - ${endDate || 'Sekarang'}`, 14, 28);
            head = [['Waktu', 'Alat', 'Mesin', 'Operator', 'Status']];
            body = filteredLogs.filter(l => l.action.toLowerCase().includes('sterilization'))
                .map(l => [
                    new Date(l.timestamp).toLocaleString('id-ID'),
                    inventory.find(i => i.id === l.toolSetId)?.name || 'Batch',
                    machines.find(m => m.id === l.machineId)?.name || '-',
                    l.operatorId,
                    l.action.includes('Start') ? 'Started' : 'Finished'
                ]);
        } else if (activeTab === 'bowie-dick') {
            title = 'Bowie Dick Test Record';
            doc.text(title, 14, 20);
            if (startDate || endDate) doc.text(`Periode: ${startDate || 'Awal'} - ${endDate || 'Sekarang'}`, 14, 28);
            head = [['Waktu', 'Mesin', 'Hasil', 'Suhu/Tekanan', 'Operator']];
            body = filteredBdLogs.map(l => [
                new Date(l.timestamp).toLocaleString('id-ID'),
                machines.find(m => m.id === l.machineId)?.name || '-',
                l.result.toUpperCase(),
                `${l.temperature}°C / ${l.pressure} Bar`,
                l.operator_name
            ]);
        } else if (activeTab === 'distribution') {
            title = 'Distribution Log';
            doc.text(title, 14, 20);
            if (startDate || endDate) doc.text(`Periode: ${startDate || 'Awal'} - ${endDate || 'Sekarang'}`, 14, 28);
            head = [['Waktu', 'Alat', 'Operator', 'Catatan']];
            body = filteredLogs.filter(l => l.action.toLowerCase().includes('distri'))
                .map(l => [
                    new Date(l.timestamp).toLocaleString('id-ID'),
                    inventory.find(inv => inv.id === l.toolSetId)?.name || 'Batch',
                    l.operatorId,
                    l.notes || '-'
                ]);
        }

        doc.autoTable({
            startY: activeTab === 'traceability' ? (startDate || endDate ? 46 : 40) : (startDate || endDate ? 35 : 28),
            head: head,
            body: body,
            theme: 'grid',
            headStyles: { fillColor: [99, 102, 241] },
        });

        doc.save(`${title.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`);
    };



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
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl text-slate-900 font-black">Laporan CSSD</h1>
                    <p className="text-slate-500 mt-1">Dokumentasi dan audit aktivitas CSSD secara komprehensif.</p>
                </div>
                <div className="flex-1 max-w-md relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <Input
                        placeholder={activeTab === 'traceability' ? "Cari Alat untuk Lacak..." : "Cari di laporan..."}
                        className="pl-12 h-12 bg-white border-slate-200 shadow-sm"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    {(activeTab === 'traceability' && searchedItemSelector.length > 0) && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden">
                            {searchedItemSelector.map(item => (
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
                                        <p className="text-[10px] font-mono text-slate-400 uppercase">{item.barcode}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <div className="flex gap-2 relative">
                    <Button
                        variant="secondary"
                        className={cn("gap-2 border-slate-200 transition-all", showFilters ? "bg-slate-900 text-white border-slate-900" : "bg-white shadow-sm")}
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <Calendar size={18} />
                        Filter Tanggal
                    </Button>

                    {showFilters && (
                        <Card className="absolute top-full right-0 mt-2 z-50 p-4 shadow-2xl border-slate-100 min-w-[300px] animate-in fade-in slide-in-from-top-2">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tanggal Mulai</label>
                                    <Input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="h-10 text-xs"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tanggal Selesai</label>
                                    <Input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="h-10 text-xs"
                                    />
                                </div>
                                <div className="flex gap-2 pt-2 border-t border-slate-50">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        className="flex-1 text-[10px] font-black uppercase"
                                        onClick={() => { setStartDate(''); setEndDate(''); }}
                                    >
                                        Reset
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="flex-1 text-[10px] font-black uppercase shadow-lg shadow-accent-indigo/10"
                                        onClick={() => setShowFilters(false)}
                                    >
                                        Terapkan
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    )}

                    <Button
                        className="gap-2 shadow-lg shadow-accent-indigo/20"
                        onClick={handleExportPDF}
                    >
                        <Download size={18} /> Export PDF
                    </Button>
                </div>
            </div>

            <div className="flex bg-white p-1 rounded-2xl border border-slate-100 shadow-sm w-fit">
                {[
                    { id: 'traceability', label: 'Jejak Alat', icon: Search },
                    { id: 'sterilization', label: 'Register Steril', icon: Settings },
                    { id: 'bowie-dick', label: 'Log Bowie Dick', icon: Activity },
                    { id: 'distribution', label: 'Distribusi', icon: Download },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={cn(
                            "flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                            activeTab === tab.id
                                ? "bg-slate-900 text-white shadow-xl"
                                : "text-slate-400 hover:text-slate-600"
                        )}
                    >
                        <tab.icon size={14} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === 'traceability' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">


                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <Card className="md:col-span-1 p-6 space-y-6 bg-slate-50/50 border-none shadow-none">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Status Saat Ini</h4>
                            {selectedItem ? (
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Nama Alat</p>
                                        <p className="font-black text-slate-900 leading-tight">{selectedItem.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Barcode</p>
                                        <p className="font-mono text-sm text-accent-indigo font-bold">{selectedItem.barcode}</p>
                                    </div>
                                    <div className={cn(
                                        "px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center",
                                        selectedItem.status === 'sterile' ? "bg-accent-emerald/10 text-accent-emerald" : "bg-accent-indigo/10 text-accent-indigo"
                                    )}>
                                        {selectedItem.status}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <Package className="mx-auto text-slate-200 mb-4" size={48} />
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                                        Pilih alat untuk melihat<br />riwayat jejak (Traceability)
                                    </p>
                                </div>
                            )}
                        </Card>

                        <Card className="md:col-span-3 p-0 overflow-hidden border-none shadow-soft">
                            <div className="p-8">
                                {displayLogs.length > 0 ? (
                                    <div className="space-y-8 relative before:absolute before:inset-0 before:left-4 before:w-0.5 before:bg-slate-100 before:z-0">
                                        {displayLogs.map((log, i) => {
                                            const machine = machines.find(m => m.id === log.machineId);
                                            return (
                                                <div key={log.id || i} className="relative z-10 flex gap-8 group">
                                                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0 shadow-lg group-hover:scale-110 transition-transform", getLogColor(log.action))}>
                                                        {getActionIcon(log.action)}
                                                    </div>
                                                    <div className="flex-1 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm transition-all group-hover:shadow-md group-hover:border-slate-200">
                                                        <div className="flex items-center justify-between gap-2 mb-2">
                                                            <div className="flex items-center gap-3">
                                                                <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{log.action}</p>
                                                                <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-500 text-[10px] font-bold">
                                                                    {new Date(log.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                                                </span>
                                                            </div>
                                                            <span className="text-[10px] font-mono font-bold text-slate-400">
                                                                {new Date(log.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </div>
                                                        <div className="flex flex-wrap gap-4 mt-2">
                                                            <div className="flex items-center gap-2">
                                                                <User size={12} className="text-slate-400" />
                                                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Op: <span className="text-slate-900">{log.operatorId}</span></span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Settings size={12} className="text-slate-400" />
                                                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Mesin: <span className="text-slate-900">{machine?.name || '-'}</span></span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-20">
                                        <History className="mx-auto text-slate-200 mb-4" size={64} />
                                        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Pilih alat untuk melihat riwayat aktivitas</p>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>
                </div>
            )}

            {activeTab !== 'traceability' && (
                <Card className="p-0 overflow-hidden border-none shadow-soft animate-in fade-in duration-500">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-900 text-white">
                                <tr className="text-[10px] font-black uppercase tracking-widest">
                                    <th className="px-8 py-5">Waktu</th>
                                    {activeTab === 'sterilization' && (
                                        <>
                                            <th className="px-8 py-5">Nama Alat</th>
                                            <th className="px-8 py-5">Mesin</th>
                                            <th className="px-8 py-5">Operator</th>
                                            <th className="px-8 py-5">Detail</th>
                                        </>
                                    )}
                                    {activeTab === 'bowie-dick' && (
                                        <>
                                            <th className="px-8 py-5">Mesin</th>
                                            <th className="px-8 py-5">Suhu / Tekanan</th>
                                            <th className="px-8 py-5">Waktu Tahan</th>
                                            <th className="px-8 py-5">Hasil</th>
                                            <th className="px-8 py-5">Operator</th>
                                        </>
                                    )}
                                    {activeTab === 'distribution' && (
                                        <>
                                            <th className="px-8 py-5">Nama Alat</th>
                                            <th className="px-8 py-5">Operator</th>
                                            <th className="px-8 py-5">Catatan</th>
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {activeTab === 'sterilization' &&
                                    sterilizationLogs.map((l, i) => (
                                        <tr key={i} className="text-xs hover:bg-slate-50 transition-colors">
                                            <td className="px-8 py-4 font-bold text-slate-400">{new Date(l.timestamp).toLocaleString('id-ID')}</td>
                                            <td className="px-8 py-4 font-black">{inventory.find(inv => inv.id === l.toolSetId)?.name || 'Batch'}</td>
                                            <td className="px-8 py-4 font-bold text-accent-indigo">{machines.find(m => m.id === l.machineId)?.name || '-'}</td>
                                            <td className="px-8 py-4 text-slate-600 font-bold">{l.operatorId}</td>
                                            <td className="px-8 py-4">
                                                <span className={cn(
                                                    "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter",
                                                    l.action.includes('Start') ? "bg-accent-indigo text-white shadow-lg shadow-accent-indigo/20" : "bg-accent-emerald text-white shadow-lg shadow-accent-emerald/20"
                                                )}>
                                                    {l.action.includes('Start') ? 'Started' : 'Finished'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                }
                                {activeTab === 'bowie-dick' &&
                                    bowieDickLogs.map((l, i) => (
                                        <tr key={i} className="text-xs hover:bg-slate-50 transition-colors">
                                            <td className="px-8 py-4 font-bold text-slate-400">{new Date(l.timestamp).toLocaleString('id-ID')}</td>
                                            <td className="px-8 py-4 font-black text-slate-700">{machines.find(m => m.id === l.machineId)?.name || '-'}</td>
                                            <td className="px-8 py-4">
                                                <div className="flex gap-2 font-mono text-accent-indigo font-bold">
                                                    <span>{l.temperature}°C</span>
                                                    <span className="text-slate-200">/</span>
                                                    <span>{l.pressure} Bar</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-4 font-bold text-slate-500">{l.holding_time}m</td>
                                            <td className="px-8 py-4">
                                                <span className={cn(
                                                    "px-3 py-1 rounded-full text-[9px] font-black uppercase",
                                                    l.result === 'passed' ? "bg-accent-emerald text-white shadow-lg shadow-accent-emerald/20" : "bg-accent-rose text-white shadow-lg shadow-accent-rose/20"
                                                )}>
                                                    {l.result}
                                                </span>
                                            </td>
                                            <td className="px-8 py-4 font-bold text-slate-600">{l.operator_name}</td>
                                        </tr>
                                    ))
                                }
                                {activeTab === 'distribution' &&
                                    distributionLogs.map((l, i) => (
                                        <tr key={i} className="text-xs hover:bg-slate-50 transition-colors">
                                            <td className="px-8 py-4 font-bold text-slate-400">{new Date(l.timestamp).toLocaleString('id-ID')}</td>
                                            <td className="px-8 py-4 font-black">{inventory.find(inv => inv.id === l.toolSetId)?.name || 'Batch'}</td>
                                            <td className="px-8 py-4 font-bold text-slate-600">{l.operatorId}</td>
                                            <td className="px-8 py-4 italic text-slate-400">{l.notes || '-'}</td>
                                        </tr>
                                    ))
                                }
                                {(activeTab === 'sterilization' && sterilizationLogs.length === 0) && (
                                    <tr><td colSpan={5} className="px-8 py-10 text-center text-slate-400 italic">Data tidak ditemukan.</td></tr>
                                )}
                                {(activeTab === 'bowie-dick' && bowieDickLogs.length === 0) && (
                                    <tr><td colSpan={5} className="px-8 py-10 text-center text-slate-400 italic">Data tidak ditemukan.</td></tr>
                                )}
                                {(activeTab === 'distribution' && distributionLogs.length === 0) && (
                                    <tr><td colSpan={5} className="px-8 py-10 text-center text-slate-400 italic">Data tidak ditemukan.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
        </div>
    );
};

