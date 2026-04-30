import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { cn } from '../../../utils/cn';

interface StaffTabProps {
    staff: any[];
    searchQuery: string;
    currentPage: number;
    itemsPerPage: number;
    onEdit: (item: any) => void;
    onDelete: (id: string, name: string) => void;
}

export const StaffTab: React.FC<StaffTabProps> = ({
    staff,
    searchQuery,
    currentPage,
    itemsPerPage,
    onEdit,
    onDelete
}) => {
    const lowerQuery = searchQuery.toLowerCase();
    const filteredStaff = (staff || []).filter(s => {
        if (!s) return false;
        const name = String(s.name || '').toLowerCase();
        const empId = String(s.employeeId || '').toLowerCase();
        return name.includes(lowerQuery) || empId.includes(lowerQuery);
    });

    const paginatedStaff = filteredStaff.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);

    return (
        <tbody className="divide-y divide-slate-50">
            {paginatedStaff.map(item => (
                <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-accent-indigo/10 text-accent-indigo flex items-center justify-center font-bold text-xs uppercase">
                                {item.name?.charAt(0) || '?'}
                            </div>
                            <span className="font-bold text-slate-900">{item.name || 'Unnamed Staff'}</span>
                        </div>
                    </td>
                    <td className="px-8 py-5 text-sm text-slate-500 font-mono italic">{item.employeeId}</td>
                    <td className="px-8 py-5 text-sm text-slate-600">{item.department}</td>
                    <td className="px-8 py-5">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-black uppercase text-slate-500">
                            {item.role === 'operator_cssd' ? 'Operator CSSD' :
                                item.role === 'operator_ruangan' ? 'Operator Ruangan' :
                                    item.role}
                        </span>
                    </td>
                    <td className="px-8 py-5">
                        <span className="text-xs text-slate-400 italic">Auth via Email</span>
                    </td>
                    <td className="px-8 py-5 text-right flex justify-end gap-2">
                        <button
                            onClick={() => onEdit(item)}
                            className="p-1.5 text-slate-400 hover:text-accent-indigo hover:bg-accent-indigo/10 rounded transition-colors"
                            title="Edit Staff"
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
                            title="Arsipkan Staff"
                        >
                            <Trash2 size={16} />
                        </button>
                    </td>
                </tr>
            ))}
        </tbody>
    );
};
