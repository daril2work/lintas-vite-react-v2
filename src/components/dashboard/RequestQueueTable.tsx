import React from 'react';
import { Card } from '../ui/Card';
import { cn } from '../../utils/cn';
import type { ToolRequest } from '../../types';

interface RequestQueueTableProps {
    requests: ToolRequest[];
}

export const RequestQueueTable: React.FC<RequestQueueTableProps> = ({ requests }) => {
    return (
        <div className="space-y-4">
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
                            {requests.slice(0, 5).map((req) => (
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
                            {requests.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-slate-400 italic text-sm">Tidak ada antrian permintaan.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};
