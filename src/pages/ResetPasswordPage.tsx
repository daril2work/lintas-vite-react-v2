import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ShieldCheck, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export const ResetPasswordPage = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Supabase handles the recovery/invite token in the URL automatically.
        // We just need to make sure we're on a session or have the hash.
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session && !window.location.hash.includes('access_token')) {
                // If no session and no token in hash, this might be an invalid access
                console.warn("No session or token found for password reset");
            }
        };
        checkSession();
    }, []);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error('Password konfirmasi tidak cocok');
            return;
        }

        if (password.length < 6) {
            toast.error('Password minimal 6 karakter');
            return;
        }

        setIsLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ password });

            if (error) throw error;

            setIsSuccess(true);
            toast.success('Password berhasil diperbarui');

            // Redirect to login after 3 seconds
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (error: any) {
            console.error('Reset error:', error);
            toast.error('Gagal memperbarui password', {
                description: error.message
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black">
                <Card className="w-full max-w-md p-10 text-center space-y-6 border-white/10 shadow-2xl">
                    <div className="w-20 h-20 bg-accent-emerald/20 text-accent-emerald rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 size={40} />
                    </div>
                    <h2 className="text-2xl font-black text-white">Password Diperbarui!</h2>
                    <p className="text-slate-400">Silakan login kembali menggunakan password baru Anda.</p>
                    <div className="pt-4">
                        <Button onClick={() => navigate('/login')} className="gap-2 w-full">
                            Ke Halaman Login <ArrowRight size={18} />
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black">
            <Card className="w-full max-w-md p-10 border-white/10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent-indigo via-accent-emerald to-accent-amber"></div>

                <div className="mb-10 text-center">
                    <div className="w-16 h-16 bg-accent-indigo/10 text-accent-indigo rounded-2xl flex items-center justify-center mx-auto mb-4 border border-accent-indigo/20">
                        <ShieldCheck size={32} />
                    </div>
                    <h1 className="text-2xl font-black text-white mb-2">Atur Password Baru</h1>
                    <p className="text-slate-400 text-sm">Demi keamanan, silakan gunakan kombinasi karakter yang kuat.</p>
                </div>

                <form onSubmit={handleReset} className="space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Password Baru</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    type="password"
                                    required
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-4 focus:ring-accent-indigo/20 focus:border-accent-indigo/50 transition-all font-mono"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Konfirmasi Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    type="password"
                                    required
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-4 focus:ring-accent-indigo/20 focus:border-accent-indigo/50 transition-all font-mono"
                                />
                            </div>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        isLoading={isLoading}
                        className="py-4 rounded-2xl font-black tracking-widest uppercase text-xs shadow-xl shadow-accent-indigo/20 w-full"
                    >
                        SIMPAN PASSWORD
                    </Button>

                    <button
                        type="button"
                        onClick={() => navigate('/login')}
                        className="w-full text-center text-slate-500 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors pt-2"
                    >
                        Batalkan dan Kembali
                    </button>
                </form>
            </Card>
        </div>
    );
};
