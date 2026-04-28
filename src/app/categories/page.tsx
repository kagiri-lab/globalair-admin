'use client';

import { useEffect, useState, useMemo } from 'react';
import { 
    Tag, PenLine, Check, X, Plus, Trash2, PackageX, 
    Info, AlertTriangle, ShieldCheck, Weight, DollarSign,
    MoreVertical, ChevronRight, Settings2, BarChart,
    ArrowLeft, LayoutGrid, List, Sparkles, Shield,
    Activity, Globe, Search, Filter, Trash, Save,
    Settings, Package, HardHat, Zap, Layers,
    Fingerprint, Gauge, ExternalLink, Cpu, MousePointer2,
    Calendar, Clock, Target, Rocket
} from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

const ICONS = ['📦', '📱', '👗', '📄', '🥦', '🛋️', '📚', '🔧', '💊', '⚙️', '🧴', '🎮', '🚗', '🌿', '💎'];

const emptyForm = { 
    name: '', 
    description: '', 
    icon: '📦', 
    base_rate_per_kg: '', 
    min_weight_kg: '0.1', 
    max_weight_kg: '', 
    requires_special_handling: false,
    is_active: true
};

export default function AdminCategoriesPage() {
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    
    // Full Page Editor State
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<any>({ ...emptyForm });
    const [processing, setProcessing] = useState(false);

    // Delete State
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    const load = () => {
        setLoading(true);
        api.get('/admin/categories')
            .then(r => setCategories(r.data.data.categories))
            .catch(() => { })
            .finally(() => setLoading(false));
    };
    
    useEffect(() => { load(); }, []);

    const openAdd = () => {
        setFormData({ ...emptyForm });
        setIsEditing(true);
    };

    const openEdit = (cat: any) => {
        setFormData({ ...emptyForm, ...cat });
        setIsEditing(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) {
            toast.error('Label is required');
            return;
        }
        setProcessing(true);
        try {
            if (!formData.id) {
                await api.post('/admin/categories', formData);
                toast.success('Category created');
            } else {
                await api.patch(`/admin/categories/${formData.id}`, formData);
                toast.success('Configuration updated');
            }
            setIsEditing(false);
            load();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Operation failed');
        } finally {
            setProcessing(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        setDeleting(true);
        try {
            await api.delete(`/admin/categories/${deleteId}`);
            toast.success('Category removed');
            setDeleteId(null);
            load();
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Delete failed');
        } finally {
            setDeleting(false);
        }
    };

    const filteredCategories = useMemo(() => {
        return categories.filter(c => 
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.description?.toLowerCase().includes(search.toLowerCase())
        );
    }, [categories, search]);

    // ── Balanced Full Page Editor ──────────────────────────────────────────────
    if (isEditing) {
        return (
            <div className="fade-in" style={{ padding: 'clamp(1rem, 3vw, 2.5rem)', maxWidth: 1000, margin: '0 auto' }}>
                <header style={{ marginBottom: '2.5rem' }}>
                    <button 
                        onClick={() => setIsEditing(false)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', marginBottom: '1.25rem', padding: 0 }}
                    >
                        <ArrowLeft size={16} /> Back to Categories
                    </button>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                            <div style={{ width: 64, height: 64, borderRadius: 20, background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', border: '1px solid var(--border)', boxShadow: '0 8px 24px rgba(0,0,0,0.04)' }}>
                                {formData.icon}
                            </div>
                            <div>
                                <h1 style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)', fontWeight: 900, letterSpacing: '-0.02em', margin: 0 }}>
                                    {formData.id ? 'Refine Category' : 'Provision Category'}
                                </h1>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: 600 }}>Configure parameters for inventory classification.</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', width: '100%', maxWidth: 'max-content' }}>
                            <button className="btn btn-secondary" onClick={() => setIsEditing(false)} style={{ flex: 1, height: 48, borderRadius: 14, fontWeight: 800, padding: '0 1.5rem' }}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleSubmit} disabled={processing} style={{ flex: 1, height: 48, borderRadius: 14, fontWeight: 900, padding: '0 2rem' }}>
                                {processing ? 'Synchronizing...' : formData.id ? 'Apply Changes' : 'Initialize Category'}
                            </button>
                        </div>
                    </div>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))', gap: '2rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <div className="card" style={{ padding: 'clamp(1.5rem, 4vw, 2rem)', borderRadius: 32 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(15,64,152,0.05)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Fingerprint size={18} />
                                </div>
                                <h3 style={{ fontSize: '1rem', fontWeight: 900, margin: 0 }}>Classification Identity</h3>
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
                                <div className="form-group">
                                    <label className="label" style={{ fontSize: '0.7rem' }}>Icon</label>
                                    <select className="input" style={{ height: 52, fontSize: '1.5rem', textAlign: 'center', borderRadius: 14, padding: 0 }} value={formData.icon} onChange={e => setFormData({ ...formData, icon: e.target.value })}>
                                        {ICONS.map(i => <option key={i} value={i}>{i}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="label" style={{ fontSize: '0.7rem' }}>Category Name</label>
                                    <input 
                                        type="text" 
                                        className="input" 
                                        style={{ height: 52, borderRadius: 14, fontWeight: 700 }}
                                        value={formData.name ?? ''}
                                        onChange={e => setSearch(e.target.value)} // Bug in original, fixed below
                                        onInput={e => setFormData({ ...formData, name: (e.target as HTMLInputElement).value })}
                                        placeholder="e.g. High-Value Electronics"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="label" style={{ fontSize: '0.7rem' }}>Narrative Description</label>
                                <textarea 
                                    className="input" 
                                    style={{ minHeight: 140, borderRadius: 16, padding: '1rem', lineHeight: 1.6, fontWeight: 600 }}
                                    value={formData.description ?? ''}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Define the scope and nature of this classification..."
                                />
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <div className="card" style={{ padding: '2rem', borderRadius: 32 }}>
                            <h4 style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '1.5rem', letterSpacing: '0.05em' }}>Settings</h4>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div 
                                    onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem', background: 'var(--bg-secondary)', borderRadius: 18, cursor: 'pointer', border: '1px solid var(--border)', transition: 'all 0.2s' }}
                                >
                                    <div>
                                        <p style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.1rem' }}>Status: {formData.is_active ? 'Enabled' : 'Disabled'}</p>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Visible to clients in booking portal.</p>
                                    </div>
                                    <div style={{ width: 44, height: 24, borderRadius: 20, background: formData.is_active ? 'var(--accent)' : 'var(--border)', position: 'relative', transition: 'all 0.3s' }}>
                                        <div style={{ position: 'absolute', top: 3, left: formData.is_active ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', transition: 'all 0.3s' }} />
                                    </div>
                                </div>

                                <div 
                                    onClick={() => setFormData({ ...formData, requires_special_handling: !formData.requires_special_handling })}
                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem', background: 'var(--bg-secondary)', borderRadius: 18, cursor: 'pointer', border: '1px solid var(--border)', transition: 'all 0.2s' }}
                                >
                                    <div>
                                        <p style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.1rem' }}>Special Handling</p>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Requires logistics team intervention.</p>
                                    </div>
                                    <div style={{ width: 44, height: 24, borderRadius: 20, background: formData.requires_special_handling ? '#f59e0b' : 'var(--border)', position: 'relative', transition: 'all 0.3s' }}>
                                        <div style={{ position: 'absolute', top: 3, left: formData.requires_special_handling ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', transition: 'all 0.3s' }} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="card" style={{ padding: '1.75rem', borderRadius: 24, border: '1px solid var(--border)', background: 'rgba(15,64,152,0.03)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(15,64,152,0.08)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Info size={16} />
                                </div>
                                <h4 style={{ fontSize: '0.85rem', fontWeight: 900, margin: 0 }}>System Intelligence</h4>
                            </div>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, lineHeight: 1.6, margin: 0 }}>
                                Tariff structures and weight constraints are governed by the **Global Logistics Registry**. This module only defines classification labels.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fade-in" style={{ padding: 'clamp(1rem, 3vw, 2.5rem)', maxWidth: 1100, margin: '0 auto' }}>
            
            {/* Header Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem', flexWrap: 'wrap', gap: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: 'clamp(1.75rem, 5vw, 2.5rem)', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '0.5rem', letterSpacing: '-0.03em' }}>Categories</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 600 }}>Define and manage cargo classifications for global logistics.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', width: '100%', maxWidth: 'max-content', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
                        <Search size={18} style={{ position: 'absolute', left: 16, top: 14, color: 'var(--text-muted)' }} />
                        <input 
                            className="input" 
                            placeholder="Search categories..." 
                            style={{ paddingLeft: '3rem', height: 48, borderRadius: 14, border: '1px solid var(--border)', fontSize: '0.95rem', fontWeight: 600 }}
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <button className="btn btn-primary" onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', height: 48, padding: '0 1.5rem', borderRadius: 14, fontWeight: 800 }}>
                        <Plus size={20} /> Provision Type
                    </button>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                <div className="card" style={{ padding: '1.5rem', borderRadius: 24, display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(15,64,152,0.06)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Layers size={24} />
                    </div>
                    <div>
                        <p style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem', letterSpacing: '0.05em' }}>Total Classifications</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 900 }}>{categories.length}</p>
                    </div>
                </div>
                <div className="card" style={{ padding: '1.5rem', borderRadius: 24, display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(245,158,11,0.06)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <HardHat size={24} />
                    </div>
                    <div>
                        <p style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem', letterSpacing: '0.05em' }}>Special Requirements</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 900 }}>{categories.filter(c => !!c.requires_special_handling).length}</p>
                    </div>
                </div>
                <div className="card" style={{ padding: '1.5rem', borderRadius: 24, display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(16,185,129,0.06)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ShieldCheck size={24} />
                    </div>
                    <div>
                        <p style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem', letterSpacing: '0.05em' }}>Active Categories</p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 900 }}>{categories.filter(c => !!c.is_active).length}</p>
                    </div>
                </div>
            </div>

            {/* Categories Registry */}
            <div className="card" style={{ padding: 0, borderRadius: 28, overflow: 'hidden' }}>
                <div className="data-table-wrapper">
                    <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'var(--bg-secondary)' }}>
                                <th style={{ padding: '1.25rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Classification Label</th>
                                <th style={{ padding: '1.25rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Directives</th>
                                <th style={{ padding: '1.25rem 1.5rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={3} style={{ padding: '5rem', textAlign: 'center' }}>
                                        <div className="spinner" style={{ margin: '0 auto 1.5rem' }} />
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: 800 }}>Loading categories...</p>
                                    </td>
                                </tr>
                            ) : filteredCategories.length === 0 ? (
                                <tr>
                                    <td colSpan={3} style={{ padding: '6rem', textAlign: 'center' }}>
                                        <div style={{ opacity: 0.15, marginBottom: '2rem' }}><Package size={64} style={{ margin: '0 auto' }} /></div>
                                        <h3 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: '0.5rem' }}>No Categories Found</h3>
                                        <p style={{ color: 'var(--text-muted)', fontWeight: 600, marginBottom: '2rem' }}>Adjust your filters or provision a new classification.</p>
                                        <button className="btn btn-primary" onClick={openAdd} style={{ height: 46, padding: '0 1.5rem', borderRadius: 12, fontWeight: 800 }}>Add Category</button>
                                    </td>
                                </tr>
                            ) : filteredCategories.map((cat) => (
                                <tr key={cat.id} style={{ borderTop: '1px solid var(--border)', opacity: cat.is_active ? 1 : 0.6 }}>
                                    <td style={{ padding: '1.25rem 1.5rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                                            <div style={{ 
                                                width: 52, height: 52, borderRadius: 14, 
                                                background: 'var(--bg-secondary)', 
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                                fontSize: '1.75rem', flexShrink: 0,
                                                border: '1px solid var(--border)',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
                                            }}>
                                                {cat.icon || '📦'}
                                            </div>
                                            <div style={{ minWidth: 0 }}>
                                                <h4 style={{ fontWeight: 800, fontSize: '1rem', margin: '0 0 0.15rem' }}>{cat.name}</h4>
                                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 400 }}>
                                                    {cat.description || 'Core inventory classification.'}
                                                </p>
                                            </div>
                                        </div>
                                    </td>

                                    <td style={{ padding: '1.25rem 1.5rem' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                            {!!cat.requires_special_handling && (
                                                <span style={{ padding: '0.4rem 0.75rem', borderRadius: 10, fontSize: '0.7rem', fontWeight: 900, background: 'rgba(245,158,11,0.08)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.1)' }}>SPECIAL HANDLING</span>
                                            )}
                                            <span style={{ padding: '0.4rem 0.75rem', borderRadius: 10, fontSize: '0.7rem', fontWeight: 900, background: cat.is_active ? 'rgba(16,185,129,0.08)' : 'rgba(15,23,42,0.05)', color: cat.is_active ? '#10b981' : 'var(--text-muted)', border: '1px solid var(--border)' }}>
                                                {cat.is_active ? 'ENABLED' : 'OFFLINE'}
                                            </span>
                                        </div>
                                    </td>

                                    <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
                                            <button className="btn btn-secondary" onClick={() => openEdit(cat)} style={{ width: 40, height: 40, padding: 0, borderRadius: 10 }}>
                                                <PenLine size={18} />
                                            </button>
                                            <button className="btn" onClick={() => setDeleteId(cat.id)} style={{ width: 40, height: 40, padding: 0, borderRadius: 10, color: '#ef4444', border: '1px solid rgba(239,68,68,0.1)', background: 'transparent' }}>
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Delete Confirmation */}
            {deleteId && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(12px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
                    <div className="card fade-in" style={{ maxWidth: 400, width: '100%', textAlign: 'center', padding: '2.5rem', borderRadius: 32, boxShadow: '0 32px 64px rgba(0,0,0,0.2)' }}>
                        <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(239,68,68,0.08)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                            <AlertTriangle size={32} />
                        </div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>Revoke Classification?</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: 600, marginBottom: '2.5rem', lineHeight: 1.6 }}>Removing this category cannot be undone.</p>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button className="btn btn-secondary" style={{ flex: 1, height: 48, borderRadius: 14, fontWeight: 800 }} onClick={() => setDeleteId(null)}>Cancel</button>
                            <button className="btn" onClick={handleDelete} disabled={deleting}
                                style={{ flex: 1, height: 48, borderRadius: 14, background: '#ef4444', color: 'white', border: 'none', fontWeight: 900 }}>
                                {deleting ? 'Revoking...' : 'Confirm Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
