'use client';

import { useEffect, useState, useMemo } from 'react';
import { 
    MessageSquare, Clock, CheckCircle, AlertCircle, 
    ChevronRight, User, Filter, Search, MoreVertical, 
    Plus, Activity, ArrowUpRight, Inbox, ShieldAlert,
    Hash, Tag, Calendar, LayoutGrid, List, ChevronLeft, Info
} from 'lucide-react';
import api from '@/lib/api';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface Ticket {
    id: string;
    subject: string;
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    category: string;
    customer_name: string;
    customer_email: string;
    updated_at: string;
    created_at: string;
    last_message?: string;
}

export default function AdminSupportHub() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState({ status: '', priority: '', category: '' });
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [page, setPage] = useState(1);
    const itemsPerPage = 10;

    const loadTickets = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.status) params.append('status', filters.status);
            if (filters.priority) params.append('priority', filters.priority);
            if (filters.category) params.append('category', filters.category);

            const res = await api.get(`/admin/support/tickets?${params.toString()}`);
            setTickets(res.data.data);
            setPage(1); // Reset to first page on filter change
        } catch (err) {
            toast.error('Failed to load tickets');
        } finally { setLoading(false); }
    };

    useEffect(() => { loadTickets(); }, [filters]);

    const filteredTickets = useMemo(() => {
        return tickets.filter(t => 
            t.subject.toLowerCase().includes(search.toLowerCase()) ||
            t.customer_name.toLowerCase().includes(search.toLowerCase()) ||
            t.customer_email.toLowerCase().includes(search.toLowerCase())
        );
    }, [tickets, search]);

    const paginatedTickets = useMemo(() => {
        const start = (page - 1) * itemsPerPage;
        return filteredTickets.slice(start, start + itemsPerPage);
    }, [filteredTickets, page]);

    const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);

    const stats = useMemo(() => {
        return {
            open: tickets.filter(t => t.status === 'open').length,
            urgent: tickets.filter(t => t.priority === 'urgent').length,
            resolved: tickets.filter(t => t.status === 'resolved').length,
            total: tickets.length
        };
    }, [tickets]);

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'open': return { color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', icon: <Inbox size={14} /> };
            case 'in_progress': return { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', icon: <Clock size={14} /> };
            case 'resolved': return { color: '#10b981', bg: 'rgba(16,185,129,0.08)', icon: <CheckCircle size={14} /> };
            case 'closed': return { color: '#6b7280', bg: 'rgba(107,114,128,0.08)', icon: <ShieldAlert size={14} /> };
            default: return { color: '#64748b', bg: '#f1f5f9', icon: <Info size={14} /> };
        }
    };

    const getPriorityConfig = (p: string) => {
        switch (p) {
            case 'urgent': return { color: '#ef4444', bg: 'rgba(239,68,68,0.1)' };
            case 'high': return { color: '#f97316', bg: 'rgba(249,115,22,0.1)' };
            case 'medium': return { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' };
            default: return { color: '#10b981', bg: 'rgba(16,185,129,0.1)' };
        }
    };

    return (
        <div className="fade-in" style={{ padding: '2rem', maxWidth: 1200, margin: '0 auto' }}>
            {/* Header Area */}
            <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 style={{ fontSize: '2.25rem', fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>Support Command</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: 500, marginTop: '0.4rem' }}>Managing customer inquiries and corridor resolution workflows.</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn btn-secondary" style={{ borderRadius: 12, height: 44, padding: '0 1.25rem' }} onClick={() => loadTickets()}><Activity size={18} /> Refresh</button>
                </div>
            </header>

            {/* Metrics Dashboard */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                {[
                    { label: 'Active Tickets', val: stats.open, color: '#3b82f6', icon: <MessageSquare size={20} />, sub: 'Awaiting Response' },
                    { label: 'Urgent Action', val: stats.urgent, color: '#ef4444', icon: <AlertCircle size={20} />, sub: 'High Priority' },
                    { label: 'Resolved (MTD)', val: stats.resolved, color: '#10b981', icon: <CheckCircle size={20} />, sub: 'Last 30 Days' },
                    { label: 'Total Volume', val: stats.total, color: '#8b5cf6', icon: <Hash size={20} />, sub: 'Lifetime Capacity' }
                ].map((stat, i) => (
                    <div key={i} className="card" style={{ padding: '1.5rem', borderRadius: 24, background: '#fff', border: '1px solid var(--border)', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: stat.color }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <p style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</p>
                                <h3 style={{ fontSize: '2rem', fontWeight: 900, margin: '0.5rem 0' }}>{stat.val}</h3>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{stat.sub}</p>
                            </div>
                            <div style={{ width: 44, height: 44, borderRadius: 12, background: `${stat.color}10`, color: stat.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {stat.icon}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filter Bar Area */}
            <div className="card" style={{ padding: '1rem', borderRadius: 20, background: '#fff', border: '1px solid var(--border)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: 280 }}>
                    <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input className="input" placeholder="Search by subject or customer..." style={{ paddingLeft: '2.75rem', height: 44, borderRadius: 14, border: 'none', background: 'var(--bg-secondary)' }} value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 800, marginRight: '0.5rem' }}><Filter size={16} /> Filters:</div>
                    
                    <select className="input" style={{ width: 140, height: 44, borderRadius: 12, fontSize: '0.85rem', fontWeight: 700 }} value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}>
                        <option value="">All Status</option>
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                    </select>

                    <select className="input" style={{ width: 140, height: 44, borderRadius: 12, fontSize: '0.85rem', fontWeight: 700 }} value={filters.priority} onChange={e => setFilters({ ...filters, priority: e.target.value })}>
                        <option value="">All Priority</option>
                        <option value="urgent">Urgent</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                    </select>

                    <div style={{ height: 24, width: 1, background: 'var(--border)', margin: '0 0.5rem' }} />

                    <div style={{ display: 'flex', background: 'var(--bg-secondary)', borderRadius: 10, padding: '0.25rem' }}>
                        <button onClick={() => setViewMode('list')} style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: viewMode === 'list' ? 'white' : 'transparent', color: viewMode === 'list' ? 'var(--accent)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: viewMode === 'list' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none' }}><List size={18} /></button>
                        <button onClick={() => setViewMode('grid')} style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: viewMode === 'grid' ? 'white' : 'transparent', color: viewMode === 'grid' ? 'var(--accent)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: viewMode === 'grid' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none' }}><LayoutGrid size={18} /></button>
                    </div>
                </div>
            </div>

            {/* Results Grid / List */}
            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}><div className="spinner" /></div>
            ) : filteredTickets.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '5rem', background: '#fff', borderRadius: 24, border: '1px dashed var(--border)' }}>
                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--bg-secondary)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                        <Inbox size={32} />
                    </div>
                    <h3 style={{ fontWeight: 800, fontSize: '1.25rem' }}>All Caught Up</h3>
                    <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>No tickets match your current filter criteria.</p>
                </div>
            ) : viewMode === 'list' ? (
                <>
                    <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border)', borderRadius: 24 }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {paginatedTickets.map((t) => {
                                const status = getStatusConfig(t.status);
                                const priority = getPriorityConfig(t.priority);
                                return (
                                    <Link key={t.id} href={`/support/${t.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                        <div className="table-row-hover" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '1.5rem', padding: '1.25rem 2rem', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                                                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--bg-secondary)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.9rem' }}>
                                                    {t.customer_name.charAt(0)}
                                                </div>
                                                <div style={{ minWidth: 0 }}>
                                                    <h4 style={{ fontWeight: 800, fontSize: '0.95rem', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.subject}</h4>
                                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '0.2rem' }}>{t.customer_name} · #{t.id.slice(0, 6)}</p>
                                                </div>
                                            </div>
                                            
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <span style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: priority.color, background: priority.bg, padding: '0.3rem 0.75rem', borderRadius: 8 }}>
                                                    {t.priority}
                                                </span>
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                                                <Tag size={14} /> {t.category}
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                                                <Calendar size={14} /> {new Date(t.updated_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'flex-end' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 800, color: status.color, background: status.bg, padding: '0.35rem 0.8rem', borderRadius: 20 }}>
                                                    {status.icon} {t.status.replace('_', ' ').toUpperCase()}
                                                </div>
                                                <ChevronRight size={20} color="var(--border)" />
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                    {totalPages > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1.5rem', marginTop: '2.5rem' }}>
                            <button className="btn btn-secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)} style={{ borderRadius: 12, padding: '0.6rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <ChevronLeft size={18} /> Previous
                            </button>
                            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-muted)' }}>Page {page} of {totalPages}</span>
                            <button className="btn btn-secondary" disabled={page === totalPages} onClick={() => setPage(p => p + 1)} style={{ borderRadius: 12, padding: '0.6rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                Next <ChevronRight size={18} />
                            </button>
                        </div>
                    )}
                </>
            ) : (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
                        {paginatedTickets.map((t) => {
                            const status = getStatusConfig(t.status);
                            const priority = getPriorityConfig(t.priority);
                            return (
                                <Link key={t.id} href={`/support/${t.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                    <div className="card table-row-hover" style={{ padding: '1.75rem', borderRadius: 24, border: '1px solid var(--border)', position: 'relative' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: priority.color, background: priority.bg, padding: '0.3rem 0.75rem', borderRadius: 8 }}>
                                                {t.priority}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 800, color: status.color }}>
                                                {status.icon} {t.status.toUpperCase()}
                                            </div>
                                        </div>

                                        <h4 style={{ fontSize: '1.1rem', fontWeight: 900, marginBottom: '0.75rem', lineHeight: 1.3 }}>{t.subject}</h4>
                                        
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: 12 }}>
                                            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem' }}>
                                                {t.customer_name.charAt(0)}
                                            </div>
                                            <div style={{ minWidth: 0 }}>
                                                <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700 }}>{t.customer_name}</p>
                                                <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.customer_email}</p>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                                                <Tag size={14} /> {t.category}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                                                <Clock size={14} /> {new Date(t.updated_at).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                    {totalPages > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1.5rem', marginTop: '2.5rem' }}>
                            <button className="btn btn-secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)} style={{ borderRadius: 12, padding: '0.6rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <ChevronLeft size={18} /> Previous
                            </button>
                            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-muted)' }}>Page {page} of {totalPages}</span>
                            <button className="btn btn-secondary" disabled={page === totalPages} onClick={() => setPage(p => p + 1)} style={{ borderRadius: 12, padding: '0.6rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                Next <ChevronRight size={18} />
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
