import { Bell, Search, Menu as MenuIcon } from 'lucide-react';
import { useUIStore } from '../../store';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';

export const Header = () => {
    const { toggleSidebar } = useUIStore();
    const { data: requests } = useQuery({
        queryKey: ['requests'],
        queryFn: api.getRequests,
        refetchInterval: 5000, // Poll every 5s for notifications
    });

    const pendingCount = requests?.filter(r => r.status === 'pending').length || 0;

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
                <button className="relative p-2.5 hover:bg-slate-50 rounded-2xl transition-all group">
                    <Bell size={20} className="text-slate-600 group-hover:text-accent-indigo" />
                    {pendingCount > 0 && (
                        <span className="absolute top-2.5 right-2.5 w-4 h-4 bg-accent-rose border-2 border-white rounded-full text-[8px] font-black flex items-center justify-center text-white">
                            {pendingCount}
                        </span>
                    )}
                </button>
                <div className="h-10 w-px bg-slate-100 mx-2"></div>
                <div className="flex flex-col items-end">
                    <span className="text-sm font-black text-slate-900">Rabu, 03 Feb 2026</span>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-accent-indigo">System Online</span>
                </div>
            </div>
        </header>
    );
};
