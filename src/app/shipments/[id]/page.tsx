'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useAdminAuth } from '@/lib/auth';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, MapPin, Package, RefreshCw, User, Calendar, DollarSign, Zap, ArrowRight, Download } from 'lucide-react';
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

    return (
        <div style={{ padding: 'clamp(1rem, 3vw, 2.5rem)', maxWidth: 1200, margin: '0 auto' }} className="fade-in">

            {/* Header Strategy */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginBottom: '3rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
                    <Link href="/shipments" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 800, padding: '0.6rem 1.25rem', borderRadius: 14, background: 'var(--bg-secondary)', border: '1px solid var(--border)', transition: 'all 0.2s' }}>
                        <ArrowLeft size={16} /> <span>Return to Registry</span>
                    </Link>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        {(shipment.status === 'pending' || shipment.status === 'draft') && (
                            isEditing ? (
                                <>
                                    <button onClick={() => setIsEditing(false)} className="btn btn-secondary" style={{ height: 48, borderRadius: 14, fontWeight: 800, padding: '0 1.5rem' }} disabled={updating}>Discard</button>
                                    <button onClick={handleSaveChanges} disabled={updating} className="btn btn-primary" style={{ height: 48, borderRadius: 14, fontWeight: 900, padding: '0 2rem' }}>
                                        {updating ? 'Syncing...' : 'Apply Edits'}
                                    </button>
                                </>
                            ) : (
                                <button onClick={() => setIsEditing(true)} className="btn btn-secondary" style={{ height: 48, borderRadius: 14, fontWeight: 800, padding: '0 1.5rem' }}>Modify Details</button>
                            )
                        )}
                        <button onClick={handleDownload} disabled={downloading} className="btn btn-primary" style={{ height: 48, borderRadius: 14, fontWeight: 900, padding: '0 1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'linear-gradient(135deg, #0f4098, #1e3a8a)', boxShadow: '0 8px 24px -8px rgba(15,64,152,0.4)' }}>
                            <Download size={18} /> <span>{downloading ? 'Extracting...' : 'Extract Invoice'}</span>
                        </button>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '2rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 'min(100%, 400px)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                            <h1 style={{ fontSize: 'clamp(1.75rem, 5vw, 2.75rem)', fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--accent)', letterSpacing: '-0.06em', margin: 0 }}>
                                {shipment.tracking_number}
                            </h1>
                            <StatusBadge status={shipment.status} />
                        </div>
                        <Link href={`/customers/${shipment.user_id}`} style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.25rem', borderRadius: 24, border: '1px solid var(--border)', background: 'white', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', transition: 'all 0.3s', textDecoration: 'none' }}>
                            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(15,64,152,0.06)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <User size={24} />
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                                <p style={{ fontWeight: 900, fontSize: '1.1rem', margin: 0, color: 'var(--text-primary)' }}>{shipment.customer_name}</p>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{shipment.customer_email}</p>
                            </div>
                            <ArrowRight size={20} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
                        </Link>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="data-table-wrapper" style={{ marginBottom: '3rem', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', gap: '2.5rem', minWidth: 'max-content' }}>
                    {[
                        { id: 'overview', label: 'Cargo Intelligence' },
                        { id: 'tracking', label: 'Operational Audit' },
                    ].map(t => (
                        <button key={t.id} onClick={() => setActiveTab(t.id as any)} style={{
                            padding: '1.25rem 0', fontSize: '1rem', fontWeight: 900,
                            color: activeTab === t.id ? 'var(--accent)' : 'var(--text-muted)',
                            borderBottom: `4px solid ${activeTab === t.id ? 'var(--accent)' : 'transparent'}`,
                            background: 'transparent', border: 'none',
                            cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap', marginBottom: '-2px'
                        }}>
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Core Content Logic */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 540px), 1fr))', gap: '2.5rem' }}>

                {activeTab === 'overview' && (
                    <>
                        {/* Logistics Trajectory */}
                        <div className="card" style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)', borderRadius: 32, background: '#fff', border: '1px solid var(--border)' }}>
                            <h3 style={{ fontSize: '0.8rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '3rem' }}>Logistics Trajectory</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', position: 'relative' }}>
                                <div style={{ position: 'absolute', left: 27, top: 56, bottom: 56, width: 2, background: 'var(--accent)', opacity: 0.1, borderStyle: 'dashed' }} />
                                {[
                                    { label: 'Point of Origin', color: '#3b82f6', city: shipment.pickup_city, country: shipment.pickup_country, address: shipment.pickup_address, contact: shipment.pickup_contact_name, phone: shipment.pickup_contact_phone },
                                    { label: 'Final Destination', color: '#8b5cf6', city: shipment.destination_city, country: shipment.destination_country, address: shipment.destination_address, contact: shipment.destination_contact_name, phone: shipment.destination_contact_phone },
                                ].map(({ label, color, city, country, address, contact, phone }) => (
                                    <div key={label} style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', position: 'relative' }}>
                                        <div style={{ width: 56, height: 56, borderRadius: 18, background: 'white', border: `2.5px solid ${color}`, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1, boxShadow: `0 12px 24px ${color}15` }}>
                                            <MapPin size={28} />
                                        </div>
                                        <div style={{ minWidth: 0, flex: 1 }}>
                                            <p style={{ fontSize: '0.75rem', color, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>{label}</p>
                                            <p style={{ fontWeight: 900, fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '0.35rem' }}>{city}, {country}</p>
                                            <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.6, fontWeight: 600 }}>{address}</p>
                                            {contact && (
                                                <div style={{ marginTop: '1rem', padding: '0.85rem 1.25rem', background: 'var(--bg-secondary)', borderRadius: 14, display: 'flex', alignItems: 'center', gap: '0.75rem', width: 'max-content', maxWidth: '100%', flexWrap: 'wrap' }}>
                                                    <span style={{ fontSize: '0.9rem', fontWeight: 900 }}>👤 {contact}</span>
                                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 800 }}>{phone}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Operational Specifications */}
                        <div className="card" style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)', borderRadius: 32, background: '#fff', border: '1px solid var(--border)' }}>
                            <h3 style={{ fontSize: '0.8rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '3rem' }}>Operational Specs</h3>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                {[
                                    { icon: Zap, label: 'Service Protocol', value: shipment.shipment_type, capitalize: true },
                                    { icon: Package, label: 'Manifest Weight', value: `${Number(shipment.total_weight_kg || 0).toFixed(2)} KG` },
                                    { icon: Calendar, label: 'Estimated Vector', value: shipment.estimated_delivery ? new Date(shipment.estimated_delivery).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Processing' },
                                    { icon: DollarSign, label: 'Vector Valuation', value: isEditing ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <span style={{ fontWeight: 900, fontSize: '1.25rem', color: 'var(--accent)' }}>$ {Number(editPrice).toLocaleString()}</span>
                                            <span style={{ fontSize: '0.7rem', background: 'rgba(15,64,152,0.1)', color: 'var(--accent)', padding: '0.3rem 0.75rem', borderRadius: 8, fontWeight: 900 }}>DYNAMIC</span>
                                        </div>
                                    ) : `$ ${Number(shipment.total_price || 0).toLocaleString()}`, highlight: true },
                                ].map(({ icon: Icon, label, value, capitalize, highlight }, i) => (
                                    <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem 0', borderBottom: i < 3 ? '1px solid var(--border)' : 'none', flexWrap: 'wrap', gap: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 700 }}>
                                            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                                                <Icon size={20} />
                                            </div>
                                            <span>{label}</span>
                                        </div>
                                        <span style={{ fontWeight: 900, fontSize: '1.1rem', textTransform: capitalize ? 'capitalize' : 'none', color: highlight ? 'var(--accent)' : 'var(--text-primary)' }}>{value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Geospatial Intelligence */}
                        {googleMapsEnabled && (shipment.pickup_latitude || shipment.destination_latitude) && (
                            <div className="card" style={{ gridColumn: '1 / -1', padding: 0, overflow: 'hidden', borderRadius: 36, border: '1px solid var(--border)', background: '#fff' }}>
                                <div style={{ padding: '1.5rem 2.5rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
                                    <h3 style={{ fontSize: '0.8rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Geospatial Intelligence</h3>
                                </div>
                                <div style={{ height: 'clamp(400px, 50vh, 600px)' }}>
                                    <ShipmentMap 
                                        pickup={shipment.pickup_latitude ? { lat: Number(shipment.pickup_latitude), lng: Number(shipment.pickup_longitude), address: shipment.pickup_address } : undefined}
                                        destination={shipment.destination_latitude ? { lat: Number(shipment.destination_latitude), lng: Number(shipment.destination_longitude), address: shipment.destination_address } : undefined}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Cargo Manifest */}
                        {shipment.items?.length > 0 && (
                            <div className="card" style={{ gridColumn: '1 / -1', padding: 0, borderRadius: 36, overflow: 'hidden', border: '1px solid var(--border)', background: '#fff' }}>
                                <div style={{ padding: '1.5rem 2.5rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                                    <h3 style={{ fontSize: '0.8rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Cargo Manifest · {shipment.items.length} Units</h3>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 900, background: 'rgba(15,64,152,0.1)', color: 'var(--accent)', padding: '0.4rem 1rem', borderRadius: 10, letterSpacing: '0.05em' }}>VERIFIED CONTENT</span>
                                </div>
                                <div className="data-table-wrapper">
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th style={{ padding: '1.25rem 2.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description</th>
                                                <th style={{ padding: '1.25rem 2.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Classification</th>
                                                <th style={{ padding: '1.25rem 2.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Metrics</th>
                                                <th style={{ padding: '1.25rem 2.5rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Valuation</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {shipment.items.map((item: any) => (
                                                <tr key={item.id} style={{ borderTop: '1px solid var(--border)', transition: 'background 0.2s' }}>
                                                    <td style={{ padding: '1.5rem 2.5rem' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                                                            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', border: '1px solid var(--border)' }}>
                                                                {item.category_icon || '📦'}
                                                            </div>
                                                            <p style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)', margin: 0 }}>{item.description}</p>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '1.5rem 2.5rem' }}>
                                                        <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-muted)' }}>{item.category_name}</span>
                                                    </td>
                                                    <td style={{ padding: '1.5rem 2.5rem' }}>
                                                        <div style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', fontWeight: 800 }}>
                                                            {item.weight_kg}KG × {isEditing ? (
                                                                <input 
                                                                    type="number" min="1" 
                                                                    className="input" style={{ width: 70, height: 36, padding: '0 0.75rem', fontSize: '0.9rem', borderRadius: 10, fontWeight: 900, textAlign: 'center', background: 'var(--bg-secondary)', border: 'none' }}
                                                                    value={editItems.find(ei => ei.id === item.id)?.quantity || 1} 
                                                                    onChange={e => {
                                                                        const qty = parseInt(e.target.value) || 1;
                                                                        setEditItems(prev => prev.map(ei => ei.id === item.id ? { ...ei, quantity: qty } : ei));
                                                                    }}
                                                                />
                                                            ) : <span style={{ color: 'var(--accent)', fontWeight: 900 }}>{item.quantity}</span>}
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '1.5rem 2.5rem', textAlign: 'right' }}>
                                                        <p style={{ fontWeight: 900, fontSize: '1.1rem', color: 'var(--text-primary)', margin: 0 }}>
                                                            $ {isEditing 
                                                                ? (Number(editItems.find(ei => ei.id === item.id)?.item_price || 0) * (editItems.find(ei => ei.id === item.id)?.quantity || 0)).toLocaleString()
                                                                : (Number(item.item_price || 0) * (item.quantity || 1)).toLocaleString()
                                                            }
                                                        </p>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'tracking' && (
                    <>
                        {/* Status Transmission Hub */}
                        <div className="card" style={{ padding: 'clamp(1.5rem, 4vw, 3rem)', border: '2px solid var(--accent)', background: 'rgba(15,64,152,0.02)', borderRadius: 36 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '3rem' }}>
                                <div style={{ width: 52, height: 52, borderRadius: 16, background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 12px 24px rgba(15,64,152,0.2)' }}>
                                    <RefreshCw size={26} />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0, color: 'var(--text-primary)' }}>Transmission Hub</h3>
                                    <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', fontWeight: 600, margin: 0 }}>Broadcast real-time operational updates.</p>
                                </div>
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
                                <div>
                                    <label className="label" style={{ fontSize: '0.75rem', fontWeight: 900, letterSpacing: '0.1em' }}>OPERATIONAL STAGE</label>
                                    <select className="input" style={{ borderRadius: 16, height: 56, background: '#fff', fontWeight: 800, fontSize: '1rem', padding: '0 1.25rem' }} value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                                        <option value="">Select Protocol Stage…</option>
                                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ').toUpperCase()}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="label" style={{ fontSize: '0.75rem', fontWeight: 900, letterSpacing: '0.1em' }}>GEOSPATIAL COORDINATE</label>
                                    <div style={{ position: 'relative' }}>
                                        <MapPin size={20} style={{ position: 'absolute', left: 18, top: 18, color: 'var(--accent)', opacity: 0.6 }} />
                                        <input className="input" style={{ paddingLeft: '3.75rem', borderRadius: 16, height: 56, background: '#fff', fontWeight: 800, fontSize: '1rem' }} placeholder="e.g. Regional Transit Center Alpha" value={location} onChange={e => setLocation(e.target.value)} />
                                    </div>
                                </div>
                                <div>
                                    <label className="label" style={{ fontSize: '0.75rem', fontWeight: 900, letterSpacing: '0.1em' }}>AUDIT LOG DESCRIPTION</label>
                                    <textarea className="input" style={{ borderRadius: 20, minHeight: 140, padding: '1.5rem', background: '#fff', fontWeight: 600, lineHeight: 1.7, fontSize: '1rem', resize: 'none' }} placeholder="Provide detailed operational context for the client..." value={description} onChange={e => setDescription(e.target.value)} />
                                </div>
                                <button className="btn btn-primary btn-full" style={{ height: 60, borderRadius: 20, fontWeight: 900, fontSize: '1.1rem', background: 'linear-gradient(135deg, #0f4098, #1e3a8a)', boxShadow: '0 15px 30px rgba(15,64,152,0.2)' }} onClick={handleUpdate} disabled={updating || !newStatus}>
                                    {updating ? 'Broadcasting Update...' : 'Transmit Protocol Update'}
                                </button>
                            </div>
                        </div>

                        {/* Logistic Anchors */}
                        <div className="card" style={{ padding: '2.5rem', borderRadius: 36, background: '#fff', border: '1px solid var(--border)' }}>
                            <h3 style={{ fontSize: '0.8rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '2.5rem' }}>Logistic Anchors</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                <div>
                                    <label className="label" style={{ fontSize: '0.75rem', fontWeight: 900, letterSpacing: '0.1em' }}>ASSIGNED WAREHOUSE</label>
                                    <select className="input" style={{ borderRadius: 16, height: 56, fontWeight: 800, padding: '0 1.25rem', background: 'var(--bg-secondary)', border: 'none' }} value={warehouseId} onChange={e => setWarehouseId(e.target.value)}>
                                        <option value="">Direct Delivery Route</option>
                                        {warehouses.map(w => <option key={w.id} value={w.id}>{w.name} · {w.code}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="label" style={{ fontSize: '0.75rem', fontWeight: 900, letterSpacing: '0.1em' }}>REGIONAL HUB</label>
                                    <select className="input" style={{ borderRadius: 16, height: 56, fontWeight: 800, padding: '0 1.25rem', background: 'var(--bg-secondary)', border: 'none' }} value={hubId} onChange={e => setHubId(e.target.value)}>
                                        <option value="">Standard Sector Path</option>
                                        {hubs.map(h => <option key={h.id} value={h.id}>{h.name} · {h.code}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Operational Audit Trail */}
                        {shipment.tracking_events?.length > 0 && (
                            <div className="card" style={{ gridColumn: '1 / -1', padding: 'clamp(2rem, 5vw, 3.5rem)', borderRadius: 40, background: '#fff', border: '1px solid var(--border)' }}>
                                <h3 style={{ fontSize: '0.85rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '4rem' }}>Operational Audit Trail</h3>
                                <div style={{ position: 'relative', paddingLeft: 'clamp(1.5rem, 4vw, 4rem)' }}>
                                    <div style={{ position: 'absolute', left: 13, top: 16, bottom: 16, width: 2, background: 'var(--accent)', opacity: 0.1, borderStyle: 'solid' }} />
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3.5rem' }}>
                                        {[...shipment.tracking_events].reverse().map((ev: any, i: number) => (
                                            <div key={ev.id} style={{ position: 'relative' }}>
                                                <div style={{
                                                    position: 'absolute', left: 'clamp(-56px, -4.5vw, -44px)', top: 2,
                                                    width: 28, height: 28, borderRadius: '50%',
                                                    background: i === 0 ? 'var(--accent)' : 'white',
                                                    border: `5px solid ${i === 0 ? 'var(--accent)' : 'var(--border)'}`,
                                                    boxShadow: i === 0 ? '0 0 25px rgba(15,64,152,0.4)' : 'none',
                                                    zIndex: 2,
                                                    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                                                }} />
                                                <div style={{ background: i === 0 ? 'rgba(15,64,152,0.03)' : 'transparent', padding: i === 0 ? '2rem' : 0, borderRadius: 28, border: i === 0 ? '1px solid rgba(15,64,152,0.1)' : 'none', transition: 'all 0.4s' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '1rem' }}>
                                                        <h4 style={{ fontWeight: 900, fontSize: '1.2rem', color: i === 0 ? 'var(--accent)' : 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>{ev.title}</h4>
                                                        <span style={{ fontSize: '0.85rem', fontWeight: 900, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', background: 'var(--bg-secondary)', padding: '0.35rem 0.85rem', borderRadius: 10 }}>{new Date(ev.event_time).toLocaleString('en-KE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                    {ev.location && <div style={{ fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}><MapPin size={18} className="text-accent" /> {ev.location}</div>}
                                                    {ev.description && <p style={{ fontSize: '1rem', color: 'var(--text-muted)', lineHeight: 1.7, fontWeight: 600, margin: 0 }}>{ev.description}</p>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
