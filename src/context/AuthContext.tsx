import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Staff } from '../types';

interface AuthContextType {
    user: Staff | null;
    login: (user: Staff) => void;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<Staff | null>(() => {
        const savedUser = localStorage.getItem('lintas_session');
        return savedUser ? JSON.parse(savedUser) : null;
    });
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Just in case we need to sync with other tabs later
        setIsLoading(false);
    }, []);

    const login = (userData: Staff) => {
        setUser(userData);
        localStorage.setItem('lintas_session', JSON.stringify(userData));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('lintas_session');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
