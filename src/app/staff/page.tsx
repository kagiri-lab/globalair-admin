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
        <div className="fade-in" style={{ padding: '2rem', maxWidth: 1200, margin: '0 auto' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>Command Staff</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 500, marginTop: '0.4rem' }}>Managing authorization layers and operational personnel.</p>
                </div>
                <button className="btn btn-primary" onClick={(e) => openModal(e)} style={{ height: 48, borderRadius: 14, padding: '0 1.5rem', fontWeight: 800, boxShadow: '0 10px 25px -5px rgba(15, 64, 152, 0.4)' }}>
                    <UserPlus size={20} /> Provision Staff
                </button>
            </header>

            {/* Metrics Dashboard */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
                {[
                    { label: 'Total Personnel', val: staff.length, color: 'var(--accent)', icon: <Users size={24} /> },
                    { label: 'Facility Managers', val: staff.filter(s => s.role === 'manager').length, color: '#6366f1', icon: <Building2 size={24} /> },
                    { label: 'Delivery Riders', val: staff.filter(s => s.role === 'rider').length, color: '#14b8a6', icon: <Truck size={24} /> },
                    { label: 'Active Sessions', val: staff.filter(s => s.is_active).length, color: '#10b981', icon: <Activity size={24} /> }
                ].map((stat, i) => (
                    <div key={i} className="card" style={{ padding: '1.75rem', borderRadius: 28, background: '#fff', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                        <div style={{ width: 56, height: 56, borderRadius: 16, background: `${stat.color}10`, color: stat.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {stat.icon}
                        </div>
                        <div>
                            <h3 style={{ fontSize: '1.75rem', fontWeight: 900, lineHeight: 1 }}>{stat.val}</h3>
                            <p style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.4rem' }}>{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters Area */}
            <div className="card" style={{ padding: '1rem', borderRadius: 20, background: '#fff', border: '1px solid var(--border)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={18} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input className="input" placeholder="Search by name, email or mobile..." style={{ paddingLeft: '3rem', height: 48, borderRadius: 14, border: 'none', background: 'var(--bg-secondary)', fontWeight: 600 }} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                </div>
                <div style={{ display: 'flex', background: 'var(--bg-secondary)', padding: '0.3rem', borderRadius: 14, gap: '0.2rem' }}>
                    {['all', 'manager', 'rider', 'admin'].map(role => (
                        <button key={role} onClick={() => setRoleFilter(role)} style={{ padding: '0.6rem 1.25rem', borderRadius: 10, border: 'none', background: roleFilter === role ? 'white' : 'transparent', color: roleFilter === role ? 'var(--accent)' : 'var(--text-muted)', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', textTransform: 'capitalize' }}>
                            {role}
                        </button>
                    ))}
                </div>
            </div>

            {/* Data Grid */}
            <div className="card" style={{ padding: 0, borderRadius: 28, overflow: 'hidden', border: '1px solid var(--border)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1.5fr 1.2fr auto', gap: '1rem', padding: '1.25rem 2rem', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <span>Identity</span>
                    <span>Role / Authorization</span>
                    <span>Contact Channel</span>
                    <span>Access Status</span>
                    <span></span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {loading ? (
                        <div style={{ padding: '5rem', textAlign: 'center' }}><div className="spinner" /></div>
                    ) : paginatedStaff.length === 0 ? (
                        <div style={{ padding: '5rem', textAlign: 'center', opacity: 0.3 }}>
                            <Users size={48} style={{ margin: '0 auto 1rem' }} />
                            <p style={{ fontWeight: 800 }}>No personnel identified</p>
                        </div>
                    ) : paginatedStaff.map((member, i) => {
                        const cfg = ROLE_CONFIG[member.role] || ROLE_CONFIG.admin;
                        return (
                            <div key={member.id} className="table-row-hover" onClick={() => handleRowClick(member.id)} style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1.5fr 1.2fr auto', gap: '1rem', padding: '1.5rem 2rem', alignItems: 'center', borderBottom: i < paginatedStaff.length - 1 ? '1px solid var(--border)' : 'none', cursor: 'pointer' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                                    <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg, #0f4098, #3b82f6)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1rem' }}>
                                        {member.name.charAt(0)}
                                    </div>
                                    <div style={{ minWidth: 0 }}>
                                        <h4 style={{ margin: 0, fontWeight: 800, fontSize: '0.95rem' }}>{member.name}</h4>
                                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>UID: {member.id.slice(0, 8).toUpperCase()}</p>
                                    </div>
                                </div>

                                <div>
                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.85rem', borderRadius: 10, background: cfg.bg, color: cfg.color, fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                                        <cfg.icon size={14} /> {cfg.label}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                                        <Mail size={12} style={{ opacity: 0.5 }} /> {member.email}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                                        <Phone size={12} style={{ opacity: 0.5 }} /> {member.phone || '—'}
                                    </div>
                                </div>

                                <div>
                                    <button onClick={(e) => toggleStatus(e, member)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: 0 }}>
                                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: member.is_active ? '#10b981' : '#ef4444' }} />
                                        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: member.is_active ? '#10b981' : '#ef4444' }}>{member.is_active ? 'Authorized' : 'Deactivated'}</span>
                                    </button>
                                </div>

                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button className="btn btn-secondary btn-sm" onClick={(e) => openModal(e, member)} style={{ width: 36, height: 36, padding: 0, borderRadius: 10 }}><Edit2 size={16} /></button>
                                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                                        <ChevronRight size={18} />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1.5rem', marginTop: '2.5rem' }}>
                    <button className="btn btn-secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)} style={{ borderRadius: 12, padding: '0.6rem 1.2rem' }}><ChevronLeft size={18} /> Prev</button>
                    <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-muted)' }}>{page} / {totalPages}</span>
                    <button className="btn btn-secondary" disabled={page === totalPages} onClick={() => setPage(p => p + 1)} style={{ borderRadius: 12, padding: '0.6rem 1.2rem' }}>Next <ChevronRight size={18} /></button>
                </div>
            )}

            {/* Focused Island Modal (Provisioning) */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100000, padding: '2rem' }}>
                    <div className="card fade-in" style={{ width: '100%', maxWidth: 500, padding: 0, border: '1px solid rgba(255,255,255,0.2)', boxShadow: '0 40px 100px -20px rgba(0, 0, 0, 0.5)', borderRadius: 32, overflow: 'hidden', background: '#fff' }}>
                        <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', padding: '2.5rem', color: 'white', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(255,255,255,0.1)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <UserCircle2 size={28} />
                            </div>
                            <div>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.02em' }}>{editingStaff ? 'Update Credentials' : 'Provision Staff'}</h2>
                                <p style={{ opacity: 0.6, fontSize: '0.85rem', fontWeight: 600 }}>IAM Authorization Layer</p>
                            </div>
                            <button onClick={() => setShowModal(false)} style={{ marginLeft: 'auto', width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={20} /></button>
                        </div>
                        
                        <form onSubmit={handleSubmit} style={{ padding: '2.5rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div>
                                    <label className="label" style={{ fontWeight: 800, fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.6rem', textTransform: 'uppercase' }}>Full Identity</label>
                                    <input className="input" style={{ height: 52, borderRadius: 14, background: 'var(--bg-secondary)', fontWeight: 600 }} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label className="label" style={{ fontWeight: 800, fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.6rem', textTransform: 'uppercase' }}>Corporate Email</label>
                                        <input className="input" type="email" style={{ height: 52, borderRadius: 14, background: 'var(--bg-secondary)', fontWeight: 600 }} value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} disabled={!!editingStaff} required />
                                    </div>
                                    <div>
                                        <label className="label" style={{ fontWeight: 800, fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.6rem', textTransform: 'uppercase' }}>Mobile Channel</label>
                                        <input className="input" style={{ height: 52, borderRadius: 14, background: 'var(--bg-secondary)', fontWeight: 600 }} value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                                    </div>
                                </div>

                                <div>
                                    <label className="label" style={{ fontWeight: 800, fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.6rem', textTransform: 'uppercase' }}>Authorization Role</label>
                                    <select className="input" style={{ height: 52, borderRadius: 14, background: 'var(--bg-secondary)', fontWeight: 600 }} value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                                        {Object.entries(ROLE_CONFIG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
                                    </select>
                                </div>

                                {!editingStaff && (
                                    <div>
                                        <label className="label" style={{ fontWeight: 800, fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.6rem', textTransform: 'uppercase' }}>Security Key (Password)</label>
                                        <div style={{ position: 'relative' }}>
                                            <Key size={16} style={{ position: 'absolute', left: 14, top: 18, color: 'var(--text-muted)' }} />
                                            <input type="password" className="input" style={{ height: 52, paddingLeft: '2.75rem', borderRadius: 14, background: 'var(--bg-secondary)', fontWeight: 600 }} value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '2.5rem', height: 56, borderRadius: 16, fontSize: '1.1rem', fontWeight: 900, boxShadow: '0 15px 30px -10px rgba(15, 64, 152, 0.4)' }}>
                                {editingStaff ? 'Synchronize Identity' : 'Authorize Personnel'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
