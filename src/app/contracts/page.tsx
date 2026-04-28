'use client';

import { useEffect, useState, useCallback } from 'react';
import { 
    FileText, Plus, Search, Filter, 
    Calendar, User, ShieldCheck, CheckCircle, 
    XCircle, Clock, AlertCircle, Download,
    Edit2, Trash2, MoreVertical, FileSignature,
    Briefcase, Building2, MapPin, Hash, Key
} from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

const CONTRACT_TYPES: Record<string, { label: string; color: string; bg: string }> = {
    employment: { label: 'Employment', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
    partnership: { label: 'Partnership', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' },
    lease: { label: 'Asset Lease', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
    service: { label: 'Service Agreement', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
};

export default function ContractsManagementPage() {
    const [contracts, setContracts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [editingContract, setEditingContract] = useState<any>(null);

    // Form state
    const [formData, setFormData] = useState({
        user_id: '',
        contract_number: '',
        type: 'employment',
        start_date: '',
        end_date: '',
        terms: '',
        file_url: '',
        status: 'pending'
    });

    const [staff, setStaff] = useState<any[]>([]);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [contractsRes, staffRes] = await Promise.all([
                api.get('/admin/contracts'),
                api.get('/admin/system/admins')
            ]);
            setContracts(contractsRes.data.data || []);
            setStaff(staffRes.data.data || []);
        } catch (e) {
            toast.error('Failed to load contract data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const filteredContracts = contracts.filter(c => {
        const matchesSearch = (c.contract_number + c.user_name + c.user_email).toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const openModal = (contract?: any) => {
        if (contract) {
            setEditingContract(contract);
            setFormData({
                user_id: contract.user_id,
                contract_number: contract.contract_number,
                type: contract.type,
                start_date: contract.start_date ? new Date(contract.start_date).toISOString().split('T')[0] : '',
                end_date: contract.end_date ? new Date(contract.end_date).toISOString().split('T')[0] : '',
                terms: contract.terms || '',
                file_url: contract.file_url || '',
                status: contract.status
            });
        } else {
            setEditingContract(null);
            setFormData({
                user_id: '',
                contract_number: `CON-${Date.now().toString().slice(-6)}`,
                type: 'employment',
                start_date: new Date().toISOString().split('T')[0],
                end_date: '',
                terms: '',
                file_url: '',
                status: 'pending'
            });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingContract) {
                await api.patch(`/admin/contracts/${editingContract.id}`, formData);
                toast.success('Contract updated');
            } else {
                await api.post('/admin/contracts', formData);
                toast.success('Contract registered');
            }
            setShowModal(false);
            loadData();
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Action failed');
        }
    };

    const statusConfig: Record<string, { color: string; bg: string; icon: any }> = {
        active: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', icon: CheckCircle },
        expired: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', icon: AlertCircle },
        terminated: { color: '#64748b', bg: 'rgba(100, 116, 139, 0.1)', icon: XCircle },
        pending: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', icon: Clock }
    };

    return (
        <div className="fade-in" style={{ padding: 'clamp(1rem, 3vw, 2.5rem)', maxWidth: 1200, margin: '0 auto' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', flexWrap: 'wrap', gap: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: 'clamp(1.75rem, 5vw, 2.5rem)', fontWeight: 900, letterSpacing: '-0.04em', display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
                        <FileSignature className="text-accent" size={clampSize(24, 32)} />
                        Legal Contracts
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', fontWeight: 600, marginTop: '0.4rem', margin: 0 }}>
                        Maintain legal and operational agreements for staff, riders, and partners.
                    </p>
                </div>
                <button className="btn btn-primary" onClick={() => openModal()} style={{ height: 48, borderRadius: 14, padding: '0 1.5rem', fontWeight: 800, whiteSpace: 'nowrap' }}>
                    <Plus size={20} /> New Agreement
                </button>
            </header>

            {/* Overview Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                {[
                    { label: 'Total Agreements', value: contracts.length, icon: FileText, color: 'var(--accent)' },
                    { label: 'Active Contracts', value: contracts.filter(c => c.status === 'active').length, icon: CheckCircle, color: '#10b981' },
                    { label: 'Expiring Soon', value: contracts.filter(c => c.status === 'active' && c.end_date && new Date(c.end_date) < new Date(Date.now() + 30*24*60*60*1000)).length, icon: AlertCircle, color: '#f59e0b' },
                    { label: 'Pending Signature', value: contracts.filter(c => c.status === 'pending').length, icon: Clock, color: '#6366f1' },
                ].map((stat, i) => (
                    <div key={i} className="card" style={{ padding: '1.75rem', borderRadius: 28, display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{ width: 56, height: 56, borderRadius: 16, background: `${stat.color}10`, color: stat.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <stat.icon size={24} />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '1.75rem', fontWeight: 900, lineHeight: 1, letterSpacing: '-0.02em' }}>{stat.value}</h3>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.35rem' }}>{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* List Header / Filters */}
            <div className="card" style={{ marginBottom: '2rem', padding: '1.25rem', borderRadius: 24, display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 2, minWidth: 'min(100%, 350px)' }}>
                    <Search size={18} style={{ position: 'absolute', left: 16, top: 14, color: 'var(--text-muted)', opacity: 0.7 }} />
                    <input 
                        className="input" style={{ paddingLeft: '3.25rem', height: 48, borderRadius: 14, border: 'none', background: 'var(--bg-secondary)', fontWeight: 600 }} 
                        placeholder="Search by contract #, name, or email..."
                        value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
                <div style={{ display: 'flex', gap: '0.4rem', background: 'var(--bg-secondary)', padding: '0.3rem', borderRadius: 12, flexWrap: 'wrap' }}>
                    {['all', 'active', 'pending', 'expired'].map(s => (
                        <button 
                            key={s}
                            className="btn btn-sm"
                            onClick={() => setStatusFilter(s)}
                            style={{ 
                                textTransform: 'capitalize', minWidth: 80, height: 36, borderRadius: 10,
                                background: statusFilter === s ? 'white' : 'transparent',
                                color: statusFilter === s ? 'var(--accent)' : 'var(--text-muted)',
                                fontWeight: 800, border: 'none', boxShadow: statusFilter === s ? '0 4px 12px rgba(0,0,0,0.08)' : 'none'
                            }}
                        >{s}</button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: 28 }}>
                <div className="data-table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th style={{ paddingLeft: '2rem' }}>Contract ID</th>
                                <th>Signatory</th>
                                <th className="desktop-only">Type</th>
                                <th>Status</th>
                                <th className="desktop-only">Validity</th>
                                <th style={{ paddingRight: '2rem', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} style={{ padding: '5rem 0', textAlign: 'center' }}><div className="spinner" /></td></tr>
                            ) : filteredContracts.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ padding: '6rem 0', textAlign: 'center' }}>
                                        <FileSignature size={48} style={{ margin: '0 auto 1.5rem', opacity: 0.1 }} />
                                        <p style={{ fontWeight: 800, color: 'var(--text-primary)' }}>No agreements match your filter</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredContracts.map((con) => {
                                    const status = statusConfig[con.status] || statusConfig.pending;
                                    const type = CONTRACT_TYPES[con.type] || CONTRACT_TYPES.employment;
                                    const isExpiring = con.end_date && new Date(con.end_date) < new Date(Date.now() + 30*24*60*60*1000);

                                    return (
                                        <tr key={con.id}>
                                            <td style={{ paddingLeft: '2rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--bg-secondary)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)', flexShrink: 0 }}>
                                                        <Hash size={18} />
                                                    </div>
                                                    <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.95rem', fontFamily: 'var(--font-mono)' }}>{con.contract_number}</span>
                                                </div>
                                            </td>

                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 900, flexShrink: 0 }}>
                                                        {con.user_name.charAt(0)}
                                                    </div>
                                                    <div style={{ minWidth: 0 }}>
                                                        <p style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)', margin: 0 }}>{con.user_name}</p>
                                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, margin: 0 }}>{con.user_email}</p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="desktop-only">
                                                <span style={{ fontSize: '0.75rem', fontWeight: 900, color: type.color, background: type.bg, padding: '0.4rem 0.8rem', borderRadius: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                    {type.label}
                                                </span>
                                            </td>

                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: status.color, fontSize: '0.8rem', fontWeight: 900, background: status.bg, padding: '0.4rem 0.8rem', borderRadius: 20, width: 'max-content' }}>
                                                    <status.icon size={14} />
                                                    <span style={{ textTransform: 'uppercase' }}>{con.status}</span>
                                                </div>
                                            </td>

                                            <td className="desktop-only">
                                                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                                    <p style={{ margin: 0 }}>Effective: {new Date(con.start_date).toLocaleDateString()}</p>
                                                    <p style={{ margin: 0, color: isExpiring ? '#ef4444' : 'var(--text-muted)', fontWeight: isExpiring ? 800 : 600 }}>
                                                        Term: {con.end_date ? new Date(con.end_date).toLocaleDateString() : 'Perpetual'}
                                                    </p>
                                                </div>
                                            </td>

                                            <td style={{ paddingRight: '2rem', textAlign: 'right' }}>
                                                <button onClick={() => openModal(con)} className="btn btn-secondary btn-sm" style={{ width: 36, height: 36, padding: 0, borderRadius: 10 }}>
                                                    <Edit2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Focused Island Modal */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <div 
                        style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(12px)' }} 
                        onClick={() => setShowModal(false)}
                    />
                    <div className="card fade-in" style={{ 
                        position: 'relative', width: '100%', maxWidth: '600px', 
                        padding: 0, overflow: 'hidden', borderRadius: 32, background: '#fff',
                        boxShadow: '0 40px 100px -20px rgba(0, 0, 0, 0.3)' 
                    }}>
                        <div style={{ padding: '2rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h2 style={{ fontSize: '1.35rem', fontWeight: 900, letterSpacing: '-0.02em' }}>{editingContract ? 'Amend Terms' : 'Register Agreement'}</h2>
                                <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginTop: '0.2rem' }}>Legal & Operational Framework</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="menu-toggle"><XCircle size={24} /></button>
                        </div>
                        <form onSubmit={handleSubmit} style={{ padding: '2rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label className="label">Signatory Identity</label>
                                    <select 
                                        className="input" required
                                        style={{ height: 48, borderRadius: 12, background: 'var(--bg-secondary)', fontWeight: 600 }}
                                        value={formData.user_id} onChange={e => setFormData({ ...formData, user_id: e.target.value })}
                                        disabled={!!editingContract}
                                    >
                                        <option value="">Select personnel...</option>
                                        {staff.map(s => <option key={s.id} value={s.id}>{s.name} ({s.role.toUpperCase()})</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="label">Legal Reference #</label>
                                    <input 
                                        className="input" required
                                        style={{ height: 48, borderRadius: 12, background: 'var(--bg-secondary)', fontWeight: 800 }}
                                        value={formData.contract_number} onChange={e => setFormData({ ...formData, contract_number: e.target.value })}
                                        disabled={!!editingContract}
                                    />
                                </div>
                                <div>
                                    <label className="label">Agreement Architecture</label>
                                    <select 
                                        className="input"
                                        style={{ height: 48, borderRadius: 12, background: 'var(--bg-secondary)', fontWeight: 600 }}
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                                    >
                                        {Object.entries(CONTRACT_TYPES).map(([k, v]) => (
                                            <option key={k} value={k}>{v.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="label">Effective Date</label>
                                    <input 
                                        type="date" className="input" required
                                        style={{ height: 48, borderRadius: 12, background: 'var(--bg-secondary)', fontWeight: 600 }}
                                        value={formData.start_date} onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="label">Expiry Boundary</label>
                                    <input 
                                        type="date" className="input"
                                        style={{ height: 48, borderRadius: 12, background: 'var(--bg-secondary)', fontWeight: 600 }}
                                        value={formData.end_date} onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                                    />
                                </div>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label className="label">Operational State</label>
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        {Object.keys(statusConfig).map(s => (
                                            <button 
                                                key={s} type="button"
                                                className="btn btn-sm"
                                                onClick={() => setFormData({ ...formData, status: s })}
                                                style={{ 
                                                    flex: 1, height: 36, fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', borderRadius: 10,
                                                    background: formData.status === s ? 'var(--accent)' : 'var(--bg-secondary)',
                                                    color: formData.status === s ? 'white' : 'var(--text-muted)', border: 'none'
                                                }}
                                            >{s}</button>
                                        ))}
                                    </div>
                                </div>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label className="label">Principal Terms & Directives</label>
                                    <textarea 
                                        className="input" style={{ minHeight: 120, borderRadius: 16, background: 'var(--bg-secondary)', padding: '1rem', fontWeight: 600, fontSize: '0.9rem', lineHeight: 1.5 }}
                                        placeholder="Outline the core parameters of this agreement..."
                                        value={formData.terms} onChange={e => setFormData({ ...formData, terms: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary" style={{ flex: 1, height: 52, borderRadius: 14, fontWeight: 800 }}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 2, height: 52, borderRadius: 14, fontWeight: 900, boxShadow: '0 10px 20px rgba(15, 64, 152, 0.2)' }}>
                                    {editingContract ? 'Apply Amendments' : 'Initialize Agreement'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function clampSize(min: number, max: number) {
    return `clamp(${min}px, 4vw, ${max}px)`;
}
