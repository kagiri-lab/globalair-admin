'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, MapPin, Package, RefreshCw, User, Calendar, DollarSign, Zap, ArrowRight } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import ShipmentMap from '@/components/ShipmentMap';

const STATUS_OPTIONS = ['confirmed', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'cancelled', 'failed'];

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

const TYPE_CONFIG: Record<string, { emoji: string; color: string; bg: string }> = {
    standard: { emoji: '📦', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
    express: { emoji: '⚡', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
    overnight: { emoji: '🚀', color: '#ec4899', bg: 'rgba(236,72,153,0.1)' },
};

function StatusBadge({ status }: { status: string }) {
    const cfg = STATUS_CONFIG[status] || { color: '#6b7280', bg: 'rgba(107,114,128,0.12)', label: status };
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
            fontSize: '0.78rem', fontWeight: 700, borderRadius: 100,
            padding: '0.3rem 0.85rem', background: cfg.bg, color: cfg.color,
            border: `1px solid ${cfg.color}35`,
        }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
            {cfg.label}
        </span>
    );
}

export default function AdminShipmentDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [shipment, setShipment] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [newStatus, setNewStatus] = useState('');
    const [location, setLocation] = useState('');
    const [description, setDescription] = useState('');
    const [warehouseId, setWarehouseId] = useState('');
    const [hubId, setHubId] = useState('');
    const [warehouses, setWarehouses] = useState<any[]>([]);
    const [hubs, setHubs] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'overview' | 'tracking'>('overview');
    const [isEditing, setIsEditing] = useState(false);
    const [editPrice, setEditPrice] = useState<string>('0');
    const [editItems, setEditItems] = useState<any[]>([]);
    const [googleMapsEnabled, setGoogleMapsEnabled] = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            // Fetch main shipment data first
            const [sRes, settingsRes] = await Promise.all([
                api.get(`/admin/shipments/${id}`),
                api.get('/public/settings')
            ]);
            
            const s = sRes.data.data.shipment;
            setShipment(s);
            setEditPrice(s.total_price.toString());
            setEditItems(s.items.map((i: any) => ({ 
                id: i.id, 
                quantity: i.quantity,
                item_price: i.item_price ? i.item_price.toString() : '0'
            })));
            setGoogleMapsEnabled(settingsRes.data.data.settings.google_maps_enabled === 'true');

            // Fetch auxiliary data separately and don't fail if they error (e.g. Due to permissions)
            api.get('/admin/logistics/warehouses').then(res => setWarehouses(res.data.data || [])).catch(() => {});
            api.get('/admin/logistics/hubs').then(res => setHubs(res.data.data || [])).catch(() => {});

        } catch (err) {
            console.error("Failed to load shipment", err);
            toast.error("Could not load shipment details");
            router.push('/shipments');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, [id]);

    const handleUpdate = async () => {
        if (!newStatus) { toast.error('Select a status'); return; }
        setUpdating(true);
        try {
            await api.patch(`/admin/shipments/${id}/status`, { 
                status: newStatus, 
                location, 
                description,
                warehouse_id: warehouseId || null,
                hub_id: hubId || null
            });
            toast.success('Status updated successfully');
            setNewStatus(''); setLocation(''); setDescription(''); setWarehouseId(''); setHubId('');
            load();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Update failed');
        } finally { setUpdating(false); }
    };

    const handleSaveChanges = async () => {
        setUpdating(true);
        try {
            await api.patch(`/admin/shipments/${id}`, {
                total_price: parseFloat(editPrice),
                items: editItems
            });
            toast.success('Shipment updated successfully');
            setIsEditing(false);
            load();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Update failed');
        } finally {
            setUpdating(false);
        }
    };

    // Auto-calculate total price when items change
    useEffect(() => {
        if (isEditing) {
            const total = editItems.reduce((acc, item) => {
                return acc + (Number(item.item_price || 0) * (item.quantity || 0));
            }, 0);
            setEditPrice(total.toFixed(2));
        }
    }, [editItems, isEditing]);
    
    const handleDownload = async () => {
        if (!shipment) return;
        setDownloading(true);
        try {
            const response = await api.get(`/admin/shipments/${id}/invoice`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Invoice-${shipment.tracking_number}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            toast.error('Failed to download invoice');
        } finally { setDownloading(false); }
    };

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '5rem' }}>
            <div className="spinner" />
        </div>
    );
    if (!shipment) return null;

    const typeCfg = TYPE_CONFIG[shipment.shipment_type] || TYPE_CONFIG.standard;

    return (
        <div style={{ padding: '2rem', maxWidth: 1000 }}>

            {/* ── Header ──────────────────────────────────────────────────── */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                <Link href="/shipments" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.8125rem', marginTop: '0.35rem', flexShrink: 0 }}>
                    <ArrowLeft size={15} /> Back
                </Link>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 900, fontFamily: 'monospace', color: 'var(--accent)', letterSpacing: '0.03em' }}>
                            {shipment.tracking_number}
                        </h1>
                        <StatusBadge status={shipment.status} />
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', fontWeight: 700, borderRadius: 100, padding: '0.3rem 0.75rem', background: typeCfg.bg, color: typeCfg.color, textTransform: 'capitalize', border: `1px solid ${typeCfg.color}30` }}>
                            {typeCfg.emoji} {shipment.shipment_type}
                        </span>
                    </div>
                    <Link href={`/customers/${shipment.user_id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap', fontSize: '0.8125rem', color: 'var(--text-muted)', textDecoration: 'none', padding: '0.4rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-secondary)', transition: 'border-color 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                        onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><User size={13} /> <b style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{shipment.customer_name}</b></span>
                        <span>{shipment.customer_email}</span>
                        {shipment.customer_phone && <span>{shipment.customer_phone}</span>}
                        <ArrowRight size={13} style={{ marginLeft: 'auto', flexShrink: 0 }} />
                    </Link>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    {(shipment.status === 'pending' || shipment.status === 'draft') && (
                        isEditing ? (
                            <>
                                <button onClick={() => setIsEditing(false)} className="btn btn-secondary btn-sm" disabled={updating}>Cancel</button>
                                <button onClick={handleSaveChanges} disabled={updating} className="btn btn-primary btn-sm">
                                    {updating ? 'Saving...' : 'Save Changes'}
                                </button>
                            </>
                        ) : (
                            <button onClick={() => setIsEditing(true)} className="btn btn-secondary btn-sm">Edit Shipment</button>
                        )
                    )}
                    <button onClick={handleDownload} disabled={downloading} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <DollarSign size={14} /> {downloading ? 'Downloading...' : 'Download Invoice'}
                    </button>
                </div>
            </div>

            {/* ── Tabs ─────────────────────────────────────────────────── */}
            <div style={{ display: 'flex', gap: '1.5rem', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem' }}>
                {[
                    { id: 'overview', label: 'Overview' },
                    { id: 'tracking', label: 'Status & Tracking' },
                ].map(t => (
                    <button key={t.id} onClick={() => setActiveTab(t.id as any)} style={{
                        padding: '0.75rem 0', fontSize: '0.875rem', fontWeight: 700,
                        color: activeTab === t.id ? 'var(--accent)' : 'var(--text-muted)',
                        borderBottom: `2px solid ${activeTab === t.id ? 'var(--accent)' : 'transparent'}`,
                        background: 'transparent', borderTop: 'none', borderLeft: 'none', borderRight: 'none',
                        cursor: 'pointer', transition: 'all 0.2s', outline: 'none'
                    }}>
                        {t.label}
                    </button>
                ))}
            </div>

            {/* ── Top grid ──────────────────────────────────────────────── */}
            <div style={{ display: activeTab === 'overview' ? 'grid' : 'none', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>

                {/* Route card */}
                <div className="card">
                    <p style={{ fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>Route</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {[
                            { label: 'Pickup', color: '#3b82f6', city: shipment.pickup_city, country: shipment.pickup_country, address: shipment.pickup_address, contact: shipment.pickup_contact_name, phone: shipment.pickup_contact_phone },
                            { label: 'Destination', color: '#8b5cf6', city: shipment.destination_city, country: shipment.destination_country, address: shipment.destination_address, contact: shipment.destination_contact_name, phone: shipment.destination_contact_phone },
                        ].map(({ label, color, city, country, address, contact, phone }) => (
                            <div key={label} style={{ display: 'flex', gap: '0.875rem', alignItems: 'flex-start', padding: '0.875rem', background: `${color}08`, borderRadius: 12, border: `1px solid ${color}20` }}>
                                <div style={{ width: 36, height: 36, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 4px 12px ${color}35` }}>
                                    <MapPin size={16} color="white" />
                                </div>
                                <div>
                                    <p style={{ fontSize: '0.7rem', color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>{label}</p>
                                    <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>{city}, {country}</p>
                                    {address && <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>{address}</p>}
                                    {contact && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>👤 {contact}{phone ? ` · ${phone}` : ''}</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Details card */}
                <div className="card">
                    <p style={{ fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>Shipment Details</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                        {[
                            { icon: Zap, label: 'Speed', value: shipment.shipment_type, capitalize: true },
                            { icon: Package, label: 'Total Weight', value: `${Number(shipment.total_weight_kg || 0).toFixed(3)} kg` },
                            { icon: Calendar, label: 'Est. Delivery', value: shipment.estimated_delivery ? new Date(shipment.estimated_delivery).toLocaleDateString('en-KE', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : '—' },
                            { icon: DollarSign, label: 'Total Price', value: isEditing ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--accent)' }}>$ {Number(editPrice).toLocaleString()}</span>
                                    <span style={{ fontSize: '0.65rem', background: 'rgba(59,130,246,0.1)', color: 'var(--accent)', padding: '0.1rem 0.4rem', borderRadius: 4, fontWeight: 700 }}>CALCULATED</span>
                                </div>
                            ) : `$ ${Number(shipment.total_price || 0).toLocaleString()}`, accent: true },
                            { icon: Calendar, label: 'Created', value: new Date(shipment.created_at).toLocaleString('en-KE', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) },
                        ].map(({ icon: Icon, label, value, capitalize, accent }, i) => (
                            <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.7rem 0', borderBottom: i < 4 ? '1px solid var(--border)' : 'none', gap: '0.75rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                                    <Icon size={13} />
                                    <span>{label}</span>
                                </div>
                                <span style={{ fontWeight: 700, fontSize: '0.8375rem', textTransform: capitalize ? 'capitalize' : 'none', color: accent ? 'var(--accent)' : 'var(--text-primary)' }}>{value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Map Section */}
                {googleMapsEnabled && (shipment.pickup_latitude || shipment.destination_latitude) && (
                    <div className="card" style={{ gridColumn: '1 / -1' }}>
                        <p style={{ fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>Precise Locations</p>
                        <ShipmentMap 
                            pickup={shipment.pickup_latitude ? { 
                                lat: Number(shipment.pickup_latitude), 
                                lng: Number(shipment.pickup_longitude),
                                address: shipment.pickup_address
                            } : undefined}
                            destination={shipment.destination_latitude ? { 
                                lat: Number(shipment.destination_latitude), 
                                lng: Number(shipment.destination_longitude),
                                address: shipment.destination_address
                            } : undefined}
                        />
                    </div>
                )}
            </div>

            {/* ── Update Status ──────────────────────────────────────────── */}
            <div className="card" style={{ marginBottom: '1.25rem', border: '1px solid rgba(59,130,246,0.2)', background: 'rgba(59,130,246,0.03)', display: activeTab === 'tracking' ? 'block' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                    <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <RefreshCw size={15} color="var(--accent)" />
                    </div>
                    <div>
                        <p style={{ fontWeight: 700, fontSize: '0.875rem' }}>Update Status</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Current: <StatusBadge status={shipment.status} /></p>
                    </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                    <div>
                        <label className="label">New Status *</label>
                        <select className="input" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                            <option value="">Select status…</option>
                            {STATUS_OPTIONS.map(s => (
                                <option key={s} value={s} disabled={s === shipment.status}>
                                    {s.replace(/_/g, ' ')} {s === shipment.status ? '(current)' : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="label">Location</label>
                        <input className="input" placeholder="e.g. Nairobi Sorting Hub" value={location} onChange={e => setLocation(e.target.value)} />
                    </div>
                    <div>
                        <label className="label">Warehouse (Optional)</label>
                        <select className="input" value={warehouseId} onChange={e => setWarehouseId(e.target.value)}>
                            <option value="">None / Not in warehouse</option>
                            {warehouses.map(w => <option key={w.id} value={w.id}>{w.name} ({w.code})</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="label">Logistic Hub (Optional)</label>
                        <select className="input" value={hubId} onChange={e => setHubId(e.target.value)}>
                            <option value="">None / Not in hub</option>
                            {hubs.map(h => <option key={h.id} value={h.id}>{h.name} ({h.code})</option>)}
                        </select>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                        <label className="label">Note / Description</label>
                        <input className="input" placeholder="e.g. Package cleared customs at JKIA" value={description} onChange={e => setDescription(e.target.value)} />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                        <button className="btn btn-primary" onClick={handleUpdate} disabled={updating || !newStatus}>
                            {updating ? <><div className="spinner" /> Updating…</> : <><CheckCircle size={15} /> Confirm Status Update</>}
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Items ──────────────────────────────────────────────────── */}
            {shipment.items?.length > 0 && (
                <div className="card" style={{ marginBottom: '1.25rem', display: activeTab === 'overview' ? 'block' : 'none' }}>
                    <p style={{ fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '1rem' }}>Package Contents · {shipment.items.length} item{shipment.items.length !== 1 ? 's' : ''}</p>
                    {shipment.items.map((item: any, i: number) => (
                        <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: i < shipment.items.length - 1 ? '1px solid var(--border)' : 'none', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ width: 36, height: 36, background: 'var(--bg-secondary)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>
                                    {item.category_icon || '📦'}
                                </div>
                                <div>
                                    <p style={{ fontWeight: 600, fontSize: '0.8375rem' }}>{item.description}</p>
                                    <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                                        {item.category_name} · {item.weight_kg} kg × {isEditing ? (
                                            <input 
                                                type="number" min="1" 
                                                className="input" style={{ width: 60, padding: '0.1rem 0.3rem', height: 'unset', fontSize: '0.75rem', display: 'inline-block' }}
                                                value={editItems.find(ei => ei.id === item.id)?.quantity || 1} 
                                                onChange={e => {
                                                    const qty = parseInt(e.target.value) || 1;
                                                    setEditItems(prev => prev.map(ei => ei.id === item.id ? { ...ei, quantity: qty } : ei));
                                                }}
                                            />
                                        ) : item.quantity}
                                        {item.is_fragile ? ' · 🔮 Fragile' : ''}{item.is_hazardous ? ' · ⚠️ Hazardous' : ''}{item.requires_refrigeration ? ' · ❄️ Refrigerated' : ''}
                                    </p>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ marginBottom: '0.25rem' }}>
                                    <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.1rem' }}>Unit Price</p>
                                    {isEditing ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', justifyContent: 'flex-end' }}>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>$</span>
                                            <input 
                                                type="number" step="0.01" 
                                                className="input" style={{ width: 85, padding: '0.2rem 0.4rem', height: 'unset', fontSize: '0.8rem', fontWeight: 800, textAlign: 'right', color: 'var(--accent)' }}
                                                value={editItems.find(ei => ei.id === item.id)?.item_price || '0'} 
                                                onChange={e => {
                                                    const price = e.target.value;
                                                    setEditItems(prev => prev.map(ei => ei.id === item.id ? { ...ei, item_price: price } : ei));
                                                }}
                                            />
                                        </div>
                                    ) : (
                                        <span style={{ fontWeight: 700, fontSize: '0.8375rem' }}>$ {Number(item.item_price || 0).toLocaleString()}</span>
                                    )}
                                </div>
                                <div>
                                    <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.1rem' }}>Subtotal</p>
                                    <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--accent)' }}>
                                        $ {isEditing 
                                            ? (Number(editItems.find(ei => ei.id === item.id)?.item_price || 0) * (editItems.find(ei => ei.id === item.id)?.quantity || 0)).toLocaleString()
                                            : (Number(item.item_price || 0) * (item.quantity || 1)).toLocaleString()
                                        }
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Tracking Timeline ───────────────────────────────────────── */}
            {shipment.tracking_events?.length > 0 && (
                <div className="card" style={{ display: activeTab === 'tracking' ? 'block' : 'none' }}>
                    <p style={{ fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Tracking Timeline · {shipment.tracking_events.length} event{shipment.tracking_events.length !== 1 ? 's' : ''}</p>
                    <div style={{ position: 'relative' }}>
                        <div style={{ position: 'absolute', left: 11, top: 11, bottom: 11, width: 2, background: 'var(--accent)', opacity: 0.15 }} />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {[...shipment.tracking_events].reverse().map((ev: any, i: number) => (
                                <div key={ev.id} style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                                    <div style={{
                                        width: 24, height: 24, borderRadius: '50%', flexShrink: 0, zIndex: 1,
                                        background: i === 0 ? 'var(--accent)' : 'var(--bg-card)',
                                        border: `2px solid ${i === 0 ? 'var(--accent)' : 'var(--border-light)'}`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        boxShadow: i === 0 ? '0 0 10px rgba(59,130,246,0.4)' : 'none',
                                    }}>
                                        {i === 0 && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'white' }} />}
                                    </div>
                                    <div style={{ paddingBottom: '0.25rem' }}>
                                        <p style={{ fontWeight: 700, fontSize: '0.85rem', color: i === 0 ? 'var(--text-primary)' : 'var(--text-secondary)', marginBottom: '0.15rem' }}>{ev.title}</p>
                                        {ev.location && <p style={{ fontSize: '0.78rem', color: 'var(--accent)', marginBottom: '0.1rem' }}>📍 {ev.location}</p>}
                                        {ev.description && <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.1rem' }}>{ev.description}</p>}
                                        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{new Date(ev.event_time).toLocaleString('en-KE', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
