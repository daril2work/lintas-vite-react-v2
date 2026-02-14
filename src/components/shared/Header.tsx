import { Bell, Search, Menu as MenuIcon, Clock, ArrowRight, BookOpen } from 'lucide-react';
import { useUIStore } from '../../store';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useAppConfig } from '../../context/ConfigContext';
import { cn } from '../../utils/cn';
import { OnboardingModal } from './OnboardingModal';

export const Header = () => {
    const navigate = useNavigate();
    const { config } = useAppConfig();
    const { toggleSidebar } = useUIStore();
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const { data: requests } = useQuery({
        queryKey: ['requests'],
        queryFn: api.getRequests,
        refetchInterval: 5000,
    });

    const pendingRequests = requests?.filter(r => r.status === 'pending') || [];
    const pendingCount = pendingRequests.length;

    // Handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsNotificationOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Indonesian Date Format
    const now = new Date();
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const dateString = `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;

    return (
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-40 px-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <button
                    onClick={toggleSidebar}
                    className="p-2 hover:bg-slate-100 rounded-xl transition-colors lg:hidden"
                >
                    <MenuIcon size={24} className="text-slate-600" />
                </button>
                <div className="hidden md:flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2 w-96 gap-3">
                    <Search size={18} className="text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search tools, batches, or staff..."
                        className="bg-transparent border-none focus:outline-none text-sm w-full"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                        className={cn(
                            "relative p-2.5 rounded-2xl transition-all group",
                            isNotificationOpen ? "bg-accent-indigo/10" : "hover:bg-slate-50"
                        )}
                    >
                        <Bell size={20} className={cn(
                            "transition-colors",
                            isNotificationOpen ? "text-accent-indigo" : "text-slate-600 group-hover:text-accent-indigo"
                        )} />
                        {pendingCount > 0 && (
                            <span className="absolute top-2.5 right-2.5 w-4 h-4 bg-accent-rose border-2 border-white rounded-full text-[8px] font-black flex items-center justify-center text-white animate-pulse">
                                {pendingCount}
                            </span>
                        )}
                    </button>

                    {/* Notification Dropdown */}
                    {isNotificationOpen && (
                        <div className="absolute right-0 mt-3 w-80 bg-white rounded-3xl shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden z-50 animate-in fade-in zoom-in duration-200 origin-top-right">
                            <div className="p-5 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                                <div>
                                    <h3 className="font-black text-slate-900 text-sm">Notifikasi</h3>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                                        {pendingCount} Permintaan Baru
                                    </p>
                                </div>
                                <span className="px-2 py-0.5 bg-accent-indigo/10 text-accent-indigo text-[10px] font-black rounded-md uppercase">Live</span>
                            </div>

                            <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                                {pendingRequests.length > 0 ? (
                                    <div className="divide-y divide-slate-50">
                                        {pendingRequests.map((req) => (
                                            <button
                                                key={req.id}
                                                onClick={() => {
                                                    navigate('/distribution');
                                                    setIsNotificationOpen(false);
                                                }}
                                                className="w-full text-left p-4 hover:bg-slate-50 transition-colors group flex gap-3"
                                            >
                                                <div className="w-10 h-10 rounded-2xl bg-slate-100 flex-shrink-0 flex items-center justify-center text-slate-400 group-hover:bg-accent-indigo/10 group-hover:text-accent-indigo transition-all">
                                                    <Clock size={18} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start mb-0.5">
                                                        <span className="font-bold text-slate-900 text-xs truncate">{req.ward}</span>
                                                        <span className="text-[10px] font-bold text-slate-400">
                                                            {new Date(req.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-slate-500 line-clamp-1 mb-2">
                                                        {req.items.map(i => i.name).join(', ')}
                                                    </p>
                                                    <div className="flex items-center justify-between">
                                                        <span className={cn(
                                                            "px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider",
                                                            req.priority === 'urgent' ? "bg-accent-rose/10 text-accent-rose" : "bg-accent-indigo/10 text-accent-indigo"
                                                        )}>
                                                            {req.priority}
                                                        </span>
                                                        <ArrowRight size={12} className="text-slate-300 group-hover:text-accent-indigo group-hover:translate-x-1 transition-all" />
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-10 text-center">
                                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <Bell size={20} className="text-slate-300" />
                                        </div>
                                        <p className="text-xs text-slate-500 font-bold">Tidak ada permintaan pending</p>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => {
                                    navigate('/distribution');
                                    setIsNotificationOpen(false);
                                }}
                                className="w-full py-4 bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] hover:text-accent-indigo transition-colors"
                            >
                                Lihat Semua Permintaan
                            </button>
                        </div>
                    )}
                </div>

                {/* Onboarding Help Button */}
                <button
                    onClick={() => setIsOnboardingOpen(true)}
                    className="p-2.5 rounded-2xl hover:bg-slate-50 transition-all group text-slate-400 hover:text-accent-indigo"
                    title="Panduan Onboarding"
                >
                    <BookOpen size={20} />
                </button>

                <OnboardingModal
                    isOpen={isOnboardingOpen}
                    onClose={() => setIsOnboardingOpen(false)}
                />
                <div className="h-10 w-px bg-slate-100 mx-2"></div>
                <div className="flex flex-col items-end">
                    <span className="text-sm font-black text-slate-900">{dateString}</span>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-accent-indigo">{config.SYSTEM_STATUS}</span>
                </div>
            </div>
        </header>
    );
};
