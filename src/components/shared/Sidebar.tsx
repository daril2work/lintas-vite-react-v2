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
    Send,
    ClipboardCheck,
    User,
    ChevronDown,
    ChevronRight
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useUIStore } from '../../store';
import { useState } from 'react';

const MENU_SECTIONS = [
    {
        id: 'utama',
        header: 'UTAMA',
        items: [
            { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        ]
    },
    {
        id: 'aktivitas',
        header: 'AKTIVITAS CSSD',
        items: [
            { icon: PackageSearch, label: 'Penerimaan', path: '/intake' },
            { icon: Waves, label: 'Pencucian', path: '/washing' },
            { icon: Box, label: 'Pengepakan', path: '/packing' },
            { icon: Settings, label: 'Sterilisasi', path: '/sterilizing' },
            { icon: Truck, label: 'Distribusi', path: '/distribution' },
        ]
    },
    {
        id: 'ruangan',
        header: 'RUANGAN / UNIT',
        items: [
            { icon: Send, label: 'Kirim Alat Kotor', path: '/ward/send' },
            { icon: ClipboardCheck, label: 'Terima Distribusi', path: '/ward/receive' },
        ]
    },
    {
        id: 'backoffice',
        header: 'BACKOFFICE',
        items: [
            { icon: Database, label: 'Master Data', path: '/admin' },
            { icon: BarChart2, label: 'Laporan', path: '/reports' },
        ]
    },
];

export const Sidebar = () => {
    const { isSidebarOpen, toggleSidebar } = useUIStore();
    const [activeSection, setActiveSection] = useState<string | null>('aktivitas'); // Default open section

    const toggleSection = (id: string) => {
        setActiveSection(prev => prev === id ? null : id);
    };

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

            <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto custom-scrollbar">
                {MENU_SECTIONS.map((section) => {
                    const isOpen = activeSection === section.id;

                    return (
                        <div key={section.id} className="space-y-1">
                            <button
                                onClick={() => toggleSection(section.id)}
                                className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-slate-800 transition-all group"
                            >
                                <span className="text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase group-hover:text-slate-300 transition-colors">
                                    {section.header}
                                </span>
                                {isOpen ? (
                                    <ChevronDown size={14} className="text-slate-600 group-hover:text-slate-400" />
                                ) : (
                                    <ChevronRight size={14} className="text-slate-600 group-hover:text-slate-400" />
                                )}
                            </button>

                            <div className={cn(
                                "space-y-1 overflow-hidden transition-all duration-300 ease-in-out",
                                isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0 pointer-events-none"
                            )}>
                                {section.items.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <a
                                            key={item.label}
                                            href={item.path}
                                            className="flex items-center gap-4 px-4 py-3 rounded-2xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all group"
                                        >
                                            <Icon size={20} className="group-hover:text-accent-indigo transition-colors" />
                                            <span className="text-sm font-semibold">{item.label}</span>
                                        </a>
                                    );
                                })}
                            </div>
                        </div>
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
