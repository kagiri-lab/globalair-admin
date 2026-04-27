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
        <div style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.25rem' }}>System Activity Logs</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Monitor all customer and admin actions across the system</p>
                </div>
                <button onClick={() => fetchLogs()} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <RefreshCw size={16} className={loading ? 'spinning' : ''} /> Refresh
                </button>
            </div>

            {/* Filters */}
            <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
                <form onSubmit={handleSearch} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'flex-end' }}>
                    <div>
                        <label className="label">Search Details</label>
                        <div style={{ position: 'relative' }}>
                            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input className="input" style={{ paddingLeft: '2.5rem' }} placeholder="Search details..." value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                    </div>
                    <div>
                        <label className="label">Exact User ID</label>
                        <input className="input" placeholder="User UUID" value={userIdFilter} onChange={e => setUserIdFilter(e.target.value)} />
                    </div>
                    <div>
                        <label className="label">User Type</label>
                        <select className="input" value={userType} onChange={e => setUserType(e.target.value)}>
                            <option value="">All Users</option>
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
                        <label className="label">Action</label>
                        <select className="input" value={action} onChange={e => setAction(e.target.value)}>
                            <option value="">All Actions</option>
                            <option value="view">Page View</option>
                            <option value="login">Login</option>
                            <option value="create">Create</option>
                            <option value="update">Update</option>
                            <option value="delete">Delete</option>
                        </select>
                    </div>
                    <div>
                        <label className="label">Entity Type</label>
                        <select className="input" value={entityType} onChange={e => setEntityType(e.target.value)}>
                            <option value="">Any Entity</option>
                            <option value="shipment">Shipment</option>
                            <option value="category">Category</option>
                            <option value="user">User/Admin</option>
                            <option value="page">Page View</option>
                        </select>
                    </div>
                    <div>
                        <label className="label">Entity ID</label>
                        <input className="input" placeholder="ID or Slug" value={entityId} onChange={e => setEntityId(e.target.value)} />
                    </div>
                    <div>
                        <label className="label">Start Date</label>
                        <input type="date" className="input" value={startDate} onChange={e => setStartDate(e.target.value)} />
                    </div>
                    <div>
                        <label className="label">End Date</label>
                        <input type="date" className="input" value={endDate} onChange={e => setEndDate(e.target.value)} />
                    </div>
                    <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
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
                        }} className="btn btn-secondary">Clear All</button>
                        <button type="submit" className="btn btn-primary" style={{ minWidth: 140 }}>Apply Filters</button>
                    </div>
                </form>
            </div>

            {/* Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden', minHeight: '400px' }}>
                <div style={{ 
                    overflowX: 'auto', 
                    transition: 'opacity 0.3s ease',
                    opacity: loading ? 0.6 : 1
                }}>
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, textAlign: 'left', fontSize: '0.875rem' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
                                <th style={{ padding: '1rem', fontWeight: 600 }}>Timestamp</th>
                                <th style={{ padding: '1rem', fontWeight: 600 }}>User</th>
                                <th style={{ padding: '1rem', fontWeight: 600 }}>Type</th>
                                <th style={{ padding: '1rem', fontWeight: 600 }}>Action</th>
                                <th style={{ padding: '1rem', fontWeight: 600 }}>Details</th>
                                <th style={{ padding: '1rem', fontWeight: 600 }}>IP Address</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} style={{ padding: '3rem', textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></td></tr>
                            ) : logs.length === 0 ? (
                                <tr><td colSpan={6} style={{ padding: '3rem', textAlign: 'center' }}>No logs found matching your criteria</td></tr>
                            ) : logs.map((log) => {
                                const details = typeof log.details === 'string' ? JSON.parse(log.details) : log.details;
                                return (
                                    <tr key={log.id} style={{ 
                                        borderBottom: '1px solid var(--border)', 
                                        transition: 'background 0.2s',
                                        animation: 'fadeIn 0.3s ease-out forwards'
                                    }}>
                                        <td style={{ padding: '1rem', whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>
                                            {new Date(log.created_at).toLocaleString()}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                {log.user_id ? (
                                                    <div>
                                                        <p style={{ fontWeight: 600 }}>{log.user_name || 'User'}</p>
                                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{log.user_email || log.user_id.slice(0, 8)}</p>
                                                    </div>
                                                ) : <span style={{ color: 'var(--text-muted)' }}>Guest</span>}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{ 
                                                fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '4px', textTransform: 'uppercase',
                                                background: log.user_type === 'customer' ? 'rgba(59,130,246,0.1)' : 'rgba(139,92,246,0.1)',
                                                color: log.user_type === 'customer' ? '#3b82f6' : '#8b5cf6'
                                            }}>
                                                {log.user_type}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                <Activity size={14} color="var(--accent)" />
                                                <span style={{ fontWeight: 600 }}>{log.action}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem', maxWidth: 300 }}>
                                            <p style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {details?.url || details?.message || JSON.stringify(details)}
                                            </p>
                                        </td>
                                        <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                            {log.ip_address || '—'}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)' }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Showing <strong>{logs.length}</strong> of <strong>{totalLogs}</strong> logs
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn btn-secondary btn-sm"><ArrowLeft size={14} /></button>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Page {page} of {totalPages}</span>
                        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn btn-secondary btn-sm"><ArrowRight size={14} /></button>
                    </div>
                </div>
            </div>
        </div>
    );
}
