'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft, Check, Eye, EyeOff,
    ShieldCheck, ShieldAlert, Headset, BarChart3, Wrench,
    ToggleLeft, ToggleRight, KeyRound, Trash2, Loader2, ArrowRight
} from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useAdminAuth } from '@/lib/auth';

// ── Role definitions ───────────────────────────────────────────────────
const ROLES = [
    { id: 'super_admin', label: 'Super Admin', icon: ShieldAlert, color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)', description: 'Full system access — all functions including managing other admin accounts.' },
    { id: 'admin', label: 'Administrator', icon: ShieldCheck, color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.25)', description: 'Full access to all operations except managing other admin accounts.' },
    { id: 'operations', label: 'Operations Manager', icon: Wrench, color: '#0f4098', bg: 'rgba(15,64,152,0.08)', border: 'rgba(15,64,152,0.25)', description: 'Manage shipments, update statuses, handle categories, and view customers.' },
    { id: 'support', label: 'Customer Support', icon: Headset, color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.25)', description: 'Handle customer queries, view and update shipment statuses.' },
    { id: 'finance', label: 'Finance Manager', icon: BarChart3, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)', description: 'Manage pricing, shipping zones, fee settings, and view dashboard reports.' },
];

const PERMISSION_GROUPS = [
    { module: 'Dashboard', permissions: [{ key: 'view_dashboard', label: 'View dashboard & statistics', roles: ['super_admin', 'admin', 'operations', 'support', 'finance'] }] },
    { module: 'Shipments', permissions: [{ key: 'view_shipments', label: 'View all shipments', roles: ['super_admin', 'admin', 'operations', 'support'] }, { key: 'update_shipments', label: 'Update shipment status & tracking', roles: ['super_admin', 'admin', 'operations', 'support'] }] },
    { module: 'Customers', permissions: [{ key: 'view_customers', label: 'View customer list & profiles', roles: ['super_admin', 'admin', 'operations', 'support'] }, { key: 'manage_customers', label: 'Create and manage customer accounts', roles: ['super_admin', 'admin', 'support'] }] },
    { module: 'Categories', permissions: [{ key: 'view_categories', label: 'View product categories', roles: ['super_admin', 'admin', 'operations', 'finance'] }, { key: 'manage_categories', label: 'Create, edit, and delete categories', roles: ['super_admin', 'admin', 'operations', 'finance'] }] },
    { module: 'Settings & Pricing', permissions: [{ key: 'view_settings', label: 'View fees and configuration', roles: ['super_admin', 'admin', 'finance'] }, { key: 'manage_settings', label: 'Modify fees and system settings', roles: ['super_admin', 'admin', 'finance'] }, { key: 'manage_zones', label: 'Manage shipping zones & rates', roles: ['super_admin', 'admin', 'finance'] }] },
    { module: 'Admin Management', permissions: [{ key: 'manage_admins', label: 'Create, edit, and delete admin accounts', roles: ['super_admin'] }] },
];

const getDefaultPermissions = (roleId: string): Set<string> => {
    const set = new Set<string>();
    PERMISSION_GROUPS.forEach(g => g.permissions.forEach(p => { if (p.roles.includes(roleId)) set.add(p.key); }));
    return set;
};

export default function EditAdminPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const { user: currentUser, hasPermission } = useAdminAuth();

    const [admin, setAdmin] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ name: '', phone: '', role: '' });
    const [selectedRole, setSelectedRole] = useState('');
    const [originalRole, setOriginalRole] = useState('');
    const [permissions, setPermissions] = useState<Set<string>>(new Set());
    const [saving, setSaving] = useState(false);

    // Password reset
    const [newPassword, setNewPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [resettingPw, setResettingPw] = useState(false);

    // Access toggle
    const [togglingAccess, setTogglingAccess] = useState(false);

    // Delete confirm
    const [showDelete, setShowDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Logs for admin
    const [activeTab, setActiveTab] = useState<'details' | 'logs'>('details');
    const [logs, setLogs] = useState<any[]>([]);
    const [logsLoading, setLogsLoading] = useState(false);
    const [logPage, setLogPage] = useState(1);
    const [logTotalPages, setLogTotalPages] = useState(1);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await api.get('/admin/system/admins');
                const found = res.data.data.find((a: any) => a.id === id);
                if (!found) { toast.error('Admin not found'); router.push('/settings'); return; }
                setAdmin(found);
                setForm({ name: found.name, phone: found.phone || '', role: found.role });
                setSelectedRole(found.role);
                setOriginalRole(found.role);
                setPermissions(new Set(
                    typeof found.permissions === 'string'
                        ? JSON.parse(found.permissions)
                        : (found.permissions || [])
                ));
            } catch { toast.error('Failed to load admin'); router.push('/settings'); }
            finally { setLoading(false); }
        };
        load();
    }, [id]);

    useEffect(() => {
        if (activeTab === 'logs' && hasPermission('manage_admins')) {
            setLogsLoading(true);
            api.get('/logs/admin', { params: { user_id: id, page: logPage, limit: 20 } })
                .then(r => {
                    setLogs(r.data.data.logs);
                    setLogTotalPages(r.data.data.pagination.pages);
                })
                .finally(() => setLogsLoading(false));
        }
    }, [id, activeTab, logPage, hasPermission]);

    const selectRole = (roleId: string) => {
        setSelectedRole(roleId);
        setForm(f => ({ ...f, role: roleId }));
        setPermissions(getDefaultPermissions(roleId));
    };

    const togglePermission = (key: string) => {
        setPermissions(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.patch(`/admin/system/admins/${id}`, {
                ...form,
                permissions: Array.from(permissions)
            });
            toast.success('Admin updated');
        } catch (err: any) { toast.error(err.response?.data?.message || 'Update failed'); }
        finally { setSaving(false); }
    };

    const handleToggleAccess = async () => {
        setTogglingAccess(true);
        try {
            const res = await api.patch(`/admin/system/admins/${id}/toggle-access`, {});
            setAdmin((a: any) => ({ ...a, is_active: res.data.is_active }));
            toast.success(res.data.message);
        } catch (err: any) { toast.error(err.response?.data?.message || 'Toggle failed'); }
        finally { setTogglingAccess(false); }
    };

    const handleResetPassword = async () => {
        if (!newPassword || newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
        setResettingPw(true);
        try {
            await api.post(`/admin/system/admins/${id}/reset-password`, { new_password: newPassword });
            toast.success('Password reset successfully');
            setNewPassword('');
        } catch (err: any) { toast.error(err.response?.data?.message || 'Reset failed'); }
        finally { setResettingPw(false); }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await api.delete(`/admin/system/admins/${id}`);
            toast.success('Admin deleted');
            router.push('/settings');
        } catch (err: any) { toast.error(err.response?.data?.message || 'Delete failed'); }
        finally { setDeleting(false); }
    };

    const isSelf = currentUser?.id === id;
    const selectedRoleMeta = ROLES.find(r => r.id === selectedRole);

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><div className="spinner" /></div>;

    return (
        <div style={{ padding: '2rem', maxWidth: 960, margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: '2rem' }}>
                <Link href="/settings" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.85rem', marginBottom: '1rem' }}>
                    <ArrowLeft size={15} /> Back to Settings
                </Link>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                    <div>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.25rem' }}>Edit Admin — {admin?.name}</h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{admin?.email}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: admin?.is_active ? '#10b981' : '#ef4444' }}>
                            {admin?.is_active ? '● Active' : '● Disabled'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Profile Tabs */}
            <div style={{ display: 'flex', gap: '2rem', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem' }}>
                <button onClick={() => setActiveTab('details')} style={{ padding: '0.75rem 0.25rem', border: 'none', background: 'none', borderBottom: `2px solid ${activeTab === 'details' ? 'var(--accent)' : 'transparent'}`, color: activeTab === 'details' ? 'var(--accent)' : 'var(--text-muted)', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>Account & Permissions</button>
                {hasPermission('manage_admins') && (
                    <button onClick={() => setActiveTab('logs')} style={{ padding: '0.75rem 0.25rem', border: 'none', background: 'none', borderBottom: `2px solid ${activeTab === 'logs' ? 'var(--accent)' : 'transparent'}`, color: activeTab === 'logs' ? 'var(--accent)' : 'var(--text-muted)', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>Activity Logs</button>
                )}
            </div>

            {activeTab === 'details' ? (
                <form onSubmit={handleSave}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>

                    {/* LEFT - Account Details & Permissions */}
                    <div style={{ flex: '1 1 420px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        {/* Account Details */}
                        <div className="card">
                            <p style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '1.25rem' }}>Account Details</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label className="label">Full Name</label>
                                    <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                                </div>
                                <div>
                                    <label className="label">Email Address</label>
                                    <input className="input" value={admin?.email} disabled style={{ opacity: 0.6 }} />
                                    <p style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Email cannot be changed</p>
                                </div>
                                <div>
                                    <label className="label">Phone Number</label>
                                    <input className="input" type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+254..." />
                                </div>
                            </div>
                        </div>

                        {/* Permissions */}
                        {selectedRole && (
                            <div className="card">
                                <p style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.25rem' }}>Permissions</p>
                                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                                    Based on <strong style={{ color: selectedRoleMeta?.color }}>{selectedRoleMeta?.label}</strong>
                                </p>
                                {PERMISSION_GROUPS.map(group => (
                                    <div key={group.module} style={{ marginBottom: '1.1rem' }}>
                                        <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>{group.module}</p>
                                        {group.permissions.map(perm => (
                                            <label key={perm.key} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.35rem 0', cursor: 'pointer' }}>
                                                <input type="checkbox" checked={permissions.has(perm.key)} onChange={() => togglePermission(perm.key)} style={{ accentColor: 'var(--accent)', width: 15, height: 15, flexShrink: 0 }} />
                                                <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{perm.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* RIGHT - Role selection, Access toggle, Password Reset, Danger Zone */}
                    <div style={{ flex: '1 1 380px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        {/* Role selector */}
                        <div className="card">
                            <p style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '1.25rem' }}>Assigned Role</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                {ROLES.map(role => {
                                    const Icon = role.icon;
                                    const active = selectedRole === role.id;
                                    return (
                                        <button key={role.id} type="button" onClick={() => !isSelf && selectRole(role.id)}
                                            style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem', padding: '0.75rem 0.875rem', borderRadius: 10, textAlign: 'left', background: active ? role.bg : 'var(--bg-secondary)', border: `1.5px solid ${active ? role.border : 'var(--border)'}`, cursor: isSelf ? 'not-allowed' : 'pointer', transition: 'all 0.15s ease', width: '100%', opacity: isSelf ? 0.7 : 1 }}>
                                            <div style={{ width: 32, height: 32, borderRadius: 7, background: role.bg, border: `1px solid ${role.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <Icon size={16} color={role.color} />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                    <p style={{ fontWeight: 700, fontSize: '0.825rem', color: active ? role.color : 'var(--text-primary)' }}>{role.label}</p>
                                                    {active && <Check size={14} color={role.color} />}
                                                </div>
                                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem', lineHeight: 1.4 }}>{role.description}</p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                            {isSelf && <p style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>You cannot change your own role.</p>}
                        </div>

                        {/* Login Access Toggle */}
                        <div className="card">
                            <p style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.75rem' }}>Login Access</p>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1rem', borderRadius: 10, background: admin?.is_active ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)', border: `1px solid ${admin?.is_active ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
                                <div>
                                    <p style={{ fontWeight: 600, fontSize: '0.875rem', color: admin?.is_active ? '#10b981' : '#ef4444' }}>
                                        {admin?.is_active ? 'Access Enabled' : 'Access Disabled'}
                                    </p>
                                    <p style={{ fontSize: '0.77rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                                        {admin?.is_active ? 'Admin can log in to the system' : 'Admin is blocked from logging in'}
                                    </p>
                                </div>
                                <button type="button" onClick={handleToggleAccess} disabled={togglingAccess || isSelf}
                                    style={{ background: 'none', border: 'none', cursor: isSelf ? 'not-allowed' : 'pointer', padding: 0, opacity: isSelf ? 0.4 : 1 }}>
                                    {togglingAccess ? <Loader2 size={30} className="spinning" color="var(--text-muted)" /> :
                                        admin?.is_active
                                            ? <ToggleRight size={36} color="#10b981" />
                                            : <ToggleLeft size={36} color="#ef4444" />}
                                </button>
                            </div>
                            {isSelf && <p style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>You cannot disable your own account.</p>}
                        </div>

                        {/* Password Reset */}
                        <div className="card">
                            <p style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.25rem' }}>Reset Password</p>
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Set a new password for this admin account</p>
                            <div style={{ display: 'flex', gap: '0.625rem' }}>
                                <div style={{ flex: 1, position: 'relative' }}>
                                    <input className="input" type={showPw ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New password (min. 6 chars)" style={{ paddingRight: '2.5rem' }} />
                                    <button type="button" onClick={() => setShowPw(s => !s)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                        {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                                    </button>
                                </div>
                                <button type="button" className="btn btn-secondary" onClick={handleResetPassword} disabled={resettingPw}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap', flexShrink: 0 }}>
                                    {resettingPw ? <Loader2 size={14} className="spinning" /> : <KeyRound size={14} />} Reset
                                </button>
                            </div>
                        </div>

                        {/* Danger Zone */}
                        {!isSelf && (
                            <div className="card" style={{ border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.02)' }}>
                                <p style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.25rem', color: 'var(--danger)' }}>Danger Zone</p>
                                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Permanently remove this admin account. This cannot be undone.</p>
                                <button type="button" onClick={() => setShowDelete(true)}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', borderRadius: 8, background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.25)', cursor: 'pointer', fontWeight: 600, fontSize: '0.83rem' }}>
                                    <Trash2 size={14} /> Delete Admin Account
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Save bar */}
                <div style={{ marginTop: '1.75rem', display: 'flex', gap: '0.875rem', justifyContent: 'flex-end' }}>
                    <Link href="/settings" className="btn btn-secondary">Cancel</Link>
                    <button type="submit" className="btn btn-primary" disabled={saving} style={{ minWidth: 140 }}>
                        {saving ? <><div className="spinner" /> Saving…</> : <><Check size={15} /> Save Changes</>}
                    </button>
                </div>
            </form>
            ) : (
                /* Logs Tab */
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
                                    <tr><td colSpan={3} style={{ padding: '3rem', textAlign: 'center' }}>No activity logs found for this admin</td></tr>
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
                    {logTotalPages > 1 && (
                        <div style={{ padding: '1rem', display: 'flex', justifyContent: 'center', gap: '1rem', alignItems: 'center', borderTop: '1px solid var(--border)' }}>
                            <button className="btn btn-secondary btn-sm" disabled={logPage === 1} onClick={() => setLogPage(p => p - 1)}><ArrowLeft size={14} /></button>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Page {logPage} of {logTotalPages}</span>
                            <button className="btn btn-secondary btn-sm" disabled={logPage === logTotalPages} onClick={() => setLogPage(p => p + 1)}><ArrowRight size={14} /></button>
                        </div>
                    )}
                </div>
            )}

            {/* Delete Confirm Modal */}
            {showDelete && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <div className="card" style={{ maxWidth: 400, width: '100%', textAlign: 'center' }}>
                        <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                            <Trash2 size={22} color="var(--danger)" />
                        </div>
                        <p style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.5rem' }}>Delete {admin?.name}?</p>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>This will permanently remove their account and cannot be undone.</p>
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                            <button className="btn btn-secondary" onClick={() => setShowDelete(false)}>Cancel</button>
                            <button onClick={handleDelete} disabled={deleting}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1.25rem', borderRadius: 8, background: 'var(--danger)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
                                {deleting ? <><div className="spinner" /> Deleting…</> : <><Trash2 size={14} /> Yes, Delete</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
