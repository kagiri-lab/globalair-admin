'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
    Search, ChevronLeft, ChevronRight, ArrowRight, Filter, 
    Package, Truck, Clock, CheckCircle2, AlertCircle, 
    Download, Plus, LayoutGrid, List, SlidersHorizontal, Activity
} from 'lucide-react';
import api from '@/lib/api';

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
    pending: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', label: 'Pending' },
    confirmed: { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', label: 'Confirmed' },
    picked_up: { color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', label: 'Picked Up' },
    in_transit: { color: '#6366f1', bg: 'rgba(99,102,241,0.1)', label: 'In Transit' },
    out_for_delivery: { color: '#14b8a6', bg: 'rgba(20,184,166,0.1)', label: 'Out for Delivery' },
    delivered: { color: '#10b981', bg: 'rgba(16,185,129,0.1)', label: 'Delivered' },
    cancelled: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', label: 'Cancelled' },
    failed: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', label: 'Failed' },
};

const TYPE_BADGE: Record<string, { emoji: string; color: string; bg: string }> = {
    standard: { emoji: '📦', color: '#64748b', bg: 'rgba(100,116,139,0.1)' },
    express: { emoji: '⚡', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    overnight: { emoji: '🚀', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
};

export default function AdminShipmentsPage() {
    const router = useRouter();
    const [shipments, setShipments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [pages, setPages] = useState(1);
    const [stats, setStats] = useState<Record<string, number>>({});
    const [status, setStatus] = useState('');
    const [search, setSearch] = useState('');
    const [debounced, setDebounced] = useState('');

    useEffect(() => {
        const t = setTimeout(() => setDebounced(search), 400);
        return () => clearTimeout(t);
    }, [search]);

    useEffect(() => { load(page, status, debounced); }, [page, status, debounced]);

    const load = (p: number, s: string, q: string) => {
        setLoading(true);
        const params = new URLSearchParams({ page: String(p), limit: '10' });
        if (s) params.set('status', s);
        if (q) params.set('search', q);
        api.get(`/admin/shipments?${params}`).then(r => {
            setShipments(r.data.data.shipments);
            setTotal(r.data.data.pagination.total);
            setPages(r.data.data.pagination.pages);
            if (r.data.data.stats) setStats(r.data.data.stats);
        }).catch(() => { }).finally(() => setLoading(false));
    };

    const STAT_CARDS = [
        { label: 'Total Volume', value: total, icon: Package, color: 'var(--accent)', bg: 'rgba(15,64,152,0.1)' },
        { label: 'In Transit', value: stats.in_transit || 0, icon: Truck, color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
        { label: 'Attention', value: stats.pending || 0, icon: Clock, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
        { label: 'Completed', value: stats.delivered || 0, icon: CheckCircle2, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
    ];

    return (
        <div className="fade-in" style={{ padding: '1.5rem 2rem', maxWidth: 1400, margin: '0 auto' }}>
            {/* Header Area */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.01em', marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
                        Shipment Registry
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 400 }}>
                        Manage and track {total} active shipments across your network.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', height: 42, padding: '0 1.25rem', borderRadius: 12 }}>
                        <Download size={16} /> Export CSV
                    </button>
                    <Link href="/shipments/new" style={{ textDecoration: 'none' }}>
                        <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', height: 42, padding: '0 1.25rem', borderRadius: 12 }}>
                            <Plus size={16} /> New Shipment
                        </button>
                    </Link>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
                {STAT_CARDS.map(({ label, value, icon: Icon, color, bg }) => (
                    <div key={label} className="stat-card" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                        <div style={{ width: 48, height: 48, borderRadius: 14, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Icon size={22} color={color} />
                        </div>
                        <div>
                            <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1 }}>{value.toLocaleString()}</p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filter & View Controls */}
            <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                    <div style={{ position: 'relative', flex: 1, maxWidth: 400 }}>
                        <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input 
                            className="input" 
                            style={{ paddingLeft: '2.75rem', height: 44, borderRadius: 12, background: '#fff', border: '1px solid var(--border)' }} 
                            placeholder="Search by Tracking ID, Customer or Destination..."
                            value={search} 
                            onChange={e => { setSearch(e.target.value); setPage(1); }} 
                        />
                    </div>
                    <div style={{ width: 1, height: 24, background: 'var(--border)' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <SlidersHorizontal size={14} color="var(--text-muted)" />
                        <select 
                            value={status} 
                            onChange={e => setStatus(e.target.value)}
                            style={{ background: 'transparent', border: 'none', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', outline: 'none', cursor: 'pointer' }}
                        >
                            <option value="">All Statuses</option>
                            {Object.entries(STATUS_CONFIG).map(([val, cfg]) => (
                                <option key={val} value={val}>{cfg.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem', background: 'var(--border)', borderRadius: 10 }}>
                    <button className="btn btn-sm" style={{ background: '#fff', padding: '0.4rem', borderRadius: 8, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                        <List size={16} />
                    </button>
                    <button className="btn btn-sm" style={{ background: 'transparent', padding: '0.4rem', color: 'var(--text-muted)' }}>
                        <LayoutGrid size={16} />
                    </button>
                </div>
            </div>

            {/* Main Table Card */}
            <div className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: 20 }}>
                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table" style={{ minWidth: 800 }}>
                        <thead>
                            <tr>
                                <th style={{ paddingLeft: '2rem' }}>Tracking ID</th>
                                <th>Customer & Account</th>
                                <th>Route Detail</th>
                                <th>Current Status</th>
                                <th style={{ paddingRight: '2rem' }}>Total Revenue</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={5} style={{ padding: '5rem 0' }}>
                                        <div style={{ display: 'flex', justifyContent: 'center' }}><div className="spinner" /></div>
                                    </td>
                                </tr>
                            ) : shipments.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ padding: '5rem 0', textAlign: 'center' }}>
                                        <div style={{ opacity: 0.3, marginBottom: '1rem' }}><Package size={48} style={{ margin: '0 auto' }} /></div>
                                        <p style={{ fontWeight: 700, color: 'var(--text-primary)' }}>No shipments match your criteria</p>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Try resetting your filters or search query</p>
                                    </td>
                                </tr>
                            ) : (
                                shipments.map((s: any) => {
                                    return (
                                        <tr key={s.id} onClick={() => router.push(`/shipments/${s.id}`)} style={{ cursor: 'pointer' }}>
                                            <td style={{ paddingLeft: '2rem' }}>
                                                <span style={{ fontFamily: 'monospace', color: 'var(--accent)', fontWeight: 700, fontSize: '0.85rem', background: 'rgba(15,64,152,0.05)', padding: '0.25rem 0.6rem', borderRadius: 6 }}>
                                                    {s.tracking_number}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{s.customer_name}</span>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.customer_email}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                                                    <span style={{ fontWeight: 500 }}>{s.pickup_city}</span>
                                                    <ArrowRight size={12} style={{ opacity: 0.3 }} />
                                                    <span style={{ fontWeight: 500 }}>{s.destination_city}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`badge badge-${s.status}`}>{s.status.replace(/_/g, ' ')}</span>
                                            </td>
                                            <td style={{ paddingRight: '2rem' }}>
                                                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                                                    USD {Number(s.total_price || 0).toLocaleString()}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination Control */}
            {pages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem' }}>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                        Showing {shipments.length} of {total} shipments
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <button 
                            className="btn btn-secondary btn-sm" 
                            style={{ borderRadius: 10, padding: '0.5rem 1rem' }}
                            onClick={() => setPage(p => Math.max(1, p - 1))} 
                            disabled={page === 1}
                        >
                            <ChevronLeft size={16} /> Previous
                        </button>
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                            {[...Array(pages)].map((_, i) => (
                                <button 
                                    key={i} 
                                    onClick={() => setPage(i + 1)}
                                    style={{ 
                                        width: 32, height: 32, borderRadius: 8, border: 'none', fontSize: '0.85rem', fontWeight: 700,
                                        background: page === i + 1 ? 'var(--accent)' : 'transparent',
                                        color: page === i + 1 ? '#fff' : 'var(--text-muted)',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                        <button 
                            className="btn btn-secondary btn-sm" 
                            style={{ borderRadius: 10, padding: '0.5rem 1rem' }}
                            onClick={() => setPage(p => Math.min(pages, p + 1))} 
                            disabled={page === pages}
                        >
                            Next <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
