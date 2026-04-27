'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAdminAuth } from '@/lib/auth';
import { logEvent } from '@/lib/api';
import { LayoutDashboard, Truck, Users, User, Tag, ShieldCheck, LogOut, Package, Settings, Menu, Activity, MessageSquare, Contact, FileText, BarChart3, DollarSign, Globe } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, isLoading, logout, hasPermission } = useAdminAuth();
    const router = useRouter();
    const pathname = usePathname();
    const isActive = (path: string) => {
        if (path === '/dashboard') return pathname === '/dashboard';
        return pathname.startsWith(path) && (pathname.length === path.length || pathname[path.length] === '/');
    };
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    useEffect(() => {
        setIsMobileMenuOpen(false);
        setIsProfileOpen(false);
    }, [pathname]);

    useEffect(() => {
        if (!isLoading && !user) router.replace('/login');
    }, [user, isLoading, router]);

    const handleLogout = () => {
        logout();
        toast.success('Logged out');
        router.push('/login');
    };

    useEffect(() => {
        if (user) {
            logEvent('view', 'page', pathname, { url: window.location.href });
        }
    }, [pathname, user?.id]);

    const [dynamicTitle, setDynamicTitle] = useState<string | null>(null);
    
    useEffect(() => {
        const handle = (e: any) => setDynamicTitle(e.detail);
        window.addEventListener('set-header-title', handle);
        return () => {
            window.removeEventListener('set-header-title', handle);
            setDynamicTitle(null);
        };
    }, [pathname]);

    if (isLoading || !user) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="spinner" /></div>;

    const mainNav = [
        { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={18} />, perm: 'view_dashboard' },
        { name: 'Shipments', path: '/shipments', icon: <Package size={18} />, perm: 'view_shipments' },
        { name: 'Customers', path: '/customers', icon: <Users size={18} />, perm: 'view_customers' },
    ].filter(item => hasPermission(item.perm));

    const manageNav = [
        { name: 'Categories', path: '/categories', icon: <Tag size={18} />, perm: 'view_categories' },
        { name: 'Pricing & Zones', path: '/locations-pricing', icon: <DollarSign size={18} />, perm: 'manage_zones' },
        { name: 'Support Tickets', path: '/support', icon: <MessageSquare size={18} />, perm: 'manage_support' },
    ].filter(item => hasPermission(item.perm));

    const systemNav = [
        { name: 'Staff Management', path: '/staff', icon: <ShieldCheck size={18} />, perm: 'manage_admins' },
        { name: 'Activity Logs', path: '/logs', icon: <Activity size={18} />, perm: 'view_logs' },
        { name: 'Settings', path: '/settings', icon: <Settings size={18} />, perm: 'view_settings' },
    ].filter(item => hasPermission(item.perm));

    return (
        <div className="dashboard-layout">
            <div
                className={`mobile-overlay ${isMobileMenuOpen ? 'open' : ''}`}
                onClick={() => setIsMobileMenuOpen(false)}
            />

            <aside className={`dashboard-sidebar ${isMobileMenuOpen ? 'open' : ''}`} style={{ width: 260, padding: '1.5rem 1rem' }}>
                {/* Logo Area */}
                <div style={{ padding: '0 0.5rem', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: 38, height: 38, background: 'var(--accent)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Package size={20} color="white" />
                        </div>
                        <div>
                            <h1 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>GlobalAir</h1>
                            <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.2rem' }}>Logistics Admin</p>
                        </div>
                    </div>
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem', overflowY: 'auto', paddingRight: '0.25rem' }} className="custom-scrollbar">
                    {/* Main Section */}
                    <div>
                        <p style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.075em', padding: '0 0.75rem', marginBottom: '0.6rem' }}>Analytics & Ops</p>
                        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            {mainNav.map(({ path, icon, name }) => (
                                <Link key={path} href={path} className={`sidebar-link ${isActive(path) ? 'active' : ''}`}>
                                    <span style={{ display: 'flex', alignItems: 'center', opacity: isActive(path) ? 1 : 0.7 }}>{icon}</span> 
                                    <span style={{ flex: 1 }}>{name}</span>
                                    {name === 'Shipments' && <span style={{ fontSize: '0.6rem', fontWeight: 700, background: 'rgba(59,130,246,0.1)', color: 'var(--accent)', padding: '0.1rem 0.4rem', borderRadius: 4 }}>Live</span>}
                                </Link>
                            ))}
                        </nav>
                    </div>

                    {/* Management Section */}
                    <div>
                        <p style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.075em', padding: '0 0.75rem', marginBottom: '0.6rem' }}>Management</p>
                        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            {manageNav.map(({ path, icon, name }) => (
                                <Link key={path} href={path} className={`sidebar-link ${isActive(path) ? 'active' : ''}`}>
                                    <span style={{ display: 'flex', alignItems: 'center', opacity: isActive(path) ? 1 : 0.7 }}>{icon}</span> 
                                    {name}
                                </Link>
                            ))}
                        </nav>
                    </div>

                    {/* System Section */}
                    <div>
                        <p style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.075em', padding: '0 0.75rem', marginBottom: '0.6rem' }}>System & Config</p>
                        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            {systemNav.map(({ path, icon, name }) => (
                                <Link key={path} href={path} className={`sidebar-link ${isActive(path) ? 'active' : ''}`}>
                                    <span style={{ display: 'flex', alignItems: 'center', opacity: isActive(path) ? 1 : 0.7 }}>{icon}</span> 
                                    {name}
                                </Link>
                            ))}
                        </nav>
                    </div>
                </div>

                <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
                    {/* Version text removed */}
                </div>
            </aside>

            <main className="dashboard-main">
                {/* Mobile Header */}
                <header className="mobile-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <img src="/logo.png" alt="Logo" style={{ height: 28, objectFit: 'contain' }} />
                    </div>
                    <button className="menu-toggle" onClick={() => setIsMobileMenuOpen(true)}>
                        <Menu size={24} />
                    </button>
                </header>

                {/* Desktop Top Header (Sticky) */}
                <header style={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 10,
                    background: '#ffffff',
                    borderBottom: '1px solid var(--border)',
                    padding: '0.75rem 2rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    height: '64px'
                }} className="desktop-only-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent)', textTransform: 'capitalize' }}>
                            {dynamicTitle || pathname.split('/').pop()?.replace(/-/g, ' ') || 'Dashboard'}
                        </h2>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', position: 'relative' }}>
                        {/* Profile Trigger */}
                        <button 
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                            style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '0.75rem', 
                                padding: '0.4rem 0.6rem', 
                                background: isProfileOpen ? 'var(--bg-secondary)' : 'transparent',
                                border: '1px solid',
                                borderColor: isProfileOpen ? 'var(--border)' : 'transparent',
                                borderRadius: 12,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => !isProfileOpen && (e.currentTarget.style.background = 'var(--bg-secondary)')}
                            onMouseLeave={e => !isProfileOpen && (e.currentTarget.style.background = 'transparent')}
                        >
                            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 700, color: 'white', flexShrink: 0 }}>
                                {user.name.charAt(0)}
                            </div>
                            <div style={{ textAlign: 'left', lineHeight: 1.2 }} className="desktop-only">
                                <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>{user.name}</p>
                                <p style={{ fontSize: '0.6rem', color: '#10b981', fontWeight: 700, textTransform: 'uppercase' }}>{user.role.replace('_', ' ')}</p>
                            </div>
                            <Activity size={14} style={{ color: 'var(--text-muted)', transform: isProfileOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                        </button>

                        {/* Profile Dropdown */}
                        {isProfileOpen && (
                            <div style={{ 
                                position: 'absolute', 
                                top: 'calc(100% + 0.5rem)', 
                                right: 0, 
                                width: 240, 
                                background: '#fff', 
                                borderRadius: 16, 
                                border: '1px solid var(--border)', 
                                boxShadow: '0 12px 30px rgba(0,0,0,0.08)', 
                                zIndex: 100,
                                padding: '0.5rem',
                                animation: 'slideUp 0.2s ease-out'
                            }}>
                                <div style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)', marginBottom: '0.25rem' }}>
                                    <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>{user.name}</p>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.email}</p>
                                </div>
                                
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                                    <Link href="/profile" className="sidebar-link" style={{ fontSize: '0.8rem', height: 40 }}>
                                        <User size={16} /> My Profile
                                    </Link>
                                </div>
                                
                                <div style={{ height: 1, background: 'var(--border)', margin: '0.4rem 0' }} />
                                
                                <button 
                                    onClick={handleLogout} 
                                    className="sidebar-link" 
                                    style={{ 
                                        width: '100%', 
                                        color: 'var(--danger)', 
                                        fontSize: '0.8rem',
                                        height: 40
                                    }}
                                >
                                    <LogOut size={16} /> Sign Out
                                </button>
                            </div>
                        )}
                    </div>
                </header>

                <div style={{ flex: 1, paddingBottom: '2rem' }}>
                    {children}
                </div>
            </main>
        </div>
    );
}
