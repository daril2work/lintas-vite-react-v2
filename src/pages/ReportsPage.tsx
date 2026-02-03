import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { Card } from '../components/ui/Card';
import { Download, Filter, Activity, Clock, Package } from 'lucide-react';
import { cn } from '../utils/cn';
import { Button } from '../components/ui/Button';

export const ReportsPage = () => {
    const { data: logs } = useQuery({ queryKey: ['logs'], queryFn: api.getLogs });
    console.log(logs); // Use it

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl text-slate-900">History & Laporan</h1>
                    <p className="text-slate-500 mt-1">Lacak jejak alat dan produktivitas harian CSSD.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="secondary" className="gap-2"><Filter size={18} /> Filter</Button>
                    <Button className="gap-2"><Download size={18} /> Export PDF</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Total Sterilisasi', value: '142', sub: 'Hari ini', icon: Activity, color: 'text-indigo-500' },
                    { label: 'Avg. Turnaround', value: '2.4j', sub: 'Target: 3j', icon: Clock, color: 'text-accent-emerald' },
                    { label: 'Alat Terpakai', value: '48', sub: 'Stock: 156', icon: Package, color: 'text-accent-amber' },
                ].map(stat => (
                    <Card key={stat.label} className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className={cn("w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center", stat.color)}>
                                <stat.icon size={20} />
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.sub}</span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                        <h3 className="text-2xl font-black">{stat.value}</h3>
                    </Card>
                ))}
            </div>

            <Card className="p-0 overflow-hidden">
                <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">Timeline Aktivitas</h4>
                    <div className="flex gap-4 text-[10px] font-bold text-slate-400">
                        <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-accent-rose"></div> Intake</span>
                        <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-accent-indigo"></div> Pack</span>
                        <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-accent-emerald"></div> Sterile</span>
                    </div>
                </div>
                <div className="p-8">
                    <div className="space-y-8 relative before:absolute before:inset-0 before:left-4 before:w-0.5 before:bg-slate-100 before:z-0">
                        {[
                            { action: 'Alat Didistribusikan', tool: 'Set Bedah Dasar A', staff: 'Budi (Logistik)', time: '10:30', color: 'bg-slate-900' },
                            { action: 'Sterilisasi Selesai', tool: 'Set Ortopedi 05', staff: 'System (Autoclave A)', time: '09:45', color: 'bg-accent-emerald' },
                            { action: 'Packing Terverifikasi', tool: 'Basic Kit IBS', staff: 'Siti Aminah', time: '09:12', color: 'bg-accent-indigo' },
                            { action: 'Penerimaan Alat', tool: 'Set Bedah Dasar A', staff: 'Andi (Shift Pagi)', time: '08:30', color: 'bg-accent-rose' },
                        ].map((log, i) => (
                            <div key={i} className="relative z-10 flex gap-8">
                                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0 shadow-lg", log.color)}>
                                    <Clock size={14} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <p className="text-sm font-black text-slate-900">{log.action}</p>
                                        <span className="text-[10px] font-bold text-slate-300">{log.time}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 font-medium">Item: <span className="font-bold text-slate-700">{log.tool}</span> • Staff: {log.staff}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </Card>
        </div>
    );
};

