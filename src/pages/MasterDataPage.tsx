import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Users, Database, Settings, Plus, Search, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { cn } from '../utils/cn';

type TabType = 'staff' | 'inventory' | 'machines';

export const MasterDataPage = () => {
    const [activeTab, setActiveTab] = useState<TabType>('staff');

    const { data: staff } = useQuery({ queryKey: ['staff'], queryFn: api.getStaff });
    const { data: inventory } = useQuery({ queryKey: ['inventory'], queryFn: api.getInventory });
    const { data: machines } = useQuery({ queryKey: ['machines'], queryFn: api.getMachines });

    const tabs = [
        { id: 'staff', label: 'Staff & User', icon: Users },
        { id: 'inventory', label: 'Inventory (Set/Alat)', icon: Database },
        { id: 'machines', label: 'Daftar Mesin', icon: Settings },
    ];

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl text-slate-900">Master Data</h1>
                    <p className="text-slate-500 mt-1">Konfigurasi data dasar sistem CSSD Lintas.</p>
                </div>
                <Button className="gap-2">
                    <Plus size={18} />
                    Tambah Data Baru
                </Button>
            </div>

            <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as TabType)}
                        className={cn(
                            "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
                            activeTab === tab.id
                                ? "bg-white text-primary shadow-sm"
                                : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                        )}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </div>

            <Card className="p-0 overflow-hidden border-none shadow-soft">
                <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder={`Cari ${activeTab}...`}
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-accent-indigo/5 focus:border-accent-indigo/30 transition-all"
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button variant="secondary" size="sm" className="h-11">Filter</Button>
                        <Button variant="secondary" size="sm" className="h-11">Export CSV</Button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/50 text-[10px] uppercase tracking-widest font-black text-slate-400">
                            {activeTab === 'staff' && (
                                <tr>
                                    <th className="px-8 py-4">Nama Staff</th>
                                    <th className="px-8 py-4">ID Pegawai</th>
                                    <th className="px-8 py-4">Departemen</th>
                                    <th className="px-8 py-4">Role</th>
                                    <th className="px-8 py-4"></th>
                                </tr>
                            )}
                            {activeTab === 'inventory' && (
                                <tr>
                                    <th className="px-8 py-4">Nama Set / Alat</th>
                                    <th className="px-8 py-4">Barcode</th>
                                    <th className="px-8 py-4">Kategori</th>
                                    <th className="px-8 py-4">Status Terakhir</th>
                                    <th className="px-8 py-4"></th>
                                </tr>
                            )}
                            {activeTab === 'machines' && (
                                <tr>
                                    <th className="px-8 py-4">Nama Mesin</th>
                                    <th className="px-8 py-4">Model / Type</th>
                                    <th className="px-8 py-4">Status</th>
                                    <th className="px-8 py-4">Last Maintenance</th>
                                    <th className="px-8 py-4"></th>
                                </tr>
                            )}
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {activeTab === 'staff' && staff?.map(item => (
                                <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-accent-indigo/10 text-accent-indigo flex items-center justify-center font-bold text-xs">
                                                {item.name.charAt(0)}
                                            </div>
                                            <span className="font-bold text-slate-900">{item.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-sm text-slate-500 font-mono italic">{item.employeeId}</td>
                                    <td className="px-8 py-5 text-sm text-slate-600">{item.department}</td>
                                    <td className="px-8 py-5">
                                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-black uppercase text-slate-500">
                                            {item.role}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <button className="p-2 text-slate-300 hover:text-slate-500 transition-colors">
                                            <MoreVertical size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}

                            {activeTab === 'inventory' && inventory?.map(item => (
                                <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                                    <td className="px-8 py-5 font-bold text-slate-900">{item.name}</td>
                                    <td className="px-8 py-5 text-sm font-mono text-slate-400 italic font-bold">{item.barcode}</td>
                                    <td className="px-8 py-5 text-sm text-slate-600">{item.category}</td>
                                    <td className="px-8 py-5">
                                        <span className={cn(
                                            "px-2 py-0.5 rounded-md text-[10px] font-black uppercase",
                                            item.status === 'sterile' ? "bg-accent-emerald/10 text-accent-emerald" : "bg-slate-100 text-slate-500"
                                        )}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-2 text-slate-400 hover:text-accent-indigo transition-colors"><Edit2 size={16} /></button>
                                            <button className="p-2 text-slate-400 hover:text-accent-rose transition-colors"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {activeTab === 'machines' && machines?.map(item => (
                                <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                                    <td className="px-8 py-5 font-bold text-slate-900">{item.name}</td>
                                    <td className="px-8 py-5 text-sm text-slate-600 uppercase tracking-wider font-bold">XZ-ALPHA-2024</td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-2">
                                            <div className={cn(
                                                "w-2 h-2 rounded-full",
                                                item.status === 'idle' ? "bg-accent-emerald" : "bg-accent-amber"
                                            )}></div>
                                            <span className="text-xs font-bold text-slate-700 capitalize">{item.status}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-sm text-slate-500">20 Jan 2026</td>
                                    <td className="px-8 py-5 text-right">
                                        <button className="p-2 text-slate-300 hover:text-slate-500 transition-colors">
                                            <MoreVertical size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};
