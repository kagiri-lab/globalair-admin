'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import api from './api';

interface AdminUser { id: string; name: string; email: string; role: string; phone?: string; permissions?: string | string[]; }
interface AuthCtx { 
    user: AdminUser | null; 
    isLoading: boolean; 
    login: (e: string, p: string) => Promise<void>; 
    logout: () => void; 
    setUser: React.Dispatch<React.SetStateAction<AdminUser | null>>;
    hasPermission: (permission: string) => boolean;
}

const ALL_ADMIN_ROLES = ['super_admin', 'admin', 'operations', 'support', 'finance', 'manager', 'rider'];
const AuthContext = createContext<AuthCtx | null>(null);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AdminUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const t = localStorage.getItem('admin_token');
        if (!t) { setIsLoading(false); return; }
        // Validate the stored token against the backend on every startup
        api.get('/auth/me').then(r => {
            const u = r.data.data.user;
            if (ALL_ADMIN_ROLES.includes(u.role)) {
                setUser(u);
                localStorage.setItem('admin_user', JSON.stringify(u));
            } else {
                localStorage.removeItem('admin_token');
                localStorage.removeItem('admin_user');
            }
        }).catch(() => {
            // Token is invalid or stale — clear everything; api interceptor redirects to /login
            localStorage.removeItem('admin_token');
            localStorage.removeItem('admin_user');
            setUser(null);
        }).finally(() => setIsLoading(false));
    }, []);

    const login = async (email: string, password: string) => {
        const res = await api.post('/auth/login', { email, password });
        const { user: u, token } = res.data.data;
        if (!ALL_ADMIN_ROLES.includes(u.role)) throw new Error('Not authorized as admin');
        localStorage.setItem('admin_token', token);
        localStorage.setItem('admin_user', JSON.stringify(u));
        document.cookie = `admin_token=${token}; path=/`;
        setUser(u);
    };

    const logout = () => {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        document.cookie = 'admin_token=; path=/; max-age=0';
        setUser(null);
    };

    const hasPermission = (permission: string): boolean => {
        if (!user) return false;
        if (user.role === 'super_admin') return true;
        
        if (user.permissions) {
            const perms = typeof user.permissions === 'string' 
                ? JSON.parse(user.permissions) 
                : user.permissions;
            if (Array.isArray(perms)) {
                return perms.includes(permission);
            }
        }
        return false; 
    };

    return <AuthContext.Provider value={{ user, isLoading, login, logout, setUser, hasPermission }}>{children}</AuthContext.Provider>;
}

export function useAdminAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('Must be inside AdminAuthProvider');
    return ctx;
}
