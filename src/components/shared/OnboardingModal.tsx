import React from 'react';
import { Card } from '../ui/Card';
import { X, BookOpen, ShieldCheck, Zap, Settings, Truck, PackageSearch, Waves, Box, ListTodo, Send, ClipboardCheck } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAuth } from '../../context/AuthContext';

interface OnboardingModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose }) => {
    const { user } = useAuth();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex justify-center items-start md:items-center p-4 md:p-8 bg-slate-900/60 backdrop-blur-md overflow-y-auto custom-scrollbar animate-in fade-in duration-300">
            <Card className="w-full max-w-3xl my-auto overflow-hidden flex flex-col shadow-2xl border-white/20">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-accent-indigo/10 flex items-center justify-center text-accent-indigo">
                            <BookOpen size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 leading-tight">Panduan Onboarding</h2>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">LINTAS CSSD - RSUD MENUR</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-slate-600 transition-all border border-transparent hover:border-slate-100"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8 bg-white/50">
                    {/* Welcome Section */}
                    <div className="bg-gradient-to-br from-accent-indigo/5 to-transparent p-6 rounded-3xl border border-accent-indigo/10">
                        <h3 className="font-black text-slate-900 text-lg mb-2">Halo, {user?.name}! 👋</h3>
                        <p className="text-sm text-slate-600 leading-relaxed">
                            Selamat datang di Sistem Layanan Integrasi Sterilisasi. Sebagai <span className="font-black text-accent-indigo uppercase">{user?.role?.replace('_', ' ')}</span>,
                            Anda memiliki akses khusus untuk menjalankan proses sterilisasi alat medis secara akurat dan transparan.
                        </p>
                    </div>

                    {/* Role Specific Guide */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Zap size={18} className="text-accent-amber" />
                            <h4 className="font-black text-slate-900 uppercase tracking-widest text-xs">Alur Kerja Utama Anda</h4>
                        </div>

                        {user?.role === 'admin' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <StepItem icon={Settings} title="Master Data" desc="Kelola data Staff, Inventaris Alat, dan daftar Mesin CSSD." color="indigo" />
                                <StepItem icon={ShieldCheck} title="Kredensial" desc="Reset password dan atur hak akses role setiap pengguna." color="emerald" />
                                <StepItem icon={PackageSearch} title="Audit Trail" desc="Pantau log aktivitas untuk akuntabilitas operasional." color="amber" />
                                <StepItem icon={Truck} title="Reports" desc="Unduh laporan efisiensi dan performa sterilisasi bulanan." color="rose" />
                            </div>
                        )}

                        {user?.role === 'operator_cssd' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <StepItem icon={PackageSearch} title="Penerimaan" desc="Scan barcode alat kotor & ambil bukti foto (Intake)." color="indigo" />
                                <StepItem icon={Waves} title="Pencucian" desc="Pilih mesin & program (Standard/Heavy) di menu Washing." color="emerald" />
                                <StepItem icon={Box} title="Sterilisasi" desc="Jalankan proses Autoclave/Plasma & pantau suhu/waktu." color="amber" />
                                <StepItem icon={Truck} title="Distribusi" desc="Pantau lonceng dan serahkan alat steril ke ruangan." color="rose" />
                            </div>
                        )}

                        {user?.role === 'operator_ruangan' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <StepItem icon={Send} title="Kirim Alat" desc="Input alat kotor dari ruangan untuk diproses CSSD." color="rose" />
                                <StepItem icon={ListTodo} title="Permintaan" desc="Ajukan permintaan alat steril baru (Normal/Urgent)." color="indigo" />
                                <StepItem icon={ClipboardCheck} title="Terima Alat" desc="Verifikasi & konfirmasi penerimaan alat steril." color="emerald" />
                            </div>
                        )}
                    </div>

                    {/* General Tips */}
                    <div className="border-t border-slate-100 pt-8 space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <ShieldCheck size={18} className="text-accent-emerald" />
                            <h4 className="font-black text-slate-900 uppercase tracking-widest text-xs">Tips & Keamanan</h4>
                        </div>
                        <ul className="space-y-3">
                            <TipItem text="Setiap aksi dicatat otomatis dalam Audit Trail atas nama akun Anda." />
                            <TipItem text="Sistem akan validasi status alat (misal: alat belum dicuci tidak bisa masuk mesin sterilisasi)." />
                            <TipItem text="Segera klik notifikasi lonceng 🔔 untuk permintaan berstatus 'URGENT'." />
                        </ul>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 shrink-0 bg-slate-50/80 border-t border-slate-100 flex justify-center">
                    <button
                        onClick={onClose}
                        className="px-10 py-4 bg-accent-indigo hover:bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-accent-indigo/20 transition-all hover:scale-105 active:scale-95"
                    >
                        SAYA MENGERTI
                    </button>
                </div>
            </Card>
        </div>
    );
};

const StepItem = ({ icon: Icon, title, desc, color }: { icon: any, title: string, desc: string, color: string }) => (
    <div className="group p-4 rounded-2xl border border-slate-100 bg-white hover:border-accent-indigo/30 transition-all hover:shadow-lg hover:shadow-slate-100">
        <div className={cn(
            "w-10 h-10 rounded-xl mb-3 flex items-center justify-center transition-all group-hover:scale-110",
            color === 'indigo' ? "bg-indigo-50 text-indigo-500" :
                color === 'emerald' ? "bg-emerald-50 text-emerald-500" :
                    color === 'amber' ? "bg-amber-50 text-amber-500" :
                        "bg-rose-50 text-rose-500"
        )}>
            <Icon size={20} />
        </div>
        <h5 className="font-bold text-slate-900 text-sm mb-1">{title}</h5>
        <p className="text-[11px] text-slate-500 leading-relaxed font-medium">{desc}</p>
    </div>
);

const TipItem = ({ text }: { text: string }) => (
    <li className="flex gap-3 text-xs text-slate-600 items-start">
        <div className="w-1.5 h-1.5 rounded-full bg-accent-indigo mt-1.5 shrink-0" />
        <span className="font-medium">{text}</span>
    </li>
);
