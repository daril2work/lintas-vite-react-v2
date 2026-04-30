import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { operatingScheduleService } from '../services/operatingSchedule.service';
import type { OperatingSchedule } from '../types';
import { toast } from 'sonner';
import { Calendar, Clock, User, Activity, Building, Search, Filter, Loader2, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ScheduleDashboardPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [schedules, setSchedules] = useState<OperatingSchedule[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchSchedules();
    }, []);

    const fetchSchedules = async () => {
        try {
            setIsLoading(true);
            const data = await operatingScheduleService.getSchedules();
            setSchedules(data);
        } catch (error) {
            toast.error('Gagal memuat jadwal operasi');
        } finally {
            setIsLoading(false);
        }
    };

    const handleStatusChange = async (id: string, newStatus: OperatingSchedule['status']) => {
        try {
            await operatingScheduleService.updateScheduleStatus(id, newStatus);
            toast.success('Status jadwal diperbarui');
            fetchSchedules();
        } catch (error) {
            toast.error('Gagal memperbarui status');
        }
    };

    const filteredSchedules = schedules.filter(schedule => 
        schedule.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        schedule.patient_rm.toLowerCase().includes(searchTerm.toLowerCase()) ||
        schedule.surgeon_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (schedule.room?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'scheduled': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            case 'in_progress': return 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20';
            case 'completed': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            case 'cancelled': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
            default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'scheduled': return 'Terjadwal';
            case 'in_progress': return 'Berlangsung';
            case 'completed': return 'Selesai';
            case 'cancelled': return 'Batal';
            default: return status;
        }
    };

    const formatDateTime = (isoString: string) => {
        const date = new Date(isoString);
        return {
            date: date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
            time: date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
        };
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <Calendar className="text-accent-indigo" size={32} />
                        Dashboard Jadwal Operasi
                    </h1>
                    <p className="text-slate-400 mt-2">Daftar jadwal operasi dari seluruh ruangan/unit.</p>
                </div>

                {user?.role === 'operator_ruangan' && (
                    <button
                        onClick={() => navigate('/ward/schedule/entry')}
                        className="flex items-center gap-2 bg-accent-indigo hover:bg-indigo-500 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-accent-indigo/25 hover:shadow-accent-indigo/40"
                    >
                        <Plus size={20} />
                        Entri Jadwal Baru
                    </button>
                )}
            </div>

            <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-6">
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                        <input
                            type="text"
                            placeholder="Cari pasien, no RM, dokter, atau ruangan..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl pl-12 pr-4 py-3 text-white focus:ring-2 focus:ring-accent-indigo outline-none"
                        />
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <Loader2 size={40} className="animate-spin text-accent-indigo mb-4" />
                        <p>Memuat jadwal operasi...</p>
                    </div>
                ) : filteredSchedules.length === 0 ? (
                    <div className="text-center py-20 bg-slate-800/20 rounded-2xl border border-dashed border-slate-700">
                        <Calendar size={48} className="mx-auto text-slate-600 mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">Belum ada jadwal operasi</h3>
                        <p className="text-slate-400">Jadwal yang ditambahkan akan muncul di sini.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredSchedules.map((schedule) => {
                            const { date, time } = formatDateTime(schedule.operation_date);
                            return (
                                <div key={schedule.id} className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5 hover:bg-slate-800/60 transition-colors group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-10 h-10 rounded-xl bg-accent-indigo/20 flex items-center justify-center text-accent-indigo">
                                                <Calendar size={20} />
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-white">{date}</div>
                                                <div className="text-xs text-slate-400 flex items-center gap-1">
                                                    <Clock size={12} /> {time}
                                                </div>
                                            </div>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusColor(schedule.status)}`}>
                                            {getStatusLabel(schedule.status)}
                                        </span>
                                    </div>

                                    <div className="space-y-3">
                                        <div>
                                            <div className="text-lg font-bold text-white">{schedule.patient_name}</div>
                                            <div className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                                                <User size={12} /> RM: {schedule.patient_rm}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-700/50">
                                            <div>
                                                <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Tindakan</div>
                                                <div className="text-sm text-slate-300 flex items-center gap-1">
                                                    <Activity size={14} className="text-accent-emerald" />
                                                    <span className="truncate">{schedule.operation_type}</span>
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Ruangan</div>
                                                <div className="text-sm text-slate-300 flex items-center gap-1">
                                                    <Building size={14} className="text-accent-rose" />
                                                    <span className="truncate">{schedule.room?.name || '-'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Dokter Bedah</div>
                                            <div className="text-sm text-slate-300">{schedule.surgeon_name}</div>
                                        </div>
                                    </div>

                                    {/* Admin Actions */}
                                    {user?.role === 'admin' && (
                                        <div className="mt-5 pt-4 border-t border-slate-700/50 flex gap-2">
                                            <select
                                                value={schedule.status}
                                                onChange={(e) => handleStatusChange(schedule.id, e.target.value as any)}
                                                className="w-full bg-slate-900 border border-slate-600 rounded-xl px-3 py-2 text-xs text-white focus:ring-1 focus:ring-accent-indigo outline-none"
                                            >
                                                <option value="scheduled">Terjadwal</option>
                                                <option value="in_progress">Berlangsung</option>
                                                <option value="completed">Selesai</option>
                                                <option value="cancelled">Batal</option>
                                            </select>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};
