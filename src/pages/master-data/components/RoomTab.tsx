import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';

interface RoomTabProps {
    rooms: any[];
    searchQuery: string;
    currentPage: number;
    itemsPerPage: number;
    onEdit: (item: any) => void;
    onDelete: (id: string, name: string) => void;
}

export const RoomTab: React.FC<RoomTabProps> = ({
    rooms,
    searchQuery,
    currentPage,
    itemsPerPage,
    onEdit,
    onDelete
}) => {
    const lowerQuery = searchQuery.toLowerCase();
    const filteredRooms = (rooms || []).filter(r => {
        if (!r) return false;
        const name = String(r.name || '').toLowerCase();
        const pic = String(r.picName || '').toLowerCase();
        return name.includes(lowerQuery) || pic.includes(lowerQuery);
    });

    const paginatedRooms = filteredRooms.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);

    return (
        <tbody className="divide-y divide-slate-50">
            {paginatedRooms.map(item => (
                <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5 font-bold text-slate-900">{item.name}</td>
                    <td className="px-8 py-5 text-sm text-slate-600">{item.picName || '-'}</td>
                    <td className="px-8 py-5 text-sm text-slate-500">
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                    </td>
                    <td className="px-8 py-5 text-right flex justify-end gap-2">
                        <button
                            onClick={() => onEdit(item)}
                            className="p-1.5 text-slate-400 hover:text-accent-indigo hover:bg-accent-indigo/10 rounded transition-colors"
                            title="Edit Ruangan"
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
                            title="Arsipkan Ruangan"
                        >
                            <Trash2 size={16} />
                        </button>
                    </td>
                </tr>
            ))}
        </tbody>
    );
};
