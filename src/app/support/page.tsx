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
        <div className="fade-in" style={{ padding: 'clamp(1rem, 3vw, 2.5rem)', maxWidth: 1200, margin: '0 auto' }}>
            {/* Header Area */}
            <header style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: 'clamp(1.75rem, 5vw, 2.5rem)', fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--text-primary)', marginBottom: '0.5rem', margin: 0 }}>Support Tickets</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 600, margin: 0 }}>Manage customer inquiries and support messages.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', width: '100%', maxWidth: 'max-content' }}>
                    <button className="btn btn-secondary" style={{ flex: 1, borderRadius: 14, height: 48, padding: '0 1.5rem', fontWeight: 800, whiteSpace: 'nowrap' }} onClick={() => loadTickets()}>
                        <Activity size={18} /> <span className="desktop-only">Refresh</span><span className="mobile-only">Sync</span>
                    </button>
                </div>
            </header>

            {/* Metrics Dashboard */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                {[
                    { label: 'Active Inquiries', val: stats.open, color: '#3b82f6', icon: <MessageSquare size={24} />, sub: 'Awaiting Response' },
                    { label: 'Urgent Action', val: stats.urgent, color: '#ef4444', icon: <AlertCircle size={24} />, sub: 'Action Required' },
                    { label: 'Resolved Tickets', val: stats.resolved, color: '#10b981', icon: <CheckCircle size={24} />, sub: 'This Month' },
                    { label: 'Total Volume', val: stats.total, color: '#8b5cf6', icon: <Hash size={24} />, sub: 'All Tickets' }
                ].map((stat, i) => (
                    <div key={i} className="card" style={{ padding: '1.75rem', borderRadius: 28, background: '#fff', border: '1px solid var(--border)', position: 'relative', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '6px', height: '100%', background: stat.color, opacity: 0.8 }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <p style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{stat.label}</p>
                                <h3 style={{ fontSize: '2.25rem', fontWeight: 900, margin: '0.75rem 0', letterSpacing: '-0.02em' }}>{stat.val}</h3>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>{stat.sub}</p>
                            </div>
                            <div style={{ width: 56, height: 56, borderRadius: 16, background: `${stat.color}08`, color: stat.color, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${stat.color}15`, flexShrink: 0 }}>
                                {stat.icon}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filter Bar Area */}
            <div className="card" style={{ padding: '1.25rem', borderRadius: 28, background: '#fff', border: '1px solid var(--border)', marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap', boxShadow: '0 8px 24px rgba(0,0,0,0.03)' }}>
                <div style={{ position: 'relative', flex: 2, minWidth: 'min(100%, 350px)' }}>
                    <Search size={20} style={{ position: 'absolute', left: 16, top: 14, color: 'var(--text-muted)', opacity: 0.8 }} />
                    <input className="input" placeholder="Search by subject or customer..." style={{ paddingLeft: '3.5rem', height: 48, borderRadius: 16, border: 'none', background: 'var(--bg-secondary)', fontWeight: 600, fontSize: '0.95rem' }} value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flex: 1, minWidth: 'min(100%, 300px)', flexWrap: 'wrap' }}>
                    <select className="input" style={{ flex: 1, minWidth: 140, height: 48, borderRadius: 16, fontSize: '0.9rem', fontWeight: 800, padding: '0 1.25rem', background: 'var(--bg-secondary)', border: 'none' }} value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}>
                        <option value="">All Statuses</option>
                        <option value="open">Open Inquiries</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                    </select>

                    <select className="input" style={{ flex: 1, minWidth: 140, height: 48, borderRadius: 16, fontSize: '0.9rem', fontWeight: 800, padding: '0 1.25rem', background: 'var(--bg-secondary)', border: 'none' }} value={filters.priority} onChange={e => setFilters({ ...filters, priority: e.target.value })}>
                        <option value="">All Priorities</option>
                        <option value="urgent">Urgent Action</option>
                        <option value="high">High Priority</option>
                        <option value="medium">Medium</option>
                    </select>

                    <div style={{ display: 'flex', background: 'var(--bg-secondary)', borderRadius: 12, padding: '0.3rem' }} className="desktop-only">
                        <button onClick={() => setViewMode('list')} style={{ width: 36, height: 36, borderRadius: 10, border: 'none', background: viewMode === 'list' ? 'white' : 'transparent', color: viewMode === 'list' ? 'var(--accent)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: viewMode === 'list' ? '0 4px 12px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.2s' }}><List size={20} /></button>
                        <button onClick={() => setViewMode('grid')} style={{ width: 36, height: 36, borderRadius: 10, border: 'none', background: viewMode === 'grid' ? 'white' : 'transparent', color: viewMode === 'grid' ? 'var(--accent)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: viewMode === 'grid' ? '0 4px 12px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.2s' }}><LayoutGrid size={20} /></button>
                    </div>
                </div>
            </div>

            {/* Results Grid / List */}
            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '6rem' }}><div className="spinner" /></div>
            ) : filteredTickets.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '6rem 2rem', background: '#fff', borderRadius: 32, border: '1px dashed var(--border)' }}>
                    <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--bg-secondary)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem', opacity: 0.5 }}>
                        <Inbox size={40} />
                    </div>
                    <h3 style={{ fontWeight: 900, fontSize: '1.5rem', letterSpacing: '-0.02em', marginBottom: '0.75rem' }}>No Tickets Found</h3>
                    <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>No tickets match your search or filters.</p>
                </div>
            ) : viewMode === 'list' ? (
                <>
                    <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border)', borderRadius: 32, boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                        <div className="data-table-wrapper">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th style={{ padding: '1.25rem 2rem' }}>Subject</th>
                                        <th className="desktop-only">Priority</th>
                                        <th className="desktop-only">Category</th>
                                        <th className="desktop-only">Last Updated</th>
                                        <th style={{ padding: '1.25rem 2rem', textAlign: 'right' }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedTickets.map((t) => {
                                        const status = getStatusConfig(t.status);
                                        const priority = getPriorityConfig(t.priority);
                                        return (
                                            <tr key={t.id} onClick={() => router.push(`/support/${t.id}`)} style={{ cursor: 'pointer' }}>
                                                <td style={{ padding: '1.5rem 2rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                                                        <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--bg-secondary)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.25rem', border: '1px solid var(--border)', flexShrink: 0 }}>
                                                            {t.customer_name.charAt(0)}
                                                        </div>
                                                        <div style={{ minWidth: 0 }}>
                                                            <h4 style={{ fontWeight: 800, fontSize: '1.05rem', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-primary)' }}>{t.subject}</h4>
                                                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '0.25rem' }}>{t.customer_name} · #{t.id.slice(0, 8).toUpperCase()}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                
                                                <td className="desktop-only">
                                                    <span style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: priority.color, background: priority.bg, padding: '0.45rem 0.9rem', borderRadius: 10, border: `1px solid ${priority.color}15` }}>
                                                        {t.priority}
                                                    </span>
                                                </td>

                                                <td className="desktop-only">
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.95rem', color: 'var(--text-secondary)', fontWeight: 800 }}>
                                                        <Tag size={16} style={{ opacity: 0.5 }} /> {t.category}
                                                    </div>
                                                </td>

                                                <td className="desktop-only">
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.95rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                                                        <Calendar size={16} style={{ opacity: 0.5 }} /> {new Date(t.updated_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                                    </div>
                                                </td>

                                                <td style={{ padding: '1.5rem 2rem', textAlign: 'right' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8rem', fontWeight: 900, color: status.color, background: status.bg, padding: '0.5rem 1.25rem', borderRadius: 24, width: 'max-content', marginLeft: 'auto' }}>
                                                        {status.icon} <span style={{ letterSpacing: '0.02em' }}>{t.status.replace('_', ' ').toUpperCase()}</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    {totalPages > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1.5rem', marginTop: '3.5rem' }}>
                            <button className="btn btn-secondary" style={{ width: 52, height: 52, padding: 0, borderRadius: 18 }} disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                                <ChevronLeft size={24} />
                            </button>
                            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', background: '#fff', padding: '0.75rem 1.5rem', borderRadius: 18, border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                                <span style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--accent)' }}>{page}</span>
                                <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 700 }}>/ {totalPages}</span>
                            </div>
                            <button className="btn btn-secondary" style={{ width: 52, height: 52, padding: 0, borderRadius: 18 }} disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                                <ChevronRight size={24} />
                            </button>
                        </div>
                    )}
                </>
            ) : (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 360px), 1fr))', gap: '2rem' }}>
                        {paginatedTickets.map((t) => {
                            const status = getStatusConfig(t.status);
                            const priority = getPriorityConfig(t.priority);
                            return (
                                <Link key={t.id} href={`/support/${t.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                    <div className="card" style={{ padding: '2.5rem', borderRadius: 36, border: '1px solid var(--border)', position: 'relative', transition: 'all 0.3s', cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', background: '#fff' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: priority.color, background: priority.bg, padding: '0.45rem 0.9rem', borderRadius: 12, border: `1px solid ${priority.color}15` }}>
                                                {t.priority}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', fontWeight: 900, color: status.color }}>
                                                {status.icon} {t.status.toUpperCase()}
                                            </div>
                                        </div>

                                        <h4 style={{ fontSize: '1.35rem', fontWeight: 900, marginBottom: '1.25rem', lineHeight: 1.4, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{t.subject}</h4>
                                        
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '2.5rem', padding: '1.25rem', background: 'var(--bg-secondary)', borderRadius: 20 }}>
                                            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1rem', flexShrink: 0 }}>
                                                {t.customer_name.charAt(0)}
                                            </div>
                                            <div style={{ minWidth: 0 }}>
                                                <p style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>{t.customer_name}</p>
                                                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 600 }}>{t.customer_email}</p>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1.75rem', borderTop: '1px solid var(--border)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 800 }}>
                                                <Tag size={18} style={{ opacity: 0.5 }} /> {t.category}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                                                <Clock size={18} style={{ opacity: 0.5 }} /> {new Date(t.updated_at).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                    {totalPages > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1.5rem', marginTop: '3.5rem' }}>
                            <button className="btn btn-secondary" style={{ width: 52, height: 52, padding: 0, borderRadius: 18 }} disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                                <ChevronLeft size={24} />
                            </button>
                            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', background: '#fff', padding: '0.75rem 1.5rem', borderRadius: 18, border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                                <span style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--accent)' }}>{page}</span>
                                <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 700 }}>/ {totalPages}</span>
                            </div>
                            <button className="btn btn-secondary" style={{ width: 52, height: 52, padding: 0, borderRadius: 18 }} disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                                <ChevronRight size={24} />
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
