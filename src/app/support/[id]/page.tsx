'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
    ArrowLeft, Send, User, Clock, CheckCircle, Activity, 
    Info, ShieldAlert, MessageSquare, AlertCircle, 
    ChevronRight, MoreVertical, ExternalLink, Calendar,
    ShieldCheck, Hash, UserCircle2, CornerDownRight, Inbox,
    Phone, Mail, MapPin, Package, History, Fingerprint,
    DollarSign, TrendingUp, Truck, ArrowUpRight
} from 'lucide-react';
import api from '@/lib/api';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAdminAuth } from '@/lib/auth';

export default function AdminTicketDetail() {
    const { id } = useParams<{ id: string }>();
    const { user: adminUser } = useAdminAuth();
    const router = useRouter();
    
    const [ticket, setTicket] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [customerData, setCustomerData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [reply, setReply] = useState('');
    const [sending, setSending] = useState(false);
    const [updating, setUpdating] = useState(false);
    
    const scrollRef = useRef<HTMLDivElement>(null);

    const loadData = async () => {
        try {
            const res = await api.get(`/admin/support/tickets/${id}`);
            const ticketData = res.data.data.ticket;
            setTicket(ticketData);
            setMessages(res.data.data.messages);

            // Pull extended customer details with stats and shipments
            if (ticketData.user_id) {
                const customerRes = await api.get(`/admin/users/${ticketData.user_id}`);
                setCustomerData(customerRes.data.data);
            }
        } catch (err) {
            toast.error('Failed to load ticket details');
            router.push('/support');
        } finally { setLoading(false); }
    };

    useEffect(() => { loadData(); }, [id]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reply.trim()) return;
        setSending(true);
        try {
            await api.post(`/admin/support/tickets/${id}/messages`, { message: reply });
            setReply('');
            loadData();
        } catch (err) {
            toast.error('Failed to send message');
        } finally { setSending(false); }
    };

    const handleStatusUpdate = async (status: string) => {
        setUpdating(true);
        try {
            await api.patch(`/admin/support/tickets/${id}/status`, { status });
            toast.success(`Ticket marked as ${status}`);
            loadData();
        } catch (err) {
            toast.error('Failed to update status');
        } finally { setUpdating(false); }
    };

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}><div className="spinner" /></div>;
    if (!ticket) return null;

    const getStatusColor = (s: string) => {
        if (s === 'resolved') return '#10b981';
        if (s === 'open') return '#3b82f6';
        if (s === 'in_progress') return '#f59e0b';
        return '#64748b';
    };

    const customer = customerData?.user;
    const stats = customerData?.stats;
    const recentShipment = customerData?.shipments?.[0];

    return (
        <div className="fade-in" style={{ padding: '1.5rem', maxWidth: 1300, margin: '0 auto', height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            {/* Header: Simplified & Clean */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Link href="/support" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem' }}>
                        <ArrowLeft size={18} /> Support Hub
                    </Link>
                    <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
                    <h1 style={{ fontSize: '1.2rem', fontWeight: 900, margin: 0, letterSpacing: '-0.02em' }}>{ticket.subject}</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem', fontWeight: 900, color: getStatusColor(ticket.status), background: `${getStatusColor(ticket.status)}10`, padding: '0.2rem 0.6rem', borderRadius: 8, textTransform: 'uppercase' }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: getStatusColor(ticket.status) }} />
                        {ticket.status.replace('_', ' ')}
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    {ticket.status !== 'resolved' && (
                        <button className="btn btn-secondary" onClick={() => handleStatusUpdate('resolved')} disabled={updating} style={{ borderRadius: 10, fontWeight: 800, height: 40, fontSize: '0.8rem', color: '#10b981', borderColor: 'rgba(16,185,129,0.2)' }}>
                            Mark Resolved
                        </button>
                    )}
                    <button className="btn btn-secondary" style={{ width: 40, height: 40, padding: 0, borderRadius: 10 }}><MoreVertical size={18} /></button>
                </div>
            </div>

            {/* Main Content: 2-Column Split */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.5rem', flex: 1, overflow: 'hidden' }}>
                
                {/* Chat Column */}
                <div style={{ display: 'flex', flexDirection: 'column', background: 'white', borderRadius: 24, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                    <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', background: '#fcfcfc' }}>
                        {messages.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '4rem', opacity: 0.4 }}>
                                <Inbox size={48} style={{ margin: '0 auto 1rem' }} />
                                <p style={{ fontWeight: 700 }}>No messages yet</p>
                            </div>
                        ) : messages.map((m) => {
                            const isMe = m.sender_id === adminUser?.id;
                            return (
                                <div key={m.id} style={{ 
                                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                                    maxWidth: '80%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: isMe ? 'flex-end' : 'flex-start'
                                }}>
                                    <div style={{ 
                                        padding: '1.15rem 1.4rem', 
                                        borderRadius: 22, 
                                        background: isMe ? 'linear-gradient(135deg, #0f4098 0%, #1e3a8a 100%)' : '#fff',
                                        color: isMe ? 'white' : 'var(--text-primary)',
                                        fontSize: '0.95rem',
                                        lineHeight: 1.6,
                                        fontWeight: 500,
                                        borderBottomRightRadius: isMe ? 4 : 22,
                                        borderBottomLeftRadius: isMe ? 22 : 4,
                                        boxShadow: isMe ? '0 8px 24px -8px rgba(15, 64, 152, 0.4)' : '0 2px 12px rgba(0,0,0,0.03)',
                                        border: isMe ? 'none' : '1px solid var(--border)'
                                    }}>
                                        {m.message}
                                    </div>
                                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.5rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.02em', padding: '0 0.5rem' }}>
                                        {m.sender_name || (isMe ? 'Me' : (ticket.customer_name || 'Customer'))} · {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    <div style={{ padding: '1.5rem 2rem', borderTop: '1px solid var(--border)', background: '#fff' }}>
                        {ticket.status === 'closed' ? (
                            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 700, padding: '0.5rem', background: 'var(--bg-secondary)', borderRadius: 12 }}>Ticket archive locked</div>
                        ) : (
                            <form onSubmit={handleSend} style={{ display: 'flex', gap: '1rem', position: 'relative' }}>
                                <textarea 
                                    className="input" 
                                    placeholder="Type your resolution draft..." 
                                    value={reply} 
                                    onChange={e => setReply(e.target.value)}
                                    disabled={sending}
                                    rows={1}
                                    style={{ margin: 0, borderRadius: 16, minHeight: 52, background: 'var(--bg-secondary)', border: 'none', padding: '1rem 1.25rem', paddingRight: '4rem', fontSize: '1rem', resize: 'none' }}
                                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e as any); } }}
                                    autoFocus
                                />
                                <button type="submit" className="btn btn-primary" disabled={sending || !reply.trim()} style={{ position: 'absolute', right: 6, top: 6, width: 40, height: 40, borderRadius: 12, padding: 0, boxShadow: '0 4px 12px rgba(15, 64, 152, 0.3)' }}>
                                    {sending ? '...' : <Send size={18} />}
                                </button>
                            </form>
                        )}
                    </div>
                </div>

                {/* Info Column: Rich Customer Intelligence */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', overflowY: 'auto', paddingRight: '0.5rem' }} className="custom-scrollbar">
                    
                    {/* Identity Card */}
                    <div className="card" style={{ padding: '1.5rem', borderRadius: 24, border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, #0f4098, #3b82f6)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.5rem' }}>
                                {customer?.name?.charAt(0) || 'U'}
                            </div>
                            <div style={{ minWidth: 0 }}>
                                <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{customer?.name || 'Guest User'}</h3>
                                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{customer?.email}</p>
                            </div>
                        </div>

                        {customer ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: 12 }}>
                                    <Phone size={14} color="var(--accent)" />
                                    <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{customer.phone || 'No phone set'}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: 12 }}>
                                    <Calendar size={14} color="var(--accent)" />
                                    <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>Joined {new Date(customer.created_at).toLocaleDateString()}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: 12 }}>
                                    <ShieldCheck size={14} color="#10b981" />
                                    <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{customer.is_active ? 'Active Account' : 'Suspended'}</span>
                                </div>
                            </div>
                        ) : (
                            <div style={{ padding: '2rem', textAlign: 'center' }}><div className="spinner" /></div>
                        )}
                    </div>

                    {/* Financial & Activity Stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="card" style={{ padding: '1.25rem', borderRadius: 20, textAlign: 'center' }}>
                            <p style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Total Spent</p>
                            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 900, color: 'var(--accent)' }}>${parseFloat(stats?.total_spent || 0).toLocaleString()}</h4>
                        </div>
                        <div className="card" style={{ padding: '1.25rem', borderRadius: 20, textAlign: 'center' }}>
                            <p style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Shipments</p>
                            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 900 }}>{stats?.total || 0}</h4>
                        </div>
                    </div>

                    {/* Recent Shipment Snapshot */}
                    {recentShipment && (
                        <div className="card" style={{ padding: '1.5rem', borderRadius: 24, border: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
                                <Truck size={18} color="var(--accent)" />
                                <h4 style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>Latest Shipment</h4>
                            </div>
                            <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 16, border: '1px solid var(--border)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--accent)' }}>{recentShipment.tracking_number}</span>
                                    <span style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', background: 'white', padding: '0.2rem 0.5rem', borderRadius: 6, border: '1px solid var(--border)' }}>{recentShipment.status}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                    {recentShipment.pickup_city} <ChevronRight size={10} /> {recentShipment.destination_city}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Support Context Card */}
                    <div className="card" style={{ padding: '1.5rem', borderRadius: 24, border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
                            <Activity size={18} color="var(--accent)" />
                            <h4 style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>Case Analysis</h4>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Priority</span>
                                <span style={{ fontWeight: 900, color: ticket.priority === 'urgent' ? '#ef4444' : 'var(--text-primary)' }}>{ticket.priority.toUpperCase()}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Category</span>
                                <span style={{ fontWeight: 900 }}>{ticket.category.toUpperCase()}</span>
                            </div>
                        </div>
                    </div>

                    <Link href={`/customers/${ticket.user_id}`} className="btn btn-secondary" style={{ width: '100%', borderRadius: 16, height: 52, fontWeight: 900, fontSize: '0.9rem', background: '#fff', border: '2px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                        Full Customer Intelligence <ArrowUpRight size={18} />
                    </Link>

                </div>
            </div>
        </div>
    );
}
