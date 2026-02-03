import {
    LayoutDashboard,
    PackageSearch,
    Waves,
    Box,
    Settings,
    Truck,
    BarChart2,
    Database,
    X,
    User
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useUIStore } from '../../store';

const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: PackageSearch, label: 'Penerimaan', path: '/intake' },
    { icon: Waves, label: 'Pencucian', path: '/washing' },
    { icon: Box, label: 'Pengepakan', path: '/packing' },
    { icon: Settings, label: 'Sterilisasi', path: '/sterilizing' },
    { icon: Truck, label: 'Distribusi', path: '/distribution' },
    { divider: true },
    { icon: Database, label: 'Master Data', path: '/admin' },
    { icon: BarChart2, label: 'Laporan', path: '/reports' },
];

export const Sidebar = () => {
    const { isSidebarOpen, toggleSidebar } = useUIStore();

    return (
        <aside
            className={cn(
                "fixed inset-y-0 left-0 z-50 w-72 bg-primary text-white transition-transform duration-300 ease-in-out transform flex flex-col",
                !isSidebarOpen && "-translate-x-full"
            )}
        >
            <div className="p-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent-indigo flex items-center justify-center font-black text-xl">L</div>
                    <span className="text-xl font-black tracking-tighter">LINTAS <span className="text-accent-amber">CSSD</span></span>
                </div>
                <button onClick={toggleSidebar} className="lg:hidden text-slate-400 hover:text-white">
                    <X size={24} />
                </button>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
                {menuItems.map((item, index) => {
                    if (item.divider) return <div key={index} className="my-6 border-t border-slate-800 lg:mx-4" />;
                    if (!item.icon) return null;

                    const Icon = item.icon;
                    return (
                        <a
                            key={item.label}
                            href={item.path}
                            className="flex items-center gap-4 px-4 py-3.5 rounded-2xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all group"
                        >
                            <Icon size={22} className="group-hover:text-accent-indigo transition-colors" />
                            <span className="font-semibold">{item.label}</span>
                        </a>
                    );
                })}
            </nav>

            <div className="p-4 mt-auto">
                <div className="bg-slate-800/50 rounded-2xl p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                        <User size={20} className="text-slate-400" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-bold truncate">Operator CSSD</p>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest">Shift Pagi</p>
                    </div>
                </div>
            </div>
        </aside>
    );
};
