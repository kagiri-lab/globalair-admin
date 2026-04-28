'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
    Users, UserPlus, Search, Filter, Mail, Phone, 
    ShieldCheck, Edit2, Trash2, CheckCircle, 
    XCircle, MoreVertical, HardHat, Truck,
    Activity, Globe, MapPin, Building2, Key,
    ShieldAlert, X, ChevronRight, ChevronLeft,
    UserCircle2, ExternalLink, Shield, Info,
    Clock, List, Zap, Terminal, Hash, Lock, Unlock, RefreshCw,
    BarChart3, Eye
} from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
    super_admin: { label: 'Super Admin', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.08)', icon: ShieldAlert },
    admin: { label: 'Admin', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.08)', icon: ShieldCheck },
    operations: { label: 'Operations', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.08)', icon: Activity },
    support: { label: 'Support', color: '#10b981', bg: 'rgba(16, 185, 129, 0.08)', icon: Globe },
    finance: { label: 'Finance', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.08)', icon: Info },
    manager: { label: 'Facility Manager', color: '#6366f1', bg: 'rgba(99, 102, 241, 0.08)', icon: Building2 },
    rider: { label: 'Delivery Rider', color: '#14b8a6', bg: 'rgba(20, 184, 166, 0.08)', icon: Truck },
};

export default function StaffManagementPage() {
    const [staff, setStaff] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [editingStaff, setEditingStaff] = useState<any>(null);
    const [page, setPage] = useState(1);
    const itemsPerPage = 10;
    const router = useRouter();

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        role: 'manager',
        password: '',
        is_active: true
    });

    const loadStaff = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/system/admins');
            setStaff(res.data.data || []);
        } catch (e) {
            toast.error('Failed to load staff records');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadStaff();
    }, [loadStaff]);

    const handleRowClick = (staffId: string) => {
        router.push(`/staff/${staffId}`);
    };

    const filteredStaff = useMemo(() => {
        return staff.filter(s => {
            const matchesSearch = (s.name + s.email + (s.phone || '')).toLowerCase().includes(searchQuery.toLowerCase());
            const matchesRole = roleFilter === 'all' || s.role === roleFilter;
            return matchesSearch && matchesRole;
        });
    }, [staff, searchQuery, roleFilter]);

    const paginatedStaff = useMemo(() => {
        const start = (page - 1) * itemsPerPage;
        return filteredStaff.slice(start, start + itemsPerPage);
    }, [filteredStaff, page]);

    const totalPages = Math.ceil(filteredStaff.length / itemsPerPage);

    const openModal = (e: React.MouseEvent, member?: any) => {
        e.stopPropagation();
        if (member) {
            setEditingStaff(member);
            setFormData({
                name: member.name,
                email: member.email,
                phone: member.phone || '',
                role: member.role,
                password: '', 
                is_active: member.is_active
            });
        } else {
            setEditingStaff(null);
            setFormData({
                name: '',
                email: '',
                phone: '',
                role: 'manager',
                password: '',
                is_active: true
            });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingStaff) {
                await api.patch(`/admin/system/admins/${editingStaff.id}`, formData);
                toast.success('Staff record updated');
            } else {
                if (!formData.password) return toast.error('Password is required');
                await api.post('/admin/system/admins', formData);
                toast.success('Staff created successfully');
            }
            setShowModal(false);
            loadStaff();
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Operation failed');
        }
    };

    const toggleStatus = async (e: React.MouseEvent, member: any) => {
        e.stopPropagation();
        try {
            await api.patch(`/admin/system/admins/${member.id}/toggle-access`);
            toast.success(`Access updated`);
            loadStaff();
        } catch (e) {
            toast.error('Status update failed');
        }
    };

    return (
        <div className="fade-in" style={{ padding: 'clamp(1rem, 3vw, 2rem)', maxWidth: 1600, margin: '0 auto' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', flexWrap: 'wrap', gap: '1.5rem' }}>
                <div>
                    <h1 style={{ fontSize: 'clamp(1.75rem, 5vw, 2.5rem)', fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>Staff Management</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 500, marginTop: '0.4rem' }}>Manage administrators and team members.</p>
                </div>
                <button className="btn btn-primary" onClick={(e) => openModal(e)} style={{ height: 48, borderRadius: 14, padding: '0 1.5rem', fontWeight: 800, boxShadow: '0 10px 25px -5px rgba(15, 64, 152, 0.4)' }}>
                    <UserPlus size={20} /> Add Staff
                </button>
            </header>

            {/* Metrics Dashboard */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginBottom: '3rem' }}>
                {[
                    { label: 'Personnel', val: staff.length, color: 'var(--accent)', icon: <Users size={24} /> },
                    { label: 'Facility Managers', val: staff.filter(s => s.role === 'manager').length, color: '#6366f1', icon: <Building2 size={24} /> },
                    { label: 'Delivery Riders', val: staff.filter(s => s.role === 'rider').length, color: '#14b8a6', icon: <Truck size={24} /> },
                    { label: 'Active Sessions', val: staff.filter(s => s.is_active).length, color: '#10b981', icon: <Activity size={24} /> }
                ].map((stat, i) => (
                    <div key={i} className="card" style={{ padding: '1.5rem', borderRadius: 24, display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                        <div style={{ width: 52, height: 52, borderRadius: 14, background: `${stat.color}10`, color: stat.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {stat.icon}
                        </div>
                        <div>
                            <h3 style={{ fontSize: '1.6rem', fontWeight: 900, lineHeight: 1, letterSpacing: '-0.02em' }}>{stat.val}</h3>
                            <p style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.35rem' }}>{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters Area */}
            <div className="card" style={{ padding: '0.75rem', borderRadius: 20, background: 'var(--bg-secondary)', border: '1px solid var(--border)', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: 'min(100%, 350px)' }}>
                    <Search size={18} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', opacity: 0.7 }} />
                    <input className="input" placeholder="Search by name, email or mobile..." style={{ paddingLeft: '3rem', height: 48, borderRadius: 14, border: '1px solid var(--border)', background: '#fff', fontWeight: 600 }} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                </div>
                <div style={{ display: 'flex', background: 'var(--border)', padding: '0.25rem', borderRadius: 12, gap: '0.2rem' }} className="desktop-only">
                    {['all', 'manager', 'rider', 'admin'].map(role => (
                        <button key={role} onClick={() => setRoleFilter(role)} style={{ padding: '0.5rem 1.25rem', borderRadius: 10, border: 'none', background: roleFilter === role ? 'white' : 'transparent', color: roleFilter === role ? 'var(--accent)' : 'var(--text-muted)', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer', textTransform: 'capitalize' }}>
                            {role}
                        </button>
                    ))}
                </div>
            </div>

            {/* Data Grid */}
            <div className="card" style={{ padding: 0, borderRadius: 24, overflow: 'hidden' }}>
                <div className="data-table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th style={{ paddingLeft: '2rem' }}>Name</th>
                                <th>Role</th>
                                <th>Contact</th>
                                <th className="desktop-only">Status</th>
                                <th style={{ paddingRight: '2rem' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={5} style={{ padding: '5rem 0' }}>
                                        <div style={{ display: 'flex', justifyContent: 'center' }}><div className="spinner" /></div>
                                    </td>
                                </tr>
                            ) : paginatedStaff.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ padding: '5rem 0', textAlign: 'center' }}>
                                        <Users size={48} style={{ margin: '0 auto', opacity: 0.1, marginBottom: '1rem' }} />
                                        <p style={{ fontWeight: 800, color: 'var(--text-primary)' }}>No personnel found</p>
                                    </td>
                                </tr>
                            ) : paginatedStaff.map((member) => {
                                const cfg = ROLE_CONFIG[member.role] || ROLE_CONFIG.admin;
                                return (
                                    <tr key={member.id} onClick={() => handleRowClick(member.id)} style={{ cursor: 'pointer' }}>
                                        <td style={{ paddingLeft: '2rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 900 }}>
                                                    {member.name.charAt(0)}
                                                </div>
                                                <div style={{ minWidth: 0 }}>
                                                    <p style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{member.name}</p>
                                                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>ID: {member.id.slice(0, 8).toUpperCase()}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.7rem', borderRadius: 8, background: cfg.bg, color: cfg.color, fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase' }}>
                                                <cfg.icon size={12} /> {cfg.label}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                                                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{member.email}</span>
                                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>{member.phone || 'No Phone'}</span>
                                            </div>
                                        </td>
                                        <td className="desktop-only">
                                            <button onClick={(e) => toggleStatus(e, member)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: 0 }}>
                                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: member.is_active ? '#10b981' : '#ef4444' }} />
                                                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: member.is_active ? '#10b981' : '#ef4444' }}>{member.is_active ? 'Active' : 'Inactive'}</span>
                                            </button>
                                        </td>
                                        <td style={{ paddingRight: '2rem' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button className="btn btn-secondary btn-sm" onClick={(e) => openModal(e, member)} style={{ width: 32, height: 32, padding: 0, borderRadius: 8 }}><Edit2 size={14} /></button>
                                                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                                                    <ChevronRight size={16} />
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '2.5rem', flexWrap: 'wrap' }}>
                    <button className="btn btn-secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)} style={{ borderRadius: 12, padding: '0.6rem 1rem' }}><ChevronLeft size={16} /></button>
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>{page}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>of {totalPages}</span>
                    </div>
                    <button className="btn btn-secondary" disabled={page === totalPages} onClick={() => setPage(p => p + 1)} style={{ borderRadius: 12, padding: '0.6rem 1rem' }}><ChevronRight size={16} /></button>
                </div>
            )}

            {/* Focused Island Modal (Provisioning) */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '1rem' }}>
                    <div className="card fade-in" style={{ width: '100%', maxWidth: 500, padding: 0, boxShadow: '0 40px 100px -20px rgba(0, 0, 0, 0.3)', borderRadius: 28, overflow: 'hidden', background: '#fff' }}>
                        <div style={{ background: 'var(--bg-secondary)', padding: '2rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h2 style={{ fontSize: '1.35rem', fontWeight: 900, letterSpacing: '-0.02em' }}>{editingStaff ? 'Edit Staff' : 'Add Staff'}</h2>
                                <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginTop: '0.2rem' }}>Staff Details</p>
                            </div>
                            <button className="menu-toggle" onClick={() => setShowModal(false)}><X size={20} /></button>
                        </div>
                        
                        <form onSubmit={handleSubmit} style={{ padding: '2rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                <div>
                                    <label className="label">Full Name</label>
                                    <input className="input" style={{ height: 48, borderRadius: 12, background: 'var(--bg-secondary)', fontWeight: 600 }} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                    <div>
                                        <label className="label">Email Address</label>
                                        <input className="input" type="email" style={{ height: 48, borderRadius: 12, background: 'var(--bg-secondary)', fontWeight: 600 }} value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} disabled={!!editingStaff} required />
                                    </div>
                                    <div>
                                        <label className="label">Phone Number</label>
                                        <input className="input" style={{ height: 48, borderRadius: 12, background: 'var(--bg-secondary)', fontWeight: 600 }} value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                                    </div>
                                </div>

                                <div>
                                    <label className="label">Role</label>
                                    <select className="input" style={{ height: 48, borderRadius: 12, background: 'var(--bg-secondary)', fontWeight: 600 }} value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                                        {Object.entries(ROLE_CONFIG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
                                    </select>
                                </div>

                                {!editingStaff && (
                                    <div>
                                        <label className="label">Password</label>
                                        <div style={{ position: 'relative' }}>
                                            <Key size={16} style={{ position: 'absolute', left: 14, top: 16, color: 'var(--text-muted)', opacity: 0.7 }} />
                                            <input type="password" className="input" style={{ height: 48, paddingLeft: '2.75rem', borderRadius: 12, background: 'var(--bg-secondary)', fontWeight: 600 }} value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: '2rem', height: 52, borderRadius: 14, fontSize: '1rem', fontWeight: 900, boxShadow: '0 10px 20px rgba(15, 64, 152, 0.2)' }}>
                                {editingStaff ? 'Update' : 'Add Staff'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
