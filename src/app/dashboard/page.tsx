'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
    Package, Users, Truck, DollarSign, 
    TrendingUp, ArrowRight, Clock, Target,
    BarChart3, Activity, PieChart as PieIcon,
    AlertCircle, CheckCircle2, Ship
} from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
    ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import api from '@/lib/api';
import { useAdminAuth } from '@/lib/auth';

const STATUS_COLORS: Record<string, string> = {
    pending: '#f59e0b',
    confirmed: '#3b82f6',
    picked_up: '#8b5cf6',
    in_transit: '#6366f1',
    out_for_delivery: '#14b8a6',
    delivered: '#10b981',
    cancelled: '#ef4444',
    failed: '#ef4444'
};

export default function AdminDashboardPage() {
    const { hasPermission } = useAdminAuth();
    const [data, setData] = useState<any>(null);
    const [charts, setCharts] = useState<any[]>([]);
    const [routes, setRoutes] = useState<any[]>([]);
    const [performance, setPerformance] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const load = async () => {
            try {
                const [dashRes, chartRes, routeRes] = await Promise.all([
                    api.get('/admin/dashboard'),
                    api.get('/analytics/charts'),
                    api.get('/analytics/routes')
                ]);
                
                setData(dashRes.data.data);
                setCharts(chartRes.data.data);
                setRoutes(routeRes.data.data);

                if (hasPermission('manage_admins')) {
                    const perfRes = await api.get('/analytics/performance');
                    setPerformance(perfRes.data.data);
                }
            } catch (err) {
                console.error("Failed to load dashboard data", err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [hasPermission]);

    if (!mounted) return null;
    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '10rem' }}><div className="spinner" /></div>;

    const s = data?.stats || {};
    const kpis = [
        { label: 'Total Revenue', value: `USD ${Number(s.total_revenue || 0).toLocaleString()}`, icon: DollarSign, color: '#10b981', bg: 'rgba(16,185,129,0.1)', trend: '+12.5%' },
        { label: 'Total Shipments', value: s.total_shipments || 0, icon: Package, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', trend: '+5.2%' },
        { label: 'Active Customers', value: s.total_users || 0, icon: Users, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', trend: '+3.1%' },
        { label: 'Conversion Rate', value: performance ? `${performance.conversion_rate}%` : '---', icon: Target, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', trend: '+0.8%' },
    ];

    const chartData = (charts || []).map(c => ({
        name: c.date ? new Date(c.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '---',
        revenue: Number(c.revenue || 0),
        count: Number(c.count || 0)
    }));

    const statusData = Object.entries(s.status_breakdown || {}).map(([name, value]) => ({
        name: name.replace(/_/g, ' '),
        value: value as number,
        color: STATUS_COLORS[name] || '#cbd5e1'
    })).filter(item => item.value > 0);

    return (
        <div className="fade-in" style={{ padding: 'clamp(1rem, 3vw, 2.5rem)', maxWidth: 1600, margin: '0 auto' }}>
            <header style={{ marginBottom: 'clamp(1.5rem, 4vw, 3.5rem)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
                <div style={{ flex: 1, minWidth: 'min(100%, 400px)' }}>
                    <h1 style={{ fontSize: 'clamp(1.25rem, 4vw, 2.5rem)', fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: '0.6rem', color: 'var(--text-primary)' }}>
                        Dashboard Overview
                    </h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem', color: '#10b981', fontWeight: 900, background: 'rgba(16,185,129,0.08)', padding: '0.4rem 0.8rem', borderRadius: 100, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px rgba(16,185,129,0.4)' }} />
                            Live
                        </span>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: 600 }}>System monitoring is active.</p>
                    </div>
                </div>
                <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem 1.25rem', borderRadius: 16, border: '1px solid var(--border)', fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.6rem' }} className="desktop-only">
                    <Clock size={16} color="var(--accent)" />
                    Last Updated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
            </header>

            {/* KPI Grid */}
            <div className="kpi-grid" style={{ gap: '1rem', marginBottom: 'clamp(1.5rem, 4vw, 3.5rem)' }}>
                {kpis.map(({ label, value, icon: Icon, color, bg, trend }) => (
                    <div key={label} className="stat-card" style={{ padding: '1.25rem', position: 'relative', overflow: 'hidden', borderRadius: 24 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', position: 'relative', zIndex: 2 }}>
                            <div style={{ width: 44, height: 44, borderRadius: 14, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.2)' }}>
                                <Icon size={22} color={color} />
                            </div>
                            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.2rem', background: 'rgba(16,185,129,0.08)', padding: '0.3rem 0.6rem', borderRadius: 10 }}>
                                <TrendingUp size={12} /> {trend}
                            </span>
                        </div>
                        <div style={{ position: 'relative', zIndex: 2 }}>
                            <p style={{ fontSize: '1.75rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.2rem', letterSpacing: '-0.03em', lineHeight: 1 }}>{value}</p>
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
                        </div>
                        <Icon size={80} style={{ position: 'absolute', right: -15, bottom: -15, opacity: 0.03, transform: 'rotate(-15deg)', pointerEvents: 'none' }} />
                    </div>
                ))}
            </div>

            <div className="dashboard-bento" style={{ marginBottom: 'clamp(1rem, 3vw, 1.75rem)' }}>
                {/* Financial Pulse Chart */}
                <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', borderRadius: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1.5rem' }}>
                        <h3 style={{ fontWeight: 700, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', letterSpacing: '-0.02em', margin: 0 }}>
                            <div style={{ width: 48, height: 48, background: 'rgba(15,64,152,0.06)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
                                <BarChart3 size={24} color="var(--accent)" />
                            </div>
                            Revenue & Volume
                        </h3>
                        <div style={{ display: 'flex', gap: '0.4rem', background: 'var(--bg-secondary)', padding: '0.4rem', borderRadius: 14, border: '1px solid var(--border)' }}>
                            <button className="btn btn-sm" style={{ background: 'white', color: 'var(--accent)', fontWeight: 900, borderRadius: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: '0.75rem', padding: '0.5rem 1rem' }}>Revenue</button>
                            <button className="btn btn-sm" style={{ background: 'transparent', color: 'var(--text-muted)', fontWeight: 800, fontSize: '0.75rem', padding: '0.5rem 1rem' }}>Volume</button>
                        </div>
                    </div>
                    <div style={{ width: '100%', height: 360, marginTop: 'auto' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" strokeOpacity={0.5} />
                                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} tick={{ fontWeight: 700 }} dy={10} />
                                <YAxis yAxisId="left" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `$${v/1000}k`} tick={{ fontWeight: 700 }} />
                                <Tooltip 
                                    contentStyle={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', border: '1px solid var(--border)', borderRadius: 20, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', padding: '1.5rem' }}
                                    itemStyle={{ fontSize: '1rem', fontWeight: 900, color: 'var(--accent)' }}
                                    labelStyle={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                                />
                                <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="var(--accent)" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" animationDuration={1500} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Status Distribution */}
                <div className="card" style={{ padding: '1.5rem', borderRadius: 24 }}>
                    <h3 style={{ fontWeight: 700, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '1rem', letterSpacing: '-0.02em', margin: '0 0 2rem 0' }}>
                        <div style={{ width: 48, height: 48, background: 'rgba(139,92,246,0.06)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
                            <PieIcon size={24} color="#8b5cf6" />
                        </div>
                        Inventory Status
                    </h3>
                    <div style={{ width: '100%', height: 260, position: 'relative' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie 
                                    data={statusData} 
                                    innerRadius="70%" 
                                    outerRadius="95%" 
                                    paddingAngle={8} 
                                    dataKey="value"
                                    stroke="none"
                                    animationDuration={1500}
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontWeight: 800 }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
                            <p style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1, margin: 0 }}>{s.total_shipments || 0}</p>
                            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '0.2rem' }}>Total Units</p>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.8rem', marginTop: '2.5rem' }}>
                        {statusData.slice(0, 4).map((item, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem 1rem', background: 'var(--bg-secondary)', borderRadius: 16, border: '1px solid var(--border)', transition: 'all 0.2s' }}>
                                <div style={{ width: 10, height: 10, borderRadius: '50%', background: item.color, boxShadow: `0 0 12px ${item.color}50` }} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', margin: 0, letterSpacing: '0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</p>
                                    <p style={{ fontSize: '0.95rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>{item.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="dashboard-bento-reverse">
                {/* Popular Routes */}
                <div className="card" style={{ padding: '1.5rem', borderRadius: 24 }}>
                    <h3 style={{ fontWeight: 700, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '1rem', letterSpacing: '-0.02em', margin: '0 0 2rem 0' }}>
                        <div style={{ width: 48, height: 48, background: 'rgba(20,184,166,0.06)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
                            <Ship size={24} color="#14b8a6" />
                        </div>
                        Popular Routes
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {routes.slice(0, 5).map((r: any, i: number) => (
                            <div key={i} className="hover-trigger" style={{ padding: '1.5rem', border: '1px solid var(--border)', borderRadius: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.3s', background: 'white' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                    <div style={{ width: 44, height: 44, borderRadius: 14, background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', fontWeight: 900, fontSize: '1rem', border: '1px solid var(--border)', flexShrink: 0 }}>
                                        {i + 1}
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{r.origin} <ArrowRight size={14} style={{ margin: '0 0.4rem', opacity: 0.4 }} /> {r.destination}</p>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '0.2rem', margin: 0 }}>Active Route</p>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ fontWeight: 900, color: 'var(--accent)', fontSize: '1.5rem', letterSpacing: '-0.03em', margin: 0 }}>{r.count}</p>
                                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Shipments</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Activity Feed */}
                <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', borderRadius: 24 }}>
                    <div style={{ padding: '1.5rem', paddingBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                        <h3 style={{ fontWeight: 700, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '1rem', letterSpacing: '-0.02em', margin: 0 }}>
                            <div style={{ width: 48, height: 48, background: 'rgba(15,64,152,0.06)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
                                <Activity size={24} color="var(--accent)" />
                            </div>
                            Recent Shipments
                        </h3>
                        <Link href="/shipments" className="btn btn-secondary" style={{ padding: '0.75rem 1.5rem', borderRadius: 14, fontSize: '0.85rem', fontWeight: 800, height: 44 }}>
                            View All Shipments
                        </Link>
                    </div>
                    
                    <div className="data-table-wrapper" style={{ marginTop: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th style={{ paddingLeft: '2.5rem' }}>Tracking Number</th>
                                    <th>Route</th>
                                    <th className="desktop-only">Status</th>
                                    <th style={{ paddingRight: '2.5rem', textAlign: 'right' }}>Revenue</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(data?.recent_shipments || []).slice(0, 5).map((s: any) => (
                                    <tr key={s.id}>
                                        <td style={{ paddingLeft: '2.5rem' }}>
                                            <Link href={`/shipments/${s.id}`} style={{ textDecoration: 'none', color: 'var(--accent)', fontWeight: 900, fontSize: '0.9rem', letterSpacing: '0.02em' }}>
                                                {s.tracking_number}
                                            </Link>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>
                                                {s.pickup_city} <ArrowRight size={14} style={{ opacity: 0.3 }} /> {s.destination_city}
                                            </div>
                                        </td>
                                        <td className="desktop-only">
                                            <span className={`badge badge-${s.status}`} style={{ fontSize: '0.7rem', fontWeight: 900 }}>{s.status.replace(/_/g, ' ')}</span>
                                        </td>
                                        <td style={{ paddingRight: '2.5rem', textAlign: 'right', fontWeight: 900, fontSize: '1rem', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                                            ${Number(s.total_price || 0).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .kpi-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                }
                @media (max-width: 1200px) {
                    .kpi-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }
                @media (max-width: 640px) {
                    .kpi-grid {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </div>
    );
}
