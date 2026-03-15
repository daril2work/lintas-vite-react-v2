import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { staffService, type InviteToken } from '../services/staff.service';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ShieldCheck, User, Mail, Lock, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const SignupStaffPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const tokenStr = searchParams.get('token');

    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [tokenData, setTokenData] = useState<InviteToken | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        const verifyToken = async () => {
            if (!tokenStr) {
                setError('Link pendaftaran tidak valid atau tidak menyertakan token.');
                setIsLoading(false);
                return;
            }

            try {
                const data = await staffService.validateToken(tokenStr);
                setTokenData(data);
            } catch (err: any) {
                setError(err.message || 'Gagal memverifikasi token.');
            } finally {
                setIsLoading(false);
            }
        };

        verifyToken();
    }, [tokenStr]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!tokenData) return;

        if (password.length < 6) {
            toast.error('Password minimal 6 karakter.');
            return;
        }

        if (password !== confirmPassword) {
            toast.error('Konfirmasi password tidak cocok.');
            return;
        }

        setIsSubmitting(true);
        try {
            // 1. Sign up user to Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: tokenData.email,
                password: password,
                options: {
                    data: {
                        name: tokenData.name,
                    }
                }
            });

            if (authError) throw authError;

            const user = authData.user;
            if (!user) throw new Error('Gagal membuat akun.');

            // 2. Create profile entry using the auth user ID
            const { error: profileError } = await supabase.from('profiles').insert([{
                id: user.id,
                email: tokenData.email,
                name: tokenData.name,
                role: tokenData.role,
                department: tokenData.department,
                employee_id: tokenData.employee_id
            }]);

            if (profileError) {
                console.error('Profile creation error:', profileError);
                // Note: Auth account exists but profile failed. 
                // In production, you'd want a cleanup or retry mechanism.
            }

            // 3. Mark token as used
            await staffService.useToken(tokenData.id);

            setIsSuccess(true);
            toast.success('Pendaftaran Berhasil!', {
                description: 'Akun Anda telah aktif. Silakan login menggunakan email dan password baru Anda.'
            });

            // Optional: Auto redirect to login after delay
            setTimeout(() => navigate('/login'), 3000);

        } catch (err: any) {
            console.error('Signup Error:', err);
            toast.error('Gagal Mendaftar', {
                description: err.message || 'Terjadi kesalahan sistem.'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
                <div className="text-center space-y-4">
                    <Loader2 className="animate-spin text-accent-indigo mx-auto" size={40} />
                    <p className="text-slate-500 font-medium tracking-wide">Memverifikasi Undangan...</p>
                </div>
            </div>
        );
    }

    if (error || !tokenData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
                <Card className="w-full max-w-md p-8 text-center space-y-6">
                    <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-500 border-4 border-rose-100/50">
                        <AlertCircle size={40} />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-black text-slate-900">Oops! Terjadi Kesalahan</h2>
                        <p className="text-slate-500 leading-relaxed font-medium">
                            {error || 'Token tidak valid atau sudah kadaluarsa.'}
                        </p>
                    </div>
                    <Button onClick={() => navigate('/login')} variant="secondary" className="w-full">
                        Kembali ke Login
                    </Button>
                </Card>
            </div>
        );
    }

    if (isSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
                <Card className="w-full max-w-md p-8 text-center space-y-6">
                    <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-500 border-4 border-emerald-100/50">
                        <CheckCircle2 size={40} />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-black text-slate-900">Pendaftaran Berhasil</h2>
                        <p className="text-slate-500 leading-relaxed font-medium">
                            Selamat datang, <strong>{tokenData.name}</strong>! Akun Anda telah siap digunakan.
                        </p>
                    </div>
                    <div className="pt-4">
                        <Button onClick={() => navigate('/login')} className="w-full h-14 rounded-2xl font-black tracking-widest uppercase text-xs shadow-xl shadow-accent-indigo/20">
                            MASUK KE APLIKASI
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
                <div className="inline-flex p-4 bg-white rounded-3xl shadow-soft mb-6">
                    <ShieldCheck className="text-accent-indigo" size={40} />
                </div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Aktivasi Akun Staff</h2>
                <p className="mt-2 text-sm text-slate-500 font-medium">Lengkapi data di bawah untuk mengaktifkan akses Anda.</p>
            </div>

            <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
                <Card className="p-8 shadow-2xl shadow-slate-200/50 border-none rounded-[2rem]">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {/* Read-only Data from Token */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest pl-1">Nama</label>
                                <div className="flex items-center gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                                    <User size={16} className="text-slate-400" />
                                    <span className="text-sm font-bold text-slate-700 truncate">{tokenData.name}</span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest pl-1">Email</label>
                                <div className="flex items-center gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                                    <Mail size={16} className="text-slate-400" />
                                    <span className="text-sm font-bold text-slate-700 truncate">{tokenData.email}</span>
                                </div>
                            </div>
                        </div>

                        {/* Password Fields */}
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest pl-1">Password Baru</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-accent-indigo transition-colors">
                                    <Lock size={18} />
                                </div>
                                <Input
                                    type="password"
                                    required
                                    placeholder="••••••••"
                                    className="pl-12 h-14 rounded-2xl border-slate-200 focus:border-accent-indigo focus:ring-accent-indigo/10 transition-all font-mono"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest pl-1">Konfirmasi Password</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-accent-indigo transition-colors">
                                    <Lock size={18} />
                                </div>
                                <Input
                                    type="password"
                                    required
                                    placeholder="••••••••"
                                    className="pl-12 h-14 rounded-2xl border-slate-200 focus:border-accent-indigo focus:ring-accent-indigo/10 transition-all font-mono"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <Button
                                type="submit"
                                isLoading={isSubmitting}
                                className="w-full h-14 rounded-2xl font-black tracking-widest uppercase text-xs shadow-xl shadow-accent-indigo/20"
                            >
                                AKTIFKAN AKUN
                            </Button>
                        </div>
                    </form>

                    <div className="mt-8 pt-8 border-t border-slate-100">
                        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                <ShieldCheck className="text-accent-indigo" size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Keamanan</p>
                                <p className="text-xs text-slate-600 font-medium">Akun Anda tersinkron dengan NIK: {tokenData.employee_id || '-'}</p>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default SignupStaffPage;
