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
        <div style={{ padding: '2rem', maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.25rem' }}>Financial Reports</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Detailed analysis of revenue, performance, and growth</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn btn-secondary" onClick={loadData}><RefreshCw size={15} /> Refresh</button>
                    <button className="btn btn-primary"><Download size={15} /> Export PDF</button>
                </div>
            </div>

            {/* Growth Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Monthly Revenue Growth</p>
                        <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>{revenueGrowth >= 0 ? '+' : ''}{revenueGrowth.toFixed(1)}%</h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.5rem', color: revenueGrowth >= 0 ? '#10b981' : '#ef4444', fontSize: '0.85rem', fontWeight: 700 }}>
                            {revenueGrowth >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                            <span>Vs Last Month</span>
                        </div>
                    </div>
                    <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <DollarSign size={28} color="var(--accent)" />
                    </div>
                </div>
                <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Active Strategies</p>
                        <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>{categories.length + zones.length} Areas</h2>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Monitored across all facilities</p>
                    </div>
                    <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Target size={28} color="#10b981" />
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
                {/* Revenue Trend */}
                <div className="card" style={{ gridColumn: 'span 2' }}>
                    <h3 style={{ fontWeight: 700, marginBottom: '2rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <Calendar size={18} color="var(--accent)" /> Revenue Trends (Last 6 Months)
                    </h3>
                    <div style={{ width: '100%', height: 350 }}>
                        <ResponsiveContainer>
                            <AreaChart data={monthly}>
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} tickFormatter={v => `K`} />
                                <Tooltip />
                                <Area type="monotone" dataKey="revenue" stroke="var(--accent)" fillOpacity={1} fill="url(#colorRev)" strokeWidth={3} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '1rem' }}>Aggregate revenue across all categories and routes</p>
                </div>

                {/* Categories Breakdown */}
                <div className="card">
                    <h3 style={{ fontWeight: 700, marginBottom: '1.5rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <Tag size={18} color="var(--accent)" /> Revenue by Category
                    </h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie data={categories} dataKey="revenue" nameKey="category" cx="50%" cy="50%" outerRadius={80} innerRadius={60}>
                                    {categories.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div style={{ marginTop: '1rem' }}>
                        {categories.map((c: any, i: number) => (
                            <div key={c.category} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.85rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[i % COLORS.length] }} />
                                    <span>{c.category || 'Uncategorized'}</span>
                                </div>
                                <span style={{ fontWeight: 700 }}>USD {Number(c.revenue).toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Zone Performance */}
                <div className="card">
                    <h3 style={{ fontWeight: 700, marginBottom: '1.5rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <Map size={18} color="var(--accent)" /> Geographic Performance
                    </h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <BarChart data={zones} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                                <XAxis type="number" hide />
                                <YAxis type="category" dataKey="zone" axisLine={false} tickLine={false} tick={{fontSize: 11, fontWeight: 600}} width={80} />
                                <Tooltip cursor={{fill: 'transparent'}} />
                                <Bar dataKey="revenue" fill="var(--accent)" radius={[0, 4, 4, 0]} barSize={20}>
                                    {zones.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Regional contribution across all shipping lanes</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
