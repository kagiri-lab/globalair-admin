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
        <div className="fade-in" style={{ padding: 'clamp(1rem, 3vw, 2.5rem)', maxWidth: 1600, margin: '0 auto' }}>
            {/* Header Area */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem', flexWrap: 'wrap', gap: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: 'clamp(1.75rem, 5vw, 2.5rem)', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                        All Shipments
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 600 }}>
                        Tracking <span style={{ color: 'var(--accent)', fontWeight: 900 }}>{total.toLocaleString()}</span> shipments.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', width: '100%', maxWidth: 'max-content' }}>
                    <button className="btn btn-secondary desktop-only" style={{ height: 48, borderRadius: 14, padding: '0 1.5rem', fontWeight: 800 }}>
                        <Download size={18} /> Export
                    </button>
                    <Link href="/shipments/new" style={{ flex: 1 }}>
                        <button className="btn btn-primary" style={{ width: '100%', height: 48, borderRadius: 14, padding: '0 2rem', fontWeight: 900, boxShadow: '0 12px 24px rgba(15,64,152,0.15)' }}>
                            <Plus size={20} /> Initialize Shipment
                        </button>
                    </Link>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                {STAT_CARDS.map(({ label, value, icon: Icon, color, bg }) => (
                    <div key={label} className="card" style={{ padding: '1.5rem 2rem', display: 'flex', alignItems: 'center', gap: '1.5rem', borderRadius: 24 }}>
                        <div style={{ width: 56, height: 56, borderRadius: 16, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                            <Icon size={24} color={color} />
                        </div>
                        <div>
                            <p style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1, letterSpacing: '-0.02em' }}>{value.toLocaleString()}</p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filter & View Controls */}
            <div style={{ marginBottom: '2rem', display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ position: 'relative', flex: 2, minWidth: 'min(100%, 400px)' }}>
                    <Search size={20} style={{ position: 'absolute', left: 16, top: 14, color: 'var(--text-muted)', opacity: 0.8 }} />
                    <input 
                        className="input" 
                        style={{ paddingLeft: '3.5rem', height: 48, borderRadius: 16, background: 'white', border: '1px solid var(--border)', fontSize: '1rem', fontWeight: 600 }} 
                        placeholder="Search by Tracking ID, Principal, or Node..."
                        value={search} 
                        onChange={e => { setSearch(e.target.value); setPage(1); }} 
                    />
                </div>
                <div style={{ display: 'flex', gap: '1rem', flex: 1, minWidth: 'min(100%, 240px)' }}>
                    <select 
                        className="input"
                        value={status} 
                        onChange={e => setStatus(e.target.value)}
                        style={{ flex: 1, height: 48, padding: '0 1.25rem', background: 'white', border: '1px solid var(--border)', borderRadius: 16, fontSize: '0.9rem', fontWeight: 800, cursor: 'pointer' }}
                    >
                        <option value="">All Statuses</option>
                        {Object.entries(STATUS_CONFIG).map(([val, cfg]) => (
                            <option key={val} value={val}>{cfg.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Main Registry Card */}
            <div className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: 32, border: '1px solid var(--border)' }}>
                <div className="data-table-wrapper">
                    <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'var(--bg-secondary)' }}>
                                <th style={{ padding: '1.25rem 2rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Tracking Reference</th>
                                <th style={{ padding: '1.25rem 2rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Logistics Principal</th>
                                <th style={{ padding: '1.25rem 2rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Tracking Number</th>
                                <th style={{ padding: '1.25rem 2rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Status</th>
                                <th style={{ padding: '1.25rem 2rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Valuation</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={5} style={{ padding: '6rem 0' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                            <div className="spinner" />
                                            <p style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-muted)' }}>Loading shipments...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : shipments.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ padding: '6rem 0', textAlign: 'center' }}>
                                        <div style={{ opacity: 0.1, marginBottom: '1.5rem' }}><Package size={64} style={{ margin: '0 auto' }} /></div>
                                        <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>No Shipments Found</h3>
                                        <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Adjust your filters or create a new shipment.</p>
                                    </td>
                                </tr>
                            ) : (
                                shipments.map((s: any) => (
                                    <tr key={s.id} onClick={() => router.push(`/shipments/${s.id}`)} style={{ cursor: 'pointer', borderTop: '1px solid var(--border)', transition: 'background 0.2s' }}>
                                        <td style={{ padding: '1.25rem 2rem' }}>
                                            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontWeight: 900, fontSize: '0.85rem', background: 'rgba(15,64,152,0.06)', padding: '0.4rem 0.75rem', borderRadius: 10, letterSpacing: '0.02em' }}>
                                                {s.tracking_number}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1.25rem 2rem' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{s.customer_name}</span>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>{s.customer_email}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1.25rem 2rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', fontWeight: 700 }}>
                                                <span style={{ color: 'var(--text-primary)' }}>{s.pickup_city}</span> 
                                                <ArrowRight size={14} style={{ opacity: 0.3, color: 'var(--accent)' }} /> 
                                                <span style={{ color: 'var(--text-primary)' }}>{s.destination_city}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1.25rem 2rem' }}>
                                            <span className={`badge badge-${s.status}`} style={{ fontSize: '0.7rem', fontWeight: 900, padding: '0.4rem 0.8rem', borderRadius: 10, textTransform: 'uppercase' }}>
                                                {s.status.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1.25rem 2rem', textAlign: 'right' }}>
                                            <span style={{ fontWeight: 900, fontSize: '1rem', color: 'var(--text-primary)' }}>
                                                ${Number(s.total_price || 0).toLocaleString()}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination Control */}
            {pages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '3rem', gap: '1.5rem', flexWrap: 'wrap' }}>
                    <button 
                        className="btn btn-secondary" 
                        style={{ width: 48, height: 48, padding: 0, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        onClick={() => setPage(p => Math.max(1, p - 1))} 
                        disabled={page === 1}
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'var(--bg-secondary)', padding: '0.6rem 1.25rem', borderRadius: 16, border: '1px solid var(--border)' }}>
                        <span style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--accent)' }}>{page}</span>
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 700 }}>/ {pages}</span>
                    </div>
                    <button 
                        className="btn btn-secondary" 
                        style={{ width: 48, height: 48, padding: 0, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        onClick={() => setPage(p => Math.min(pages, p + 1))} 
                        disabled={page === pages}
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            )}
        </div>
    );
}
