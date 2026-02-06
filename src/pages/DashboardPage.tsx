import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { Card } from '../components/ui/Card';
import {
    PackageSearch,
    Waves,
    Box,
    Settings,
    Truck,
    TrendingUp,
    AlertCircle,
    Activity,
    ArrowRight
} from 'lucide-react';
import { cn } from '../utils/cn';
import { Button } from '../components/ui/Button';

export const DashboardPage = () => {
    const { data: inventory } = useQuery({
        queryKey: ['inventory'],
        queryFn: api.getInventory,
    });

    const { data: machines } = useQuery({
        queryKey: ['machines'],
        queryFn: api.getMachines,
    });

    const { data: requests } = useQuery({
        queryKey: ['requests'],
        queryFn: api.getRequests,
    });

    const { data: staffList } = useQuery({
        queryKey: ['staff'],
        queryFn: api.getStaff,
    });

    const { data: efficiency } = useQuery({
        queryKey: ['efficiency'],
        queryFn: api.getEfficiency,
    });

    const stats = [
        { label: 'Penerimaan', count: inventory?.filter(i => i.status === 'dirty').length || 0, icon: PackageSearch, color: 'text-accent-rose', bg: 'bg-accent-rose/10', path: '/intake' },
        { label: 'Pencucian', count: inventory?.filter(i => i.status === 'washing').length || 0, icon: Waves, color: 'text-accent-amber', bg: 'bg-accent-amber/10', path: '/washing' },
        { label: 'Pengepakan', count: inventory?.filter(i => i.status === 'packing').length || 0, icon: Box, color: 'text-accent-indigo', bg: 'bg-accent-indigo/10', path: '/packing' },
        { label: 'Sterilisasi', count: inventory?.filter(i => i.status === 'sterilizing').length || 0, icon: Settings, color: 'text-indigo-400', bg: 'bg-indigo-400/10', path: '/sterilizing' },
        { label: 'Siap Kirim', count: inventory?.filter(i => i.status === 'sterile').length || 0, icon: Truck, color: 'text-accent-emerald', bg: 'bg-accent-emerald/10', path: '/distribution' },
    ];

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl text-slate-900 font-black">Dashboard Utama</h1>
                    <p className="text-slate-500 mt-1">Pantau status alat medis dan antrian mesin secara real-time.</p>
                </div>
                <div className="flex gap-3">
                    <div className="bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent-emerald/10 text-accent-emerald flex items-center justify-center">
                            <TrendingUp size={16} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Efficiency</p>
                            <p className="text-sm font-black text-slate-900">+{efficiency || 0}%</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                {stats.map((stat) => (
                    <a key={stat.label} href={stat.path}>
                        <Card className="hover:scale-[1.02] cursor-pointer transition-all border-none shadow-soft hover:shadow-xl group overflow-hidden">
                            <div className={cn("absolute top-0 right-0 w-16 h-16 rounded-bl-full opacity-20 transition-all group-hover:w-full group-hover:h-full group-hover:rounded-none", stat.bg)}></div>
                            <div className="relative z-10 space-y-4">
                                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", stat.bg, stat.color)}>
                                    <stat.icon size={24} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                                    <h3 className="text-3xl font-black text-slate-900">{stat.count}</h3>
                                </div>
                                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 group-hover:text-accent-indigo transition-colors uppercase">
                                    Lihat Detail <ArrowRight size={10} />
                                </div>
                            </div>
                        </Card>
                    </a>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Status Mesin Terkini</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(machines || []).map(machine => (
                            <Card key={machine.id} className="hover:border-slate-200">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center",
                                            machine.status === 'running' ? "bg-accent-indigo/10 text-accent-indigo" : "bg-slate-100 text-slate-400"
                                        )}>
                                            <Activity size={20} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black capitalize">{machine.name}</p>
                                            <p className="text-[10px] text-slate-400 uppercase font-bold">{machine.type}</p>
                                        </div>
                                    </div>
                                    <span className={cn(
                                        "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                                        machine.status === 'running' ? "bg-accent-indigo text-white" : "bg-slate-100 text-slate-500"
                                    )}>
                                        {machine.status}
                                    </span>
                                </div>
                                {machine.status === 'running' && (
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-[10px] font-bold uppercase">
                                            <span className="text-slate-400">Progress</span>
                                            <span>{(machine as any).timeRemaining || 'In Progress'}</span>
                                        </div>
                                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-accent-indigo animate-pulse" style={{ width: `${(machine as any).progress || 50}%` }}></div>
                                        </div>
                                    </div>
                                )}
                                {machine.status === 'idle' && (
                                    <p className="text-[10px] text-slate-400 italic">Siap untuk digunakan.</p>
                                )}
                            </Card>
                        ))}
                    </div>

                    <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Permintaan Alat (Antrian Ruangan)</h4>
                    <Card className="p-0 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                    <tr>
                                        <th className="px-6 py-4">Prioritas</th>
                                        <th className="px-6 py-4">Unit</th>
                                        <th className="px-6 py-4">Item</th>
                                        <th className="px-6 py-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 text-slate-900">
                                    {(requests || []).slice(0, 5).map((req) => (
                                        <tr key={req.id} className="text-sm">
                                            <td className="px-6 py-4">
                                                <span className={cn(
                                                    "px-2 py-0.5 rounded-md text-[10px] font-black uppercase",
                                                    req.priority === 'urgent' ? "bg-accent-rose/10 text-accent-rose" : "bg-slate-100 text-slate-500"
                                                )}>
                                                    {req.priority}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-bold capitalize">{req.ward}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {req.items?.map((it, idx) => (
                                                        <span key={idx} className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">{it.name}</span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 uppercase font-black text-[10px]">
                                                {req.status}
                                            </td>
                                        </tr>
                                    ))}
                                    {(!requests || requests.length === 0) && (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-8 text-center text-slate-400 italic text-sm">Tidak ada antrian permintaan.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="bg-primary text-white border-none shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
                        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6">Pesan Penting</h4>
                        <div className="space-y-4">
                            <div className="flex gap-4 p-4 bg-slate-800/50 rounded-2xl border border-slate-700">
                                <AlertCircle className="text-accent-amber shrink-0" size={20} />
                                <div>
                                    <p className="text-xs font-bold mb-1">Cek Maintenance</p>
                                    <p className="text-[10px] text-slate-400 leading-relaxed">Autoclave 01 dijadwalkan kalibrasi rutin minggu ini.</p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6">Staff Terdaftar</h4>
                        <div className="space-y-4">
                            {(staffList || []).slice(0, 5).map(staff => (
                                <div key={staff.id} className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 uppercase font-black text-xs">
                                        {staff.name.charAt(0)}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-black text-slate-900">{staff.name}</p>
                                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{staff.role} • {staff.department}</p>
                                    </div>
                                    <div className="w-2 h-2 rounded-full bg-accent-emerald"></div>
                                </div>
                            ))}
                        </div>
                        <a href="/admin">
                            <Button variant="secondary" className="w-full mt-6 text-xs uppercase tracking-widest h-10">Manajemen Staff</Button>
                        </a>
                    </Card>
                </div>
            </div>
        </div>
    );
};

