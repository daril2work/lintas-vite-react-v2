import React from 'react';
import { Plus, ChevronRight, Box, PackageCheck, Edit2, Trash2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { cn } from '../../../utils/cn';

interface InventoryTabProps {
    inventory: any[];
    searchQuery: string;
    currentPage: number;
    itemsPerPage: number;
    expandedGroup: string | null;
    setExpandedGroup: (group: string | null) => void;
    onAddUnit: (groupName: string, category: string) => void;
    onEditItem: (item: any) => void;
    onDeleteItem: (id: string, name: string) => void;
}

export const InventoryTab: React.FC<InventoryTabProps> = ({
    inventory,
    searchQuery,
    currentPage,
    itemsPerPage,
    expandedGroup,
    setExpandedGroup,
    onAddUnit,
    onEditItem,
    onDeleteItem
}) => {
    const groupedInventory = (inventory || []).reduce((acc, item) => {
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
    }, {} as Record<string, any>) || {};

    const lowerQuery = searchQuery.toLowerCase();
    const filteredGroups = Object.values(groupedInventory).filter((g: any) => {
        const name = String(g.name || '').toLowerCase();
        const cat = String(g.category || '').toLowerCase();
        return name.includes(lowerQuery) || cat.includes(lowerQuery);
    });

    const paginatedGroups = filteredGroups.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);

    return (
        <>
            {paginatedGroups.map((group: any) => (
                <React.Fragment key={group.name}>
                    <tr
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
                                        onAddUnit(group.name, group.category);
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
                                                        <div className="flex flex-col gap-1">
                                                            <span className={cn(
                                                                "px-2 py-0.5 rounded text-[10px] font-bold uppercase w-fit",
                                                                item.status === 'sterile' ? "bg-accent-emerald/10 text-accent-emerald" : "bg-slate-100 text-slate-500"
                                                            )}>
                                                                {item.status}
                                                            </span>
                                                            {item.is_validated === false && (
                                                                <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase w-fit bg-accent-amber/20 text-accent-amber border border-accent-amber/10 animate-pulse">
                                                                    Belum Tervalidasi
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 text-right flex justify-end gap-2">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onEditItem(item);
                                                            }}
                                                            className="p-1.5 text-slate-400 hover:text-accent-indigo hover:bg-accent-indigo/10 rounded transition-colors"
                                                            title="Edit Item"
                                                        >
                                                            <Edit2 size={14} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                onDeleteItem(item.id, `${item.name} (${item.barcode})`);
                                                            }}
                                                            className="p-1.5 text-slate-400 hover:text-accent-rose hover:bg-accent-rose/10 rounded transition-colors"
                                                            title="Arsipkan Item"
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
                </React.Fragment>
            ))}
        </>
    );
};
