import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/shared/Sidebar';
import { Header } from '../components/shared/Header';
import { useUIStore } from '../store';
import { cn } from '../utils/cn';

export const MainLayout = () => {
    const { isSidebarOpen } = useUIStore();

    return (
        <div className="min-h-screen bg-slate-50 flex">
            <Sidebar />
            <main
                className={cn(
                    "flex-1 flex flex-col transition-all duration-300 ease-in-out",
                    isSidebarOpen ? "lg:ml-72" : "ml-0"
                )}
            >
                <Header />
                <div className="p-8 flex-1">
                    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
};
