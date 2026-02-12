import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
// import { api } from '../services/api'; // Removed unused api import
import { Button } from '../components/ui/Button';
import { Shield, Mail, Lock, AlertCircle, ArrowLeft } from 'lucide-react';
import { APP_CONFIG } from '../constants/config';

export const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const { login, user, isLoading: isAuthLoading } = useAuth();
    const navigate = useNavigate();

    // Auto-redirect if already authenticated
    React.useEffect(() => {
        if (user && !isAuthLoading) {
            navigate('/dashboard');
        }
    }, [user, isAuthLoading, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            // Updated for Supabase Auth
            await login(email, password);
            navigate('/dashboard');
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Login gagal. Periksa email dan password Anda.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 overflow-hidden">
            {/* Background Blobs */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent-indigo/10 blur-[120px] rounded-full" />

            <div className="relative z-10 w-full max-w-md">
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors text-sm group"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Kembali ke Beranda
                </button>

                <div className="bg-slate-900/50 backdrop-blur-2xl border border-white/10 rounded-[32px] p-10 shadow-2xl">
                    <div className="flex flex-col items-center mb-10">
                        <div className="w-16 h-16 bg-gradient-to-br from-accent-indigo to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-accent-indigo/20 mb-6">
                            <Shield className="text-white" size={32} />
                        </div>
                        <h1 className="text-3xl font-black text-white tracking-tight">Selamat Datang</h1>
                        <p className="text-slate-500 mt-2 text-sm text-center">
                            Masuk dengan kredensial yang diberikan oleh Admin CSSD.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest pl-1">Email / Username</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-accent-indigo transition-colors" size={18} />
                                <input
                                    type="text"
                                    placeholder="nama@email.com"
                                    className="w-full pl-12 pr-4 h-14 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-4 focus:ring-accent-indigo/10 focus:border-accent-indigo/30 transition-all"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest pl-1">Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-accent-indigo transition-colors" size={18} />
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    className="w-full pl-12 pr-4 h-14 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-4 focus:ring-accent-indigo/10 focus:border-accent-indigo/30 transition-all"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 bg-accent-rose/10 border border-accent-rose/20 rounded-2xl flex items-center gap-3 text-accent-rose text-sm animate-shake">
                                <AlertCircle size={18} />
                                {error}
                            </div>
                        )}

                        <Button
                            className="w-full h-14 bg-accent-indigo hover:bg-indigo-600 text-white border-none text-md font-bold mt-4 shadow-xl shadow-accent-indigo/20"
                            type="submit"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Memproses...' : 'Sign In to Dashboard'}
                        </Button>
                    </form>

                    <div className="mt-10 pt-8 border-t border-white/5 text-center">
                        <p className="text-xs text-slate-500">
                            Lupa password? Silakan hubungi <span className="text-accent-indigo font-bold">Admin IT / CSSD</span> untuk reset kredensial Anda.
                        </p>
                        <p className="text-[10px] text-slate-600 font-bold uppercase tracking-[0.3em] mt-4">
                            System Version {APP_CONFIG.APP_VERSION}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
