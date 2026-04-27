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
            <div className="fade-in" style={{ padding: '2rem', maxWidth: 900, margin: '0 auto' }}>
                <header style={{ marginBottom: '2.5rem' }}>
                    <button 
                        onClick={() => setIsEditing(false)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', marginBottom: '1.25rem' }}
                    >
                        <ArrowLeft size={16} /> Back to Categories
                    </button>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', border: '1px solid var(--border)' }}>
                                {formData.icon}
                            </div>
                            <div>
                                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
                                    {formData.id ? 'Edit Category' : 'New Category'}
                                </h1>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>Configure technical parameters for this classification.</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button className="btn btn-secondary" onClick={() => setIsEditing(false)} style={{ height: 42, borderRadius: 12, fontWeight: 700 }}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleSubmit} disabled={processing} style={{ height: 42, borderRadius: 12, fontWeight: 800, padding: '0 1.5rem' }}>
                                {processing ? 'Saving...' : formData.id ? 'Save Changes' : 'Create Category'}
                            </button>
                        </div>
                    </div>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <div className="card" style={{ padding: '2rem', borderRadius: 24, border: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                <Fingerprint size={18} color="var(--accent)" />
                                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0 }}>Basic Identity</h3>
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                <div className="form-group">
                                    <label className="label-compact">Icon</label>
                                    <select className="input-compact" value={formData.icon} onChange={e => setFormData({ ...formData, icon: e.target.value })}>
                                        {ICONS.map(i => <option key={i} value={i}>{i}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="label-compact">Category Label</label>
                                    <input 
                                        type="text" 
                                        className="input-compact" 
                                        value={formData.name ?? ''}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g. Perishables"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="label-compact">Description</label>
                                <textarea 
                                    className="input-compact" 
                                    style={{ minHeight: 120, padding: '1rem', lineHeight: 1.6 }}
                                    value={formData.description ?? ''}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Enter operational details..."
                                />
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <div className="card" style={{ padding: '1.75rem', borderRadius: 24, border: '1px solid var(--border)' }}>
                            <h4 style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '1.25rem', letterSpacing: '0.05em' }}>Status & Protocol</h4>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <div 
                                    onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 16, cursor: 'pointer', border: '1px solid var(--border)' }}
                                >
                                    <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Publicly Active</span>
                                    <div style={{ width: 40, height: 22, borderRadius: 20, background: formData.is_active ? 'var(--accent)' : 'var(--border)', position: 'relative' }}>
                                        <div style={{ position: 'absolute', top: 3, left: formData.is_active ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: 'white' }} />
                                    </div>
                                </div>

                                <div 
                                    onClick={() => setFormData({ ...formData, requires_special_handling: !formData.requires_special_handling })}
                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 16, cursor: 'pointer', border: '1px solid var(--border)' }}
                                >
                                    <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Special Handling</span>
                                    <div style={{ width: 40, height: 22, borderRadius: 20, background: formData.requires_special_handling ? '#f59e0b' : 'var(--border)', position: 'relative' }}>
                                        <div style={{ position: 'absolute', top: 3, left: formData.requires_special_handling ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: 'white' }} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="card" style={{ padding: '1.5rem', borderRadius: 24, border: '1px solid var(--border)', background: 'rgba(59,130,246,0.03)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
                                <Info size={18} color="var(--accent)" />
                                <h4 style={{ fontSize: '0.85rem', fontWeight: 800, margin: 0 }}>Note</h4>
                            </div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, lineHeight: 1.5, margin: 0 }}>
                                Pricing and weight limits are now managed centrally in the **Locations & Routes** module.
                            </p>
                        </div>
                    </div>
                </div>
                
                <style jsx>{`
                    .label-compact { display: block; font-weight: 700; font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; margin-bottom: 0.5rem; }
                    .input-compact { width: 100%; height: 48px; padding: 0 1rem; background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 12px; outline: none; font-weight: 600; font-size: 0.95rem; }
                    .input-compact:focus { border-color: var(--accent); background: white; }
                `}</style>
            </div>
        );
    }

    return (
        <div className="fade-in" style={{ padding: '2rem', maxWidth: 1100, margin: '0 auto' }}>
            
            {/* Header Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>Product Categories</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Define cargo types and their specialized handling protocols.</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <div style={{ position: 'relative', width: 260 }}>
                        <Search size={18} style={{ position: 'absolute', left: 14, top: 11, color: 'var(--text-muted)' }} />
                        <input 
                            className="input" 
                            placeholder="Search..." 
                            style={{ paddingLeft: '2.75rem', height: 40, borderRadius: 10, border: '1px solid var(--border)', fontSize: '0.9rem' }}
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <button className="btn btn-primary" onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', height: 40, padding: '0 1.25rem', borderRadius: 10, fontWeight: 700 }}>
                        <Plus size={18} /> New Category
                    </button>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
                <div className="card" style={{ padding: '1.25rem', borderRadius: 20, display: 'flex', alignItems: 'center', gap: '1rem', border: '1px solid var(--border)' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(15,64,152,0.06)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Layers size={22} />
                    </div>
                    <div>
                        <p style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Total Types</p>
                        <p style={{ fontSize: '1.25rem', fontWeight: 800 }}>{categories.length}</p>
                    </div>
                </div>
                <div className="card" style={{ padding: '1.25rem', borderRadius: 20, display: 'flex', alignItems: 'center', gap: '1rem', border: '1px solid var(--border)' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(245,158,11,0.06)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <HardHat size={22} />
                    </div>
                    <div>
                        <p style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Special Handling</p>
                        <p style={{ fontSize: '1.25rem', fontWeight: 800 }}>{categories.filter(c => !!c.requires_special_handling).length}</p>
                    </div>
                </div>
                <div className="card" style={{ padding: '1.25rem', borderRadius: 20, display: 'flex', alignItems: 'center', gap: '1rem', border: '1px solid var(--border)' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(16,185,129,0.06)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ShieldCheck size={22} />
                    </div>
                    <div>
                        <p style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Active Protocols</p>
                        <p style={{ fontSize: '1.25rem', fontWeight: 800 }}>{categories.filter(c => !!c.is_active).length}</p>
                    </div>
                </div>
            </div>

            {/* Categories List (Table View) */}
            <div className="card" style={{ padding: 0, borderRadius: 20, overflow: 'hidden', border: '1px solid var(--border)' }}>
                <div style={{ padding: '1rem 1.5rem', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1.5fr 1fr auto', gap: '1rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Classification</span>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Protocols</span>
                    <span></span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {loading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5rem', gap: '1rem' }}>
                            <div className="spinner" />
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>Syncing categories...</p>
                        </div>
                    ) : filteredCategories.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '6rem' }}>
                            <Package size={40} style={{ color: 'var(--text-muted)', opacity: 0.2, marginBottom: '1.5rem' }} />
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.5rem' }}>No Categories Found</h3>
                            <button className="btn btn-primary" onClick={openAdd}>Add Category</button>
                        </div>
                    ) : filteredCategories.map((cat) => (
                        <div key={cat.id} className="table-row-hover" style={{ 
                            padding: '1rem 1.5rem', 
                            display: 'grid', 
                            gridTemplateColumns: '1.5fr 1fr auto', 
                            gap: '1rem', 
                            alignItems: 'center',
                            borderBottom: '1px solid var(--border)',
                            opacity: cat.is_active ? 1 : 0.6,
                            background: 'white',
                            transition: 'background 0.2s'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ 
                                    width: 40, height: 40, borderRadius: 10, 
                                    background: 'var(--bg-secondary)', 
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                    fontSize: '1.5rem', flexShrink: 0,
                                    border: '1px solid var(--border)'
                                }}>
                                    {cat.icon || '📦'}
                                </div>
                                <div style={{ minWidth: 0 }}>
                                    <h4 style={{ fontWeight: 700, fontSize: '0.95rem', margin: 0 }}>{cat.name}</h4>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {cat.description || 'Global classification.'}
                                    </p>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {!!cat.requires_special_handling && (
                                    <span style={{ padding: '0.25rem 0.6rem', borderRadius: 6, fontSize: '0.65rem', fontWeight: 800, background: 'rgba(245,158,11,0.08)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.1)' }}>SPECIAL</span>
                                )}
                                <span style={{ padding: '0.25rem 0.6rem', borderRadius: 6, fontSize: '0.65rem', fontWeight: 800, background: cat.is_active ? 'rgba(16,185,129,0.08)' : 'rgba(15,23,42,0.05)', color: cat.is_active ? '#10b981' : 'var(--text-muted)', border: '1px solid var(--border)' }}>
                                    {cat.is_active ? 'ACTIVE' : 'OFF'}
                                </span>
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button className="btn btn-secondary btn-sm" onClick={() => openEdit(cat)} style={{ width: 34, height: 34, padding: 0 }}>
                                    <PenLine size={16} />
                                </button>
                                <button className="btn btn-sm" onClick={() => setDeleteId(cat.id)} style={{ width: 34, height: 34, padding: 0, color: '#ef4444', border: '1px solid rgba(239,68,68,0.1)' }}>
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Delete Confirmation */}
            {deleteId && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
                    <div className="card fade-in" style={{ maxWidth: 360, width: '100%', textAlign: 'center', padding: '2rem', borderRadius: 24 }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>Delete Category?</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>This action cannot be undone.</p>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setDeleteId(null)}>Cancel</button>
                            <button className="btn" onClick={handleDelete} disabled={deleting}
                                style={{ flex: 1, background: '#ef4444', color: 'white', border: 'none', fontWeight: 800 }}>
                                {deleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            <style jsx global>{`
                .table-row-hover:hover { background-color: var(--bg-secondary) !important; }
            `}</style>
        </div>
    );
}
