'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
    Search, ChevronLeft, ChevronRight, Users, Package, 
    ArrowRight, Plus, X, User, Mail, Phone, Lock,
    UserCheck, UserMinus, MoreHorizontal, Filter, Download
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

export default function AdminUsersPage() {
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
        <div className="fade-in" style={{ padding: '2rem', maxWidth: 1200, margin: '0 auto' }}>
            
            {/* Header Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Customers</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Manage and monitor all registered accounts in your system.</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', height: 42, padding: '0 1.25rem', borderRadius: 12 }}>
                        <Download size={16} /> Export CSV
                    </button>
                    <button className="btn btn-primary" onClick={() => setIsModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', height: 42, padding: '0 1.25rem', borderRadius: 12 }}>
                        <Plus size={16} /> New Customer
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
                        <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Customers</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 800 }}>{total.toLocaleString()}</p>
                    </div>
                </div>
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.5rem' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(16,185,129,0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <UserCheck size={24} />
                    </div>
                    <div>
                        <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Accounts</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 800 }}>{Math.floor(total * 0.92).toLocaleString()}</p>
                    </div>
                </div>
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.5rem' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(245,158,11,0.1)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Plus size={24} />
                    </div>
                    <div>
                        <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>New Today</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 800 }}>+12</p>
                    </div>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ position: 'relative', flex: 1, maxWidth: 400 }}>
                    <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input 
                        className="input" 
                        style={{ paddingLeft: '2.75rem', height: 44, borderRadius: 10 }} 
                        placeholder="Search by name, email, or phone..."
                        value={search} 
                        onChange={e => { setSearch(e.target.value); setPage(1); }} 
                    />
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: 10, height: 44 }}>
                        <Filter size={16} /> Filters
                    </button>
                    <div style={{ width: 1, height: 32, background: 'var(--border)', margin: '0 0.25rem' }} />
                    <button className="btn btn-secondary" style={{ borderRadius: 10, height: 44, padding: '0 0.75rem' }}>
                        <MoreHorizontal size={18} />
                    </button>
                </div>
            </div>

            {/* Customers Registry Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border)' }}>
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '2.5fr 2fr 1.2fr 1fr 1fr 1fr 40px', 
                    gap: '1rem', 
                    padding: '1rem 1.5rem', 
                    background: 'var(--bg-secondary)', 
                    borderBottom: '1px solid var(--border)',
                    fontSize: '0.75rem', 
                    fontWeight: 700, 
                    color: 'var(--text-muted)', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.05em' 
                }}>
                    <span>Customer Details</span>
                    <span>Contact Info</span>
                    <span>Status</span>
                    <span>Shipments</span>
                    <span>Last Active</span>
                    <span>Joined</span>
                    <span />
                </div>

                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5rem', gap: '1rem' }}>
                        <div className="spinner" />
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>Loading registry...</p>
                    </div>
                ) : users.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '5rem', background: 'white' }}>
                        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                            <Users size={32} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
                        </div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.5rem' }}>No customers found</h3>
                        <p style={{ color: 'var(--text-muted)', maxWidth: 300, margin: '0 auto' }}>We couldn't find any customers matching your current search criteria.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {users.map((u: any, i: number) => (
                            <Link key={u.id} href={`/customers/${u.id}`} style={{ textDecoration: 'none', display: 'block', color: 'inherit' }}>
                                <div style={{
                                    display: 'grid', 
                                    gridTemplateColumns: '2.5fr 2fr 1.2fr 1fr 1fr 1fr 40px',
                                    gap: '1rem', 
                                    padding: '1.25rem 1.5rem', 
                                    alignItems: 'center',
                                    borderBottom: i < users.length - 1 ? '1px solid var(--border)' : 'none',
                                    cursor: 'pointer', 
                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                    background: 'white'
                                }}
                                className="table-row-hover"
                                >
                                    {/* Name & Avatar */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0 }}>
                                        <div style={{ 
                                            width: 42, height: 42, borderRadius: 12, 
                                            background: 'linear-gradient(135deg, var(--accent) 0%, #3b82f6 100%)', 
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                            fontSize: '1rem', fontWeight: 800, color: 'white', flexShrink: 0,
                                            boxShadow: '0 4px 12px rgba(15,64,152,0.15)'
                                        }}>
                                            {(u.name || 'U').charAt(0).toUpperCase()}
                                        </div>
                                        <div style={{ minWidth: 0 }}>
                                            <p style={{ fontWeight: 700, fontSize: '0.925rem', marginBottom: '0.15rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</p>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>#{u.id.split('-')[0].toUpperCase()}</p>
                                        </div>
                                    </div>

                                    {/* Contact */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                            <Mail size={13} style={{ opacity: 0.7 }} />
                                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                            <Phone size={13} style={{ opacity: 0.7 }} />
                                            <span>{u.phone || '—'}</span>
                                        </div>
                                    </div>

                                    {/* Status Badge */}
                                    <div>
                                        <span style={{ 
                                            display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                                            padding: '0.3rem 0.75rem', borderRadius: 100, fontSize: '0.75rem', fontWeight: 700,
                                            background: u.is_active ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                                            color: u.is_active ? '#10b981' : '#ef4444',
                                            border: `1px solid ${u.is_active ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`
                                        }}>
                                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
                                            {u.is_active ? 'Active' : 'Suspended'}
                                        </span>
                                    </div>

                                    {/* Shipments */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <div style={{ background: 'var(--bg-secondary)', padding: '0.4rem 0.6rem', borderRadius: 8, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                            <Package size={14} color="var(--accent)" />
                                            <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>{u.shipment_count || 0}</span>
                                        </div>
                                    </div>

                                    {/* Last Active */}
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                        {u.last_login ? new Date(u.last_login).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' }) : '—'}
                                    </span>

                                    {/* Joined */}
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        {new Date(u.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </span>

                                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                        <ArrowRight size={16} color="var(--text-muted)" className="row-arrow" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Pagination Section */}
            {pages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem', padding: '0 0.5rem' }}>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        Showing <span style={{ color: 'var(--text-primary)' }}>{(page-1)*10 + 1}</span> to <span style={{ color: 'var(--text-primary)' }}>{Math.min(page*10, total)}</span> of <span style={{ color: 'var(--text-primary)' }}>{total}</span> customers
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-secondary" style={{ borderRadius: 10, padding: '0.5rem 1rem' }} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                            <ChevronLeft size={18} /> Previous
                        </button>
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                            {Array.from({ length: Math.min(5, pages) }).map((_, i) => {
                                const p = i + 1;
                                return (
                                    <button key={p} onClick={() => setPage(p)} style={{
                                        width: 40, height: 40, borderRadius: 10, border: 'none', cursor: 'pointer',
                                        background: page === p ? 'var(--accent)' : 'transparent',
                                        color: page === p ? 'white' : 'var(--text-secondary)',
                                        fontWeight: 700, transition: 'all 0.2s'
                                    }}>
                                        {p}
                                    </button>
                                );
                            })}
                        </div>
                        <button className="btn btn-secondary" style={{ borderRadius: 10, padding: '0.5rem 1rem' }} onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}>
                            Next <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            )}

            {/* Create User Slide-over Modal */}
            {isModalOpen && (
                <>
                    <div className="modal-backdrop" onClick={() => setIsModalOpen(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 999 }} />
                    <div className="card slide-over" style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: 450, margin: 0, borderRadius: 0, zIndex: 1000, display: 'flex', flexDirection: 'column', padding: 0, boxShadow: '-10px 0 30px rgba(0,0,0,0.1)' }}>
                        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
                            <div>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Add New Customer</h2>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Register a new account manually.</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} style={{ width: 36, height: 36, borderRadius: '50%', background: 'white', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
                        </div>

                        <div style={{ padding: '2rem', flex: 1, overflowY: 'auto' }}>
                            <form id="createUserForm" onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div className="form-group">
                                    <label className="label">Full Name</label>
                                    <div style={{ position: 'relative' }}>
                                        <User size={18} style={{ position: 'absolute', left: 14, top: 13, color: 'var(--text-muted)' }} />
                                        <input type="text" className="input" required value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} style={{ paddingLeft: '2.75rem', height: 48, borderRadius: 12 }} placeholder="Jane Doe" />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="label">Email Address</label>
                                    <div style={{ position: 'relative' }}>
                                        <Mail size={18} style={{ position: 'absolute', left: 14, top: 13, color: 'var(--text-muted)' }} />
                                        <input type="email" className="input" required value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} style={{ paddingLeft: '2.75rem', height: 48, borderRadius: 12 }} placeholder="jane@example.com" />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="label">Phone Number</label>
                                    <div style={{ position: 'relative' }}>
                                        <Phone size={18} style={{ position: 'absolute', left: 14, top: 13, color: 'var(--text-muted)' }} />
                                        <input type="tel" className="input" value={newUser.phone} onChange={e => setNewUser({ ...newUser, phone: e.target.value })} style={{ paddingLeft: '2.75rem', height: 48, borderRadius: 12 }} placeholder="+254..." />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="label">Initial Password</label>
                                    <div style={{ position: 'relative' }}>
                                        <Lock size={18} style={{ position: 'absolute', left: 14, top: 13, color: 'var(--text-muted)' }} />
                                        <input type="password" required minLength={6} className="input" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} style={{ paddingLeft: '2.75rem', height: 48, borderRadius: 12 }} placeholder="Min. 6 characters" />
                                    </div>
                                </div>
                                <div style={{ padding: '1.25rem', background: 'rgba(59,130,246,0.05)', borderRadius: 14, border: '1px solid rgba(59,130,246,0.1)', display: 'flex', gap: '1rem' }}>
                                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Users size={12} /></div>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                        New accounts are set to <b>Active</b> by default. The customer will be able to log in using these credentials immediately.
                                    </p>
                                </div>
                            </form>
                        </div>

                        <div style={{ padding: '1.5rem 2rem', borderTop: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
                            <button type="submit" form="createUserForm" className="btn btn-primary" style={{ width: '100%', height: 48, borderRadius: 12, fontSize: '1rem', fontWeight: 800 }} disabled={creating}>
                                {creating ? 'Creating Account...' : 'Create Customer Account'}
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
