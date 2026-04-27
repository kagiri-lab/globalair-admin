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
        <div style={{ padding: '2rem', maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: 900, letterSpacing: '-0.025em', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <FileSignature className="text-accent" size={32} />
                        Contract Management
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem' }}>
                        Maintain legal and operational agreements for staff, riders, and partners.
                    </p>
                </div>
                <button className="btn btn-primary" onClick={() => openModal()}>
                    <Plus size={18} /> New Contract
                </button>
            </div>

            {/* Overview Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                {[
                    { label: 'Total Agreements', value: contracts.length, icon: FileText, color: 'var(--accent)' },
                    { label: 'Active Contracts', value: contracts.filter(c => c.status === 'active').length, icon: CheckCircle, color: '#10b981' },
                    { label: 'Expiring Soon', value: contracts.filter(c => c.status === 'active' && c.end_date && new Date(c.end_date) < new Date(Date.now() + 30*24*60*60*1000)).length, icon: AlertCircle, color: '#f59e0b' },
                    { label: 'Pending Signature', value: contracts.filter(c => c.status === 'pending').length, icon: Clock, color: '#6366f1' },
                ].map((stat, i) => (
                    <div key={i} className="stat-card">
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: `${stat.color}15`, color: stat.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <stat.icon size={22} />
                        </div>
                        <div>
                            <p style={{ fontSize: '1.5rem', fontWeight: 800 }}>{stat.value}</p>
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* List Header / Filters */}
            <div className="card" style={{ marginBottom: '1rem', padding: '0.75rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input 
                        className="input" style={{ paddingLeft: '2.5rem' }} 
                        placeholder="Search by contract #, name, or email..."
                        value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                    {['all', 'active', 'pending', 'expired'].map(s => (
                        <button 
                            key={s}
                            className={`btn ${statusFilter === s ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                            onClick={() => setStatusFilter(s)}
                            style={{ textTransform: 'capitalize' }}
                        >{s}</button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1.2fr 2fr 1fr 1fr 1fr 60px',
                    gap: '1rem', padding: '0.75rem 1.5rem', background: 'var(--bg-secondary)',
                    borderBottom: '1px solid var(--border)', fontSize: '0.7rem', fontWeight: 800,
                    color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em'
                }}>
                    <span>Contract ID</span>
                    <span>Signatory</span>
                    <span>Type</span>
                    <span>Status</span>
                    <span>Validity</span>
                    <span />
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '5rem' }}><div className="spinner" /></div>
                ) : filteredContracts.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-muted)' }}>
                        <FileSignature size={48} style={{ margin: '0 auto 1rem', opacity: 0.1 }} />
                        <p>No contracts found</p>
                    </div>
                ) : (
                    filteredContracts.map((con, i) => {
                        const status = statusConfig[con.status] || statusConfig.pending;
                        const type = CONTRACT_TYPES[con.type] || CONTRACT_TYPES.employment;
                        const isExpiring = con.end_date && new Date(con.end_date) < new Date(Date.now() + 30*24*60*60*1000);

                        return (
                            <div key={con.id} className="fade-in" style={{ 
                                display: 'grid', gridTemplateColumns: '1.2fr 2fr 1fr 1fr 1fr 60px',
                                gap: '1rem', padding: '1rem 1.5rem', alignItems: 'center',
                                borderBottom: i < filteredContracts.length - 1 ? '1px solid var(--border)' : 'none'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg-secondary)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Hash size={16} />
                                    </div>
                                    <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.875rem' }}>{con.contract_number}</span>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>
                                        {con.user_name.charAt(0)}
                                    </div>
                                    <div style={{ minWidth: 0 }}>
                                        <p style={{ fontWeight: 700, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{con.user_name}</p>
                                        <p style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>{con.user_email}</p>
                                    </div>
                                </div>

                                <div>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: type.color, background: type.bg, padding: '0.2rem 0.6rem', borderRadius: 6 }}>
                                        {type.label}
                                    </span>
                                </div>

                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: status.color, fontSize: '0.75rem', fontWeight: 800 }}>
                                        <status.icon size={14} />
                                        <span style={{ textTransform: 'capitalize' }}>{con.status}</span>
                                    </div>
                                </div>

                                <div style={{ fontSize: '0.725rem' }}>
                                    <p style={{ fontWeight: 700 }}>Starts: {new Date(con.start_date).toLocaleDateString()}</p>
                                    <p style={{ color: isExpiring ? 'var(--danger)' : 'var(--text-muted)', fontWeight: isExpiring ? 700 : 500 }}>
                                        Ends: {con.end_date ? new Date(con.end_date).toLocaleDateString() : 'Perpetual'}
                                    </p>
                                </div>

                                <div style={{ textAlign: 'right' }}>
                                    <button onClick={() => openModal(con)} className="btn btn-secondary btn-sm" style={{ padding: '0.4rem', borderRadius: 8 }}>
                                        <Edit2 size={14} />
                                    </button>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div 
                        style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)' }} 
                        onClick={() => setShowModal(false)}
                    />
                    <div className="card fade-in" style={{ 
                        position: 'relative', width: '100%', maxWidth: '600px', 
                        padding: 0, overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' 
                    }}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{editingContract ? 'Update Contract Terms' : 'Register New Contract'}</h2>
                            <button onClick={() => setShowModal(false)} className="btn btn-secondary btn-sm" style={{ height: 32, width: 32, padding: 0, borderRadius: '50%' }}>
                                <XCircle size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label className="label">Signatory (Staff/Member)</label>
                                    <select 
                                        className="input" required
                                        value={formData.user_id} onChange={e => setFormData({ ...formData, user_id: e.target.value })}
                                        disabled={!!editingContract}
                                    >
                                        <option value="">Select a member...</option>
                                        {staff.map(s => <option key={s.id} value={s.id}>{s.name} ({s.role})</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="label">Contract Number</label>
                                    <input 
                                        className="input" required placeholder="CON-XXXXXX"
                                        value={formData.contract_number} onChange={e => setFormData({ ...formData, contract_number: e.target.value })}
                                        disabled={!!editingContract}
                                    />
                                </div>
                                <div>
                                    <label className="label">Agreement Type</label>
                                    <select 
                                        className="input" value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                                    >
                                        {Object.entries(CONTRACT_TYPES).map(([k, v]) => (
                                            <option key={k} value={k}>{v.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="label">Start Date</label>
                                    <input 
                                        type="date" className="input" required
                                        value={formData.start_date} onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="label">End Date (Expiry)</label>
                                    <input 
                                        type="date" className="input"
                                        value={formData.end_date} onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                                    />
                                </div>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label className="label">Contract Status</label>
                                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                                        {Object.keys(statusConfig).map(s => (
                                            <button 
                                                key={s} type="button"
                                                className={`btn btn-sm ${formData.status === s ? 'btn-primary' : 'btn-secondary'}`}
                                                onClick={() => setFormData({ ...formData, status: s })}
                                                style={{ flex: 1, fontSize: '0.65rem', textTransform: 'uppercase' }}
                                            >{s}</button>
                                        ))}
                                    </div>
                                </div>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label className="label">Principal Terms & Conditions</label>
                                    <textarea 
                                        className="input" style={{ minHeight: 100, fontSize: '0.875rem' }}
                                        placeholder="Summary of the contract terms..."
                                        value={formData.terms} onChange={e => setFormData({ ...formData, terms: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary btn-full">Cancel</button>
                                <button type="submit" className="btn btn-primary btn-full">
                                    {editingContract ? 'Save Amendments' : 'Finalize Contract'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
