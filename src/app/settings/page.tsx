'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Save, Plus, Trash2, PenLine, X, Check, Globe, DollarSign, SlidersHorizontal, Building2, Users, MapPin } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

import { useAdminAuth } from '@/lib/auth';
import { Zone } from '@/lib/types';

const TIERS = ['domestic', 'regional', 'international'];
const GROUP_ICONS: Record<string, React.ReactNode> = {
    fees: <DollarSign size={16} />,
    delivery: <Globe size={16} />,
    general: <Building2 size={16} />,
    locations: <MapPin size={16} />,
    google_maps: <Globe size={16} />,
};

function SettingInput({ item, onChange }: { item: any; onChange: (key: string, val: string) => void }) {
    if (item.type === 'boolean') {
        return (
            <select className="input" style={{ maxWidth: 120 }} value={item.value} onChange={e => onChange(item.key, e.target.value)}>
                <option value="true">Enabled</option>
                <option value="false">Disabled</option>
            </select>
        );
    }
    return (
        <input className="input" style={{ maxWidth: 480 }} type={item.type === 'number' ? 'number' : 'text'} step={item.type === 'number' ? 'any' : undefined} value={item.value} onChange={e => onChange(item.key, e.target.value)} />
    );
}


export default function AdminSettingsPage() {
    const [settings, setSettings] = useState<Record<string, any[]>>({});
    const [settingsDirty, setSettingsDirty] = useState<Record<string, string>>({});
    const [savingSettings, setSavingSettings] = useState(false);
    const [zones, setZones] = useState<Zone[]>([]);
    const [zonesLoading, setZonesLoading] = useState(true);
    const [editZone, setEditZone] = useState<Partial<Zone> | null>(null);
    const [savingZone, setSavingZone] = useState(false);
    const [activeTab, setActiveTab] = useState<'fees' | 'plans' | 'admins' | 'landing'>('fees');
    const [activeFeeTab, setActiveFeeTab] = useState<'general' | 'fees' | 'google_maps'>('general');

    const [plans, setPlans] = useState<any[]>([]);
    const [plansLoading, setPlansLoading] = useState(false);
    const [editPlan, setEditPlan] = useState<any>(null);

    const [admins, setAdmins] = useState<any[]>([]);
    const [adminsLoading, setAdminsLoading] = useState(false);
    
    const [landingContent, setLandingContent] = useState<any>(null);
    const [landingLoading, setLandingLoading] = useState(false);
    const [savingLanding, setSavingLanding] = useState(false);
    
    const { user, hasPermission } = useAdminAuth();

    const loadAdmins = useCallback(async () => {
        if (!['super_admin', 'admin'].includes(user?.role as any)) return;
        setAdminsLoading(true);
        try {
            const res = await api.get('/admin/system/admins');
            setAdmins(res.data.data);
        } catch (e) {
            console.error(e);
        } finally {
            setAdminsLoading(false);
        }
    }, [user]);

    const loadLandingContent = useCallback(async () => {
        setLandingLoading(true);
        try {
            const res = await api.get('/admin/landing/content');
            setLandingContent(res.data.data);
        } catch {
            toast.error('Failed to load landing content');
        } finally {
            setLandingLoading(false);
        }
    }, []);

    const loadAll = useCallback(() => {
        api.get('/admin/settings').then(r => setSettings(r.data.data.settings)).catch(() => { });
        api.get('/admin/zones').then(r => setZones(r.data.data.zones)).catch(() => { }).finally(() => setZonesLoading(false));
        api.get('/admin/logistics/plans').then(r => setPlans(r.data.data)).catch(() => { });
        if (['super_admin', 'admin'].includes(user?.role as any)) loadAdmins();
        loadLandingContent();
    }, [user, loadAdmins, loadLandingContent]);

    useEffect(() => { loadAll(); }, [loadAll]);

    const onSettingChange = (key: string, val: string) => setSettingsDirty(d => ({ ...d, [key]: val }));

    const saveSettings = async () => {
        if (!Object.keys(settingsDirty).length) { toast('No changes to save'); return; }
        setSavingSettings(true);
        try {
            await api.put('/admin/settings', { updates: settingsDirty });
            toast.success(`${Object.keys(settingsDirty).length} settings saved`);
            setSettingsDirty({});
            loadAll();
        } catch { toast.error('Failed to save settings'); } finally { setSavingSettings(false); }
    };

    const handleZoneSave = async () => {
        if (!editZone?.zone_name) { toast.error('Zone name required'); return; }
        setSavingZone(true);
        try {
            const payload = { ...editZone, origin_country: editZone.origin_country || null, destination_country: editZone.destination_country || null };
            if (editZone.id) {
                await api.patch(`/admin/zones/${editZone.id}`, payload);
                toast.success('Zone updated');
            } else {
                await api.post('/admin/zones', payload);
                toast.success('Zone created');
            }
            setEditZone(null);
            loadAll();
        } catch (e: any) { toast.error(e.response?.data?.message || 'Save failed'); } finally { setSavingZone(false); }
    };

    const handleZoneDelete = async (id: number) => {
        if (!confirm('Delete this zone?')) return;
        try {
            await api.delete(`/admin/zones/${id}`);
            toast.success('Zone deleted');
            loadAll();
        } catch (e: any) { toast.error(e.response?.data?.message || 'Delete failed'); }
    };


    const handleAdminDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this admin account?')) return;
        try {
            await api.delete(`/admin/system/admins/${id}`);
            toast.success('Admin deleted');
            loadAdmins();
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Failed to delete admin');
        }
    };

    const handleSaveLandingSection = async (key: string) => {
        setSavingLanding(true);
        try {
            await api.patch('/admin/landing/content', { key, content: landingContent[key] });
            toast.success('Section updated');
        } catch {
            toast.error('Failed to save section');
        } finally {
            setSavingLanding(false);
        }
    };

    const updateLandingItem = (key: string, id: number, field: string, value: any) => {
        setLandingContent((prev: any) => ({
            ...prev,
            [key]: prev[key].map((item: any) => item.id === id ? { ...item, [field]: value } : item)
        }));
    };

    const tierColor: Record<string, string> = { domestic: '#10b981', regional: '#f59e0b', international: '#8b5cf6' };

    const currentGroupSettings = (group: string) =>
        (settings[group] || []).map(s => ({ ...s, value: settingsDirty[s.key] ?? s.value }));

    return (
        <div style={{ padding: '2rem', maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.25rem' }}>Settings & Configuration</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Manage shipping fees, rates, zone pricing, and platform settings</p>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '0' }}>
                {[
                    { id: 'fees', label: '⚙️ Platform Settings', icon: <Building2 size={15} />, perm: 'view_settings' },
                    { id: 'landing', label: '🌐 Landing Page', icon: <Globe size={15} />, perm: 'view_settings' },
                    { id: 'admins', label: '🛡️ Admins & Roles', icon: <Users size={15} />, perm: 'manage_admins' },
                ].filter(t => hasPermission(t.perm)).map(({ id, label }) => (
                    <button key={id} onClick={() => setActiveTab(id as any)} className="btn btn-sm"
                        style={{ borderRadius: '8px 8px 0 0', marginBottom: -1, borderBottom: activeTab === id ? '2px solid var(--accent)' : '2px solid transparent', background: 'transparent', color: activeTab === id ? 'var(--accent)' : 'var(--text-muted)', fontWeight: activeTab === id ? 700 : 500, padding: '0.6rem 1.25rem' }}>
                        {label}
                    </button>
                ))}
            </div>

            {/* ── Fee Configuration ─── */}
            {activeTab === 'fees' && (
                <div className="fade-in">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>

                        {/* Sub-tabs for Fee Configuration */}
                        <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--bg-secondary)', padding: '0.25rem', borderRadius: '8px' }}>
                            {[
                                { id: 'general', label: 'General', icon: <Building2 size={13} /> },
                                { id: 'google_maps', label: 'Google Config', icon: <Globe size={13} /> },
                            ].map(t => (
                                <button key={t.id} onClick={() => setActiveFeeTab(t.id as any)} className="btn btn-sm"
                                    style={{ 
                                        padding: '0.5rem 0.85rem', fontSize: '0.75rem', fontWeight: activeFeeTab === t.id ? 800 : 500,
                                        background: activeFeeTab === t.id ? 'white' : 'transparent',
                                        color: activeFeeTab === t.id ? 'var(--accent)' : 'var(--text-muted)',
                                        boxShadow: activeFeeTab === t.id ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                                        borderRadius: 6, display: 'flex', alignItems: 'center', gap: '0.4rem'
                                    }}>
                                    {t.icon} {t.label}
                                </button>
                            ))}
                        </div>

                        <button className="btn btn-primary" onClick={saveSettings} disabled={savingSettings || !Object.keys(settingsDirty).length}>
                            {savingSettings ? <><div className="spinner" /> Saving…</> : <><Save size={15} /> Save All Changes</>}
                            {Object.keys(settingsDirty).length > 0 && <span style={{ background: 'rgba(255,255,255,0.25)', borderRadius: 100, padding: '0.1rem 0.45rem', fontSize: '0.72rem', marginLeft: '0.25rem' }}>{Object.keys(settingsDirty).length}</span>}
                        </button>
                    </div>

                    <div className="card" style={{ marginBottom: '1.25rem', minHeight: 400 }}>
                        <h3 style={{ fontWeight: 700, marginBottom: '1.5rem', fontSize: '0.9rem', textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent)' }}>
                            {GROUP_ICONS[activeFeeTab]} {activeFeeTab === 'google_maps' ? 'Google Maps' : activeFeeTab.charAt(0).toUpperCase() + activeFeeTab.slice(1)} Settings
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                            {currentGroupSettings(activeFeeTab).map((s, i) => (
                                <div key={s.key} className="fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 0.7fr 1.5fr', gap: '1rem', alignItems: 'center', padding: '0.875rem 0', borderBottom: i < currentGroupSettings(activeFeeTab).length - 1 ? '1px solid var(--border)' : 'none' }}>
                                    <div>
                                        <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{s.label}</p>
                                        {s.description && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{s.description}</p>}
                                    </div>
                                    <SettingInput item={s} onChange={onSettingChange} />
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        {settingsDirty[s.key] !== undefined && settingsDirty[s.key] !== s.value && (
                                            <span style={{ fontSize: '0.7rem', background: 'rgba(245,158,11,0.15)', color: '#f59e0b', borderRadius: 100, padding: '0.15rem 0.5rem', fontWeight: 600 }}>Unsaved</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {currentGroupSettings(activeFeeTab).length === 0 && (
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', padding: '2rem 0', textAlign: 'center' }}>No settings found in this category.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}


            {/* ── Admins & Roles ─── */}
            {activeTab === 'admins' && hasPermission('manage_admins') && (
                <div className="fade-in">
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.25rem' }}>
                        <Link href="/settings/admins/new" className="btn btn-primary">
                            <Plus size={15} /> Create Admin
                        </Link>
                    </div>

                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        {adminsLoading ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="spinner" /></div>
                        ) : admins.length === 0 ? (
                            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No admin accounts found</div>
                        ) : (
                            <>
                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1.5fr 1.2fr 1fr auto', gap: '0.5rem', padding: '0.6rem 1rem', borderBottom: '1px solid var(--border)', fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    <span>Admin</span><span>Email</span><span>Phone</span><span>Status</span><span>Role</span><span></span>
                                </div>
                                {admins.map((admin) => (
                                    <div key={admin.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1.5fr 1.2fr 1fr auto', gap: '0.5rem', padding: '0.875rem 1rem', alignItems: 'center' }}>
                                            <div>
                                                <p style={{ fontWeight: 600, fontSize: '0.8125rem' }}>{admin.name} {admin.id === user?.id && <span style={{ fontSize: '0.65rem', background: 'var(--accent)', color: 'white', padding: '0.1rem 0.3rem', borderRadius: 4, marginLeft: '0.2rem' }}>YOU</span>}</p>
                                            </div>
                                            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{admin.email}</span>
                                            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{admin.phone || '—'}</span>
                                            <div style={{ display: 'flex' }}>
                                                <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: 100, background: admin.is_active ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: admin.is_active ? '#10b981' : '#ef4444' }}>
                                                    {admin.is_active ? 'Active' : 'Disabled'}
                                                </span>
                                            </div>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: admin.role === 'super_admin' ? '#ef4444' : 'var(--accent)', textTransform: 'uppercase' }}>
                                                {admin.role.replace('_', ' ')}
                                            </span>
                                            <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                                                <Link href={`/settings/admins/${admin.id}`} className="btn btn-sm btn-secondary" title="Edit"><PenLine size={13} /></Link>
                                                {admin.id !== user?.id && user?.role === 'super_admin' && (
                                                    <button className="btn btn-sm btn-danger" onClick={() => handleAdminDelete(admin.id)} title="Delete"><Trash2 size={13} /></button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* ── Operational Plans ─── */}
            {activeTab === 'plans' && (
                <div className="fade-in">
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.25rem' }}>
                        <button className="btn btn-primary" onClick={() => setEditPlan({ name: '', description: '', type: 'delivery', config: {} })}>
                            <Plus size={15} /> Create Plan
                        </button>
                    </div>

                    {editPlan && (
                        <div className="card" style={{ marginBottom: '1.5rem', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                                <h3 style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--accent)' }}>{editPlan.id ? 'Edit Plan' : 'New Operational Plan'}</h3>
                                <button onClick={() => setEditPlan(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label className="label">Plan Name *</label>
                                    <input className="input" value={editPlan.name} onChange={e => setEditPlan({ ...editPlan, name: e.target.value })} />
                                </div>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label className="label">Description</label>
                                    <textarea className="input" style={{ minHeight: 60 }} value={editPlan.description} onChange={e => setEditPlan({ ...editPlan, description: e.target.value })} />
                                </div>
                                <div>
                                    <label className="label">Plan Category</label>
                                    <select className="input" value={editPlan.type} onChange={e => setEditPlan({ ...editPlan, type: e.target.value })}>
                                        <option value="delivery">Last-mile Delivery</option>
                                        <option value="maintenance">Fleet Maintenance</option>
                                        <option value="insurance">Asset Insurance</option>
                                        <option value="other">Other Operational</option>
                                    </select>
                                </div>
                                <div style={{ gridColumn: 'span 2', display: 'flex', gap: '0.75rem' }}>
                                    <button className="btn btn-primary" onClick={async () => {
                                        if (editPlan.id) await api.patch(`/admin/logistics/plans/${editPlan.id}`, editPlan);
                                        else await api.post('/admin/logistics/plans', editPlan);
                                        toast.success('Plan saved');
                                        setEditPlan(null);
                                        loadAll();
                                    }}>Save Plan</button>
                                    <button className="btn btn-secondary" onClick={() => setEditPlan(null)}>Cancel</button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '0.5rem', padding: '0.6rem 1rem', borderBottom: '1px solid var(--border)', fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            <span>Plan Details</span><span>Category</span><span>Status</span><span>Created</span><span></span>
                        </div>
                        {plans.map(plan => (
                            <div key={plan.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '0.5rem', padding: '1rem', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
                                <div>
                                    <p style={{ fontWeight: 700, fontSize: '0.85rem' }}>{plan.name}</p>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{plan.description}</p>
                                </div>
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent)' }}>{plan.type}</span>
                                <div>
                                    <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: 100, background: plan.is_active ? 'rgba(16,185,129,0.1)' : 'rgba(100,116,139,0.1)', color: plan.is_active ? '#10b981' : '#64748b' }}>
                                        {plan.is_active ? 'Active' : 'Archived'}
                                    </span>
                                </div>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(plan.created_at).toLocaleDateString()}</span>
                                <button className="btn btn-sm btn-secondary" onClick={() => setEditPlan(plan)}><PenLine size={13} /></button>
                            </div>
                        ))}
                        {plans.length === 0 && <p style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No plans defined yet.</p>}
                    </div>
                </div>
            )}

            {/* ── Landing Page Content ─── */}
            {activeTab === 'landing' && (
                <div className="fade-in">
                    <div style={{ marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Landing Page Configuration</h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Customize the "How It Works" section on the public portal</p>
                    </div>

                    {landingLoading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><div className="spinner" /></div>
                    ) : !landingContent ? (
                        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>Failed to load content</div>
                    ) : (
                        <div className="card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                <div>
                                    <h3 style={{ fontWeight: 800, fontSize: '1rem' }}>"How It Works" Steps</h3>
                                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>These steps appear on the landing page</p>
                                </div>
                                <button className="btn btn-primary" onClick={() => handleSaveLandingSection('landing_how_it_works')} disabled={savingLanding}>
                                    {savingLanding ? <div className="spinner" /> : <><Save size={14} /> Save Section</>}
                                </button>
                            </div>

                            <div style={{ display: 'grid', gap: '1.25rem' }}>
                                {(landingContent.landing_how_it_works || []).map((item: any) => (
                                    <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 2fr', gap: '1.5rem', alignItems: 'start', padding: '1.5rem', background: 'var(--bg-secondary)', borderRadius: 12, border: '1px solid var(--border)' }}>
                                        <div className="form-group">
                                            <label className="label" style={{ fontSize: '0.7rem' }}>Icon/Emoji</label>
                                            <input className="input" style={{ textAlign: 'center', fontSize: '1.25rem' }} value={item.icon || item.emoji} onChange={e => updateLandingItem('landing_how_it_works', item.id, 'icon', e.target.value)} />
                                        </div>
                                        <div className="form-group">
                                            <label className="label" style={{ fontSize: '0.7rem' }}>Step Title</label>
                                            <input className="input" style={{ fontWeight: 600 }} value={item.title} onChange={e => updateLandingItem('landing_how_it_works', item.id, 'title', e.target.value)} />
                                        </div>
                                        <div className="form-group">
                                            <label className="label" style={{ fontSize: '0.7rem' }}>Description</label>
                                            <textarea className="input" style={{ minHeight: 60, fontSize: '0.875rem' }} value={item.description} onChange={e => updateLandingItem('landing_how_it_works', item.id, 'description', e.target.value)} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
