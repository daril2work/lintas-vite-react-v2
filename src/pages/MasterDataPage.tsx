import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, MASTER_DATA } from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Users, Database, Settings, Plus, Search, Edit2, Trash2, X, ChevronRight, PackageCheck, Box } from 'lucide-react';
import { cn } from '../utils/cn';

type TabType = 'staff' | 'inventory' | 'machines';

export const MasterDataPage = () => {
    const [activeTab, setActiveTab] = useState<TabType>('staff');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        barcode: '',
        category: MASTER_DATA.CATEGORIES[0],
        quantity: 1,
        // Staff fields
        employeeId: '',
        department: MASTER_DATA.DEPARTMENTS[0],
        role: MASTER_DATA.ROLES[0],
        username: '',
        password: '',
        // Machine fields
        type: MASTER_DATA.MACHINE_TYPES[0]
    });

    // Edit & delete states
    const [editingItem, setEditingItem] = useState<any>(null);
    const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
    const [credentialsModal, setCredentialsModal] = useState<{ isOpen: boolean, staff: any | null }>({ isOpen: false, staff: null });

    const queryClient = useQueryClient();

    const { data: staff } = useQuery({ queryKey: ['staff'], queryFn: api.getStaff });
    const { data: inventory } = useQuery({ queryKey: ['inventory'], queryFn: api.getInventory });
    const { data: machines } = useQuery({ queryKey: ['machines'], queryFn: api.getMachines });

    // Group inventory by name
    const groupedInventory = inventory?.reduce((acc, item) => {
        if (!acc[item.name]) {
            acc[item.name] = {
                name: item.name,
                category: item.category,
                total: 0,
                available: 0,
                items: []
            };
        }
        acc[item.name].total += 1;
        if (item.status === 'sterile') {
            acc[item.name].available += 1;
        }
        acc[item.name].items.push(item);
        return acc;
    }, {} as Record<string, { name: string, category: string, total: number, available: number, items: typeof inventory }>) || {};

    const createToolMutation = useMutation({
        mutationFn: api.createToolSet,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
            setIsModalOpen(false);
            resetForm();
        },
    });

    const createStaffMutation = useMutation({
        mutationFn: api.createStaff,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['staff'] });
            setIsModalOpen(false);
            resetForm();
        },
    });

    const createMachineMutation = useMutation({
        mutationFn: api.createMachine,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['machines'] });
            setIsModalOpen(false);
            resetForm();
        },
    });

    const updateToolMutation = useMutation({
        mutationFn: ({ id, data }: { id: string, data: any }) => api.updateTool(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
            setEditingItem(null);
            setIsModalOpen(false);
        },
    });

    const deleteToolMutation = useMutation({
        mutationFn: api.deleteTool,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
        },
    });

    const updateStaffMutation = useMutation({
        mutationFn: ({ id, data }: { id: string, data: any }) => api.updateStaff(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['staff'] });
            setEditingItem(null);
            setIsModalOpen(false);
            setCredentialsModal({ isOpen: false, staff: null });
        },
    });

    const deleteStaffMutation = useMutation({
        mutationFn: api.deleteStaff,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['staff'] });
        },
    });

    const updateMachineMutation = useMutation({
        mutationFn: ({ id, data }: { id: string, data: any }) => api.updateMachine(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['machines'] });
            setEditingItem(null);
            setIsModalOpen(false);
        },
    });

    const deleteMachineMutation = useMutation({
        mutationFn: api.deleteMachine,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['machines'] });
        },
    });

    const resetForm = () => {
        setFormData({
            name: '', barcode: '', category: MASTER_DATA.CATEGORIES[0], quantity: 1,
            employeeId: '', department: MASTER_DATA.DEPARTMENTS[0], role: MASTER_DATA.ROLES[0],
            username: '', password: '',
            type: MASTER_DATA.MACHINE_TYPES[0]
        });
        setEditingItem(null);
    };

    const tabs = [
        { id: 'staff', label: 'Staff & User', icon: Users },
        { id: 'inventory', label: 'Inventory (Set/Alat)', icon: Database },
        { id: 'machines', label: 'Daftar Mesin', icon: Settings },
    ];

    const generateSequentialBarcode = (baseBarcode: string, index: number) => {
        if (index === 0) return baseBarcode;
        const match = baseBarcode.match(/^(.*?)(\d+)$/);
        if (match) {
            const prefix = match[1];
            const number = match[2];
            const newNumber = (parseInt(number) + index).toString().padStart(number.length, '0');
            return `${prefix}${newNumber}`;
        }
        return `${baseBarcode}-${index + 1}`;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (activeTab === 'inventory') {
            if (editingItem) {
                updateToolMutation.mutate({
                    id: editingItem.id,
                    data: { name: formData.name, barcode: formData.barcode, category: formData.category }
                });
            } else {
                const qty = formData.quantity || 1;
                for (let i = 0; i < qty; i++) {
                    const newBarcode = generateSequentialBarcode(formData.barcode, i);
                    await createToolMutation.mutateAsync({
                        name: formData.name,
                        barcode: newBarcode,
                        category: formData.category
                    });
                }
            }
        } else if (activeTab === 'staff') {
            if (editingItem) {
                updateStaffMutation.mutate({
                    id: editingItem.id,
                    data: {
                        name: formData.name,
                        employeeId: formData.employeeId,
                        department: formData.department,
                        role: formData.role as any,
                        username: formData.username,
                        password: formData.password
                    }
                });
            } else {
                // Auto-generate username and password for new staff if not provided
                const username = formData.username || formData.name.toLowerCase().replace(/\s+/g, '.');
                const password = formData.password || Math.random().toString(36).slice(-8);

                createStaffMutation.mutate({
                    name: formData.name,
                    employeeId: formData.employeeId,
                    department: formData.department,
                    role: formData.role as any,
                    username,
                    password
                });
            }
        } else if (activeTab === 'machines') {
            if (editingItem) {
                updateMachineMutation.mutate({
                    id: editingItem.id,
                    data: { name: formData.name, type: formData.type as any }
                });
            } else {
                createMachineMutation.mutate({
                    name: formData.name,
                    type: formData.type as any
                });
            }
        }
    };

    // ... (rest of the component)

    // UI snippet for Modal content needs to be inserted here? No, I'll do it in a separate edit to keep it clean.
    // Wait, the ReplacementContent must be contiguous.
    // I will replace the top part first (imports to handleSubmit).
    // Then I will do a separate edit for the Modal UI.

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl text-slate-900">Master Data</h1>
                    <p className="text-slate-500 mt-1">Konfigurasi data dasar sistem CSSD Lintas.</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)} className="gap-2">
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
                                    <th className="px-8 py-4">Kredensial</th>
                                    <th className="px-8 py-4"></th>
                                </tr>
                            )}
                            {activeTab === 'inventory' && (
                                <tr>
                                    <th className="px-8 py-4">Nama Set / Alat</th>
                                    <th className="px-8 py-4">Kategori</th>
                                    <th className="px-8 py-4 text-center">Total Inventory</th>
                                    <th className="px-8 py-4 text-center">Siap Distribusi</th>
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
                                    <td className="px-8 py-5">
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={() => setCredentialsModal({ isOpen: true, staff: item })}
                                            className="text-xs"
                                        >
                                            Detail
                                        </Button>
                                    </td>
                                    <td className="px-8 py-5 text-right flex justify-end gap-2">
                                        <button
                                            onClick={() => {
                                                setEditingItem(item);
                                                setFormData({
                                                    name: item.name,
                                                    barcode: '',
                                                    category: MASTER_DATA.CATEGORIES[0],
                                                    quantity: 1,
                                                    employeeId: item.employeeId,
                                                    department: item.department,
                                                    role: item.role,
                                                    username: item.username || '',
                                                    password: item.password || '',
                                                    type: 'washer'
                                                });
                                                setIsModalOpen(true);
                                            }}
                                            className="p-1.5 text-slate-400 hover:text-accent-indigo hover:bg-accent-indigo/10 rounded transition-colors"
                                            title="Edit Staff"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (confirm(`Apakah Anda yakin ingin menghapus staff "${item.name}"?`)) {
                                                    deleteStaffMutation.mutate(item.id);
                                                }
                                            }}
                                            className="p-1.5 text-slate-400 hover:text-accent-rose hover:bg-accent-rose/10 rounded transition-colors"
                                            title="Hapus Staff"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}

                            {activeTab === 'inventory' && Object.values(groupedInventory).map((group: any) => (
                                <>
                                    <tr
                                        key={group.name}
                                        className={cn(
                                            "group transition-colors cursor-pointer",
                                            expandedGroup === group.name ? "bg-slate-50" : "hover:bg-slate-50/50"
                                        )}
                                        onClick={() => setExpandedGroup(expandedGroup === group.name ? null : group.name)}
                                    >
                                        <td className="px-8 py-5 font-bold text-slate-900 flex items-center gap-2">
                                            <ChevronRight size={16} className={cn("text-slate-400 transition-transform", expandedGroup === group.name && "rotate-90")} />
                                            {group.name}
                                        </td>
                                        <td className="px-8 py-5 text-sm text-slate-600">{group.category}</td>
                                        <td className="px-8 py-5 text-center">
                                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full">
                                                <Box size={14} className="text-slate-500" />
                                                <span className="text-xs font-bold text-slate-700">{group.total} Unit</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-emerald/10 rounded-full">
                                                <PackageCheck size={14} className="text-accent-emerald" />
                                                <span className="text-xs font-bold text-accent-emerald">{group.available} Ready</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    size="sm"
                                                    className="h-8 px-3 gap-1 bg-accent-emerald text-white hover:bg-accent-emerald/90 shadow-sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        resetForm();
                                                        setFormData(prev => ({ ...prev, name: group.name, category: group.category, barcode: '' }));
                                                        setEditingItem(null);
                                                        setIsModalOpen(true);
                                                    }}
                                                >
                                                    <Plus size={14} />
                                                    Tambah Unit
                                                </Button>
                                                <Button size="sm" variant="ghost" className="h-8" onClick={(e) => {
                                                    e.stopPropagation();
                                                    setExpandedGroup(expandedGroup === group.name ? null : group.name);
                                                }}>
                                                    Detail
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                    {expandedGroup === group.name && (
                                        <tr>
                                            <td colSpan={5} className="bg-slate-50 px-8 pb-6 pt-0">
                                                <div className="pl-6 border-l-2 border-slate-200">
                                                    <table className="w-full text-sm">
                                                        <thead className="text-[10px] uppercase text-slate-400 font-bold border-b border-slate-200/50">
                                                            <tr>
                                                                <th className="py-2 text-left">Barcode</th>
                                                                <th className="py-2 text-left">Status Saat Ini</th>
                                                                <th className="py-2 text-right">Aksi</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-200/50">
                                                            {group.items.map((item: any) => (
                                                                <tr key={item.id} className="hover:bg-slate-100/50">
                                                                    <td className="py-3 font-mono text-slate-600">{item.barcode}</td>
                                                                    <td className="py-3">
                                                                        <span className={cn(
                                                                            "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                                                                            item.status === 'sterile' ? "bg-accent-emerald/10 text-accent-emerald" : "bg-slate-100 text-slate-500"
                                                                        )}>
                                                                            {item.status}
                                                                        </span>
                                                                    </td>
                                                                    <td className="py-3 text-right flex justify-end gap-2">
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setEditingItem(item);
                                                                                setFormData({
                                                                                    name: item.name,
                                                                                    barcode: item.barcode,
                                                                                    category: item.category,
                                                                                    quantity: 1,
                                                                                    employeeId: '',
                                                                                    department: MASTER_DATA.DEPARTMENTS[0],
                                                                                    role: MASTER_DATA.ROLES[0],
                                                                                    username: '',
                                                                                    password: '',
                                                                                    type: 'washer'
                                                                                });
                                                                                setIsModalOpen(true);
                                                                            }}
                                                                            className="p-1.5 text-slate-400 hover:text-accent-indigo hover:bg-accent-indigo/10 rounded transition-colors"
                                                                            title="Edit Item"
                                                                        >
                                                                            <Edit2 size={14} />
                                                                        </button>
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                if (confirm(`Apakah Anda yakin ingin menghapus alat "${item.name}" (${item.barcode})?`)) {
                                                                                    deleteToolMutation.mutate(item.id);
                                                                                }
                                                                            }}
                                                                            className="p-1.5 text-slate-400 hover:text-accent-rose hover:bg-accent-rose/10 rounded transition-colors"
                                                                            title="Hapus Item"
                                                                        >
                                                                            <Trash2 size={14} />
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </>
                            ))}

                            {activeTab === 'machines' && machines?.map(item => (
                                <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                                    <td className="px-8 py-5 font-bold text-slate-900">{item.name}</td>
                                    <td className="px-8 py-5 text-sm text-slate-600 uppercase tracking-wider font-bold">{item.type}</td>
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
                                    <td className="px-8 py-5 text-right flex justify-end gap-2">
                                        <button
                                            onClick={() => {
                                                setEditingItem(item);
                                                setFormData({
                                                    name: item.name,
                                                    barcode: '',
                                                    category: MASTER_DATA.CATEGORIES[0],
                                                    quantity: 1,
                                                    employeeId: '',
                                                    department: MASTER_DATA.DEPARTMENTS[0],
                                                    role: MASTER_DATA.ROLES[0],
                                                    username: '',
                                                    password: '',
                                                    type: item.type as any
                                                });
                                                setIsModalOpen(true);
                                            }}
                                            className="p-1.5 text-slate-400 hover:text-accent-indigo hover:bg-accent-indigo/10 rounded transition-colors"
                                            title="Edit Mesin"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (confirm(`Apakah Anda yakin ingin menghapus mesin "${item.name}"?`)) {
                                                    deleteMachineMutation.mutate(item.id);
                                                }
                                            }}
                                            className="p-1.5 text-slate-400 hover:text-accent-rose hover:bg-accent-rose/10 rounded transition-colors"
                                            title="Hapus Mesin"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Modal Tambah Data */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-black text-slate-900">
                                {editingItem ? 'Edit Data' : `Tambah ${activeTab === 'staff' ? 'Staff' : activeTab === 'inventory' ? 'Alat' : 'Mesin'} Baru`}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">

                            {/* Form Inventory */}
                            {activeTab === 'inventory' && (
                                <>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest pl-1">Nama Set / Alat</label>
                                        <Input
                                            required
                                            placeholder="Contoh: Set Bedah Dasar B"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest pl-1">
                                                {formData.quantity > 1 ? 'Barcode Awal' : 'Barcode / Serial Number'}
                                            </label>
                                            <Input
                                                required
                                                placeholder="Contoh: SET-099"
                                                value={formData.barcode}
                                                onChange={(e) => setFormData({ ...formData, barcode: e.target.value.toUpperCase() })}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest pl-1">Jumlah Unit</label>
                                            <Input
                                                type="number"
                                                min={1}
                                                max={100}
                                                required
                                                value={formData.quantity}
                                                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                                                disabled={!!editingItem}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest pl-1">Kategori</label>
                                        <select
                                            className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-4 focus:ring-accent-indigo/5 transition-all"
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        >
                                            {MASTER_DATA.CATEGORIES.map(c => <option key={c}>{c}</option>)}
                                        </select>
                                    </div>
                                </>
                            )}

                            {/* Form Staff */}
                            {activeTab === 'staff' && (
                                <>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest pl-1">Nama Lengkap</label>
                                        <Input
                                            required
                                            placeholder="Nama Staff"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest pl-1">ID Pegawai</label>
                                        <Input
                                            required
                                            placeholder="Contoh: EMP001"
                                            value={formData.employeeId}
                                            onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest pl-1">Departemen</label>
                                            <select
                                                className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-4 focus:ring-accent-indigo/5 transition-all"
                                                value={formData.department}
                                                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                            >
                                                {MASTER_DATA.DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest pl-1">Role</label>
                                            <select
                                                className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-4 focus:ring-accent-indigo/5 transition-all"
                                                value={formData.role}
                                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                            >
                                                {MASTER_DATA.ROLES.map(r => <option key={r} value={r}>{r.toUpperCase()}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest pl-1">Username</label>
                                            <Input
                                                placeholder="username.staff"
                                                value={formData.username}
                                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest pl-1">Password</label>
                                            <Input
                                                type="text"
                                                placeholder="password123"
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Form Machines */}
                            {activeTab === 'machines' && (
                                <>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest pl-1">Nama Mesin</label>
                                        <Input
                                            required
                                            placeholder="Contoh: Autoclave 2A"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest pl-1">Tipe Mesin</label>
                                        <select
                                            className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-4 focus:ring-accent-indigo/5 transition-all"
                                            value={formData.type}
                                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                        >
                                            {MASTER_DATA.MACHINE_TYPES.map(m => (
                                                <option key={m} value={m}>
                                                    {m === 'washer' ? 'Washer Disinfector' : m === 'sterilizer' ? 'Steam Sterilizer (Autoclave)' : 'Plasma Sterilizer'}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </>
                            )}

                            <div className="pt-4 flex gap-3">
                                <Button variant="secondary" className="flex-1" type="button" onClick={() => setIsModalOpen(false)}>Batal</Button>
                                <Button className="flex-1" type="submit" disabled={createToolMutation.isPending || updateToolMutation.isPending || createStaffMutation.isPending || createMachineMutation.isPending}>
                                    {createToolMutation.isPending || updateToolMutation.isPending || createStaffMutation.isPending || createMachineMutation.isPending ? 'Menyimpan...' : 'Simpan Data'}
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}

            {/* Credentials Modal */}
            {credentialsModal.isOpen && credentialsModal.staff && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <Card className="w-full max-w-md">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black text-slate-900">Kredensial Login</h3>
                            <button onClick={() => setCredentialsModal({ isOpen: false, staff: null })} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-2">Nama Staff</p>
                                <p className="text-lg font-bold text-slate-900">{credentialsModal.staff.name}</p>
                            </div>

                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-2">Username</p>
                                <p className="text-lg font-mono font-bold text-slate-900">
                                    {credentialsModal.staff.username || 'Belum diatur'}
                                </p>
                            </div>

                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-2">Password</p>
                                <p className="text-lg font-mono font-bold text-slate-900">
                                    {credentialsModal.staff.password || 'Belum diatur'}
                                </p>
                            </div>

                            <div className="p-3 bg-accent-amber/10 border border-accent-amber/20 rounded-xl flex gap-2">
                                <div className="text-accent-amber mt-0.5">⚠️</div>
                                <p className="text-xs text-slate-600">
                                    Simpan kredensial ini dengan aman. Dalam produksi, password akan di-hash untuk keamanan.
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 flex gap-3">
                            <Button
                                variant="secondary"
                                className="flex-1"
                                onClick={() => {
                                    const st = credentialsModal.staff;
                                    setEditingItem(st);
                                    setFormData({
                                        name: st.name,
                                        barcode: '',
                                        category: MASTER_DATA.CATEGORIES[0],
                                        quantity: 1,
                                        employeeId: st.employeeId,
                                        department: st.department,
                                        role: st.role,
                                        username: st.username || '',
                                        password: st.password || '',
                                        type: 'washer'
                                    });
                                    setCredentialsModal({ isOpen: false, staff: null });
                                    setIsModalOpen(true);
                                }}
                            >
                                <Edit2 size={14} className="mr-2" />
                                Edit Kredensial
                            </Button>
                            <Button
                                className="flex-1"
                                onClick={() => setCredentialsModal({ isOpen: false, staff: null })}
                            >
                                Tutup
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};
