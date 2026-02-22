import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import type { Staff } from '../../types';

interface StaffListProps {
    staff: Staff[];
}

export const StaffList: React.FC<StaffListProps> = ({ staff }) => {
    return (
        <Card>
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6">Staff Terdaftar</h4>
            <div className="space-y-4">
                {staff.slice(0, 5).map(s => (
                    <div key={s.id} className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 uppercase font-black text-xs">
                            {s.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-black text-slate-900">{s.name}</p>
                            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{s.role} • {s.department}</p>
                        </div>
                        <div className="w-2 h-2 rounded-full bg-accent-emerald"></div>
                    </div>
                ))}
            </div>
            <a href="/admin">
                <Button variant="secondary" className="w-full mt-6 text-xs uppercase tracking-widest h-10">Manajemen Staff</Button>
            </a>
        </Card>
    );
};
