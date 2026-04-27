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
        <div className="fade-in" style={{ padding: '1.5rem 2rem', maxWidth: 1400, margin: '0 auto' }}>
            <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.01em', marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
                        Business Overview
                    </h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: '#10b981', fontWeight: 600, background: 'rgba(16,185,129,0.1)', padding: '0.2rem 0.6rem', borderRadius: 100 }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
                            Live Updates Enabled
                        </span>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 400 }}>System monitoring active for Global Air Cargo</p>
                    </div>
                </div>
                <div style={{ background: 'var(--bg-secondary)', padding: '0.5rem 1rem', borderRadius: 12, border: '1px solid var(--border)', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    Last Sync: {new Date().toLocaleTimeString()}
                </div>
            </div>

            {/* KPI Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
                {kpis.map(({ label, value, icon: Icon, color, bg, trend }) => (
                    <div key={label} className="stat-card" style={{ padding: '1.75rem', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                            <div style={{ width: 54, height: 54, borderRadius: 16, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Icon size={28} color={color} />
                            </div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <TrendingUp size={14} /> {trend}
                            </span>
                        </div>
                        <div>
                            <p style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem', letterSpacing: '-0.01em' }}>{value}</p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
                        </div>
                        <div style={{ position: 'absolute', right: -10, bottom: -10, opacity: 0.03 }}>
                            <Icon size={100} />
                        </div>
                    </div>
                ))}
            </div>

            <div className="dashboard-bento" style={{ marginBottom: '1.5rem' }}>
                {/* Revenue Growth Chart */}
                <div className="card" style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <h3 style={{ fontWeight: 700, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ padding: '0.5rem', background: 'rgba(15,64,152,0.1)', borderRadius: 10 }}>
                                <BarChart3 size={20} color="var(--accent)" />
                            </div>
                            Financial Performance
                        </h3>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '0.25rem 0.75rem', borderRadius: 100 }}>Revenue</span>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#3b82f6', background: 'rgba(59,130,246,0.1)', padding: '0.25rem 0.75rem', borderRadius: 100 }}>Volume</span>
                        </div>
                    </div>
                    <div style={{ width: '100%', height: 320 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                                <YAxis yAxisId="left" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `${v/1000}k`} />
                                <Tooltip 
                                    contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: '0 10px 25px rgba(0,0,0,0.1)', padding: '1rem' }}
                                    itemStyle={{ fontSize: '0.85rem', fontWeight: 700 }}
                                />
                                <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                                <Line yAxisId="left" type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 6 }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Status Distribution */}
                <div className="card" style={{ padding: '2rem' }}>
                    <h3 style={{ fontWeight: 700, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                        <div style={{ padding: '0.5rem', background: 'rgba(139,92,246,0.1)', borderRadius: 10 }}>
                            <PieIcon size={20} color="#8b5cf6" />
                        </div>
                        Delivery Pipeline
                    </h3>
                    <div style={{ width: '100%', height: 220 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie 
                                    data={statusData} 
                                    innerRadius={70} 
                                    outerRadius={95} 
                                    paddingAngle={5} 
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '1.5rem' }}>
                        {statusData.slice(0, 4).map((item, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.6rem', background: 'var(--bg-secondary)', borderRadius: 10 }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color }} />
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'capitalize' }}>{item.name}</span>
                                <span style={{ marginLeft: 'auto', fontSize: '0.75rem', fontWeight: 800 }}>{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="dashboard-bento-reverse">
                {/* Popular Routes */}
                <div className="card" style={{ padding: '2rem' }}>
                    <h3 style={{ fontWeight: 700, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <div style={{ padding: '0.5rem', background: 'rgba(20,184,166,0.1)', borderRadius: 10 }}>
                            <Ship size={20} color="#14b8a6" />
                        </div>
                        Top Lanes
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {routes.slice(0, 5).map((r: any, i: number) => (
                            <div key={i} style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', fontWeight: 800, fontSize: '0.75rem' }}>
                                        {i + 1}
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '0.85rem', fontWeight: 700 }}>{r.origin} → {r.destination}</p>
                                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>Active Shipping Route</p>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ fontWeight: 900, color: 'var(--accent)', fontSize: '1.1rem' }}>{r.count}</p>
                                    <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Orders</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Activity Feed */}
                <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
                    <div style={{ padding: '2rem', paddingBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontWeight: 700, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ padding: '0.5rem', background: 'rgba(15,64,152,0.1)', borderRadius: 10 }}>
                                <Activity size={20} color="var(--accent)" />
                            </div>
                            Live Operations
                        </h3>
                        <Link href="/shipments" className="btn btn-sm btn-secondary" style={{ padding: '0.5rem 1rem', borderRadius: 10, fontSize: '0.75rem', fontWeight: 700 }}>
                            Full Registry
                        </Link>
                    </div>
                    
                    <div className="data-table-wrapper" style={{ overflowX: 'auto' }}>
                        <table className="data-table" style={{ minWidth: 'auto' }}>
                            <thead>
                                <tr>
                                    <th>Tracking</th>
                                    <th>Route</th>
                                    <th>Status</th>
                                    <th>Revenue</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(data?.recent_shipments || []).slice(0, 5).map((s: any) => (
                                    <tr key={s.id}>
                                        <td style={{ fontWeight: 700, color: 'var(--accent)', whiteSpace: 'nowrap' }}>
                                            <Link href={`/shipments/${s.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>{s.tracking_number}</Link>
                                        </td>
                                        <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                {s.pickup_city} <ArrowRight size={10} /> {s.destination_city}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`badge badge-${s.status}`}>{s.status.replace(/_/g, ' ')}</span>
                                        </td>
                                        <td style={{ fontWeight: 700 }}>USD {Number(s.total_price || 0).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
