'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { 
    Save, Plus, Trash2, PenLine, X, Check, Globe, 
    DollarSign, MapPin, Search, Filter, ArrowLeft, 
    ChevronRight, Truck, Ship, Plane, Info, MoreVertical,
    Activity, ShieldCheck, Map, ChevronDown, ChevronUp, ExternalLink,
    LayoutGrid, List, Navigation, Settings2, Sparkles, Building2,
    Calendar, Clock, Shield, Globe2, Weight, Gauge, AlertTriangle, Sparkle,
    ArrowRightLeft, ArrowRight, Zap, Copy, RefreshCcw
} from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useAdminAuth } from '@/lib/auth';

interface Location { 
    id: string; 
    name: string; 
    type: 'origin_country' | 'origin' | 'destination_country' | 'destination_city'; 
    parent_id: string | null; 
    country_code: string | null; 
    is_active: boolean; 
}

interface Rate {
    id: string;
    origin_id: string;
    destination_id: string;
    air_rate_per_kg: number;
    air_rate_type: 'per_kg' | 'upto';
    air_upto_weight: number;
    air_days: number;
    sea_rate_per_kg: number;
    sea_rate_type: 'per_kg' | 'upto';
    sea_upto_weight: number;
    sea_days: number;
    road_rate_per_kg: number;
    road_rate_type: 'per_kg' | 'upto';
    road_upto_weight: number;
    road_days: number;
    flat_surcharge: number;
}

const EMPTY_LOCATION: Omit<Location, 'id'> = { 
    name: '', 
    type: 'origin', 
    parent_id: null, 
    country_code: null, 
    is_active: true 
};

const EMPTY_RATE = (originId: string, destId: string): Partial<Rate> => ({
    origin_id: originId,
    destination_id: destId,
    air_rate_per_kg: 0,
    air_rate_type: 'upto',
    air_upto_weight: 5,
    air_days: 7,
    sea_rate_per_kg: 0,
    sea_rate_type: 'upto',
    sea_upto_weight: 5,
    sea_days: 30,
    road_rate_per_kg: 0,
    road_rate_type: 'upto',
    road_upto_weight: 5,
    road_days: 14,
    flat_surcharge: 0
});

export default function LocationsPricingPage() {
    const [locations, setLocations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [localSearch, setLocalSearch] = useState('');
    const [activeTab, setActiveTab] = useState<'origins' | 'destinations'>('origins');
    
    // View state
    const [selectedCountryId, setSelectedCountryId] = useState<string | null>(null);
    const [selectedLocalId, setSelectedLocalId] = useState<string | null>(null); // Can be Hub or City
    const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
    
    const [localPage, setLocalPage] = useState(1);
    const [countryPage, setCountryPage] = useState(1);
    const itemsPerPage = 10;
    const countriesPerPage = 10;
    const [isAddingCountry, setIsAddingCountry] = useState(false);
    
    // Editor state
    const [editTarget, setEditTarget] = useState<Partial<Location> | null>(null);
    const [processing, setProcessing] = useState(false);

    const { hasPermission } = useAdminAuth();

    const loadLocations = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/locations');
            setLocations(res.data.data);
        } catch (e) {
            toast.error('Failed to load locations');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadLocations(); }, [loadLocations]);

    // Reset local page on search or country change
    useEffect(() => { setLocalPage(1); }, [localSearch, selectedCountryId]);
    useEffect(() => { setCountryPage(1); }, [search, activeTab]);

    const filteredCountries = useMemo(() => {
        const type = activeTab === 'origins' ? 'origin_country' : 'destination_country';
        return locations.filter(l => l.type === type && (search === '' || l.name.toLowerCase().includes(search.toLowerCase())));
    }, [locations, activeTab, search]);

    const paginatedCountries = useMemo(() => {
        const start = (countryPage - 1) * countriesPerPage;
        return filteredCountries.slice(start, start + countriesPerPage);
    }, [filteredCountries, countryPage]);

    const totalCountryPages = Math.ceil(filteredCountries.length / countriesPerPage);

    const selectedCountry = useMemo(() => {
        if (!selectedCountryId) return null;
        return locations.find(l => l.id === selectedCountryId) || null;
    }, [locations, selectedCountryId]);

    const selectedLocal = useMemo(() => {
        if (!selectedLocalId) return null;
        return locations.find(l => l.id === selectedLocalId) || null;
    }, [locations, selectedLocalId]);

    const selectedPartner = useMemo(() => {
        if (!selectedPartnerId) return null;
        return locations.find(l => l.id === selectedPartnerId) || null;
    }, [locations, selectedPartnerId]);

    const filteredChildren = useMemo(() => {
        if (!selectedCountryId) return [];
        return locations.filter(l => 
            l.parent_id === selectedCountryId && 
            (localSearch === '' || l.name.toLowerCase().includes(localSearch.toLowerCase()))
        );
    }, [locations, selectedCountryId, localSearch]);

    const paginatedChildren = useMemo(() => {
        const start = (localPage - 1) * itemsPerPage;
        return filteredChildren.slice(start, start + itemsPerPage);
    }, [filteredChildren, localPage]);

    const totalLocalPages = Math.ceil(filteredChildren.length / itemsPerPage);

    const handleSaveLocation = async (data: Partial<Location>) => {
        if (!data.name) { toast.error('Name is required'); return; }
        setProcessing(true);
        try {
            if (data.id) {
                await api.patch(`/locations/${data.id}`, data);
                toast.success('Updated successfully');
            } else {
                await api.post('/locations', data);
                toast.success('Created successfully');
            }
            setEditTarget(null);
            setIsAddingCountry(false);
            loadLocations();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Operation failed');
        } finally {
            setProcessing(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure? This action is permanent.')) return;
        try {
            await api.delete(`/locations/${id}`);
            toast.success('Removed successfully');
            if (selectedLocalId === id) setSelectedLocalId(null);
            if (selectedCountryId === id) setSelectedCountryId(null);
            loadLocations();
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Delete failed');
        }
    };

    if (!hasPermission('manage_zones')) return <div style={{ padding: '5rem', textAlign: 'center' }}>Access Denied</div>;

    // ── 4th Level: Full Page Route Editor ────────────────────────────────────
    if (selectedPartner && selectedLocal && selectedCountry) {
        const origin = activeTab === 'origins' ? selectedLocal : selectedPartner;
        const destination = activeTab === 'origins' ? selectedPartner : selectedLocal;

        return (
            <div className="fade-in" style={{ padding: 'clamp(1rem, 3vw, 2.5rem)', maxWidth: 1000, margin: '0 auto' }}>
                <header style={{ marginBottom: '3rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.85rem', fontWeight: 700, flexWrap: 'wrap' }}>
                        <button onClick={() => { setSelectedPartnerId(null); setSelectedLocalId(null); setSelectedCountryId(null); }} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}>Countries</button>
                        <ChevronRight size={14} />
                        <button onClick={() => { setSelectedPartnerId(null); setSelectedLocalId(null); }} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}>{selectedCountry.name}</button>
                        <ChevronRight size={14} />
                        <button onClick={() => setSelectedPartnerId(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}>{selectedLocal.name}</button>
                        <ChevronRight size={14} />
                        <span style={{ color: 'var(--text-primary)' }}>Configure {selectedPartner.name}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '2rem' }}>
                        <div>
                            <h1 style={{ fontSize: 'clamp(1.75rem, 5vw, 2.5rem)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.1, margin: 0 }}>Location Pricing</h1>
                            <p style={{ color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 600, marginTop: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', margin: 0 }}>
                                From <span style={{ color: 'var(--accent)' }}>{origin.name}</span> to <span style={{ color: 'var(--accent)' }}>{destination.name}</span>
                            </p>
                        </div>
                        <button className="btn btn-secondary" onClick={() => setSelectedPartnerId(null)} style={{ height: 48, borderRadius: 14, fontWeight: 800, padding: '0 1.5rem' }}>
                            <ArrowLeft size={18} /> Back
                        </button>
                    </div>
                </header>

                <FullPageRateEditor hub={origin} city={destination} onBack={() => setSelectedPartnerId(null)} />
            </div>
        );
    }

    // ── 3rd Level: Matrix View (Partner Connections) ─────────────────────────
    if (selectedLocal && selectedCountry) {
        return (
            <div className="fade-in" style={{ padding: 'clamp(1rem, 3vw, 2.5rem)', maxWidth: 1100, margin: '0 auto' }}>
                <header style={{ marginBottom: '3rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.85rem', fontWeight: 700, flexWrap: 'wrap' }}>
                        <button onClick={() => { setSelectedLocalId(null); setSelectedCountryId(null); }} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}>Countries</button>
                        <ChevronRight size={14} />
                        <button onClick={() => setSelectedLocalId(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}>{selectedCountry.name}</button>
                        <ChevronRight size={14} />
                        <span style={{ color: 'var(--text-primary)' }}>{selectedLocal.name}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                            <div style={{ width: 64, height: 64, borderRadius: 18, background: 'var(--bg-secondary)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)', flexShrink: 0 }}>
                                {activeTab === 'origins' ? <Building2 size={32} /> : <MapPin size={32} />}
                            </div>
                            <div>
                                <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.25rem)', fontWeight: 900, letterSpacing: '-0.03em', margin: 0 }}>{selectedLocal.name}</h1>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: 600, marginTop: '0.3rem', margin: 0 }}>
                                    {activeTab === 'origins' ? 'Routes starting from this Hub' : 'Rates for shipments to this City'}
                                </p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button className="btn btn-secondary" onClick={() => setEditTarget(selectedLocal)} style={{ height: 44, borderRadius: 12, fontWeight: 800, padding: '0 1.25rem' }}>Edit Node</button>
                        </div>
                    </div>
                </header>

                <PricingMatrix 
                    source={selectedLocal} 
                    mode={activeTab} 
                    locations={locations} 
                    onSetPrice={(partnerId: string) => setSelectedPartnerId(partnerId)} 
                />

                <EditorModal target={editTarget} onClose={() => setEditTarget(null)} onSave={handleSaveLocation} processing={processing} />
            </div>
        );
    }

    // ── 2nd Level: Country View ──────────────────────────────────────────────
    if (selectedCountry) {
        return (
            <div className="fade-in" style={{ padding: 'clamp(1rem, 3vw, 2.5rem)', maxWidth: 1000, margin: '0 auto' }}>
                <header style={{ marginBottom: '3rem' }}>
                    <button 
                        onClick={() => setSelectedCountryId(null)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 800, marginBottom: '1.5rem', fontSize: '0.9rem', padding: 0 }}
                    >
                        <ArrowLeft size={18} /> Back
                    </button>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                            <div style={{ width: 64, height: 64, borderRadius: 18, background: activeTab === 'origins' ? 'rgba(16,185,129,0.1)' : 'rgba(59,130,246,0.1)', color: activeTab === 'origins' ? '#10b981' : '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 900, border: '1px solid var(--border)', flexShrink: 0 }}>
                                {selectedCountry.country_code || <Globe size={32} />}
                            </div>
                            <div>
                                <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.25rem)', fontWeight: 900, letterSpacing: '-0.03em', margin: 0 }}>{selectedCountry.name}</h1>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: 600, marginTop: '0.3rem', margin: 0 }}>
                                    Managing {filteredChildren.length} {activeTab === 'origins' ? 'pickup points' : 'destination cities'}
                                </p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', width: '100%', maxWidth: 'max-content' }}>
                            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                                <Search size={16} style={{ position: 'absolute', left: 16, top: 12, color: 'var(--text-muted)', opacity: 0.7 }} />
                                <input className="input" placeholder={`Search ${activeTab === 'origins' ? 'towns' : 'cities'}...`} style={{ paddingLeft: '2.75rem', height: 40, fontSize: '0.875rem', borderRadius: 12, border: 'none', background: 'var(--bg-secondary)', fontWeight: 600 }} value={localSearch} onChange={e => setLocalSearch(e.target.value)} />
                            </div>
                            <button className="btn btn-primary" onClick={() => setEditTarget({ ...EMPTY_LOCATION, type: activeTab === 'origins' ? 'origin' : 'destination_city', parent_id: selectedCountry.id })} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: 12, height: 40, fontSize: '0.85rem', padding: '0 1.25rem', fontWeight: 800 }}>
                                <Plus size={18} /> Add {activeTab === 'origins' ? 'Node' : 'City'}
                            </button>
                        </div>
                    </div>
                </header>

                <div className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: 28 }}>
                    <div className="data-table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th style={{ paddingLeft: '2rem' }}>{activeTab === 'origins' ? 'Town Name' : 'City Name'}</th>
                                    <th>{activeTab === 'origins' ? 'Type' : 'Category'}</th>
                                    <th>Status</th>
                                    <th style={{ paddingRight: '2rem', textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedChildren.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} style={{ padding: '6rem 0', textAlign: 'center' }}>
                                            <Navigation size={48} style={{ margin: '0 auto 1.5rem', opacity: 0.1 }} />
                                            <p style={{ fontWeight: 800, color: 'var(--text-primary)' }}>No active nodes found in this region</p>
                                        </td>
                                    </tr>
                                ) : paginatedChildren.map(child => (
                                    <tr key={child.id} onClick={() => setSelectedLocalId(child.id)} style={{ cursor: 'pointer' }}>
                                        <td style={{ paddingLeft: '2rem' }}>
                                            <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '1rem' }}>{child.name}</span>
                                        </td>
                                        <td>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 800, background: 'var(--bg-secondary)', padding: '0.3rem 0.6rem', borderRadius: 8, textTransform: 'uppercase' }}>
                                                {child.type === 'origin' ? 'Hub' : 'Destination'}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: child.is_active ? '#10b981' : '#ef4444', fontSize: '0.8rem', fontWeight: 900 }}>
                                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'currentColor' }} />
                                                <span style={{ textTransform: 'uppercase' }}>{child.is_active ? 'Active' : 'Offline'}</span>
                                            </div>
                                        </td>
                                        <td style={{ paddingRight: '2rem', textAlign: 'right' }}>
                                            <ChevronRight size={18} style={{ opacity: 0.3 }} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {totalLocalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '3rem' }}>
                        <button className="btn btn-secondary btn-sm" disabled={localPage === 1} onClick={() => setLocalPage(p => p - 1)} style={{ width: 40, height: 40, padding: 0, borderRadius: 12 }}><ArrowLeft size={18} /></button>
                        <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>{localPage} / {totalLocalPages}</span>
                        <button className="btn btn-secondary btn-sm" disabled={localPage === totalLocalPages} onClick={() => setLocalPage(p => p + 1)} style={{ width: 40, height: 40, padding: 0, borderRadius: 12 }}><ArrowRight size={18} /></button>
                    </div>
                )}

                <EditorModal target={editTarget} onClose={() => setEditTarget(null)} onSave={handleSaveLocation} processing={processing} />
            </div>
        );
    }

    // ── 1st Level: Global View ──────────────────────────────────────────────
    return (
        <div className="fade-in" style={{ padding: 'clamp(1rem, 3vw, 2.5rem)', maxWidth: 1200, margin: '0 auto' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', flexWrap: 'wrap', gap: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: 'clamp(1.75rem, 5vw, 2.5rem)', fontWeight: 900, letterSpacing: '-0.04em', margin: 0 }}>Locations & Pricing</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', fontWeight: 600, marginTop: '0.4rem', margin: 0 }}>Manage global origin-destination tariffs and routes.</p>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem', background: 'var(--bg-secondary)', padding: '0.3rem', borderRadius: 14, width: '100%', maxWidth: 'max-content' }}>
                    <button 
                        className="btn btn-sm" 
                        onClick={() => { setActiveTab('origins'); setSelectedCountryId(null); setSelectedLocalId(null); }} 
                        style={{ 
                            flex: 1, minWidth: 100, height: 40, borderRadius: 10,
                            background: activeTab === 'origins' ? 'white' : 'transparent',
                            color: activeTab === 'origins' ? 'var(--accent)' : 'var(--text-muted)',
                            fontWeight: 800, border: 'none', boxShadow: activeTab === 'origins' ? '0 4px 12px rgba(0,0,0,0.08)' : 'none'
                        }}
                    >Origins</button>
                    <button 
                        className="btn btn-sm" 
                        onClick={() => { setActiveTab('destinations'); setSelectedCountryId(null); setSelectedLocalId(null); }} 
                        style={{ 
                            flex: 1, minWidth: 100, height: 40, borderRadius: 10,
                            background: activeTab === 'destinations' ? 'white' : 'transparent',
                            color: activeTab === 'destinations' ? 'var(--accent)' : 'var(--text-muted)',
                            fontWeight: 800, border: 'none', boxShadow: activeTab === 'destinations' ? '0 4px 12px rgba(0,0,0,0.08)' : 'none'
                        }}
                    >Destinations</button>
                </div>
            </header>

            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 2, minWidth: 'min(100%, 350px)' }}>
                    <Search size={20} style={{ position: 'absolute', left: 16, top: 14, color: 'var(--text-muted)', opacity: 0.7 }} />
                    <input className="input" placeholder="Search locations..." style={{ paddingLeft: '3.5rem', height: 48, borderRadius: 14, border: 'none', background: 'var(--bg-secondary)', fontWeight: 600 }} value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <button className="btn btn-primary" onClick={() => setIsAddingCountry(true)} style={{ height: 48, borderRadius: 14, padding: '0 1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.6rem', flex: 1, minWidth: 'max-content' }}>
                    <Plus size={20} /> Add Country
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))', gap: '1.5rem' }}>
                {loading ? <div style={{ gridColumn: '1/-1', padding: '10rem', textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div> :
                 paginatedCountries.map(c => (
                    <div key={c.id} className="card hover-trigger fade-in" onClick={() => setSelectedCountryId(c.id)} style={{ padding: '2rem', borderRadius: 32, cursor: 'pointer', border: '1px solid var(--border)', transition: 'all 0.3s' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <div style={{ width: 56, height: 56, borderRadius: 16, background: activeTab === 'origins' ? 'rgba(16,185,129,0.1)' : 'rgba(59,130,246,0.1)', color: activeTab === 'origins' ? '#10b981' : '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.35rem', fontWeight: 900, border: '1px solid var(--border)' }}>
                                {c.country_code || <Globe size={28} />}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontWeight: 900, color: 'var(--text-primary)', background: 'var(--bg-secondary)', padding: '0.5rem 1rem', borderRadius: 12 }}>
                                {locations.filter(l => l.parent_id === c.id).length} Nodes <ChevronRight size={14} className="opacity-40" />
                            </div>
                        </div>
                        <h3 style={{ fontSize: '1.35rem', fontWeight: 900, marginBottom: '0.4rem', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{c.name}</h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>Country Code: {c.country_code || 'N/A'}</p>
                    </div>
                ))}
            </div>

            {totalCountryPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '4rem' }}>
                    <button className="btn btn-secondary btn-sm" disabled={countryPage === 1} onClick={() => setCountryPage(p => p - 1)} style={{ width: 44, height: 44, padding: 0, borderRadius: 12 }}><ArrowLeft size={18} /></button>
                    <span style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--text-primary)' }}>{countryPage} / {totalCountryPages}</span>
                    <button className="btn btn-secondary btn-sm" disabled={countryPage === totalCountryPages} onClick={() => setCountryPage(p => p + 1)} style={{ width: 44, height: 44, padding: 0, borderRadius: 12 }}><ArrowRight size={18} /></button>
                </div>
            )}

            <EditorModal target={isAddingCountry ? { ...EMPTY_LOCATION, type: activeTab === 'origins' ? 'origin_country' : 'destination_country' } : null} onClose={() => setIsAddingCountry(false)} onSave={handleSaveLocation} processing={processing} />
        </div>
    );
}

function PricingMatrix({ source, mode, locations, onSetPrice }: { source: Location, mode: 'origins' | 'destinations', locations: Location[], onSetPrice: (id: string) => void }) {
    const [rates, setRates] = useState<Rate[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [query, setQuery] = useState('');
    
    const allPartners = locations.filter((l: any) => 
        mode === 'origins' ? l.type === 'destination_city' : l.type === 'origin'
    );

    const filteredPartners = useMemo(() => {
        return allPartners.filter(p => p.name.toLowerCase().includes(query.toLowerCase()));
    }, [allPartners, query]);

    const loadRates = useCallback(() => {
        setLoading(true);
        api.get(`/locations/${source.id}/rates?mode=${mode}`).then(res => {
            setRates(res.data.data);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [source.id, mode]);

    useEffect(() => { loadRates(); }, [loadRates]);

    const handleQuickUpdate = async (partnerId: string, field: string, value: number) => {
        setSaving(partnerId);
        try {
            const existing = rates.find(r => mode === 'origins' ? r.destination_id === partnerId : r.origin_id === partnerId);
            const payload = existing ? { ...existing, [field]: value } : {
                ...EMPTY_RATE(mode === 'origins' ? source.id : partnerId, mode === 'origins' ? partnerId : source.id),
                [field]: value
            };
            await api.post('/locations/rates', payload);
            toast.success('Matrix updated');
            loadRates();
        } catch (e) {
            toast.error('Quick update failed');
        } finally {
            setSaving(null);
        }
    };

    const handleApplyToAll = async (field: 'air' | 'sea' | 'road', baseRateId: string) => {
        const baseRate = rates.find(r => (mode === 'origins' ? r.destination_id : r.origin_id) === baseRateId);
        if (!baseRate) return;
        
        if (!confirm(`Apply this ${field} tariff to all ${allPartners.length} connections?`)) return;
        
        setLoading(true);
        try {
            const promises = allPartners.map(p => {
                const existing = rates.find(r => (mode === 'origins' ? r.destination_id : r.origin_id) === p.id);
                const payload = existing ? { 
                    ...existing, 
                    [`${field}_rate_per_kg`]: baseRate[`${field}_rate_per_kg`],
                    [`${field}_rate_type`]: baseRate[`${field}_rate_type`],
                    [`${field}_upto_weight`]: baseRate[`${field}_upto_weight`],
                    [`${field}_days`]: baseRate[`${field}_days`]
                } : {
                    ...EMPTY_RATE(mode === 'origins' ? source.id : p.id, mode === 'origins' ? p.id : source.id),
                    [`${field}_rate_per_kg`]: baseRate[`${field}_rate_per_kg`],
                    [`${field}_rate_type`]: baseRate[`${field}_rate_type`],
                    [`${field}_upto_weight`]: baseRate[`${field}_upto_weight`],
                    [`${field}_days`]: baseRate[`${field}_days`]
                };
                return api.post('/locations/rates', payload);
            });
            await Promise.all(promises);
            toast.success(`Propagated ${field} rates globally`);
            loadRates();
        } catch (e) {
            toast.error('Bulk propagation failed');
            setLoading(false);
        }
    };

    if (loading) return <div style={{ padding: '5rem', textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>;

    return (
        <div className="card" style={{ padding: 0, borderRadius: 32, overflow: 'hidden', border: '1px solid var(--border)' }}>
            <div style={{ padding: '1.25rem 2rem', background: 'white', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: 'min(100%, 250px)' }}>
                    <Search size={18} style={{ position: 'absolute', left: 16, top: 11, color: 'var(--text-muted)', opacity: 0.7 }} />
                    <input 
                        className="input" 
                        placeholder={`Search ${mode === 'origins' ? 'destinations' : 'origins'}...`} 
                        style={{ height: 40, paddingLeft: '3rem', borderRadius: 12, fontSize: '0.875rem', fontWeight: 700, background: 'var(--bg-secondary)', border: 'none' }}
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                    />
                </div>
                <div style={{ fontSize: '0.8rem', fontWeight: 900, color: 'var(--accent)', background: 'rgba(15,64,152,0.06)', padding: '0.5rem 1rem', borderRadius: 10 }}>
                    {filteredPartners.length} Active Logistics Nodes
                </div>
            </div>

            <div className="data-table-wrapper">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th style={{ paddingLeft: '2rem' }}>{mode === 'origins' ? 'Destination City' : 'Origin Hub'}</th>
                            <th><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Plane size={14}/> AIR</div></th>
                            <th className="desktop-only"><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Ship size={14}/> SEA</div></th>
                            <th className="desktop-only"><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Truck size={14}/> ROAD</div></th>
                            <th style={{ textAlign: 'right', paddingRight: '2rem' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredPartners.length === 0 ? (
                            <tr>
                                <td colSpan={5} style={{ padding: '6rem 0', textAlign: 'center' }}>
                                    <Search size={48} style={{ marginBottom: '1.5rem', opacity: 0.1, margin: '0 auto' }} />
                                    <p style={{ fontWeight: 800, color: 'var(--text-muted)' }}>No routes matched your query</p>
                                </td>
                            </tr>
                        ) : filteredPartners.map((partner: any) => {
                            const rate = rates.find(r => 
                                mode === 'origins' ? r.destination_id === partner.id : r.origin_id === partner.id
                            );
                            const isSaving = saving === partner.id;

                            return (
                                <tr key={partner.id} style={{ opacity: isSaving ? 0.6 : 1 }}>
                                    <td style={{ paddingLeft: '2rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--bg-secondary)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)', flexShrink: 0 }}>
                                                {mode === 'origins' ? <MapPin size={18} /> : <Building2 size={18} />}
                                            </div>
                                            <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{partner.name}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <div style={{ position: 'relative' }}>
                                                <DollarSign size={12} style={{ position: 'absolute', left: 8, top: 12, color: 'var(--text-muted)' }} />
                                                <input 
                                                    className="quick-input" 
                                                    type="number" 
                                                    defaultValue={rate?.air_rate_per_kg || ''} 
                                                    onBlur={(e) => handleQuickUpdate(partner.id, 'air_rate_per_kg', parseFloat(e.target.value) || 0)}
                                                    placeholder="0.00"
                                                    style={{ paddingLeft: '1.75rem', fontWeight: 900 }}
                                                />
                                            </div>
                                            {rate && <button onClick={() => handleApplyToAll('air', partner.id)} title="Apply to all" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.5rem', borderRadius: 8, transition: 'all 0.2s' }} className="hover-bg"><RefreshCcw size={14} /></button>}
                                        </div>
                                    </td>
                                    <td className="desktop-only">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <div style={{ position: 'relative' }}>
                                                <DollarSign size={12} style={{ position: 'absolute', left: 8, top: 12, color: 'var(--text-muted)' }} />
                                                <input 
                                                    className="quick-input" 
                                                    type="number" 
                                                    defaultValue={rate?.sea_rate_per_kg || ''} 
                                                    onBlur={(e) => handleQuickUpdate(partner.id, 'sea_rate_per_kg', parseFloat(e.target.value) || 0)}
                                                    placeholder="0.00"
                                                    style={{ paddingLeft: '1.75rem', fontWeight: 900 }}
                                                />
                                            </div>
                                            {rate && <button onClick={() => handleApplyToAll('sea', partner.id)} title="Apply to all" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.5rem', borderRadius: 8, transition: 'all 0.2s' }} className="hover-bg"><RefreshCcw size={14} /></button>}
                                        </div>
                                    </td>
                                    <td className="desktop-only">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <div style={{ position: 'relative' }}>
                                                <DollarSign size={12} style={{ position: 'absolute', left: 8, top: 12, color: 'var(--text-muted)' }} />
                                                <input 
                                                    className="quick-input" 
                                                    type="number" 
                                                    defaultValue={rate?.road_rate_per_kg || ''} 
                                                    onBlur={(e) => handleQuickUpdate(partner.id, 'road_rate_per_kg', parseFloat(e.target.value) || 0)}
                                                    placeholder="0.00"
                                                    style={{ paddingLeft: '1.75rem', fontWeight: 900 }}
                                                />
                                            </div>
                                            {rate && <button onClick={() => handleApplyToAll('road', partner.id)} title="Apply to all" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.5rem', borderRadius: 8, transition: 'all 0.2s' }} className="hover-bg"><RefreshCcw size={14} /></button>}
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'right', paddingRight: '2rem' }}>
                                        <button className="btn btn-secondary btn-sm" onClick={() => onSetPrice(partner.id)} style={{ width: 38, height: 38, padding: 0, borderRadius: 10 }}>
                                            <Settings2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <style jsx>{`
                .quick-input { width: 90px; height: 38px; border: 1px solid var(--border); border-radius: 10px; outline: none; font-size: 0.95rem; background: var(--bg-secondary); transition: all 0.2s; }
                .quick-input:focus { border-color: var(--accent); background: white; box-shadow: 0 0 0 4px rgba(15, 64, 152, 0.05); }
                .hover-bg:hover { background: var(--bg-secondary); color: var(--accent); }
            `}</style>
        </div>
    );
}

// ── Full Page Rate Editor Component ──────────────────────────────────────
function FullPageRateEditor({ hub, city, onBack }: { hub: Location, city: Location, onBack: () => void }) {
    const [rate, setRate] = useState<Partial<Rate>>(EMPTY_RATE(hub.id, city.id));
    const [categoryOverrides, setCategoryOverrides] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                const [catsRes, ratesRes] = await Promise.all([
                    api.get('/admin/categories'),
                    api.get(`/locations/${city.id}/rates`)
                ]);
                
                setCategories(catsRes.data.data.categories);
                
                const found = ratesRes.data.data.find((r: any) => r.origin_id === hub.id);
                if (found) {
                    setRate({ ...EMPTY_RATE(hub.id, city.id), ...found });
                    // Fetch overrides for this specific route
                    const ovRes = await api.get(`/locations/${city.id}/rates?routeId=${found.id}`);
                    setCategoryOverrides(ovRes.data.overrides || []);
                }
            } catch (e) {
                toast.error('Failed to sync matrix data');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [hub.id, city.id]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.post('/locations/rates', { 
                ...rate, 
                category_overrides: categoryOverrides 
            });
            toast.success('Logistics Matrix Synchronized');
            onBack();
        } catch (e) {
            toast.error('Failed to save rate matrix');
        } finally {
            setSaving(false);
        }
    };

    const addOverride = (catId: string) => {
        if (categoryOverrides.some(o => o.category_id === catId)) return;
        setCategoryOverrides([...categoryOverrides, {
            category_id: catId,
            air_rate_per_kg: rate.air_rate_per_kg,
            air_rate_type: rate.air_rate_type,
            air_upto_weight: rate.air_upto_weight,
            sea_rate_per_kg: rate.sea_rate_per_kg,
            sea_rate_type: rate.sea_rate_type,
            sea_upto_weight: rate.sea_upto_weight,
            road_rate_per_kg: rate.road_rate_per_kg,
            road_rate_type: rate.road_rate_type,
            road_upto_weight: rate.road_upto_weight
        }]);
    };

    const removeOverride = (catId: string) => {
        setCategoryOverrides(categoryOverrides.filter(o => o.category_id !== catId));
    };

    const updateOverride = (catId: string, data: any) => {
        setCategoryOverrides(categoryOverrides.map(o => o.category_id === catId ? { ...o, ...data } : o));
    };

    if (loading) return <div style={{ padding: '5rem', textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>;

    const RateModeSelector = ({ mode, currentType, currentWeight, onUpdate, compact = false }: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? '0.6rem' : '1rem', padding: compact ? '1rem' : '1.5rem', background: 'var(--bg-secondary)', borderRadius: compact ? 16 : 24, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                    onClick={() => onUpdate({ [`${mode}_rate_type`]: 'per_kg' })}
                    style={{ flex: 1, height: compact ? 36 : 44, borderRadius: 10, border: 'none', fontSize: '0.75rem', fontWeight: 900, cursor: 'pointer', background: currentType === 'per_kg' ? 'var(--accent)' : 'white', color: currentType === 'per_kg' ? 'white' : 'var(--text-muted)', transition: 'all 0.2s', boxShadow: currentType === 'per_kg' ? '0 4px 12px rgba(15, 64, 152, 0.2)' : 'none' }}
                >
                    PER KG
                </button>
                <button 
                    onClick={() => onUpdate({ [`${mode}_rate_type`]: 'upto' })}
                    style={{ flex: 1, height: compact ? 36 : 44, borderRadius: 10, border: 'none', fontSize: '0.75rem', fontWeight: 900, cursor: 'pointer', background: currentType === 'upto' ? 'var(--accent)' : 'white', color: currentType === 'upto' ? 'white' : 'var(--text-muted)', transition: 'all 0.2s', boxShadow: currentType === 'upto' ? '0 4px 12px rgba(15, 64, 152, 0.2)' : 'none' }}
                >
                    UPTO
                </button>
            </div>
            {currentType === 'upto' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingTop: '0.6rem', borderTop: '1px dashed var(--border)' }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ position: 'relative' }}>
                            <Weight size={14} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
                            <input className="input" type="number" placeholder="KG" style={{ height: 38, paddingLeft: '2.5rem', borderRadius: 10, fontSize: '0.9rem', fontWeight: 800, background: 'white' }} value={currentWeight} onChange={e => onUpdate({ [`${mode}_upto_weight`]: parseFloat(e.target.value) || 0 })} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                
                {/* GLOBAL ROUTE BASE RATES */}
                <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white', borderRadius: 32, border: '1px solid var(--border)' }}>
                    <div style={{ padding: '1.5rem 2.5rem', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <Globe2 size={24} color="var(--accent)" />
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 900, letterSpacing: '-0.02em', margin: 0 }}>Standard Route Tariffs</h3>
                    </div>

                    <div style={{ padding: 'clamp(1.5rem, 4vw, 3rem)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '2.5rem' }}>
                            {/* Air */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(59,130,246,0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Plane size={22} />
                                    </div>
                                    <span style={{ fontWeight: 900, fontSize: '1.1rem', letterSpacing: '-0.01em' }}>Air Logistics</span>
                                </div>
                                <RateModeSelector mode="air" currentType={rate.air_rate_type} currentWeight={rate.air_upto_weight} onUpdate={(val: any) => setRate({ ...rate, ...val })} />
                                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem' }}>
                                    <div className="form-group">
                                        <label className="label-mini">Rate (USD)</label>
                                        <div style={{ position: 'relative' }}>
                                            <DollarSign size={16} style={{ position: 'absolute', left: 14, top: 12, color: '#3b82f6' }} />
                                            <input className="input-premium" type="number" style={{ height: 44, paddingLeft: '2.5rem', fontSize: '1.1rem' }} value={rate.air_rate_per_kg || ''} onChange={e => setRate({ ...rate, air_rate_per_kg: parseFloat(e.target.value) || 0 })} />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label className="label-mini">Days</label>
                                        <input className="input-premium" type="number" style={{ height: 44, fontSize: '1.1rem', textAlign: 'center' }} value={rate.air_days || ''} onChange={e => setRate({ ...rate, air_days: parseInt(e.target.value) || 0 })} />
                                    </div>
                                </div>
                            </div>
                            {/* Sea */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Ship size={22} />
                                    </div>
                                    <span style={{ fontWeight: 900, fontSize: '1.1rem', letterSpacing: '-0.01em' }}>Ocean Freight</span>
                                </div>
                                <RateModeSelector mode="sea" currentType={rate.sea_rate_type} currentWeight={rate.sea_upto_weight} onUpdate={(val: any) => setRate({ ...rate, ...val })} />
                                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem' }}>
                                    <div className="form-group">
                                        <label className="label-mini">Rate (USD)</label>
                                        <div style={{ position: 'relative' }}>
                                            <DollarSign size={16} style={{ position: 'absolute', left: 14, top: 12, color: '#8b5cf6' }} />
                                            <input className="input-premium" type="number" style={{ height: 44, paddingLeft: '2.5rem', fontSize: '1.1rem' }} value={rate.sea_rate_per_kg || ''} onChange={e => setRate({ ...rate, sea_rate_per_kg: parseFloat(e.target.value) || 0 })} />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label className="label-mini">Days</label>
                                        <input className="input-premium" type="number" style={{ height: 44, fontSize: '1.1rem', textAlign: 'center' }} value={rate.sea_days || ''} onChange={e => setRate({ ...rate, sea_days: parseInt(e.target.value) || 0 })} />
                                    </div>
                                </div>
                            </div>
                            {/* Road */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(16,185,129,0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Truck size={22} />
                                    </div>
                                    <span style={{ fontWeight: 900, fontSize: '1.1rem', letterSpacing: '-0.01em' }}>Road Network</span>
                                </div>
                                <RateModeSelector mode="road" currentType={rate.road_rate_type} currentWeight={rate.road_upto_weight} onUpdate={(val: any) => setRate({ ...rate, ...val })} />
                                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem' }}>
                                    <div className="form-group">
                                        <label className="label-mini">Rate (USD)</label>
                                        <div style={{ position: 'relative' }}>
                                            <DollarSign size={16} style={{ position: 'absolute', left: 14, top: 12, color: '#10b981' }} />
                                            <input className="input-premium" type="number" style={{ height: 44, paddingLeft: '2.5rem', fontSize: '1.1rem' }} value={rate.road_rate_per_kg || ''} onChange={e => setRate({ ...rate, road_rate_per_kg: parseFloat(e.target.value) || 0 })} />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label className="label-mini">Days</label>
                                        <input className="input-premium" type="number" style={{ height: 44, fontSize: '1.1rem', textAlign: 'center' }} value={rate.road_days || ''} onChange={e => setRate({ ...rate, road_days: parseInt(e.target.value) || 0 })} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CATEGORY OVERRIDES */}
                <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white', borderRadius: 32, border: '1px solid var(--border)' }}>
                    <div style={{ padding: '1.5rem 2.5rem', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <Sparkle size={24} color="var(--accent)" />
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 900, letterSpacing: '-0.02em', margin: 0 }}>Special Category Overrides</h3>
                        </div>
                        <div style={{ position: 'relative', width: '100%', maxWidth: '240px' }}>
                            <select 
                                className="input" 
                                style={{ height: 42, borderRadius: 12, paddingLeft: '1rem', paddingRight: '2.5rem', border: '1px solid var(--border)', fontWeight: 800, fontSize: '0.85rem', background: 'white', appearance: 'none' }}
                                onChange={(e) => { if (e.target.value) addOverride(e.target.value); e.target.value = ''; }}
                                value=""
                            >
                                <option value="">+ Add Specialized Override</option>
                                {categories.filter(c => !categoryOverrides.some(o => o.category_id === c.id)).map(c => (
                                    <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                                ))}
                            </select>
                            <ChevronDown size={16} style={{ position: 'absolute', right: 12, top: 13, color: 'var(--text-muted)', pointerEvents: 'none' }} />
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {categoryOverrides.length === 0 ? (
                            <div style={{ padding: '6rem 2rem', textAlign: 'center', opacity: 0.4 }}>
                                <AlertTriangle size={56} style={{ marginBottom: '1.5rem', margin: '0 auto' }} />
                                <h4 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>No Specialized Overrides</h4>
                                <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-muted)', marginTop: '0.5rem' }}>Standard route rates will apply to all cargo classifications.</p>
                            </div>
                        ) : categoryOverrides.map((ov) => {
                            const cat = categories.find(c => c.id === ov.category_id);
                            return (
                                <div key={ov.category_id} className="fade-in" style={{ padding: 'clamp(1.5rem, 4vw, 3rem)', borderBottom: '1px solid var(--border)', background: 'rgba(15, 64, 152, 0.01)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1.5rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                                            <div style={{ width: 60, height: 60, borderRadius: 16, background: 'white', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', boxShadow: '0 8px 24px rgba(0,0,0,0.05)' }}>
                                                {cat?.icon || '📦'}
                                            </div>
                                            <div>
                                                <h4 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0, letterSpacing: '-0.02em' }}>{cat?.name} Override</h4>
                                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '0.2rem' }}>Custom tariffs for specialized cargo architecture.</p>
                                            </div>
                                        </div>
                                        <button className="btn btn-sm" onClick={() => removeOverride(ov.category_id)} style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: 'none', borderRadius: 12, fontWeight: 900, height: 40, padding: '0 1.5rem' }}>Remove Override</button>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '2rem' }}>
                                        {/* Air Override */}
                                        <div style={{ padding: '1.75rem', background: 'white', borderRadius: 24, border: '1px solid var(--border)', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                                                <Plane size={18} color="#3b82f6" />
                                                <span style={{ fontSize: '0.85rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Air Parameters</span>
                                            </div>
                                            <RateModeSelector compact mode="air" currentType={ov.air_rate_type} currentWeight={ov.air_upto_weight} onUpdate={(val: any) => updateOverride(ov.category_id, val)} />
                                            <div style={{ position: 'relative', marginTop: '1rem' }}>
                                                <DollarSign size={18} style={{ position: 'absolute', left: 16, top: 13, color: '#3b82f6' }} />
                                                <input className="input-premium" type="number" style={{ height: 48, paddingLeft: '3rem', fontSize: '1.25rem' }} value={ov.air_rate_per_kg || ''} onChange={e => updateOverride(ov.category_id, { air_rate_per_kg: parseFloat(e.target.value) || 0 })} />
                                            </div>
                                        </div>
                                        {/* Sea Override */}
                                        <div style={{ padding: '1.75rem', background: 'white', borderRadius: 24, border: '1px solid var(--border)', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                                                <Ship size={18} color="#8b5cf6" />
                                                <span style={{ fontSize: '0.85rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ocean Parameters</span>
                                            </div>
                                            <RateModeSelector compact mode="sea" currentType={ov.sea_rate_type} currentWeight={ov.sea_upto_weight} onUpdate={(val: any) => updateOverride(ov.category_id, val)} />
                                            <div style={{ position: 'relative', marginTop: '1rem' }}>
                                                <DollarSign size={18} style={{ position: 'absolute', left: 16, top: 13, color: '#8b5cf6' }} />
                                                <input className="input-premium" type="number" style={{ height: 48, paddingLeft: '3rem', fontSize: '1.25rem' }} value={ov.sea_rate_per_kg || ''} onChange={e => updateOverride(ov.category_id, { sea_rate_per_kg: parseFloat(e.target.value) || 0 })} />
                                            </div>
                                        </div>
                                        {/* Road Override */}
                                        <div style={{ padding: '1.75rem', background: 'white', borderRadius: 24, border: '1px solid var(--border)', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                                                <Truck size={18} color="#10b981" />
                                                <span style={{ fontSize: '0.85rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Road Parameters</span>
                                            </div>
                                            <RateModeSelector compact mode="road" currentType={ov.road_rate_type} currentWeight={ov.road_upto_weight} onUpdate={(val: any) => updateOverride(ov.category_id, val)} />
                                            <div style={{ position: 'relative', marginTop: '1rem' }}>
                                                <DollarSign size={18} style={{ position: 'absolute', left: 16, top: 13, color: '#10b981' }} />
                                                <input className="input-premium" type="number" style={{ height: 48, paddingLeft: '3rem', fontSize: '1.25rem' }} value={ov.road_rate_per_kg || ''} onChange={e => updateOverride(ov.category_id, { road_rate_per_kg: parseFloat(e.target.value) || 0 })} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* FINAL SYNC BUTTON */}
                <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem 0' }}>
                    <button 
                        className="btn btn-primary" 
                        onClick={handleSave} 
                        disabled={saving} 
                        style={{ height: 64, borderRadius: 100, padding: '0 4.5rem', fontSize: '1.25rem', fontWeight: 900, boxShadow: '0 20px 40px -10px rgba(15, 64, 152, 0.4)', display: 'flex', alignItems: 'center', gap: '1rem', width: '100%', maxWidth: 'max-content' }}
                    >
                        <Save size={24} />
                        {saving ? 'Synchronizing Intelligence...' : 'Finalize Logistics Matrix'}
                    </button>
                </div>
            </div>

            <style jsx>{`
                .label-mini { display: block; font-size: 0.7rem; fontWeight: 900; color: var(--text-muted); text-transform: uppercase; margin-bottom: 0.5rem; letter-spacing: 0.05em; }
                .input-premium { width: 100%; border: 1px solid var(--border); border-radius: 12px; outline: none; font-weight: 800; background: var(--bg-secondary); transition: all 0.2s; }
                .input-premium:focus { border-color: var(--accent); background: white; box-shadow: 0 0 0 4px rgba(15, 64, 152, 0.06); }
            `}</style>
        </div>
    );
}

// ── Editor Modal Component ──────────────────
function EditorModal({ target, onClose, onSave, processing }: any) {
    const [data, setData] = useState<Partial<Location>>({});
    useEffect(() => { if (target) setData(target); }, [target]);
    if (!target) return null;

    const isCountry = data.type?.includes('country');
    const typeLabel = (data.type || '').split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100000, padding: '1.5rem' }}>
            <div className="card fade-in" style={{ width: '100%', maxWidth: 480, padding: '2.5rem', borderRadius: 36, boxShadow: '0 50px 100px -20px rgba(0, 0, 0, 0.3)', background: '#fff', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                    <div>
                        <h2 style={{ fontSize: '1.6rem', fontWeight: 900, letterSpacing: '-0.03em', margin: 0 }}>{data.id ? 'Edit Entry' : `New ${typeLabel}`}</h2>
                        <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginTop: '0.3rem' }}>Operational Hub Provisioning</p>
                    </div>
                    <button onClick={onClose} className="menu-toggle"><X size={26} /></button>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                    <div>
                        <label className="label">Display Identity</label>
                        <input className="input" style={{ height: 56, borderRadius: 14, fontWeight: 700, background: 'var(--bg-secondary)', fontSize: '1.1rem' }} value={data.name || ''} onChange={e => setData({ ...data, name: e.target.value })} placeholder="e.g. United Kingdom" />
                    </div>

                    {isCountry && (
                        <div>
                            <label className="label">ISO Protocol Code</label>
                            <input className="input" style={{ height: 56, borderRadius: 14, fontWeight: 900, textAlign: 'center', fontSize: '1.5rem', background: 'var(--bg-secondary)', letterSpacing: '0.15em', textTransform: 'uppercase' }} value={data.country_code || ''} onChange={e => setData({ ...data, country_code: e.target.value.toUpperCase() })} maxLength={2} placeholder="UK" />
                        </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem', background: 'var(--bg-secondary)', borderRadius: 20, cursor: 'pointer', border: '1px solid var(--border)', transition: 'all 0.2s' }} onClick={() => setData({ ...data, is_active: !data.is_active })}>
                        <div>
                            <p style={{ fontWeight: 900, fontSize: '0.95rem', margin: 0 }}>Active Status</p>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '0.1rem' }}>Visible in logistics engine</p>
                        </div>
                        <div style={{ width: 48, height: 26, borderRadius: 20, background: data.is_active ? 'var(--accent)' : 'var(--border)', position: 'relative', transition: 'all 0.3s' }}>
                            <div style={{ position: 'absolute', top: 4, left: data.is_active ? 26 : 4, width: 18, height: 18, borderRadius: '50%', background: 'white', boxShadow: '0 2px 6px rgba(0,0,0,0.15)', transition: 'all 0.3s' }} />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                        <button className="btn btn-secondary" style={{ flex: 1, height: 56, borderRadius: 14, fontWeight: 800 }} onClick={onClose}>Cancel</button>
                        <button className="btn btn-primary" style={{ flex: 2, height: 56, borderRadius: 14, fontWeight: 900, boxShadow: '0 10px 20px rgba(15, 64, 152, 0.2)' }} onClick={() => onSave(data)} disabled={processing}>
                            {processing ? 'Processing...' : 'Sync Details'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
