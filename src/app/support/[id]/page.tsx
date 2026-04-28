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
        <div className="fade-in" style={{ padding: 'clamp(1rem, 3vw, 2rem)', maxWidth: 1300, margin: '0 auto', minHeight: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Header: Simplified & Clean */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', padding: '0.5rem 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <Link href="/support" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 800, fontSize: '0.85rem', padding: '0.6rem 1rem', borderRadius: 12, background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                        <ArrowLeft size={18} /> <span className="desktop-only">Back to Support</span>
                    </Link>
                    <div className="desktop-only" style={{ width: 1, height: 20, background: 'var(--border)' }} />
                    <h1 style={{ fontSize: 'clamp(1.1rem, 4vw, 1.5rem)', fontWeight: 900, margin: 0, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>{ticket.subject}</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 900, color: getStatusColor(ticket.status), background: `${getStatusColor(ticket.status)}10`, padding: '0.35rem 0.85rem', borderRadius: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: getStatusColor(ticket.status) }} />
                        {ticket.status.replace('_', ' ')}
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', marginLeft: 'auto' }}>
                    {ticket.status !== 'resolved' && (
                        <button className="btn btn-secondary" onClick={() => handleStatusUpdate('resolved')} disabled={updating} style={{ borderRadius: 12, fontWeight: 900, height: 44, padding: '0 1.25rem', fontSize: '0.85rem', color: '#10b981', borderColor: 'rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.05)' }}>
                            Mark Resolved
                        </button>
                    )}
                    <button className="btn btn-secondary" style={{ width: 44, height: 44, padding: 0, borderRadius: 12 }}><MoreVertical size={20} /></button>
                </div>
            </div>

            {/* Main Content: Responsive Split/Stack */}
            <div className="ticket-layout-container">
                
                {/* Chat Column */}
                <div style={{ display: 'flex', flexDirection: 'column', background: 'white', borderRadius: 32, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.03)', flex: 1, minWidth: 0 }}>
                    <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: 'clamp(1.25rem, 4vw, 2.5rem)', display: 'flex', flexDirection: 'column', gap: '1.75rem', background: '#fcfcfc', minHeight: '400px' }}>
                        {messages.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '5rem', opacity: 0.3 }}>
                                <Inbox size={56} style={{ margin: '0 auto 1.5rem' }} />
                                <p style={{ fontWeight: 900, fontSize: '1.1rem', margin: 0, marginBottom: '0.5rem' }}>Start Conversation</p>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0, fontWeight: 600 }}>No messages registered for this case yet.</p>
                            </div>
                        ) : messages.map((m) => {
                            const isMe = m.sender_id === adminUser?.id;
                            return (
                                <div key={m.id} style={{ 
                                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                                    maxWidth: 'min(90%, 600px)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: isMe ? 'flex-end' : 'flex-start'
                                }}>
                                    <div style={{ 
                                        padding: '1.25rem 1.75rem', 
                                        borderRadius: 24, 
                                        background: isMe ? 'linear-gradient(135deg, #0f4098 0%, #1e3a8a 100%)' : '#fff',
                                        color: isMe ? 'white' : 'var(--text-primary)',
                                        fontSize: '0.95rem',
                                        lineHeight: 1.6,
                                        fontWeight: 600,
                                        borderBottomRightRadius: isMe ? 4 : 24,
                                        borderBottomLeftRadius: isMe ? 24 : 4,
                                        boxShadow: isMe ? '0 12px 28px -8px rgba(15, 64, 152, 0.4)' : '0 4px 15px rgba(0,0,0,0.04)',
                                        border: isMe ? 'none' : '1px solid var(--border)'
                                    }}>
                                        {m.message}
                                    </div>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.6rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 0.75rem' }}>
                                        {m.sender_name || (isMe ? 'Me' : (ticket.customer_name || 'Customer'))} · {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    <div style={{ padding: 'clamp(1rem, 3vw, 1.75rem) clamp(1rem, 3vw, 2rem)', borderTop: '1px solid var(--border)', background: '#fff' }}>
                        {ticket.status === 'closed' ? (
                            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 800, padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 16, border: '1px solid var(--border)' }}>This ticket is closed.</div>
                        ) : (
                            <form onSubmit={handleSend} style={{ display: 'flex', gap: '1rem', position: 'relative' }}>
                                <textarea 
                                    className="input" 
                                    placeholder="Type your message here..." 
                                    value={reply} 
                                    onChange={e => setReply(e.target.value)}
                                    disabled={sending}
                                    rows={1}
                                    style={{ margin: 0, borderRadius: 20, minHeight: 60, background: 'var(--bg-secondary)', border: 'none', padding: '1.25rem 1.5rem', paddingRight: '4.5rem', fontSize: '1rem', resize: 'none', fontWeight: 600 }}
                                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e as any); } }}
                                    autoFocus
                                />
                                <button type="submit" className="btn btn-primary" disabled={sending || !reply.trim()} style={{ position: 'absolute', right: 8, top: 8, width: 44, height: 44, borderRadius: 14, padding: 0, boxShadow: '0 8px 20px rgba(15, 64, 152, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {sending ? <div className="spinner-sm" /> : <Send size={20} />}
                                </button>
                            </form>
                        )}
                    </div>
                </div>

                {/* Info Column: Rich Customer Intelligence */}
                <div className="info-sidebar">
                    
                    {/* Identity Card */}
                    <div className="card" style={{ padding: 'clamp(1.5rem, 4vw, 2rem)', borderRadius: 32, border: '1px solid var(--border)', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '2rem' }}>
                            <div style={{ width: 64, height: 64, borderRadius: 20, background: 'linear-gradient(135deg, #0f4098, #3b82f6)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.75rem', boxShadow: '0 8px 24px rgba(15, 64, 152, 0.2)' }}>
                                {customer?.name?.charAt(0) || 'U'}
                            </div>
                            <div style={{ minWidth: 0 }}>
                                <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.25rem', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{customer?.name || 'Guest User'}</h3>
                                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 700 }}>{customer?.email}</p>
                            </div>
                        </div>

                        {customer ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 16, border: '1px solid var(--border)' }}>
                                    <Phone size={18} color="var(--accent)" style={{ opacity: 0.8 }} />
                                    <span style={{ fontSize: '0.9rem', fontWeight: 800 }}>{customer.phone || 'No phone set'}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 16, border: '1px solid var(--border)' }}>
                                    <Calendar size={18} color="var(--accent)" style={{ opacity: 0.8 }} />
                                    <span style={{ fontSize: '0.9rem', fontWeight: 800 }}>Member since {new Date(customer.created_at).toLocaleDateString()}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'rgba(16,185,129,0.05)', borderRadius: 16, border: '1px solid rgba(16,185,129,0.1)' }}>
                                    <ShieldCheck size={18} color="#10b981" />
                                    <span style={{ fontSize: '0.9rem', fontWeight: 900, color: '#10b981' }}>{customer.is_active ? 'Verified Account' : 'Suspended'}</span>
                                </div>
                            </div>
                        ) : (
                            <div style={{ padding: '2rem', textAlign: 'center' }}><div className="spinner" /></div>
                        )}
                    </div>

                    {/* Financial & Activity Stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="card" style={{ padding: '1.5rem', borderRadius: 24, textAlign: 'center', border: '1px solid var(--border)' }}>
                            <p style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem', margin: 0 }}>Total Spent</p>
                            <h4 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>${parseFloat(stats?.total_spent || 0).toLocaleString()}</h4>
                        </div>
                        <div className="card" style={{ padding: '1.5rem', borderRadius: 24, textAlign: 'center', border: '1px solid var(--border)' }}>
                            <p style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem', margin: 0 }}>Shipments</p>
                            <h4 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900 }}>{stats?.total || 0}</h4>
                        </div>
                    </div>

                    {/* Recent Shipment Snapshot */}
                    {recentShipment && (
                        <div className="card" style={{ padding: 'clamp(1.5rem, 4vw, 2rem)', borderRadius: 32, border: '1px solid var(--border)', background: 'rgba(15,64,152,0.02)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                <Truck size={20} color="var(--accent)" />
                                <h4 style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', margin: 0 }}>Recent Shipment</h4>
                            </div>
                            <div style={{ background: '#fff', padding: '1.25rem', borderRadius: 20, border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 900, color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>{recentShipment.tracking_number}</span>
                                    <span style={{ fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', background: 'var(--bg-secondary)', padding: '0.35rem 0.75rem', borderRadius: 10, border: '1px solid var(--border)' }}>{recentShipment.status}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 800 }}>
                                    {recentShipment.pickup_city} <ChevronRight size={12} style={{ opacity: 0.5 }} /> {recentShipment.destination_city}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Support Context Card */}
                    <div className="card" style={{ padding: 'clamp(1.5rem, 4vw, 2rem)', borderRadius: 32, border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                            <Activity size={20} color="var(--accent)" />
                            <h4 style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', margin: 0 }}>Ticket Details</h4>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
                                <span style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.9rem' }}>Priority</span>
                                <span style={{ fontWeight: 900, color: ticket.priority === 'urgent' ? '#ef4444' : 'var(--text-primary)', fontSize: '0.9rem' }}>{ticket.priority.toUpperCase()}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.9rem' }}>Category</span>
                                <span style={{ fontWeight: 900, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{ticket.category.toUpperCase()}</span>
                            </div>
                        </div>
                    </div>

                    <Link href={`/customers/${ticket.user_id}`} className="btn btn-secondary" style={{ width: '100%', borderRadius: 20, height: 56, fontWeight: 900, fontSize: '0.95rem', background: '#fff', border: '2px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginTop: 'auto', transition: 'all 0.2s' }}>
                        View Customer Profile <ArrowUpRight size={20} />
                    </Link>

                </div>
            </div>

            <style jsx global>{`
                .ticket-layout-container {
                    display: flex;
                    flex-direction: row;
                    gap: 2rem;
                    flex: 1;
                    min-height: 0;
                }
                .info-sidebar {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                    width: 380px;
                    flex-shrink: 0;
                }
                @media (max-width: 1024px) {
                    .ticket-layout-container {
                        flex-direction: column;
                        min-height: auto;
                    }
                    .info-sidebar {
                        width: 100%;
                    }
                }
            `}</style>
        </div>
    );
}
