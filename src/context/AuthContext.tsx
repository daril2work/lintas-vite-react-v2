import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Staff } from '../types';
import { supabase } from '../services/supabase';
import type { Session, AuthChangeEvent } from '@supabase/supabase-js';

interface AuthContextType {
    user: Staff | null;
    login: (email: string, password?: string) => Promise<void>; // Added password for real auth
    logout: () => Promise<void>;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<Staff | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check active session
        supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
            if (session?.user) {
                fetchProfile(session.user.id);
            } else {
                setIsLoading(false);
            }
        });

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
            if (session?.user) {
                fetchProfile(session.user.id);
            } else {
                setUser(null);
                setIsLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('Error fetching profile:', error);
            }

            if (data) {
                setUser({
                    id: data.id,
                    name: data.name,
                    role: data.role as Staff['role'],
                    department: data.department,
                    employeeId: data.employee_id,
                    username: data.email, // Use email as username
                });
            }
        } catch (error) {
            console.error('Unexpected error fetching profile:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (email: string, password?: string) => {
        if (!password) {
            alert("Password is required for Supabase login.");
            return;
        }

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            console.error("Login failed:", error.message);
            throw error;
        } else {
            // Profile fetch will happen in onAuthStateChange
        }
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
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
