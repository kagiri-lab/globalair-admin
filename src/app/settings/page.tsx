'use client';

import { useState, useEffect, useCallback } from 'react';
import { Settings2, Globe, Building2, Users, MapPin, Save, Plus, Trash2, PenLine, X, Check, SlidersHorizontal, Sparkles, DollarSign } from 'lucide-react';
import { useAdminAuth } from '@/lib/auth';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';

const TIERS = ['domestic', 'regional', 'international'];
const GROUP_ICONS: Record<string, React.ReactNode> = {
    fees: <DollarSign size={16} />,
    delivery: <Globe size={16} />,
    general: <Building2 size={16} />,
    locations: <MapPin size={16} />,
    google_maps: <Globe size={16} />,
};

interface Zone {
    id: string;
    zone_name: string;
    origin_country?: string | null;
    destination_country?: string | null;
    [key: string]: any;
}

function SettingInput({ item, onChange }: { item: any; onChange: (key: string, val: string) => void }) {
    if (item.type === 'boolean') {
        return (
            <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--bg-secondary)', padding: '0.25rem', borderRadius: 10, border: '1px solid var(--border)' }}>
                <button onClick={() => onChange(item.key, 'true')} style={{ border: 'none', padding: '0.4rem 0.8rem', fontSize: '0.7rem', fontWeight: 800, borderRadius: 8, background: item.value === 'true' ? 'var(--accent)' : 'transparent', color: item.value === 'true' ? 'white' : 'var(--text-muted)', cursor: 'pointer' }}>ON</button>
                <button onClick={() => onChange(item.key, 'false')} style={{ border: 'none', padding: '0.4rem 0.8rem', fontSize: '0.7rem', fontWeight: 800, borderRadius: 8, background: item.value === 'false' ? 'var(--accent)' : 'transparent', color: item.value === 'false' ? 'white' : 'var(--text-muted)', cursor: 'pointer' }}>OFF</button>
            </div>
        );
    }
    return (
        <input className="input" style={{ width: '100%', minWidth: 'clamp(100px, 20vw, 300px)', height: 42, borderRadius: 10, fontWeight: 800, textAlign: item.type === 'number' ? 'right' : 'left' }} type={item.type === 'number' ? 'number' : 'text'} step={item.type === 'number' ? 'any' : undefined} value={item.value} onChange={e => onChange(item.key, e.target.value)} />
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

    const currentGroupSettings = (group: string) =>
        (settings[group] || []).map(s => ({ ...s, value: settingsDirty[s.key] ?? s.value }));

    return (
        <div className="fade-in" style={{ padding: 'clamp(1rem, 3vw, 2.5rem)', maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ marginBottom: '3rem' }}>
                <h1 style={{ fontSize: 'clamp(1.75rem, 5vw, 2.5rem)', fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Configuration Engine</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 600 }}>Manage global variables, operational logic, and platform identity.</p>
            </div>

            <div className="data-table-wrapper" style={{ marginBottom: '3rem', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', gap: '0.5rem', minWidth: 'max-content' }}>
                    {[
                        { id: 'fees', label: 'Platform Logic', icon: <Settings2 size={18} />, perm: 'view_settings' },
                        { id: 'landing', label: 'Brand Identity', icon: <Sparkles size={18} />, perm: 'view_settings' },
                        { id: 'admins', label: 'Access Control', icon: <Users size={18} />, perm: 'manage_admins' },
                    ].filter(t => hasPermission(t.perm)).map(({ id, label, icon }) => (
                        <button key={id} onClick={() => setActiveTab(id as any)}
                            style={{ 
                                border: 'none',
                                background: 'none',
                                padding: '1rem 1.5rem',
                                fontSize: '0.9rem',
                                fontWeight: 800,
                                color: activeTab === id ? 'var(--accent)' : 'var(--text-muted)',
                                borderBottom: activeTab === id ? '3px solid var(--accent)' : '3px solid transparent',
                                transition: 'all 0.2s',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                marginBottom: '-1px'
                            }}>
                            {icon} {label}
                        </button>
                    ))}
                </div>
            </div>

            {activeTab === 'fees' && (
                <div className="fade-in">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '2rem' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', background: 'var(--bg-secondary)', padding: '0.4rem', borderRadius: 16, border: '1px solid var(--border)' }}>
                            {[
                                { id: 'general', label: 'Core', icon: <Building2 size={16} /> },
                                { id: 'google_maps', label: 'Geospatial', icon: <Globe size={16} /> },
                            ].map(t => (
                                <button key={t.id} onClick={() => setActiveFeeTab(t.id as any)}
                                    style={{ 
                                        padding: '0.75rem 1.5rem', 
                                        fontSize: '0.8rem', 
                                        fontWeight: 800,
                                        background: activeFeeTab === t.id ? 'white' : 'transparent',
                                        color: activeFeeTab === t.id ? 'var(--accent)' : 'var(--text-muted)',
                                        boxShadow: activeFeeTab === t.id ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
                                        borderRadius: 12,
                                        border: 'none',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.6rem',
                                        transition: 'all 0.2s'
                                    }}>
                                    {t.icon} {t.label}
                                </button>
                            ))}
                        </div>

                        <button className="btn btn-primary" onClick={saveSettings} disabled={savingSettings || !Object.keys(settingsDirty).length} style={{ height: 52, padding: '0 2rem', borderRadius: 16, fontWeight: 900, boxShadow: '0 12px 24px rgba(15,64,152,0.15)' }}>
                            <Save size={18} />
                            <span>{savingSettings ? 'Synchronizing...' : 'Save Configuration'}</span>
                            {Object.keys(settingsDirty).length > 0 && <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 10, padding: '0.2rem 0.6rem', fontSize: '0.75rem', marginLeft: '0.75rem' }}>{Object.keys(settingsDirty).length}</span>}
                        </button>
                    </div>

                    <div className="card" style={{ padding: 'clamp(1.5rem, 4vw, 3rem)', borderRadius: 32, background: '#fff', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
                            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(15,64,152,0.06)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {GROUP_ICONS[activeFeeTab]}
                            </div>
                            <div>
                                <h3 style={{ fontWeight: 900, fontSize: '1.25rem', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                                    {activeFeeTab === 'google_maps' ? 'Geospatial Intelligence' : 'Core Platform Logic'}
                                </h3>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>Manage critical variables for the {activeFeeTab.replace('_', ' ')} sector.</p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {currentGroupSettings(activeFeeTab).map((s, i) => (
                                <div key={s.key} className="fade-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', padding: '2rem 0', borderBottom: i < currentGroupSettings(activeFeeTab).length - 1 ? '1px solid var(--border)' : 'none', flexWrap: 'wrap', gap: '1.5rem' }}>
                                    <div style={{ flex: 1, minWidth: 'min(100%, 400px)' }}>
                                        <p style={{ fontWeight: 900, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{s.label}</p>
                                        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6, fontWeight: 600 }}>{s.description || 'System variable governing platform operations.'}</p>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.75rem', width: '100%', maxWidth: 'max-content' }}>
                                        <SettingInput item={s} onChange={onSettingChange} />
                                        {settingsDirty[s.key] !== undefined && settingsDirty[s.key] !== s.value && (
                                            <span style={{ fontSize: '0.7rem', background: 'rgba(245,158,11,0.1)', color: '#b45309', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, padding: '0.3rem 0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Modified State</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {currentGroupSettings(activeFeeTab).length === 0 && (
                                <div style={{ padding: '6rem 0', textAlign: 'center', opacity: 0.2 }}>
                                    <SlidersHorizontal size={64} style={{ marginBottom: '1.5rem', margin: '0 auto' }} />
                                    <p style={{ fontWeight: 900, fontSize: '1.1rem' }}>No variables detected in this sector.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'admins' && hasPermission('manage_admins') && (
                <div className="fade-in">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '2rem' }}>
                        <div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Access Control List</h2>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: 600 }}>Managing <span style={{ color: 'var(--accent)', fontWeight: 900 }}>{admins.length}</span> verified administrative principals.</p>
                        </div>
                        <Link href="/settings/admins/new">
                            <button className="btn btn-primary" style={{ height: 48, padding: '0 2rem', borderRadius: 14, fontWeight: 900, boxShadow: '0 12px 24px rgba(15,64,152,0.15)' }}>
                                <Plus size={20} /> Provision Admin
                            </button>
                        </Link>
                    </div>

                    <div className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: 32, border: '1px solid var(--border)', background: '#fff' }}>
                        <div className="data-table-wrapper">
                            <table className="data-table">
                                <thead>
                                    <tr style={{ background: 'var(--bg-secondary)' }}>
                                        <th style={{ padding: '1.25rem 2rem', fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Security Principal</th>
                                        <th className="desktop-only" style={{ padding: '1.25rem 2rem', fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Contact Vector</th>
                                        <th style={{ padding: '1.25rem 2rem', fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Status</th>
                                        <th style={{ padding: '1.25rem 2rem', fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Authority</th>
                                        <th style={{ padding: '1.25rem 2rem', fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {adminsLoading ? (
                                        <tr><td colSpan={5} style={{ padding: '6rem 0' }}><div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}><div className="spinner" /><p style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-muted)' }}>Syncing Principals...</p></div></td></tr>
                                    ) : admins.length === 0 ? (
                                        <tr><td colSpan={5} style={{ padding: '6rem 0', textAlign: 'center' }}><div style={{ opacity: 0.1, marginBottom: '1.5rem' }}><Users size={64} style={{ margin: '0 auto' }} /></div><p style={{ fontWeight: 800, color: 'var(--text-muted)' }}>No administrative principals found.</p></td></tr>
                                    ) : (
                                        admins.map((admin) => (
                                            <tr key={admin.id} style={{ borderTop: '1px solid var(--border)', transition: 'background 0.2s' }}>
                                                <td style={{ padding: '1.25rem 2rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--bg-secondary)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <Users size={20} />
                                                        </div>
                                                        <div>
                                                            <p style={{ fontWeight: 900, fontSize: '0.95rem', color: 'var(--text-primary)', margin: 0 }}>{admin.name}</p>
                                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, margin: 0 }}>{admin.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="desktop-only" style={{ padding: '1.25rem 2rem' }}>
                                                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 700 }}>{admin.phone || 'N/A'}</span>
                                                </td>
                                                <td style={{ padding: '1.25rem 2rem' }}>
                                                    <span className={`badge badge-${admin.is_active ? 'delivered' : 'cancelled'}`} style={{ fontSize: '0.7rem', fontWeight: 900, padding: '0.4rem 0.8rem', borderRadius: 10 }}>
                                                        {admin.is_active ? 'ACTIVE' : 'LOCKED'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '1.25rem 2rem' }}>
                                                    <span style={{ fontSize: '0.75rem', fontWeight: 900, color: admin.role === 'super_admin' ? 'var(--danger)' : 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                        {admin.role.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: 'right', padding: '1.25rem 2rem' }}>
                                                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                                                        <Link href={`/settings/admins/${admin.id}`}>
                                                            <button className="btn btn-secondary" style={{ width: 40, height: 40, padding: 0, borderRadius: 12 }}>
                                                                <PenLine size={16} />
                                                            </button>
                                                        </Link>
                                                        {admin.id !== user?.id && user?.role === 'super_admin' && (
                                                            <button className="btn btn-danger" onClick={() => handleAdminDelete(admin.id)} style={{ width: 40, height: 40, padding: 0, borderRadius: 12 }}>
                                                                <Trash2 size={16} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'landing' && (
                <div className="fade-in">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem', flexWrap: 'wrap', gap: '2rem' }}>
                        <div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Brand Narrative</h2>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: 600 }}>Synchronize public communication across global sectors.</p>
                        </div>
                        <button className="btn btn-primary" onClick={() => handleSaveLandingSection('landing_how_it_works')} disabled={savingLanding} style={{ height: 48, padding: '0 2rem', borderRadius: 14, fontWeight: 900, boxShadow: '0 12px 24px rgba(15,64,152,0.15)' }}>
                            <Save size={18} />
                            <span>{savingLanding ? 'Syncing...' : 'Synchronize Narrative'}</span>
                        </button>
                    </div>

                    {landingLoading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '6rem 0' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: '2rem' }}>
                            {(landingContent?.landing_how_it_works || []).map((item: any, idx: number) => (
                                <div key={item.id} className="card fade-in" style={{ padding: '2rem', borderRadius: 28, border: '1px solid var(--border)', background: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                                    <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem', alignItems: 'center' }}>
                                        <div style={{ position: 'relative' }}>
                                            <label className="label" style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Icon</label>
                                            <input className="input" style={{ width: 64, height: 64, textAlign: 'center', fontSize: '1.75rem', borderRadius: 18, background: 'var(--bg-secondary)', border: 'none', padding: 0 }} value={item.icon || item.emoji} onChange={e => updateLandingItem('landing_how_it_works', item.id, 'icon', e.target.value)} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <label className="label" style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Step {idx + 1} Protocol</label>
                                            <input className="input" style={{ fontWeight: 900, height: 48, borderRadius: 14, background: 'var(--bg-secondary)', border: 'none', padding: '0 1.25rem' }} value={item.title} onChange={e => updateLandingItem('landing_how_it_works', item.id, 'title', e.target.value)} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="label" style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}>Explanation Matrix</label>
                                        <textarea className="input" style={{ minHeight: 120, fontSize: '0.95rem', borderRadius: 14, background: 'var(--bg-secondary)', border: 'none', padding: '1.25rem', lineHeight: 1.6, fontWeight: 600, resize: 'none' }} value={item.description} onChange={e => updateLandingItem('landing_how_it_works', item.id, 'description', e.target.value)} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
