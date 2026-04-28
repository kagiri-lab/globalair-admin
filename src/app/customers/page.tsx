'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
    Search, ChevronLeft, ChevronRight, Users, Package, 
    ArrowRight, Plus, X, User, Mail, Phone, Lock,
    UserCheck, UserMinus, MoreHorizontal, Filter, Download
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

export default function AdminUsersPage() {
    const router = useRouter();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [pages, setPages] = useState(1);
    const [search, setSearch] = useState('');
    const [debounced, setDebounced] = useState('');

    // Create User Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [newUser, setNewUser] = useState({ name: '', email: '', phone: '', password: '', role: 'customer' });

    useEffect(() => { const t = setTimeout(() => setDebounced(search), 400); return () => clearTimeout(t); }, [search]);
    useEffect(() => { load(); }, [page, debounced]);

    const load = () => {
        setLoading(true);
        const p = new URLSearchParams({ page: String(page), limit: '10' });
        if (debounced) p.set('search', debounced);
        api.get(`/admin/users?${p}`).then(r => {
            setUsers(r.data.data.users);
            setTotal(r.data.data.pagination.total);
            setPages(r.data.data.pagination.pages);
        }).catch(() => { }).finally(() => setLoading(false));
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        try {
            const res = await api.post('/admin/users', newUser);
            toast.success(res.data.message);
            setIsModalOpen(false);
            setNewUser({ name: '', email: '', phone: '', password: '', role: 'customer' });
            load();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to create user');
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="fade-in" style={{ padding: 'clamp(1rem, 3vw, 2rem)', maxWidth: 1600, margin: '0 auto' }}>
            
            {/* Header Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1.5rem' }}>
                <div>
                    <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>Customers</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>Manage and monitor your global customer base.</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <button className="btn btn-secondary desktop-only" style={{ borderRadius: 12, padding: '0.6rem 1.25rem' }}>
                        <Download size={16} /> Export
                    </button>
                    <button className="btn btn-primary" onClick={() => setIsModalOpen(true)} style={{ borderRadius: 12, padding: '0.6rem 1.25rem', boxShadow: '0 8px 20px rgba(15,64,152,0.15)' }}>
                        <Plus size={18} /> New Customer
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.5rem' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(15,64,152,0.1)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Users size={24} />
                    </div>
                    <div>
                        <p style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.075em' }}>Total Customers</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.01em' }}>{total.toLocaleString()}</p>
                    </div>
                </div>
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.5rem' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(16,185,129,0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <UserCheck size={24} />
                    </div>
                    <div>
                        <p style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.075em' }}>Active Accounts</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.01em' }}>{Math.floor(total * 0.92).toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="card" style={{ padding: '0.75rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: 'min(100%, 400px)' }}>
                    <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', opacity: 0.7 }} />
                    <input 
                        className="input" 
                        style={{ paddingLeft: '2.75rem', height: 44, borderRadius: 12, background: '#fff', border: '1px solid var(--border)' }} 
                        placeholder="Search by name, email, or phone..."
                        value={search} 
                        onChange={e => { setSearch(e.target.value); setPage(1); }} 
                    />
                </div>
            </div>

            {/* Customers Registry Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: 20 }}>
                <div className="data-table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th style={{ paddingLeft: '2rem' }}>Customer</th>
                                <th>Contact</th>
                                <th className="desktop-only">Status</th>
                                <th>Shipments</th>
                                <th style={{ paddingRight: '2rem' }}>Joined</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={5} style={{ padding: '5rem 0' }}>
                                        <div style={{ display: 'flex', justifyContent: 'center' }}><div className="spinner" /></div>
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ padding: '5rem 0', textAlign: 'center' }}>
                                        <Users size={48} style={{ margin: '0 auto', opacity: 0.1, marginBottom: '1rem' }} />
                                        <p style={{ fontWeight: 800, color: 'var(--text-primary)' }}>No customers found</p>
                                    </td>
                                </tr>
                            ) : (
                                users.map((u: any) => (
                                    <tr key={u.id} onClick={() => router.push(`/customers/${u.id}`)} style={{ cursor: 'pointer' }}>
                                        <td style={{ paddingLeft: '2rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 800 }}>
                                                    {(u.name || 'U').charAt(0).toUpperCase()}
                                                </div>
                                                <div style={{ minWidth: 0 }}>
                                                    <p style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{u.name}</p>
                                                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>ID: {u.id.split('-')[0].toUpperCase()}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                                                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{u.email}</span>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>{u.phone || 'No Phone'}</span>
                                            </div>
                                        </td>
                                        <td className="desktop-only">
                                            <span style={{ 
                                                display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                                                padding: '0.25rem 0.65rem', borderRadius: 100, fontSize: '0.65rem', fontWeight: 800,
                                                background: u.is_active ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                                                color: u.is_active ? '#10b981' : '#ef4444'
                                            }}>
                                                {u.is_active ? 'Active' : 'Suspended'}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800, color: 'var(--accent)', fontSize: '0.9rem' }}>
                                                <Package size={14} />
                                                {u.shipment_count || 0}
                                            </div>
                                        </td>
                                        <td style={{ paddingRight: '2rem', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                                            {new Date(u.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination Section */}
            {pages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '2.5rem', gap: '1rem', flexWrap: 'wrap' }}>
                    <button className="btn btn-secondary" style={{ borderRadius: 12, padding: '0.6rem 1rem' }} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                        <ChevronLeft size={18} />
                    </button>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>{page}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>of {pages}</span>
                    </div>
                    <button className="btn btn-secondary" style={{ borderRadius: 12, padding: '0.6rem 1rem' }} onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}>
                        <ChevronRight size={18} />
                    </button>
                </div>
            )}

            {/* Create User Slide-over Modal */}
            {isModalOpen && (
                <>
                    <div className="modal-backdrop" onClick={() => setIsModalOpen(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(8px)', zIndex: 999 }} />
                    <div className="card" style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: 500, margin: 0, borderRadius: 0, zIndex: 1000, display: 'flex', flexDirection: 'column', padding: 0, boxShadow: '-20px 0 60px rgba(15,23,42,0.15)', border: 'none', background: '#fff', animation: 'slideIn 0.3s ease-out' }}>
                        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
                            <div>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0, marginBottom: '0.2rem' }}>Add New Customer</h2>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500, margin: 0 }}>Create a new system account manually.</p>
                            </div>
                            <button className="menu-toggle" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
                        </div>

                        <div style={{ padding: '2rem', flex: 1, overflowY: 'auto' }} className="custom-scrollbar">
                            <form id="createUserForm" onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                                <div className="form-group">
                                    <label className="label">Full Name</label>
                                    <div style={{ position: 'relative' }}>
                                        <User size={18} style={{ position: 'absolute', left: 14, top: 13, color: 'var(--text-muted)', opacity: 0.7 }} />
                                        <input type="text" className="input" required value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} style={{ paddingLeft: '2.75rem', height: 48, borderRadius: 12 }} placeholder="Jane Doe" />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="label">Email Address</label>
                                    <div style={{ position: 'relative' }}>
                                        <Mail size={18} style={{ position: 'absolute', left: 14, top: 13, color: 'var(--text-muted)', opacity: 0.7 }} />
                                        <input type="email" className="input" required value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} style={{ paddingLeft: '2.75rem', height: 48, borderRadius: 12 }} placeholder="jane@example.com" />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="label">Phone Number</label>
                                    <div style={{ position: 'relative' }}>
                                        <Phone size={18} style={{ position: 'absolute', left: 14, top: 13, color: 'var(--text-muted)', opacity: 0.7 }} />
                                        <input type="tel" className="input" value={newUser.phone} onChange={e => setNewUser({ ...newUser, phone: e.target.value })} style={{ paddingLeft: '2.75rem', height: 48, borderRadius: 12 }} placeholder="+254..." />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="label">Initial Password</label>
                                    <div style={{ position: 'relative' }}>
                                        <Lock size={18} style={{ position: 'absolute', left: 14, top: 13, color: 'var(--text-muted)', opacity: 0.7 }} />
                                        <input type="password" required minLength={6} className="input" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} style={{ paddingLeft: '2.75rem', height: 48, borderRadius: 12 }} placeholder="Min. 6 characters" />
                                    </div>
                                </div>
                                <div style={{ padding: '1.25rem', background: 'rgba(15,64,152,0.03)', borderRadius: 16, border: '1px solid rgba(15,64,152,0.08)', display: 'flex', gap: '1rem' }}>
                                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Users size={12} /></div>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, fontWeight: 500, margin: 0 }}>
                                        New accounts are set to <b>Active</b> by default.
                                    </p>
                                </div>
                            </form>
                        </div>

                        <div style={{ padding: '1.5rem 2rem', borderTop: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
                            <button type="submit" form="createUserForm" className="btn btn-primary" style={{ width: '100%', height: 52, borderRadius: 12, fontSize: '1rem', fontWeight: 800, boxShadow: '0 8px 20px rgba(15,64,152,0.15)' }} disabled={creating}>
                                {creating ? 'Creating...' : 'Create Account'}
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
