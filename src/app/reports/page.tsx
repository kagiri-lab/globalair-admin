'use client';

import { useEffect, useState } from 'react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
    TrendingUp, TrendingDown, DollarSign, Map, Tag, 
    Download, Calendar, RefreshCw, Target
} from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#ec4899'];

export default function ReportsPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/analytics/financials');
            setData(res.data.data);
        } catch (err) {
            toast.error('Failed to load financial reports');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '10rem' }}><div className="spinner" /></div>;

    const { categories = [], zones = [], monthly = [] } = data || {};

    // Calculate growth
    const currentMonth = monthly.length > 0 ? monthly[monthly.length - 1] : { revenue: 0 };
    const prevMonth = monthly.length > 1 ? monthly[monthly.length - 2] : null;
    const revenueGrowth = prevMonth && prevMonth.revenue > 0 
        ? ((currentMonth.revenue - prevMonth.revenue) / prevMonth.revenue) * 100 
        : 0;

    return (
        <div className="fade-in" style={{ padding: 'clamp(1rem, 3vw, 2.5rem)', maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '2rem', marginBottom: '3rem' }}>
                <div>
                    <h1 style={{ fontSize: 'clamp(1.75rem, 5vw, 2.5rem)', fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Financial Analytics</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 600 }}>Detailed corridor intelligence on revenue and growth vectors.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', width: '100%', maxWidth: 'max-content' }}>
                    <button className="btn btn-secondary" style={{ flex: 1, borderRadius: 14, height: 48, padding: '0 1.5rem', fontWeight: 800 }} onClick={loadData}>
                        <RefreshCw size={18} /> Refresh Hub
                    </button>
                    <button className="btn btn-primary" style={{ flex: 1, borderRadius: 14, height: 48, padding: '0 1.5rem', fontWeight: 800, background: 'linear-gradient(135deg, #0f4098, #1e3a8a)', boxShadow: '0 8px 24px -8px rgba(15,64,152,0.4)' }}>
                        <Download size={18} /> Export PDF
                    </button>
                </div>
            </div>

            {/* Growth Metrics Dashboard */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                <div className="card" style={{ padding: '2rem', borderRadius: 28, background: '#fff', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                    <div>
                        <p style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>Revenue Velocity</p>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.03em', margin: 0 }}>{revenueGrowth >= 0 ? '+' : ''}{revenueGrowth.toFixed(1)}%</h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', color: revenueGrowth >= 0 ? '#10b981' : '#ef4444', fontSize: '0.9rem', fontWeight: 800 }}>
                            {revenueGrowth >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                            <span>Vs Preceding Cycle</span>
                        </div>
                    </div>
                    <div style={{ width: 72, height: 72, borderRadius: 20, background: 'rgba(13, 64, 152, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(13, 64, 152, 0.1)' }}>
                        <DollarSign size={32} color="var(--accent)" />
                    </div>
                </div>
                
                <div className="card" style={{ padding: '2rem', borderRadius: 28, background: '#fff', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                    <div>
                        <p style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>Strategic Reach</p>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.03em', margin: 0 }}>{categories.length + zones.length} Sectors</h2>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '1rem', fontWeight: 700 }}>Actively monitored corridor zones</p>
                    </div>
                    <div style={{ width: 72, height: 72, borderRadius: 20, background: 'rgba(16, 185, 129, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                        <Target size={32} color="#10b981" />
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 500px), 1fr))', gap: '2rem' }}>
                {/* Revenue Trajectory Trend */}
                <div className="card" style={{ padding: '2.5rem', borderRadius: 32, background: '#fff', border: '1px solid var(--border)', gridColumn: '1 / -1', boxShadow: '0 8px 32px rgba(0,0,0,0.03)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <h3 style={{ fontWeight: 900, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', letterSpacing: '-0.02em' }}>
                            <div style={{ width: 44, height: 44, background: 'rgba(15,64,152,0.08)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Calendar size={20} color="var(--accent)" />
                            </div>
                            Revenue Trajectory (6-Cycle Trend)
                        </h3>
                    </div>
                    <div style={{ width: '100%', height: 400 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={monthly}>
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.15}/>
                                        <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" strokeOpacity={0.6} />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: 'var(--text-muted)' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: 'var(--text-muted)' }} tickFormatter={v => `$${v/1000}k`} />
                                <Tooltip 
                                    contentStyle={{ background: '#fff', border: 'none', borderRadius: 16, boxShadow: '0 20px 40px rgba(0,0,0,0.12)', padding: '1.25rem' }}
                                    itemStyle={{ fontSize: '0.9rem', fontWeight: 800 }}
                                    labelStyle={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem' }}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="var(--accent)" fillOpacity={1} fill="url(#colorRev)" strokeWidth={4} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Sector Allocation Breakdown */}
                <div className="card" style={{ padding: '2.5rem', borderRadius: 32, background: '#fff', border: '1px solid var(--border)', boxShadow: '0 8px 32px rgba(0,0,0,0.03)' }}>
                    <h3 style={{ fontWeight: 900, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem', letterSpacing: '-0.02em' }}>
                        <div style={{ width: 44, height: 44, background: 'rgba(139,92,246,0.08)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Tag size={20} color="#8b5cf6" />
                        </div>
                        Sector Revenue Allocation
                    </h3>
                    <div style={{ width: '100%', height: 320 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={categories} dataKey="revenue" nameKey="category" cx="50%" cy="50%" outerRadius={110} innerRadius={80} paddingAngle={6} stroke="none">
                                    {categories.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ background: '#fff', border: 'none', borderRadius: 16, boxShadow: '0 12px 24px rgba(0,0,0,0.1)' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div style={{ marginTop: '2.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {categories.map((c: any, i: number) => (
                            <div key={c.category} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 16, border: '1px solid var(--border)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[i % COLORS.length], boxShadow: `0 0 10px ${COLORS[i % COLORS.length]}40` }} />
                                    <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>{c.category || 'Unassigned'}</span>
                                </div>
                                <span style={{ fontWeight: 900, fontSize: '0.9rem', color: 'var(--accent)' }}>USD {Number(c.revenue).toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Regional Lane Performance */}
                <div className="card" style={{ padding: '2.5rem', borderRadius: 32, background: '#fff', border: '1px solid var(--border)', boxShadow: '0 8px 32px rgba(0,0,0,0.03)' }}>
                    <h3 style={{ fontWeight: 900, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem', letterSpacing: '-0.02em' }}>
                        <div style={{ width: 44, height: 44, background: 'rgba(20,184,166,0.08)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Map size={20} color="#14b8a6" />
                        </div>
                        Corridor Performance Vectors
                    </h3>
                    <div style={{ width: '100%', height: 320 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={zones} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" strokeOpacity={0.6} />
                                <XAxis type="number" hide />
                                <YAxis type="category" dataKey="zone" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 800, fill: 'var(--text-primary)' }} width={90} />
                                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                <Bar dataKey="revenue" fill="var(--accent)" radius={[0, 8, 8, 0]} barSize={24}>
                                    {zones.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div style={{ marginTop: '2rem', textAlign: 'center', padding: '1.5rem', background: 'var(--bg-secondary)', borderRadius: 20, border: '1px solid var(--border)' }}>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 700, margin: 0 }}>Aggregate Regional contribution across all strategic lanes.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
