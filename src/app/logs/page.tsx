'use client';

import { useEffect, useState } from 'react';
import { useAdminAuth } from '@/lib/auth';
import api from '@/lib/api';
import { 
    Activity, Filter, Search, Calendar, User, 
    ArrowLeft, ArrowRight, RefreshCw, Eye
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function LogsPage() {
    const { hasPermission } = useAdminAuth();
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalLogs, setTotalLogs] = useState(0);
    
    // Filters
    const [search, setSearch] = useState('');
    const [userType, setUserType] = useState('');
    const [action, setAction] = useState('');
    const [userIdFilter, setUserIdFilter] = useState('');
    const [entityType, setEntityType] = useState('');
    const [entityId, setEntityId] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await api.get('/logs/admin', {
                params: {
                    page,
                    user_id: userIdFilter || undefined,
                    user_type: userType || undefined,
                    action: action || undefined,
                    entity_type: entityType || undefined,
                    entity_id: entityId || undefined,
                    start_date: startDate ? new Date(startDate).toISOString() : undefined,
                    end_date: endDate ? new Date(new Date(endDate).setHours(23, 59, 59, 999)).toISOString() : undefined,
                    search: search || undefined
                }
            });
            setLogs(res.data.data.logs);
            setTotalPages(res.data.data.pagination.pages);
            setTotalLogs(res.data.data.pagination.total);
        } catch (err) {
            toast.error('Failed to load logs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [page, userType, action]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchLogs();
    };

    if (!hasPermission('manage_admins')) {
        return <div style={{ padding: '2rem', textAlign: 'center' }}>Access Denied</div>;
    }

    return (
        <div className="fade-in" style={{ padding: 'clamp(1rem, 3vw, 2.5rem)', maxWidth: 1400, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '2rem', marginBottom: '3rem' }}>
                <div>
                    <h1 style={{ fontSize: 'clamp(1.75rem, 5vw, 2.5rem)', fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Audit Chronicle</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 600 }}>Real-time monitoring of all global sector operations.</p>
                </div>
                <button onClick={() => fetchLogs()} className="btn btn-secondary" style={{ height: 48, borderRadius: 14, padding: '0 1.5rem', fontWeight: 800, background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> <span>Refresh Ledger</span>
                </button>
            </div>

            {/* Filters Dashboard */}
            <div className="card" style={{ padding: '2rem', borderRadius: 28, background: '#fff', border: '1px solid var(--border)', marginBottom: '2rem', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                <form onSubmit={handleSearch} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '1.5rem', alignItems: 'flex-end' }}>
                    <div>
                        <label className="label" style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '0.75rem', display: 'block' }}>Search Signature</label>
                        <div style={{ position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', left: 16, top: 14, color: 'var(--text-muted)', opacity: 0.7 }} />
                            <input className="input" style={{ paddingLeft: '3.5rem', height: 48, borderRadius: 14, background: 'var(--bg-secondary)', border: 'none', fontWeight: 600 }} placeholder="Search details..." value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                    </div>
                    <div>
                        <label className="label" style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '0.75rem', display: 'block' }}>Principal UUID</label>
                        <input className="input" style={{ height: 48, borderRadius: 14, background: 'var(--bg-secondary)', border: 'none', fontWeight: 600, padding: '0 1.25rem' }} placeholder="User Identifier" value={userIdFilter} onChange={e => setUserIdFilter(e.target.value)} />
                    </div>
                    <div>
                        <label className="label" style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '0.75rem', display: 'block' }}>Principal Tier</label>
                        <select className="input" style={{ height: 48, borderRadius: 14, background: 'var(--bg-secondary)', border: 'none', fontWeight: 800, padding: '0 1.25rem' }} value={userType} onChange={e => setUserType(e.target.value)}>
                            <option value="">All Tiers</option>
                            <option value="super_admin">Super Admin</option>
                            <option value="admin">Admin</option>
                            <option value="operations">Operations</option>
                            <option value="support">Support</option>
                            <option value="finance">Finance</option>
                            <option value="customer">Customer</option>
                            <option value="guest">Guest</option>
                        </select>
                    </div>
                    <div>
                        <label className="label" style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '0.75rem', display: 'block' }}>Action Vector</label>
                        <select className="input" style={{ height: 48, borderRadius: 14, background: 'var(--bg-secondary)', border: 'none', fontWeight: 800, padding: '0 1.25rem' }} value={action} onChange={e => setAction(e.target.value)}>
                            <option value="">All Vectors</option>
                            <option value="view">Surveillance</option>
                            <option value="login">Access Granted</option>
                            <option value="create">Initialization</option>
                            <option value="update">Modification</option>
                            <option value="delete">Termination</option>
                        </select>
                    </div>
                    <div>
                        <label className="label" style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '0.75rem', display: 'block' }}>Sector Type</label>
                        <select className="input" style={{ height: 48, borderRadius: 14, background: 'var(--bg-secondary)', border: 'none', fontWeight: 800, padding: '0 1.25rem' }} value={entityType} onChange={e => setEntityType(e.target.value)}>
                            <option value="">Any Sector</option>
                            <option value="shipment">Shipment</option>
                            <option value="category">Category</option>
                            <option value="user">User/Admin</option>
                            <option value="page">Page View</option>
                        </select>
                    </div>
                    <div>
                        <label className="label" style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '0.75rem', display: 'block' }}>Sector ID</label>
                        <input className="input" style={{ height: 48, borderRadius: 14, background: 'var(--bg-secondary)', border: 'none', fontWeight: 600, padding: '0 1.25rem' }} placeholder="Slug/ID" value={entityId} onChange={e => setEntityId(e.target.value)} />
                    </div>
                    <div>
                        <label className="label" style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '0.75rem', display: 'block' }}>Start Cycle</label>
                        <input type="date" className="input" style={{ height: 48, borderRadius: 14, background: 'var(--bg-secondary)', border: 'none', fontWeight: 600, padding: '0 1.25rem' }} value={startDate} onChange={e => setStartDate(e.target.value)} />
                    </div>
                    <div>
                        <label className="label" style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '0.75rem', display: 'block' }}>End Cycle</label>
                        <input type="date" className="input" style={{ height: 48, borderRadius: 14, background: 'var(--bg-secondary)', border: 'none', fontWeight: 600, padding: '0 1.25rem' }} value={endDate} onChange={e => setEndDate(e.target.value)} />
                    </div>
                    <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem' }}>
                        <button type="button" onClick={() => {
                            setSearch('');
                            setUserIdFilter('');
                            setUserType('');
                            setAction('');
                            setEntityType('');
                            setEntityId('');
                            setStartDate('');
                            setEndDate('');
                            setPage(1);
                        }} className="btn btn-secondary" style={{ height: 48, borderRadius: 14, padding: '0 1.5rem', fontWeight: 800 }}>Clear Parameters</button>
                        <button type="submit" className="btn btn-primary" style={{ minWidth: 160, height: 48, borderRadius: 14, fontWeight: 900, background: 'linear-gradient(135deg, #0f4098, #1e3a8a)', boxShadow: '0 8px 24px -8px rgba(15,64,152,0.4)' }}>Apply Protocol</button>
                    </div>
                </form>
            </div>

            {/* Audit Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: 32, border: '1px solid var(--border)', background: '#fff' }}>
                <div className="data-table-wrapper" style={{ transition: 'opacity 0.3s ease', opacity: loading ? 0.6 : 1 }}>
                    <table className="data-table">
                        <thead>
                            <tr style={{ background: 'var(--bg-secondary)' }}>
                                <th style={{ padding: '1.25rem 2rem', fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Chronology</th>
                                <th style={{ padding: '1.25rem 2rem', fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Principal</th>
                                <th style={{ padding: '1.25rem 2rem', fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Tier</th>
                                <th style={{ padding: '1.25rem 2rem', fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Vector</th>
                                <th style={{ padding: '1.25rem 2rem', fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Details</th>
                                <th style={{ padding: '1.25rem 2rem', fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Node IP</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} style={{ padding: '6rem 0' }}><div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}><div className="spinner" /><p style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-muted)' }}>Syncing Audit Ledger...</p></div></td></tr>
                            ) : logs.length === 0 ? (
                                <tr><td colSpan={6} style={{ padding: '6rem 0', textAlign: 'center' }}><div style={{ opacity: 0.1, marginBottom: '1.5rem' }}><Activity size={64} style={{ margin: '0 auto' }} /></div><h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>No Records Detected</h3><p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Adjust parameters to broaden the chronicity search.</p></td></tr>
                            ) : logs.map((log) => {
                                const details = typeof log.details === 'string' ? JSON.parse(log.details) : log.details;
                                return (
                                    <tr key={log.id} style={{ borderTop: '1px solid var(--border)', transition: 'background 0.2s' }}>
                                        <td style={{ padding: '1.25rem 2rem', whiteSpace: 'nowrap', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 700 }}>
                                            {new Date(log.created_at).toLocaleString('en-KE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td style={{ padding: '1.25rem 2rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <User size={18} color="var(--accent)" />
                                                </div>
                                                <div>
                                                    <p style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)', margin: 0 }}>{log.user_name || 'Anonymous'}</p>
                                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, margin: 0 }}>{log.user_email || log.user_id?.slice(0, 8) || 'No Trace'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1.25rem 2rem' }}>
                                            <span style={{ 
                                                fontSize: '0.7rem', fontWeight: 900, padding: '0.4rem 0.8rem', borderRadius: 10, textTransform: 'uppercase',
                                                background: log.user_type === 'customer' ? 'rgba(59,130,246,0.06)' : 'rgba(139,92,246,0.06)',
                                                color: log.user_type === 'customer' ? '#3b82f6' : '#8b5cf6',
                                                border: `1px solid ${log.user_type === 'customer' ? '#3b82f630' : '#8b5cf630'}`
                                            }}>
                                                {log.user_type}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1.25rem 2rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                                <Activity size={16} color="var(--accent)" />
                                                <span style={{ fontWeight: 800, fontSize: '0.85rem', textTransform: 'capitalize' }}>{log.action}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1.25rem 2rem', maxWidth: 350 }}>
                                            <p style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', margin: 0 }}>
                                                {details?.url || details?.message || JSON.stringify(details)}
                                            </p>
                                        </td>
                                        <td style={{ padding: '1.25rem 2rem', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                                            {log.ip_address || '—'}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Ledger Pagination */}
                <div style={{ padding: '1.5rem 2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', background: 'var(--bg-secondary)', flexWrap: 'wrap', gap: '1.5rem' }}>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                        Monitoring <strong style={{ color: 'var(--text-primary)' }}>{logs.length}</strong> of <strong style={{ color: 'var(--text-primary)' }}>{totalLogs}</strong> audit entries.
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn btn-secondary" style={{ width: 40, height: 40, padding: 0, borderRadius: 12 }}><ArrowLeft size={16} /></button>
                        <div style={{ background: '#fff', padding: '0.5rem 1rem', borderRadius: 10, border: '1px solid var(--border)', fontSize: '0.85rem', fontWeight: 900 }}>
                            Cycle {page} / {totalPages}
                        </div>
                        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn btn-secondary" style={{ width: 40, height: 40, padding: 0, borderRadius: 12 }}><ArrowRight size={16} /></button>
                    </div>
                </div>
            </div>
        </div>
    );
}
