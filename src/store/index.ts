import { create } from 'zustand';
import type { Staff } from '../types';

interface AuthState {
    user: Staff | null;
    setUser: (user: Staff | null) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null, // Default to null for auth flow
    setUser: (user) => set({ user }),
    logout: () => set({ user: null }),
}));

interface UIState {
    isSidebarOpen: boolean;
    setSidebarOpen: (isOpen: boolean) => void;
    toggleSidebar: () => void;
}

export const useUIStore = create<UIState>((set) => ({
    isSidebarOpen: true,
    setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
    toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
}));
