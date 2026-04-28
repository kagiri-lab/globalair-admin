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
        <div style={{ padding: 'clamp(1rem, 3vw, 2rem)', maxWidth: 1100, margin: '0 auto' }} className="fade-in">

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', minWidth: 'min(100%, 400px)' }}>
                    <div style={{ width: 64, height: 64, borderRadius: 16, background: 'linear-gradient(135deg, var(--accent) 0%, #3b82f6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 800, color: 'white', flexShrink: 0, boxShadow: '0 8px 24px rgba(15,64,152,0.15)' }}>
                        {initials}
                    </div>
                    <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                            <h1 style={{ fontSize: 'clamp(1.25rem, 4vw, 1.75rem)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{user.name}</h1>
                            <span style={{ 
                                display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                                padding: '0.25rem 0.65rem', borderRadius: 100, fontSize: '0.65rem', fontWeight: 800,
                                background: user.is_active ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                                color: user.is_active ? '#10b981' : '#ef4444'
                            }}>
                                {user.is_active ? 'Active' : 'Suspended'}
                            </span>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Mail size={14} className="opacity-70" /> {user.email}</span>
                            {user.phone && <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Phone size={14} className="opacity-70" /> {user.phone}</span>}
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', width: '100%', maxWidth: 'max-content' }}>
                    <button className="btn btn-secondary" onClick={() => router.push('/customers')} style={{ borderRadius: 12, height: 42, flex: 1 }}>
                        <ArrowLeft size={16} /> <span className="desktop-only">Customers</span>
                    </button>
                    {hasPermission('manage_customers') && (
                        <button className="btn btn-primary" onClick={() => setShowPassModal(true)} style={{ borderRadius: 12, height: 42, flex: 1.5 }}>Reset Password</button>
                    )}
                </div>
            </div>

            {/* Account Controls Card */}
            {hasPermission('manage_customers') && (
                <div className="card" style={{ marginBottom: '2rem', padding: '1.25rem', background: 'rgba(15,64,152,0.02)', border: '1px solid rgba(15,64,152,0.08)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'white', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                                <Lock size={20} />
                            </div>
                            <div>
                                <p style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Administrative Controls</p>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>Global access management for this account.</p>
                            </div>
                        </div>
                        <button 
                            className={`btn ${user.is_active ? 'btn-secondary' : 'btn-primary'}`} 
                            style={{ borderRadius: 12, height: 44, minWidth: 160, fontWeight: 800 }}
                            onClick={handleToggleStatus}
                            disabled={updating}
                        >
                            {updating ? 'Processing...' : user.is_active ? 'Suspend Access' : 'Restore Access'}
                        </button>
                    </div>
                </div>
            )}

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                {STAT_CARDS.map(({ icon: Icon, label, value, color, bg }) => (
                    <div key={label} className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Icon size={20} color={color} />
                        </div>
                        <div>
                            <p style={{ fontSize: '1.35rem', fontWeight: 900, lineHeight: 1, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{value}</p>
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.35rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '2rem', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem', overflowX: 'auto' }} className="hide-scrollbar">
                <button onClick={() => setActiveTab('shipments')} style={{ padding: '0.85rem 0', border: 'none', background: 'none', borderBottom: `3px solid ${activeTab === 'shipments' ? 'var(--accent)' : 'transparent'}`, color: activeTab === 'shipments' ? 'var(--accent)' : 'var(--text-muted)', fontWeight: 800, cursor: 'pointer', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>Shipment Registry</button>
                {hasPermission('manage_admins') && (
                    <button onClick={() => setActiveTab('logs')} style={{ padding: '0.85rem 0', border: 'none', background: 'none', borderBottom: `3px solid ${activeTab === 'logs' ? 'var(--accent)' : 'transparent'}`, color: activeTab === 'logs' ? 'var(--accent)' : 'var(--text-muted)', fontWeight: 800, cursor: 'pointer', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>Security Audit Logs</button>
                )}
            </div>

            {/* Tab Panels */}
            {activeTab === 'shipments' ? (
                <div className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: 20 }}>
                    <div className="data-table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th style={{ paddingLeft: '1.5rem' }}>Tracking</th>
                                    <th className="desktop-only">Route</th>
                                    <th>Status</th>
                                    <th style={{ textAlign: 'right', paddingRight: '1.5rem' }}>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {shipments.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} style={{ padding: '5rem 0', textAlign: 'center' }}>
                                            <Package size={48} style={{ margin: '0 auto', opacity: 0.1, marginBottom: '1rem' }} />
                                            <p style={{ fontWeight: 800, color: 'var(--text-primary)' }}>No shipments found</p>
                                        </td>
                                    </tr>
                                ) : (
                                    shipments.map((s: any) => (
                                        <tr key={s.id} onClick={() => router.push(`/shipments/${s.id}`)} style={{ cursor: 'pointer' }}>
                                            <td style={{ paddingLeft: '1.5rem' }}>
                                                <div style={{ minWidth: 0 }}>
                                                    <p style={{ fontWeight: 900, fontSize: '0.85rem', color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>{s.tracking_number}</p>
                                                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>{s.shipment_type.toUpperCase()}</p>
                                                </div>
                                            </td>
                                            <td className="desktop-only">
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                                                    {s.pickup_city} <ArrowRight size={12} className="opacity-40" /> {s.destination_city}
                                                </div>
                                            </td>
                                            <td><StatusBadge status={s.status} /></td>
                                            <td style={{ textAlign: 'right', paddingRight: '1.5rem' }}>
                                                <p style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)' }}>${Number(s.total_price || 0).toLocaleString()}</p>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: 20 }}>
                    <div className="data-table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th style={{ paddingLeft: '1.5rem' }}>Audit Event</th>
                                    <th className="desktop-only">Context / URL</th>
                                    <th style={{ textAlign: 'right', paddingRight: '1.5rem' }}>Timestamp</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logsLoading ? (
                                    <tr><td colSpan={3} style={{ padding: '5rem 0', textAlign: 'center' }}><div className="spinner" /></td></tr>
                                ) : logs.length === 0 ? (
                                    <tr><td colSpan={3} style={{ padding: '5rem 0', textAlign: 'center' }}><p style={{ fontWeight: 800, opacity: 0.2 }}>No activity recorded</p></td></tr>
                                ) : logs.map(l => (
                                    <tr key={l.id}>
                                        <td style={{ paddingLeft: '1.5rem' }}>
                                            <p style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{l.action}</p>
                                        </td>
                                        <td className="desktop-only">
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {typeof l.details === 'string' ? JSON.parse(l.details)?.url || l.details : l.details?.url || JSON.stringify(l.details)}
                                            </p>
                                        </td>
                                        <td style={{ textAlign: 'right', paddingRight: '1.5rem' }}>
                                            <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{new Date(l.created_at).toLocaleDateString()} {new Date(l.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {totalPages > 1 && (
                        <div style={{ padding: '1.25rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'center', gap: '1rem', alignItems: 'center', background: 'var(--bg-secondary)' }}>
                            <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}><ArrowLeft size={14} /></button>
                            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>{page} / {totalPages}</span>
                            <button className="btn btn-secondary btn-sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}><ArrowRight size={14} /></button>
                        </div>
                    )}
                </div>
            )}

            {/* Reset Password Modal */}
            {showPassModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '1.5rem' }}>
                    <div className="card fade-in" style={{ width: '100%', maxWidth: 450, padding: 0, boxShadow: '0 40px 100px -20px rgba(0,0,0,0.3)', borderRadius: 28, overflow: 'hidden', background: '#fff' }}>
                        <div style={{ background: 'var(--bg-secondary)', padding: '1.75rem 2rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 900, letterSpacing: '-0.02em' }}>Reset Identity Key</h2>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '0.2rem' }}>Manual credential override</p>
                            </div>
                            <button className="menu-toggle" onClick={() => setShowPassModal(false)}><X size={20} /></button>
                        </div>
                        <div style={{ padding: '2rem' }}>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.75rem', lineHeight: 1.5, fontWeight: 500 }}>
                                You are modifying credentials for <b>{user.name}</b>. This action will take effect immediately upon next login.
                            </p>
                            <div className="form-group" style={{ marginBottom: '2rem' }}>
                                <label className="label">New Secure Password</label>
                                <div style={{ position: 'relative' }}>
                                    <Lock size={16} style={{ position: 'absolute', left: 14, top: 16, color: 'var(--text-muted)', opacity: 0.7 }} />
                                    <input 
                                        type="text" 
                                        className="input" 
                                        style={{ paddingLeft: '2.75rem', height: 48, borderRadius: 12, background: 'var(--bg-secondary)', fontWeight: 600 }} 
                                        placeholder="Min. 6 characters" 
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <button className="btn btn-secondary" style={{ flex: 1, height: 48, borderRadius: 12, fontWeight: 800 }} onClick={() => setShowPassModal(false)}>Cancel</button>
                                <button className="btn btn-primary" style={{ flex: 2, height: 48, borderRadius: 12, fontWeight: 900, boxShadow: '0 8px 16px rgba(15,64,152,0.15)' }} onClick={handleResetPassword} disabled={resetting}>
                                    {resetting ? 'Resetting...' : 'Overwrite Password'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
