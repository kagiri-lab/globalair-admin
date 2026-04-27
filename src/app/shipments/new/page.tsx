'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
    ChevronLeft, Package, User, MapPin, Truck, 
    Plus, Trash2, Search, ArrowRight, Save, 
    AlertCircle, CheckCircle2, DollarSign
} from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function NewShipmentPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    
    // Data for dropdowns
    const [users, setUsers] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [searchUser, setSearchUser] = useState('');

    // Form State
    const [formData, setFormData] = useState({
        user_id: '',
        origin_id: '',
        destination_id: '',
        shipment_type: 'standard',
        transport_mode: 'air',
        pickup_address: '',
        pickup_city: '',
        pickup_country: '',
        pickup_contact_name: '',
        pickup_contact_phone: '',
        destination_address: '',
        destination_city: '',
        destination_country: '',
        destination_contact_name: '',
        destination_contact_phone: '',
        items: [
            { category_id: '', description: '', weight_kg: 1, quantity: 1, length_cm: 10, width_cm: 10, height_cm: 10 }
        ],
        notes: ''
    });

    const [quote, setQuote] = useState<any>(null);
    const [calculating, setCalculating] = useState(false);

    const [searching, setSearching] = useState(false);

    const [locations, setLocations] = useState<any>({ originCountries: [], originCities: [], destCountries: [], destCities: [] });
    const [selectedOriginCountry, setSelectedOriginCountry] = useState('');
    const [selectedDestCountry, setSelectedDestCountry] = useState('');

    useEffect(() => {
        // Fetch categories and locations on load
        api.get('/admin/categories').then(res => setCategories(res.data.data.categories));
        api.get('/admin/locations').then(res => {
            const all = res.data.data;
            setLocations({
                originCountries: all.filter((l: any) => l.type === 'origin_country' || (l.type === 'origin' && !l.parent_id)),
                originCities: all.filter((l: any) => l.type === 'origin' && l.parent_id),
                destCountries: all.filter((l: any) => l.type === 'destination_country'),
                destCities: all.filter((l: any) => l.type === 'destination_city' && l.parent_id),
            });
        });
    }, []);

    // Debounced Search for Users
    useEffect(() => {
        if (searchUser.length < 2) {
            setUsers([]);
            return;
        }

        const t = setTimeout(() => {
            setSearching(true);
            api.get(`/admin/users?search=${searchUser}&limit=10`)
                .then(res => setUsers(res.data.data.users))
                .catch(() => {})
                .finally(() => setSearching(false));
        }, 500);

        return () => clearTimeout(t);
    }, [searchUser]);

    const handleAddItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, { category_id: '', description: '', weight_kg: 1, quantity: 1, length_cm: 10, width_cm: 10, height_cm: 10 }]
        });
    };

    const handleRemoveItem = (index: number) => {
        const newItems = formData.items.filter((_, i) => i !== index);
        setFormData({ ...formData, items: newItems });
    };

    const updateItem = (index: number, field: string, value: any) => {
        const newItems = [...formData.items];
        (newItems[index] as any)[field] = value;
        setFormData({ ...formData, items: newItems });
    };

    const getQuote = async () => {
        if (!formData.origin_id || !formData.destination_id || formData.items.some(i => !i.category_id)) {
            toast.error('Please fill in origin, destination and item categories first');
            return;
        }
        setCalculating(true);
        try {
            const res = await api.post('/shipments/quote', formData);
            setQuote(res.data.data);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to calculate quote');
        } finally {
            setCalculating(false);
        }
    };

    const handleSubmit = async () => {
        // Basic validation
        if (!formData.pickup_address || !formData.pickup_city || !formData.destination_address || !formData.destination_city) {
            toast.error('Please complete all address details in Step 2');
            setStep(2);
            return;
        }

        setLoading(true);
        try {
            const res = await api.post('/shipments', formData);
            toast.success('Shipment created successfully!');
            router.push(`/shipments/${res.data.data.shipment.id}`);
        } catch (error: any) {
            const msgs = error.response?.data?.errors;
            if (Array.isArray(msgs)) {
                msgs.forEach((err: any) => toast.error(err.msg));
            } else {
                toast.error(error.response?.data?.message || 'Failed to create shipment');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fade-in" style={{ padding: '2rem', maxWidth: 900, margin: '0 auto' }}>
            {/* Breadcrumbs */}
            <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginBottom: '1.5rem', fontWeight: 600 }}>
                <ChevronLeft size={18} /> Back to Shipments
            </button>

            <div style={{ marginBottom: '2.5rem' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Create New Shipment</h1>
                <p style={{ color: 'var(--text-muted)' }}>Manually register a shipment for a customer.</p>
            </div>

            {/* Steps Indicator */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                {[1, 2, 3].map(s => (
                    <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: step >= s ? 'var(--accent)' : 'var(--border)', transition: 'background 0.3s' }} />
                ))}
            </div>

            <div className="card" style={{ padding: '2rem' }}>
                {step === 1 && (
                    <div className="fade-in">
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <User size={22} color="var(--accent)" /> 1. Select Customer
                        </h2>
                        
                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                            <label className="label">Search Customer</label>
                            <div style={{ position: 'relative' }}>
                                <Search size={18} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
                                <input 
                                    className="input" 
                                    style={{ paddingLeft: '2.75rem' }} 
                                    placeholder="Search by name or email..." 
                                    value={searchUser}
                                    onChange={e => setSearchUser(e.target.value)}
                                />
                            </div>
                        </div>

                        <div style={{ maxHeight: 300, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 12, minHeight: 120, display: 'flex', flexDirection: 'column' }}>
                            {searching ? (
                                <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><div className="spinner" /></div>
                            ) : users.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                                    <User size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.2 }} />
                                    <p style={{ fontSize: '0.85rem' }}>{searchUser.length < 2 ? 'Type at least 2 characters to search...' : 'No customers found.'}</p>
                                </div>
                            ) : (
                                users.map(u => (
                                    <div 
                                        key={u.id} 
                                        onClick={() => setFormData({ ...formData, user_id: u.id, pickup_contact_name: u.name, pickup_contact_phone: u.phone || '' })}
                                        style={{ 
                                            padding: '1rem', 
                                            borderBottom: '1px solid var(--border)', 
                                            cursor: 'pointer',
                                            background: formData.user_id === u.id ? 'rgba(15,64,152,0.05)' : 'transparent',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}
                                    >
                                        <div>
                                            <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>{u.name}</p>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{u.email}</p>
                                        </div>
                                        {formData.user_id === u.id && <CheckCircle2 size={20} color="var(--accent)" />}
                                    </div>
                                ))
                            )}
                        </div>

                        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                            <button className="btn btn-primary" disabled={!formData.user_id} onClick={() => setStep(2)}>
                                Next Step <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="fade-in">
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <MapPin size={22} color="var(--accent)" /> 2. Route & Service
                        </h2>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                            {/* Origin */}
                            <div>
                                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-secondary)' }}>PICKUP DETAILS</h3>
                                <div className="form-group">
                                    <label className="label">Origin Country</label>
                                    <select 
                                        className="input" 
                                        value={selectedOriginCountry} 
                                        onChange={e => {
                                            setSelectedOriginCountry(e.target.value);
                                            setFormData({ ...formData, origin_id: '', pickup_city: '', pickup_country: '' });
                                        }}
                                    >
                                        <option value="">Select Country</option>
                                        {locations.originCountries.map((l: any) => (
                                            <option key={l.id} value={l.id}>{l.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="label">Origin City</label>
                                    <select 
                                        className="input" 
                                        disabled={!selectedOriginCountry}
                                        value={formData.origin_id} 
                                        onChange={e => {
                                            const city = locations.originCities.find((l: any) => l.id === e.target.value);
                                            const country = locations.originCountries.find((l: any) => l.id === selectedOriginCountry);
                                            setFormData({ 
                                                ...formData, 
                                                origin_id: e.target.value,
                                                pickup_city: city?.name || '',
                                                pickup_country: country?.name || ''
                                            });
                                        }}
                                    >
                                        <option value="">Select City</option>
                                        {locations.originCities.filter((l: any) => l.parent_id === selectedOriginCountry).map((l: any) => (
                                            <option key={l.id} value={l.id}>{l.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="label">Pickup Address</label>
                                    <input className="input" value={formData.pickup_address} onChange={e => setFormData({ ...formData, pickup_address: e.target.value })} placeholder="Street, Building..." />
                                </div>
                            </div>

                            {/* Destination */}
                            <div>
                                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-secondary)' }}>DESTINATION DETAILS</h3>
                                <div className="form-group">
                                    <label className="label">Destination Country</label>
                                    <select 
                                        className="input" 
                                        value={selectedDestCountry} 
                                        onChange={e => {
                                            setSelectedDestCountry(e.target.value);
                                            setFormData({ ...formData, destination_id: '', destination_city: '', destination_country: '' });
                                        }}
                                    >
                                        <option value="">Select Country</option>
                                        {locations.destCountries.map((l: any) => (
                                            <option key={l.id} value={l.id}>{l.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="label">Destination City</label>
                                    <select 
                                        className="input" 
                                        disabled={!selectedDestCountry}
                                        value={formData.destination_id} 
                                        onChange={e => {
                                            const city = locations.destCities.find((l: any) => l.id === e.target.value);
                                            const country = locations.destCountries.find((l: any) => l.id === selectedDestCountry);
                                            setFormData({ 
                                                ...formData, 
                                                destination_id: e.target.value,
                                                destination_city: city?.name || '',
                                                destination_country: country?.name || ''
                                            });
                                        }}
                                    >
                                        <option value="">Select City</option>
                                        {locations.destCities.filter((l: any) => l.parent_id === selectedDestCountry).map((l: any) => (
                                            <option key={l.id} value={l.id}>{l.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="label">Delivery Address</label>
                                    <input className="input" value={formData.destination_address} onChange={e => setFormData({ ...formData, destination_address: e.target.value })} placeholder="Street, Apartment..." />
                                </div>
                            </div>
                        </div>

                        <div style={{ height: 1, background: 'var(--border)', margin: '2rem 0' }} />

                        <div className="form-group">
                            <label className="label">Transport Mode</label>
                            <select className="input" value={formData.transport_mode} onChange={e => setFormData({ ...formData, transport_mode: e.target.value })}>
                                <option value="air">✈️ Air Freight</option>
                                <option value="sea">🚢 Sea Freight</option>
                                <option value="road">🚛 Road Transport</option>
                            </select>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Select the primary method of transportation for this shipment.</p>
                        </div>

                        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between' }}>
                            <button className="btn btn-secondary" onClick={() => setStep(1)}>
                                Back
                            </button>
                            <button className="btn btn-primary" onClick={() => setStep(3)}>
                                Next Step <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="fade-in">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <Package size={22} color="var(--accent)" /> 3. Shipment Items
                            </h2>
                            <button className="btn btn-secondary btn-sm" onClick={handleAddItem}>
                                <Plus size={16} /> Add Another Item
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {formData.items.map((item, idx) => (
                                <div key={idx} className="card" style={{ padding: '1.25rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent)' }}>ITEM #{idx + 1}</span>
                                        {formData.items.length > 1 && (
                                            <button onClick={() => handleRemoveItem(idx)} style={{ color: 'var(--danger)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 2fr', gap: '1rem', marginBottom: '1rem' }}>
                                        <div className="form-group">
                                            <label className="label">Category</label>
                                            <select className="input" value={item.category_id} onChange={e => updateItem(idx, 'category_id', e.target.value)}>
                                                <option value="">Select Category</option>
                                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label className="label">Description</label>
                                            <input className="input" value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} placeholder="e.g. Spare parts, Documents..." />
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem' }}>
                                        <div className="form-group">
                                            <label className="label">Qty</label>
                                            <input type="number" className="input" value={item.quantity} onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value))} />
                                        </div>
                                        <div className="form-group">
                                            <label className="label">Weight (Kg)</label>
                                            <input type="number" className="input" value={item.weight_kg} onChange={e => updateItem(idx, 'weight_kg', parseFloat(e.target.value))} />
                                        </div>
                                        <div className="form-group">
                                            <label className="label">L (cm)</label>
                                            <input type="number" className="input" value={item.length_cm} onChange={e => updateItem(idx, 'length_cm', parseInt(e.target.value))} />
                                        </div>
                                        <div className="form-group">
                                            <label className="label">W (cm)</label>
                                            <input type="number" className="input" value={item.width_cm} onChange={e => updateItem(idx, 'width_cm', parseInt(e.target.value))} />
                                        </div>
                                        <div className="form-group">
                                            <label className="label">H (cm)</label>
                                            <input type="number" className="input" value={item.height_cm} onChange={e => updateItem(idx, 'height_cm', parseInt(e.target.value))} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#f8fafc', borderRadius: 16, border: '1px dashed #cbd5e1' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>Estimated Pricing</h4>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Calculation based on weight, dimensions, and route.</p>
                                </div>
                                {quote ? (
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent)' }}>USD {(quote.total_price || 0).toLocaleString()}</p>
                                        <p style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700 }}>EST. {quote.estimated_days || 7} DAYS</p>
                                    </div>
                                ) : (
                                    <button className="btn btn-secondary" onClick={getQuote} disabled={calculating}>
                                        {calculating ? 'Calculating...' : <><DollarSign size={16} /> Get Quote</>}
                                    </button>
                                )}
                            </div>
                        </div>

                        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between' }}>
                            <button className="btn btn-secondary" onClick={() => setStep(2)}>
                                Back
                            </button>
                            <button className="btn btn-primary" style={{ padding: '0 2rem' }} onClick={handleSubmit} disabled={loading}>
                                {loading ? 'Creating...' : <><Save size={18} /> Create Shipment</>}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
