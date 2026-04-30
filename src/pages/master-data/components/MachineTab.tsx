import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { cn } from '../../../utils/cn';

interface MachineTabProps {
    machines: any[];
    searchQuery: string;
    currentPage: number;
    itemsPerPage: number;
    onEdit: (item: any) => void;
    onDelete: (id: string, name: string) => void;
}

export const MachineTab: React.FC<MachineTabProps> = ({
    machines,
    searchQuery,
    currentPage,
    itemsPerPage,
    onEdit,
    onDelete
}) => {
    const lowerQuery = searchQuery.toLowerCase();
    const filteredMachines = (machines || []).filter(m => {
        if (!m) return false;
        const name = String(m.name || '').toLowerCase();
        const type = String(m.type || '').toLowerCase();
        return name.includes(lowerQuery) || type.includes(lowerQuery);
    });

    const paginatedMachines = filteredMachines.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);

    return (
        <tbody className="divide-y divide-slate-50">
            {paginatedMachines.map(item => (
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
                    <td className="px-8 py-5 text-sm text-slate-500">
                        {item.lastService ? new Date(item.lastService).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                    </td>
                    <td className="px-8 py-5 text-right flex justify-end gap-2">
                        <button
                            onClick={() => onEdit(item)}
                            className="p-1.5 text-slate-400 hover:text-accent-indigo hover:bg-accent-indigo/10 rounded transition-colors"
                            title="Edit Mesin"
                        >
                            <Edit2 size={16} />
                        </button>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onDelete(item.id, item.name);
                            }}
                            className="p-1.5 text-slate-400 hover:text-accent-rose hover:bg-accent-rose/10 rounded transition-colors"
                            title="Arsipkan Mesin"
                        >
                            <Trash2 size={16} />
                        </button>
                    </td>
                </tr>
            ))}
        </tbody>
    );
};
