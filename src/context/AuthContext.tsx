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
        // 1. Check active Supabase session
        supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
            if (session?.user) {
                fetchProfile(session.user.id);
            } else {
                // 2. Fallback: Check for mock session in localStorage
                const mockUser = localStorage.getItem('cssd_mock_user');
                if (mockUser) {
                    try {
                        setUser(JSON.parse(mockUser));
                    } catch (e) {
                        localStorage.removeItem('cssd_mock_user');
                    }
                }
                setIsLoading(false);
            }
        });

        // Listen for Supabase changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
            if (session?.user) {
                fetchProfile(session.user.id);
            } else {
                // Only clear if no mock user exists
                if (!localStorage.getItem('cssd_mock_user')) {
                    setUser(null);
                    setIsLoading(false);
                }
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
            alert("Password is required.");
            return;
        }

        try {
            // Try REAL Supabase Auth first
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) {
                // If real auth fails, try MOCK fallback
                console.log("Supabase Auth failed, checking Profiles table for fallback...");

                // 1. First check if the user exists at all (by email/username)
                const { data: profileCheck, error: checkError } = await supabase
                    .from('profiles')
                    .select('*')
                    .ilike('email', email)
                    .single();

                if (checkError || !profileCheck) {
                    console.error("Mock Fallback: User not found in profiles table.");
                    throw new Error("Username/Email tidak terdaftar di sistem.");
                }

                // 2. If user exists, check password
                if (profileCheck.password !== password) {
                    console.error("Mock Fallback: Password mismatch.");
                    throw new Error("Password yang Anda masukkan salah.");
                }

                // Mock Login Success
                console.log("Mock Login Success for:", profileCheck.name);
                const staffUser: Staff = {
                    id: profileCheck.id,
                    name: profileCheck.name,
                    role: profileCheck.role as Staff['role'],
                    department: profileCheck.department,
                    employeeId: profileCheck.employee_id,
                    username: profileCheck.email,
                };

                setUser(staffUser);
                localStorage.setItem('cssd_mock_user', JSON.stringify(staffUser));
                return;
            } else if (data.user) {
                localStorage.removeItem('cssd_mock_user'); // Clear mock if real succeeds
                await fetchProfile(data.user.id);
            }
        } catch (err: any) {
            console.error("Final Login Error:", err.message);
            throw err;
        }
    };

    const logout = async () => {
        await supabase.auth.signOut();
        localStorage.removeItem('cssd_mock_user');
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
