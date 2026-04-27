'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Mail, Phone, Calendar, Package, ArrowRight, TrendingUp, CheckCircle2, DollarSign, Activity, X, Lock } from 'lucide-react';
import api from '@/lib/api';
import { useAdminAuth } from '@/lib/auth';
import toast from 'react-hot-toast';

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
    pending: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: 'Pending' },
    confirmed: { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', label: 'Confirmed' },
    picked_up: { color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', label: 'Picked Up' },
    in_transit: { color: '#06b6d4', bg: 'rgba(6,182,212,0.12)', label: 'In Transit' },
    out_for_delivery: { color: '#f97316', bg: 'rgba(249,115,22,0.12)', label: 'Out for Delivery' },
    delivered: { color: '#10b981', bg: 'rgba(16,185,129,0.12)', label: 'Delivered' },
    cancelled: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', label: 'Cancelled' },
    failed: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', label: 'Failed' },
};

function StatusBadge({ status }: { status: string }) {
    const cfg = STATUS_CONFIG[status] || { color: '#6b7280', bg: 'rgba(107,114,128,0.12)', label: status };
    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', fontWeight: 700, borderRadius: 100, padding: '0.2rem 0.65rem', background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}30`, whiteSpace: 'nowrap' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
            {cfg.label}
        </span>
    );
}

export default function UserDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'shipments' | 'logs'>('shipments');
    const [logs, setLogs] = useState<any[]>([]);
    const [logsLoading, setLogsLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const { hasPermission } = useAdminAuth();
    
    const [updating, setUpdating] = useState(false);
    const [resetting, setResetting] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [showPassModal, setShowPassModal] = useState(false);

    const load = () => {
        setLoading(true);
        api.get(`/admin/users/${id}`)
            .then(r => setData(r.data.data))
            .catch(() => router.push('/customers'))
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, [id]);

    useEffect(() => {
        if (data?.user?.name) {
            window.dispatchEvent(new CustomEvent('set-header-title', { detail: data.user.name }));
            document.title = `${data.user.name} | GlobalAir Admin`;
        }
    }, [data?.user?.name]);

    const handleToggleStatus = async () => {
        setUpdating(true);
        try {
            await api.patch(`/admin/users/${id}/toggle-status`);
            toast.success('Account status updated');
            load();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to update status');
        } finally {
            setUpdating(false);
        }
    };

    const handleResetPassword = async () => {
        if (!newPassword || newPassword.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }
        setResetting(true);
        try {
            await api.patch(`/admin/users/${id}/reset-password`, { password: newPassword });
            toast.success('Password reset successfully');
            setShowPassModal(false);
            setNewPassword('');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to reset password');
        } finally {
            setResetting(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'logs' && hasPermission('manage_admins')) {
            setLogsLoading(true);
            api.get('/logs/admin', { params: { user_id: id, page, limit: 20 } })
                .then(r => {
                    setLogs(r.data.data.logs);
                    setTotalPages(r.data.data.pagination.pages);
                })
                .finally(() => setLogsLoading(false));
        }
    }, [id, activeTab, page]);

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '5rem' }}><div className="spinner" /></div>;
    if (!data) return null;

    const { user, shipments, stats } = data;
    const initials = (user.name || 'U').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);

    const STAT_CARDS = [
        { icon: Package, label: 'Total Shipments', value: Number(stats?.total || 0), color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
        { icon: CheckCircle2, label: 'Delivered', value: Number(stats?.delivered || 0), color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
        { icon: DollarSign, label: 'Total Spent', value: `USD ${Number(stats?.total_spent || 0).toLocaleString()}`, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
        { icon: TrendingUp, label: 'Success Rate', value: stats?.total > 0 ? `${Math.round((stats.delivered / stats.total) * 100)}%` : '—', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    ];

    return (
        <div style={{ padding: '2rem', maxWidth: 1000, margin: '0 auto' }} className="fade-in">

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                    <div style={{ width: 64, height: 64, borderRadius: 16, background: 'linear-gradient(135deg, var(--accent) 0%, #3b82f6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 800, color: 'white', flexShrink: 0, boxShadow: '0 8px 24px rgba(15,64,152,0.15)' }}>
                        {initials}
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                            <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>{user.name}</h1>
                            <span style={{ 
                                display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                                padding: '0.25rem 0.75rem', borderRadius: 100, fontSize: '0.72rem', fontWeight: 700,
                                background: user.is_active ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                                color: user.is_active ? '#10b981' : '#ef4444',
                                border: `1px solid ${user.is_active ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`
                            }}>
                                <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor' }} />
                                {user.is_active ? 'Active Account' : 'Account Suspended'}
                            </span>
                        </div>
                        <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Mail size={14} /> {user.email}</span>
                            {user.phone && <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Phone size={14} /> {user.phone}</span>}
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Calendar size={14} /> Joined {new Date(user.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn btn-secondary" onClick={() => router.push('/customers')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: 10 }}>
                        <ArrowLeft size={16} /> All Customers
                    </button>
                    {hasPermission('manage_customers') && (
                        <div style={{ position: 'relative' }}>
                             <button className="btn btn-primary" onClick={() => setShowPassModal(true)} style={{ borderRadius: 10 }}>Reset Password</button>
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Actions Card (New Section) */}
            {hasPermission('manage_customers') && (
                <div className="card" style={{ marginBottom: '2rem', padding: '1.5rem', background: 'rgba(15,64,152,0.03)', border: '1px solid rgba(15,64,152,0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'white', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                                <Lock size={20} />
                            </div>
                            <div>
                                <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>Account Controls</p>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Administrative tools to manage customer access.</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button 
                                className={`btn ${user.is_active ? 'btn-secondary' : 'btn-primary'}`} 
                                style={{ borderRadius: 10, minWidth: 140 }}
                                onClick={handleToggleStatus}
                                disabled={updating}
                            >
                                {updating ? 'Updating...' : user.is_active ? 'Suspend Account' : 'Activate Account'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.875rem', marginBottom: '1.75rem' }}>
                {STAT_CARDS.map(({ icon: Icon, label, value, color, bg }) => (
                    <div key={label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Icon size={18} color={color} />
                        </div>
                        <div>
                            <p style={{ fontSize: '1.2rem', fontWeight: 800, lineHeight: 1, color: 'var(--text-primary)' }}>{value}</p>
                            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem', fontWeight: 600 }}>{label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '2rem', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem' }}>
                <button onClick={() => setActiveTab('shipments')} style={{ padding: '0.75rem 0.25rem', border: 'none', background: 'none', borderBottom: `2px solid ${activeTab === 'shipments' ? 'var(--accent)' : 'transparent'}`, color: activeTab === 'shipments' ? 'var(--accent)' : 'var(--text-muted)', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>Shipment History</button>
                {hasPermission('manage_admins') && (
                    <button onClick={() => setActiveTab('logs')} style={{ padding: '0.75rem 0.25rem', border: 'none', background: 'none', borderBottom: `2px solid ${activeTab === 'logs' ? 'var(--accent)' : 'transparent'}`, color: activeTab === 'logs' ? 'var(--accent)' : 'var(--text-muted)', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>Activity Logs</button>
                )}
            </div>

            {/* Content sections */}
            {activeTab === 'shipments' ? (
                /* Shipment History */
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>Shipment History</p>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{shipments.length} shipment{shipments.length !== 1 ? 's' : ''}</p>
                </div>

                {/* Table header */}
                {shipments.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.4fr 1fr 1fr 0.9fr 32px', gap: '0.75rem', padding: '0.55rem 1.25rem', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        <span>Tracking</span><span>Route</span><span>Type</span><span>Status</span><span>Price</span><span />
                    </div>
                )}

                {shipments.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                        <Package size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.3 }} />
                        <p style={{ fontWeight: 600 }}>No shipments yet</p>
                    </div>
                ) : (
                    shipments.map((s: any, i: number) => (
                        <Link key={s.id} href={`/shipments/${s.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                            <div style={{
                                display: 'grid', gridTemplateColumns: '1.5fr 1.4fr 1fr 1fr 0.9fr 32px',
                                gap: '0.75rem', padding: '0.875rem 1.25rem', alignItems: 'center',
                                borderBottom: i < shipments.length - 1 ? '1px solid var(--border)' : 'none',
                                cursor: 'pointer', transition: 'background 0.15s',
                            }}
                                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>

                                <span style={{ fontFamily: 'monospace', color: 'var(--accent)', fontWeight: 700, fontSize: '0.78rem' }}>{s.tracking_number}</span>

                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                    {s.pickup_city} <ArrowRight size={11} style={{ opacity: 0.4, flexShrink: 0 }} /> {s.destination_city}
                                </span>

                                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{s.shipment_type}</span>

                                <StatusBadge status={s.status} />

                                <span style={{ fontWeight: 700, fontSize: '0.8rem' }}>USD {Number(s.total_price || 0).toLocaleString()}</span>

                                <ArrowRight size={14} color="var(--text-muted)" />
                            </div>
                        </Link>
                    ))
                )}
            </div>
            ) : (
                /* Activity Logs */
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
                                    <th style={{ padding: '0.875rem 1rem' }}>Timestamp</th>
                                    <th style={{ padding: '0.875rem 1rem' }}>Action</th>
                                    <th style={{ padding: '0.875rem 1rem' }}>Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logsLoading ? (
                                    <tr><td colSpan={3} style={{ padding: '3rem', textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></td></tr>
                                ) : logs.length === 0 ? (
                                    <tr><td colSpan={3} style={{ padding: '3rem', textAlign: 'center' }}>No activity logs found</td></tr>
                                ) : logs.map(l => (
                                    <tr key={l.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '0.875rem 1rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{new Date(l.created_at).toLocaleString()}</td>
                                        <td style={{ padding: '0.875rem 1rem', fontWeight: 600 }}>{l.action}</td>
                                        <td style={{ padding: '0.875rem 1rem', maxWidth: 400 }}>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{typeof l.details === 'string' ? JSON.parse(l.details)?.url || l.details : l.details?.url || JSON.stringify(l.details)}</p>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {totalPages > 1 && (
                        <div style={{ padding: '1rem', display: 'flex', justifyContent: 'center', gap: '1rem', alignItems: 'center', borderTop: '1px solid var(--border)' }}>
                            <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}><ArrowLeft size={14} /></button>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Page {page} of {totalPages}</span>
                            <button className="btn btn-secondary btn-sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}><ArrowRight size={14} /></button>
                        </div>
                    )}
                </div>
            )}
            {/* Reset Password Modal */}
            {showPassModal && (
                <>
                    <div className="modal-backdrop" onClick={() => setShowPassModal(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 999 }} />
                    <div className="card" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '90%', maxWidth: 400, zIndex: 1000, padding: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Reset Password</h2>
                            <button onClick={() => setShowPassModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
                        </div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                            Setting a new password for <b>{user.name}</b>. They will need to use this new password for their next login.
                        </p>
                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                            <label className="label">New Password</label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
                                <input 
                                    type="text" 
                                    className="input" 
                                    style={{ paddingLeft: '2.5rem' }} 
                                    placeholder="Enter new secure password" 
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowPassModal(false)}>Cancel</button>
                            <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleResetPassword} disabled={resetting}>
                                {resetting ? 'Resetting...' : 'Update Password'}
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
