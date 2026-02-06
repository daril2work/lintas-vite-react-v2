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
    ChevronRight,
    ListTodo,
    LogOut
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useUIStore } from '../../store';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { NavLink, useNavigate } from 'react-router-dom';
import { APP_CONFIG } from '../../constants/config';

const MENU_SECTIONS = [
    {
        id: 'utama',
        header: 'UTAMA',
        allowedRoles: ['admin', 'operator', 'nurse'],
        items: [
            { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
        ]
    },
    {
        id: 'aktivitas',
        header: 'AKTIVITAS CSSD',
        allowedRoles: ['admin', 'operator'],
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
        allowedRoles: ['admin', 'nurse'],
        items: [
            { icon: Send, label: 'Kirim Alat Kotor', path: '/ward/send' },
            { icon: ClipboardCheck, label: 'Terima Distribusi', path: '/ward/receive' },
            { icon: ListTodo, label: 'Permintaan Alat', path: '/ward/request' },
        ]
    },
    {
        id: 'backoffice',
        header: 'BACKOFFICE',
        allowedRoles: ['admin'],
        items: [
            { icon: Database, label: 'Master Data', path: '/admin' },
            { icon: BarChart2, label: 'Laporan', path: '/reports' },
        ]
    },
];

export const Sidebar = () => {
    const { isSidebarOpen, toggleSidebar } = useUIStore();
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState<string | null>('aktivitas');

    const toggleSection = (id: string) => {
        setActiveSection(prev => prev === id ? null : id);
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    // Filter menu sections based on role
    const visibleSections = MENU_SECTIONS.filter(section => {
        if (!user) return false;
        return section.allowedRoles.includes(user.role);
    });

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
                    <div className="flex flex-col">
                        <span className="text-xl font-black tracking-tighter leading-none">LINTAS <span className="text-accent-amber">CSSD</span></span>
                        <span className="text-[8px] font-bold tracking-[0.2em] text-slate-500 uppercase mt-1">Version {APP_CONFIG.APP_VERSION}</span>
                    </div>
                </div>
                <button onClick={toggleSidebar} className="lg:hidden text-slate-400 hover:text-white">
                    <X size={24} />
                </button>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto custom-scrollbar">
                {visibleSections.map((section) => {
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
                                        <NavLink
                                            key={item.label}
                                            to={item.path}
                                            className={({ isActive }) => cn(
                                                "flex items-center gap-4 px-4 py-3 rounded-2xl transition-all group",
                                                isActive
                                                    ? "text-white bg-accent-indigo shadow-lg shadow-accent-indigo/20 font-bold"
                                                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                                            )}
                                        >
                                            <Icon size={20} className={cn(
                                                "transition-colors",
                                                "group-hover:text-accent-indigo"
                                            )} />
                                            <span className="text-sm">{item.label}</span>
                                        </NavLink>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </nav>

            <div className="p-4 mt-auto space-y-2">
                <div className="bg-slate-800/50 rounded-2xl p-4 flex items-center gap-4 border border-white/5">
                    <div className="w-10 h-10 rounded-full bg-accent-indigo/20 flex items-center justify-center border border-accent-indigo/30">
                        <User size={20} className="text-accent-indigo" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-bold truncate leading-none mb-1">{user?.name || 'User Lintas'}</p>
                        <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{user?.role || 'Guest'}</p>
                    </div>
                </div>

                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-3 py-3 rounded-2xl text-slate-400 hover:text-white hover:bg-accent-rose/10 hover:text-accent-rose transition-all font-bold text-sm"
                >
                    <LogOut size={18} />
                    Keluar Sistem
                </button>
            </div>
        </aside>
    );
};
