'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
    ArrowLeft, Mail, Phone, ShieldCheck, Activity, 
    Globe, Building2, Key, ShieldAlert, Clock, 
    Zap, Terminal, Hash, Lock, Unlock, RefreshCw,
    UserCircle2, ExternalLink, Shield, Info,
    ChevronRight, Calendar, MapPin, Package,
    TrendingUp, AlertCircle, CheckCircle2, Truck,
    Filter, ChevronLeft, Database, UserCheck, HardHat,
    CreditCard, Settings, Search, History, MousePointer2,
    Layers, Fingerprint, ShieldEllipsis, Link as LinkIcon
} from 'lucide-react';
import api from '@/lib/api';
import Link from 'next/link';
import toast from 'react-hot-toast';

const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any; description: string; layer: number }> = {
    super_admin: { 
        label: 'Super Admin', 
        color: '#ef4444', 
        bg: 'rgba(239, 68, 68, 0.08)', 
        icon: ShieldAlert,
        layer: 0,
        description: 'Root level access — full system authority including administrative management and security overrides.'
    },
    admin: { 
        label: 'Admin', 
        color: '#3b82f6', 
        bg: 'rgba(59, 130, 246, 0.08)', 
        icon: ShieldCheck,
        layer: 1,
        description: 'High-level access — full operational authority across all logistics and customer management modules.'
    },
    operations: { 
        label: 'Operations', 
        color: '#8b5cf6', 
        bg: 'rgba(139, 92, 246, 0.08)', 
        icon: Activity,
        layer: 2,
        description: 'Logistics management — authorized for shipment lifecycle, category mapping, and customer records.'
    },
    support: { 
        label: 'Support', 
        color: '#10b981', 
        bg: 'rgba(16, 185, 129, 0.08)', 
        icon: Globe,
        layer: 3,
        description: 'Customer relations — authorized for helpdesk management, shipment tracking, and user communication.'
    },
    finance: { 
        label: 'Finance', 
        color: '#f59e0b', 
        bg: 'rgba(245, 158, 11, 0.08)', 
        icon: Info,
        layer: 2,
        description: 'Financial authority — authorized for rate management, pricing zones, and operational reporting.'
    },
    manager: { 
        label: 'Facility Manager', 
        color: '#6366f1', 
        bg: 'rgba(99, 102, 241, 0.08)', 
        icon: Building2,
        layer: 3,
        description: 'Facility oversight — authorized for warehouse logistics, hub inventory, and localized shipment handling.'
    },
    rider: { 
        label: 'Delivery Rider', 
        color: '#14b8a6', 
        bg: 'rgba(20, 184, 166, 0.08)', 
        icon: Truck,
        layer: 4,
        description: 'Logistics fulfillment — authorized for last-mile delivery updates, location tracking, and status synchronization.'
    },
};

const ACTION_ICONS: Record<string, any> = {
    login: UserCheck,
    update: RefreshCw,
    create: Zap,
    delete: AlertCircle,
    view: Search,
    status_change: Lock,
    payment: CreditCard,
    settings: Settings
};

export default function StaffDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    
    const [staff, setStaff] = useState<any>(null);
    const [logs, setLogs] = useState<any[]>([]);
    const [allLoginLogs, setAllLoginLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [logsLoading, setLogsLoading] = useState(false);
    
    const [logPage, setLogPage] = useState(1);
    const [logTotalPages, setLogTotalPages] = useState(1);
    const itemsPerLogPage = 5;

    const [showResetModal, setShowResetModal] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [resetting, setResetting] = useState(false);

    const loadStaff = async () => {
        try {
            const staffRes = await api.get(`/admin/users/${id}`);
            setStaff(staffRes.data.data.user);
        } catch (err) {
            toast.error('Failed to load personnel data');
            router.push('/staff');
        }
    };

    const loadLogs = async (p: number) => {
        setLogsLoading(true);
        try {
            const logsRes = await api.get(`/admin/system/logs?user_id=${id}&page=${p}&limit=${itemsPerLogPage}`);
            setLogs(logsRes.data.data.logs);
            setLogTotalPages(logsRes.data.data.pagination.pages);
            
            if (p === 1) {
                const loginRes = await api.get(`/admin/system/logs?user_id=${id}&action=login&limit=100`);
                setAllLoginLogs(loginRes.data.data.logs);
            }
        } catch (err) {
            toast.error('Audit trail fetch failed');
        } finally {
            setLogsLoading(false);
        }
    };

    const sessionStats = useMemo(() => {
        if (!allLoginLogs.length) return { last: 'N/A', today: 0, week: 0 };
        
        const now = new Date();
        const startOfDay = new Date(now.setHours(0, 0, 0, 0));
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        
        const loginsToday = allLoginLogs.filter(l => new Date(l.created_at) >= startOfDay).length;
        const loginsThisWeek = allLoginLogs.filter(l => new Date(l.created_at) >= startOfWeek).length;
        const lastLogin = allLoginLogs[0]?.created_at;

        return {
            last: lastLogin ? new Date(lastLogin).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A',
            today: loginsToday,
            week: loginsThisWeek
        };
    }, [allLoginLogs]);

    const loadData = async () => {
        setLoading(true);
        await loadStaff();
        await loadLogs(1);
        setLoading(false);
    };

    useEffect(() => { loadData(); }, [id]);

    const handleLogPageChange = (p: number) => {
        setLogPage(p);
        loadLogs(p);
    };

    const toggleStatus = async () => {
        try {
            await api.patch(`/admin/system/admins/${id}/toggle-access`);
            toast.success(staff.is_active ? 'Account locked' : 'Account unlocked');
            loadData();
        } catch (e) {
            toast.error('Authorization update failed');
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPassword || newPassword.length < 6) return toast.error('Key too short');
        setResetting(true);
        try {
            await api.post(`/admin/system/admins/${id}/reset-password`, { new_password: newPassword });
            toast.success('Security key synchronized');
            setShowResetModal(false);
            setNewPassword('');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Override failed');
        } finally {
            setResetting(false);
        }
    };

    const formatLogDescription = (log: any) => {
        const action = log.action.toLowerCase();
        const entity = log.entity_type?.replace(/_/g, ' ') || 'system';
        const idShort = log.entity_id ? log.entity_id.slice(0, 8).toUpperCase() : null;
        
        let detailsText = '';
        let extraInfo = '';
        if (log.details) {
            try {
                const parsed = typeof log.details === 'string' ? JSON.parse(log.details) : log.details;
                if (parsed.message) detailsText = parsed.message;
                else if (parsed.status) detailsText = `Status transitioned to ${parsed.status}`;
                else if (parsed.amount) detailsText = `Value: ${parsed.amount}`;
                else if (typeof parsed === 'string') detailsText = parsed;
                
                if (parsed.tracking_number) extraInfo = ` (${parsed.tracking_number})`;
                else if (parsed.name) extraInfo = ` (${parsed.name})`;
            } catch (e) {
                detailsText = log.details;
            }
        }

        const target = idShort ? `${entity} [${idShort}]${extraInfo}` : entity;

        if (action.includes('login')) return `Authenticated via secure administrative gateway`;
        if (action.includes('view')) return `Accessed and viewed ${target} records`;
        if (action.includes('update')) return `Modified parameters for ${target}`;
        if (action.includes('create')) return `Successfully provisioned ${target} in system`;
        if (action.includes('delete')) return `De-provisioned ${target} from platform`;
        
        return detailsText || `Executed ${action} on ${target}`;
    };

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '10rem' }}><div className="spinner" /></div>;
    if (!staff) return null;

    const roleCfg = ROLE_CONFIG[staff.role] || ROLE_CONFIG.admin;

    return (
        <div className="fade-in staff-detail-container" style={{ padding: '2rem', maxWidth: 1400, margin: '0 auto' }}>
            <div style={{ marginBottom: '2.5rem' }}>
                <Link href="/staff" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                    <ArrowLeft size={18} /> Back to Staff Management
                </Link>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                        <div style={{ width: 80, height: 80, borderRadius: 24, background: 'linear-gradient(135deg, #0f4098 0%, #1e3a8a 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 900, boxShadow: '0 10px 30px -10px rgba(15, 64, 152, 0.4)', flexShrink: 0 }}>
                            {staff.name.charAt(0)}
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                                <h1 style={{ fontSize: 'clamp(1.5rem, 5vw, 2.5rem)', fontWeight: 900, margin: 0, letterSpacing: '-0.04em' }}>{staff.name}</h1>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.85rem', borderRadius: 10, background: roleCfg.bg, color: roleCfg.color, fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    <roleCfg.icon size={14} /> {roleCfg.label}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.95rem', flexWrap: 'wrap' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Mail size={16} /> {staff.email}</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Phone size={16} /> {staff.phone || 'No phone set'}</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Calendar size={16} /> Joined {new Date(staff.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', width: '100%', maxWidth: 'max-content', flexWrap: 'wrap' }}>
                        <button onClick={() => setShowResetModal(true)} className="btn btn-secondary" style={{ flex: 1, minWidth: 160, height: 48, borderRadius: 14, fontWeight: 800, border: '2px solid var(--border)' }}>
                            <RefreshCw size={18} /> Reset Password
                        </button>
                        <button onClick={toggleStatus} className="btn" style={{ flex: 1, minWidth: 160, height: 48, borderRadius: 14, fontWeight: 900, background: staff.is_active ? '#ef4444' : '#10b981', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                            {staff.is_active ? <Lock size={18} /> : <Unlock size={18} />}
                            {staff.is_active ? 'Lock' : 'Unlock'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="detail-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem' }}>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minWidth: 0 }}>
                    <div className="card" style={{ padding: '2rem', borderRadius: 28, border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                                    <Database size={20} />
                                </div>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 900, margin: 0 }}>Action Audit Trail</h3>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginRight: '0.5rem' }}>Page {logPage} / {logTotalPages}</span>
                                <button className="btn btn-secondary btn-sm" disabled={logPage === 1} onClick={() => handleLogPageChange(logPage - 1)} style={{ width: 32, height: 32, padding: 0, borderRadius: 8 }}><ChevronLeft size={16} /></button>
                                <button className="btn btn-secondary btn-sm" disabled={logPage === logTotalPages} onClick={() => handleLogPageChange(logPage + 1)} style={{ width: 32, height: 32, padding: 0, borderRadius: 8 }}><ChevronRight size={16} /></button>
                            </div>
                        </div>

                        {logsLoading ? (
                            <div style={{ padding: '5rem', textAlign: 'center' }}><div className="spinner" /></div>
                        ) : logs.length === 0 ? (
                            <div style={{ padding: '5rem', textAlign: 'center', opacity: 0.3 }}>
                                <Terminal size={48} style={{ margin: '0 auto 1.5rem' }} />
                                <p style={{ fontWeight: 800 }}>No system activity records found</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {logs.map((log) => {
                                    const ActionIcon = ACTION_ICONS[log.action.split('_')[0].toLowerCase()] || Zap;
                                    const details = typeof log.details === 'string' ? JSON.parse(log.details) : log.details;
                                    const url = details?.request_url || null;
                                    const method = details?.request_method || null;

                                    return (
                                        <div key={log.id} style={{ display: 'flex', gap: '1.25rem', padding: '1.5rem', borderRadius: 20, background: 'var(--bg-secondary)', border: '1px solid var(--border)', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 70 }}>
                                                <span style={{ fontSize: '0.9rem', fontWeight: 900, color: 'var(--text-primary)' }}>{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '0.2rem' }}>{new Date(log.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                                            </div>
                                            <div style={{ width: 1, background: 'var(--border)', alignSelf: 'stretch' }} />
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                                                        <div style={{ width: 32, height: 32, borderRadius: 10, background: 'white', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid var(--border)' }}>
                                                            <ActionIcon size={16} />
                                                        </div>
                                                        <h4 style={{ margin: 0, fontWeight: 900, fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.02em', color: 'var(--text-primary)' }}>{log.action.replace(/_/g, ' ')}</h4>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                        <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', background: '#fff', padding: '0.25rem 0.6rem', borderRadius: 8, border: '1px solid var(--border)', flexShrink: 0 }}>IP: {log.ip_address || '127.0.0.1'}</span>
                                                    </div>
                                                </div>
                                                <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600, lineHeight: 1.5 }}>
                                                    {formatLogDescription(log)}
                                                </p>
                                                {url && (
                                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.75rem', background: '#fff', borderRadius: 10, border: '1px solid var(--border)', maxWidth: '100%' }}>
                                                        <LinkIcon size={12} color="var(--accent)" />
                                                        <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            <span style={{ color: 'var(--accent)', marginRight: '0.4rem' }}>{method}</span>
                                                            {url}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    
                    {/* Session Intelligence Card */}
                    <div className="card" style={{ padding: '2rem', borderRadius: 28, border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                            <History size={20} color="var(--accent)" />
                            <h4 style={{ fontSize: '1rem', fontWeight: 900 }}>Session Intelligence</h4>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    <Clock size={14} color="var(--text-muted)" />
                                    <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Last Authentication</p>
                                </div>
                                <p style={{ margin: 0, fontSize: '1rem', fontWeight: 900, color: 'var(--text-primary)' }}>{sessionStats.last}</p>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 16 }}>
                                    <p style={{ margin: 0, fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Logins Today</p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <MousePointer2 size={16} color="var(--accent)" />
                                        <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900 }}>{sessionStats.today}</p>
                                    </div>
                                </div>
                                <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 16 }}>
                                    <p style={{ margin: 0, fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Weekly Volume</p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <TrendingUp size={16} color="#10b981" />
                                        <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900 }}>{sessionStats.week}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card" style={{ padding: '2rem', borderRadius: 28, border: '1px solid var(--border)', background: staff.is_active ? 'rgba(16, 185, 129, 0.03)' : 'rgba(239, 68, 68, 0.03)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                            {staff.is_active ? <CheckCircle2 color="#10b981" size={24} /> : <AlertCircle color="#ef4444" size={24} />}
                            <h4 style={{ fontSize: '1.1rem', fontWeight: 900 }}>Authorization Pulse</h4>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
                            <Layers size={14} color="var(--text-muted)" />
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Security Layer {roleCfg.layer}</span>
                        </div>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600, lineHeight: 1.6 }}>
                            {staff.is_active 
                                ? roleCfg.description 
                                : 'Access for this identity has been formally revoked. All active authentication tokens have been invalidated and system routing is disabled.'}
                        </p>
                    </div>

                    <div className="card" style={{ padding: '1.75rem', borderRadius: 28, border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                            <Fingerprint size={20} color="var(--accent)" />
                            <h4 style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>Security Footprint</h4>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                                    <Building2 size={20} />
                                </div>
                                <div>
                                    <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)' }}>Organization</p>
                                    <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800 }}>GlobalAir Cargo</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                                    <ShieldEllipsis size={20} />
                                </div>
                                <div>
                                    <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)' }}>Clearance</p>
                                    <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800 }}>Verified Personnel</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Security Override Modal */}
            {showResetModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(30px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100001, padding: '2rem' }}>
                    <div className="card fade-in" style={{ width: '100%', maxWidth: 450, padding: 0, borderRadius: 32, overflow: 'hidden', background: '#fff', boxShadow: '0 50px 100px -20px rgba(0, 0, 0, 0.7)' }}>
                        <div style={{ background: '#0f172a', padding: '2.5rem', color: 'white', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Key size={28} />
                            </div>
                            <div>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.02em' }}>Security Override</h2>
                                <p style={{ opacity: 0.6, fontSize: '0.85rem', fontWeight: 600 }}>Emergency Key Rotation</p>
                            </div>
                        </div>
                        <form onSubmit={handleResetPassword} style={{ padding: '2.5rem' }}>
                            <div style={{ marginBottom: '2rem' }}>
                                <label className="label" style={{ fontWeight: 800, fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.8rem', textTransform: 'uppercase' }}>New Authorization Key</label>
                                <div style={{ position: 'relative' }}>
                                    <Shield size={20} style={{ position: 'absolute', left: 16, top: 18, color: 'var(--accent)' }} />
                                    <input type="password" className="input" placeholder="Secure alphanumeric string" style={{ height: 56, paddingLeft: '3.5rem', borderRadius: 16, background: 'var(--bg-secondary)', fontWeight: 700, fontSize: '1.1rem' }} value={newPassword} onChange={e => setNewPassword(e.target.value)} required autoFocus />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button type="button" onClick={() => setShowResetModal(false)} className="btn btn-secondary" style={{ flex: 1, height: 56, borderRadius: 16, fontWeight: 800 }}>Cancel</button>
                                <button type="submit" disabled={resetting} className="btn btn-primary" style={{ flex: 1.5, height: 56, borderRadius: 16, fontWeight: 900 }}>
                                    {resetting ? 'Overriding...' : 'Synchronize Key'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style jsx global>{`
                @media (max-width: 1100px) {
                    .detail-grid {
                        grid-template-columns: 1fr !important;
                    }
                }
                @media (max-width: 600px) {
                    .staff-detail-container {
                        padding: 1rem !important;
                    }
                }
            `}</style>
        </div>
    );
}
