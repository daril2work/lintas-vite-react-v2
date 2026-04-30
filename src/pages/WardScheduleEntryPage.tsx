import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { operatingScheduleService } from '../services/operatingSchedule.service';
import { toast } from 'sonner';
import { Calendar, Clock, User, FileText, Activity, Save, Loader2, Building } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const WardScheduleEntryPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [rooms, setRooms] = useState<{id: string, name: string}[]>([]);
    
    const [formData, setFormData] = useState({
        room_id: '',
        patient_name: '',
        patient_rm: '',
        surgeon_name: '',
        operation_type: '',
        operation_date: '',
        operation_time: '',
        notes: ''
    });

    useEffect(() => {
        fetchRooms();
    }, []);

    const fetchRooms = async () => {
        try {
            const { data, error } = await supabase
                .from('rooms')
                .select('id, name')
                .order('name');
            
            if (error) throw error;
            setRooms(data || []);
        } catch (error) {
            console.error('Error fetching rooms:', error);
            toast.error('Gagal mengambil data ruangan');
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.room_id || !formData.patient_name || !formData.patient_rm || !formData.surgeon_name || !formData.operation_type || !formData.operation_date || !formData.operation_time) {
            toast.error('Harap lengkapi semua field yang wajib');
            return;
        }

        setIsLoading(true);

        try {
            // Combine date and time
            const operationDateTime = `${formData.operation_date}T${formData.operation_time}:00`;
            const dateObj = new Date(operationDateTime);
            
            if (isNaN(dateObj.getTime())) {
                throw new Error('Format tanggal atau waktu tidak valid');
            }

            await operatingScheduleService.addSchedule({
                room_id: formData.room_id,
                patient_name: formData.patient_name,
                patient_rm: formData.patient_rm,
                surgeon_name: formData.surgeon_name,
                operation_type: formData.operation_type,
                operation_date: dateObj.toISOString(),
                notes: formData.notes,
                status: 'scheduled',
                created_by: user?.id
            });

            toast.success('Jadwal operasi berhasil ditambahkan');
            navigate('/schedule/dashboard');
        } catch (error: any) {
            console.error('Error saving schedule:', error);
            toast.error(error.message || 'Gagal menyimpan jadwal operasi');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-3xl font-black text-white tracking-tight">Entri Jadwal Operasi</h1>
                <p className="text-slate-400 mt-2">Masukkan data jadwal operasi dari ruangan/unit Anda.</p>
            </div>

            <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                                <Building size={16} className="text-accent-indigo" />
                                Ruangan / Unit *
                            </label>
                            <select
                                name="room_id"
                                value={formData.room_id}
                                onChange={handleChange}
                                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-accent-indigo outline-none"
                                required
                            >
                                <option value="">-- Pilih Ruangan --</option>
                                {rooms.map(room => (
                                    <option key={room.id} value={room.id}>{room.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                                <User size={16} className="text-accent-indigo" />
                                Nama Pasien *
                            </label>
                            <input
                                type="text"
                                name="patient_name"
                                value={formData.patient_name}
                                onChange={handleChange}
                                placeholder="Nama Lengkap Pasien"
                                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-accent-indigo outline-none"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                                <FileText size={16} className="text-accent-indigo" />
                                No. Rekam Medis (RM) *
                            </label>
                            <input
                                type="text"
                                name="patient_rm"
                                value={formData.patient_rm}
                                onChange={handleChange}
                                placeholder="Contoh: RM-123456"
                                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-accent-indigo outline-none"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                                <User size={16} className="text-accent-indigo" />
                                Nama Dokter Bedah *
                            </label>
                            <input
                                type="text"
                                name="surgeon_name"
                                value={formData.surgeon_name}
                                onChange={handleChange}
                                placeholder="Dr. Nama Dokter, Sp.B"
                                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-accent-indigo outline-none"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                                <Activity size={16} className="text-accent-indigo" />
                                Tindakan Operasi *
                            </label>
                            <input
                                type="text"
                                name="operation_type"
                                value={formData.operation_type}
                                onChange={handleChange}
                                placeholder="Jenis / Nama Tindakan"
                                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-accent-indigo outline-none"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                                <Calendar size={16} className="text-accent-indigo" />
                                Tanggal Operasi *
                            </label>
                            <input
                                type="date"
                                name="operation_date"
                                value={formData.operation_date}
                                onChange={handleChange}
                                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-accent-indigo outline-none"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                                <Clock size={16} className="text-accent-indigo" />
                                Waktu Operasi *
                            </label>
                            <input
                                type="time"
                                name="operation_time"
                                value={formData.operation_time}
                                onChange={handleChange}
                                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-accent-indigo outline-none"
                                required
                            />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-bold text-slate-300 flex items-center gap-2">
                                <FileText size={16} className="text-accent-indigo" />
                                Catatan Tambahan (Opsional)
                            </label>
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                placeholder="Keterangan tambahan jika ada..."
                                rows={3}
                                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-accent-indigo outline-none"
                            />
                        </div>

                    </div>

                    <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => navigate('/schedule/dashboard')}
                            className="px-6 py-3 rounded-xl font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex items-center gap-2 bg-accent-indigo hover:bg-indigo-500 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-accent-indigo/25 hover:shadow-accent-indigo/40 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                            Simpan Jadwal
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
