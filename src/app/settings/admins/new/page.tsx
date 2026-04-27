'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Check, Eye, EyeOff, ShieldCheck, ShieldAlert, Headset, BarChart3, Wrench } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

// ── Role definitions (mirrors backend permissions.js) ─────────────────
const ROLES = [
    {
        id: 'super_admin',
        label: 'Super Admin',
        icon: ShieldAlert,
        color: '#ef4444',
        bg: 'rgba(239,68,68,0.08)',
        border: 'rgba(239,68,68,0.25)',
        description: 'Full system access — all functions including managing other admin accounts.',
    },
    {
        id: 'admin',
        label: 'Administrator',
        icon: ShieldCheck,
        color: '#8b5cf6',
        bg: 'rgba(139,92,246,0.08)',
        border: 'rgba(139,92,246,0.25)',
        description: 'Full access to all operations except managing other admin accounts.',
    },
    {
        id: 'operations',
        label: 'Operations Manager',
        icon: Wrench,
        color: '#0f4098',
        bg: 'rgba(15,64,152,0.08)',
        border: 'rgba(15,64,152,0.25)',
        description: 'Manage shipments, update statuses, handle categories, and view customers.',
    },
    {
        id: 'support',
        label: 'Customer Support',
        icon: Headset,
        color: '#10b981',
        bg: 'rgba(16,185,129,0.08)',
        border: 'rgba(16,185,129,0.25)',
        description: 'Handle customer queries, view and update shipment statuses.',
    },
    {
        id: 'finance',
        label: 'Finance Manager',
        icon: BarChart3,
        color: '#f59e0b',
        bg: 'rgba(245,158,11,0.08)',
        border: 'rgba(245,158,11,0.25)',
        description: 'Manage pricing, shipping zones, fee settings, and view dashboard reports.',
    },
];

// ── Permission groups with which roles get them by default ────────────
const PERMISSION_GROUPS = [
    {
        module: 'Dashboard',
        permissions: [
            { key: 'view_dashboard', label: 'View dashboard & statistics', roles: ['super_admin', 'admin', 'operations', 'support', 'finance'] },
        ],
    },
    {
        module: 'Shipments',
        permissions: [
            { key: 'view_shipments', label: 'View all shipments', roles: ['super_admin', 'admin', 'operations', 'support'] },
            { key: 'update_shipments', label: 'Update shipment status & tracking', roles: ['super_admin', 'admin', 'operations', 'support'] },
        ],
    },
    {
        module: 'Customers',
        permissions: [
            { key: 'view_customers', label: 'View customer list & profiles', roles: ['super_admin', 'admin', 'operations', 'support'] },
            { key: 'manage_customers', label: 'Create and manage customer accounts', roles: ['super_admin', 'admin', 'support'] },
        ],
    },
    {
        module: 'Categories',
        permissions: [
            { key: 'view_categories', label: 'View product categories', roles: ['super_admin', 'admin', 'operations', 'finance'] },
            { key: 'manage_categories', label: 'Create, edit, and delete categories', roles: ['super_admin', 'admin', 'operations', 'finance'] },
        ],
    },
    {
        module: 'Settings & Pricing',
        permissions: [
            { key: 'view_settings', label: 'View fees and configuration', roles: ['super_admin', 'admin', 'finance'] },
            { key: 'manage_settings', label: 'Modify fees and system settings', roles: ['super_admin', 'admin', 'finance'] },
            { key: 'manage_zones', label: 'Manage shipping zones & rates', roles: ['super_admin', 'admin', 'finance'] },
        ],
    },
    {
        module: 'Admin Management',
        permissions: [
            { key: 'manage_admins', label: 'Create, edit, and delete admin accounts', roles: ['super_admin'] },
        ],
    },
];

const getDefaultPermissions = (roleId: string): Set<string> => {
    const set = new Set<string>();
    PERMISSION_GROUPS.forEach(g => g.permissions.forEach(p => {
        if (p.roles.includes(roleId)) set.add(p.key);
    }));
    return set;
};

export default function CreateAdminPage() {
    const router = useRouter();
    const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [selectedRole, setSelectedRole] = useState<string>('');
    const [permissions, setPermissions] = useState<Set<string>>(new Set());
    const [saving, setSaving] = useState(false);

    const selectRole = (roleId: string) => {
        setSelectedRole(roleId);
        setForm(f => ({ ...f, role: roleId }));
        setPermissions(getDefaultPermissions(roleId));
    };

    const togglePermission = (key: string) => {
        setPermissions(prev => {
            const next = new Set(prev);
            next.has(key) ? next.delete(key) : next.add(key);
            return next;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRole) { toast.error('Please select a role'); return; }
        if (!form.name || !form.email || !form.password) { toast.error('Name, email, and password are required'); return; }
        setSaving(true);
        try {
            await api.post('/admin/system/admins', { ...form, permissions: Array.from(permissions) });
            toast.success('Admin account created successfully');
            router.push('/settings');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to create admin');
        } finally { setSaving(false); }
    };

    const selectedRoleMeta = ROLES.find(r => r.id === selectedRole);

    return (
        <div style={{ padding: '2rem', maxWidth: 900, margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: '2rem' }}>
                <Link href="/settings" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.85rem', marginBottom: '1rem' }}>
                    <ArrowLeft size={15} /> Back to Settings
                </Link>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.25rem' }}>Create Admin Account</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Set up a new admin user and assign their role and permissions</p>
            </div>

            <form onSubmit={handleSubmit}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>

                    {/* LEFT – Account details & Permissions */}
                    <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div className="card">
                            <p style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '1.25rem' }}>Account Details</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label className="label">Full Name *</label>
                                    <input className="input" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Jane Doe" />
                                </div>
                                <div>
                                    <label className="label">Email Address *</label>
                                    <input className="input" type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="jane@company.com" />
                                </div>
                                <div>
                                    <label className="label">Phone Number</label>
                                    <input className="input" type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+254..." />
                                </div>
                                <div>
                                    <label className="label">Initial Password *</label>
                                    <div style={{ position: 'relative' }}>
                                        <input className="input" type={showPassword ? 'text' : 'password'} required minLength={6} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min. 6 characters" style={{ paddingRight: '2.5rem' }} />
                                        <button type="button" onClick={() => setShowPassword(s => !s)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Permissions Panel */}
                        {selectedRole && (
                            <div className="card">
                                <p style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.25rem' }}>Permissions</p>
                                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                                    Based on <strong style={{ color: selectedRoleMeta?.color }}>{selectedRoleMeta?.label}</strong>. You can adjust individual permissions.
                                </p>
                                {PERMISSION_GROUPS.map(group => (
                                    <div key={group.module} style={{ marginBottom: '1.1rem' }}>
                                        <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>{group.module}</p>
                                        {group.permissions.map(perm => (
                                            <label key={perm.key} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.35rem 0', cursor: 'pointer' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={permissions.has(perm.key)}
                                                    onChange={() => togglePermission(perm.key)}
                                                    style={{ accentColor: 'var(--accent)', width: 15, height: 15, flexShrink: 0 }}
                                                />
                                                <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{perm.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* RIGHT – Role selector */}
                    <div style={{ flex: '1 1 350px' }}>
                        <div className="card">
                            <p style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '1.25rem' }}>Select Role *</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {ROLES.map(role => {
                                    const Icon = role.icon;
                                    const active = selectedRole === role.id;
                                    return (
                                        <button
                                            key={role.id}
                                            type="button"
                                            onClick={() => selectRole(role.id)}
                                            style={{
                                                display: 'flex', alignItems: 'flex-start', gap: '0.875rem',
                                                padding: '0.875rem 1rem', borderRadius: 10, textAlign: 'left',
                                                background: active ? role.bg : 'var(--bg-secondary)',
                                                border: `1.5px solid ${active ? role.border : 'var(--border)'}`,
                                                cursor: 'pointer', transition: 'all 0.15s ease', width: '100%',
                                                outline: active ? `2px solid ${role.color}22` : 'none',
                                            }}
                                        >
                                            <div style={{ width: 36, height: 36, borderRadius: 8, background: role.bg, border: `1px solid ${role.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <Icon size={18} color={role.color} />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                    <p style={{ fontWeight: 700, fontSize: '0.875rem', color: active ? role.color : 'var(--text-primary)' }}>{role.label}</p>
                                                    {active && <Check size={15} color={role.color} />}
                                                </div>
                                                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem', lineHeight: 1.45 }}>{role.description}</p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Submit */}
                <div style={{ marginTop: '1.75rem', display: 'flex', gap: '0.875rem', justifyContent: 'flex-end' }}>
                    <Link href="/settings" className="btn btn-secondary">Cancel</Link>
                    <button type="submit" className="btn btn-primary" disabled={saving || !selectedRole} style={{ minWidth: 160 }}>
                        {saving ? <><div className="spinner" /> Creating…</> : <><Check size={15} /> Create Admin Account</>}
                    </button>
                </div>
            </form>
        </div>
    );
}
