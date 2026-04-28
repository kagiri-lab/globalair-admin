'use client';

import { useState, useEffect } from 'react';
import { useAdminAuth } from '@/lib/auth';
import { User, ShieldCheck, Mail, Phone, Lock, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

export default function AdminProfilePage() {
    const { user, setUser } = useAdminAuth();

    // Profile State
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [savingProfile, setSavingProfile] = useState(false);

    // Password State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [savingPassword, setSavingPassword] = useState(false);

    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setEmail(user.email || '');
            setPhone(user.phone || '');
        }
    }, [user]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingProfile(true);
        try {
            const res = await api.patch('/admin/profile', { name, email, phone });
            toast.success(res.data.message);
            setUser({ ...user, name, email, phone } as any);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setSavingProfile(false);
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }
        setSavingPassword(true);
        try {
            const res = await api.patch('/admin/profile/password', { currentPassword, newPassword });
            toast.success(res.data.message);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update password');
        } finally {
            setSavingPassword(false);
        }
    };

    if (!user) return null;

    return (
        <div className="fade-in" style={{ padding: 'clamp(1rem, 3vw, 2.5rem)', maxWidth: 1000, margin: '0 auto' }}>
            <div style={{ marginBottom: '3rem' }}>
                <h1 style={{ fontSize: 'clamp(1.75rem, 5vw, 2.5rem)', fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Account Security</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 600 }}>Manage your administrative credentials and security protocol.</p>
            </div>

            <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))' }}>

                {/* Personal Details Form */}
                <form onSubmit={handleUpdateProfile} className="card" style={{ padding: '2.5rem', borderRadius: 32, background: '#fff', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1.75rem', boxShadow: '0 8px 32px rgba(0,0,0,0.03)' }}>
                    <div style={{ paddingBottom: '1.25rem', borderBottom: '1px solid var(--border)' }}>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                            <User size={22} color="var(--accent)" /> Identity Profile
                        </h2>
                    </div>

                    <div className="form-group">
                        <label className="label" style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '0.75rem', display: 'block' }}>Full Name</label>
                        <div style={{ position: 'relative' }}>
                            <User size={18} style={{ position: 'absolute', left: 16, top: 14, color: 'var(--text-muted)', opacity: 0.7 }} />
                            <input type="text" className="input" required value={name} onChange={e => setName(e.target.value)} style={{ paddingLeft: '3.5rem', height: 48, borderRadius: 14, background: 'var(--bg-secondary)', border: 'none', fontWeight: 600, fontSize: '0.95rem' }} />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="label" style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '0.75rem', display: 'block' }}>Email Vector</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} style={{ position: 'absolute', left: 16, top: 14, color: 'var(--text-muted)', opacity: 0.7 }} />
                            <input type="email" className="input" required value={email} onChange={e => setEmail(e.target.value)} style={{ paddingLeft: '3.5rem', height: 48, borderRadius: 14, background: 'var(--bg-secondary)', border: 'none', fontWeight: 600, fontSize: '0.95rem' }} />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="label" style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '0.75rem', display: 'block' }}>Phone Corridor (Optional)</label>
                        <div style={{ position: 'relative' }}>
                            <Phone size={18} style={{ position: 'absolute', left: 16, top: 14, color: 'var(--text-muted)', opacity: 0.7 }} />
                            <input type="tel" className="input" value={phone} onChange={e => setPhone(e.target.value)} style={{ paddingLeft: '3.5rem', height: 48, borderRadius: 14, background: 'var(--bg-secondary)', border: 'none', fontWeight: 600, fontSize: '0.95rem' }} />
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem', background: 'rgba(16,185,129,0.05)', padding: '1.25rem', borderRadius: '20px', color: '#10b981', border: '1px solid rgba(16,185,129,0.1)' }}>
                        <ShieldCheck size={24} style={{ flexShrink: 0 }} />
                        <div>
                            <p style={{ fontWeight: 900, fontSize: '0.9rem', margin: 0 }}>System Administrator Status</p>
                            <p style={{ opacity: 0.8, fontSize: '0.8rem', fontWeight: 600, margin: '0.2rem 0 0' }}>Authorized with full sector oversight.</p>
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={savingProfile} style={{ marginTop: '0.5rem', height: 52, borderRadius: 16, fontWeight: 900, fontSize: '0.95rem', background: 'linear-gradient(135deg, #0f4098, #1e3a8a)', boxShadow: '0 8px 24px -8px rgba(15,64,152,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                        {savingProfile ? <div className="spinner-sm" /> : <><Save size={20} /> Update Identity</>}
                    </button>
                </form>

                {/* Password Form */}
                <form onSubmit={handleUpdatePassword} className="card" style={{ padding: '2.5rem', borderRadius: 32, background: '#fff', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1.75rem', alignSelf: 'start', boxShadow: '0 8px 32px rgba(0,0,0,0.03)' }}>
                    <div style={{ paddingBottom: '1.25rem', borderBottom: '1px solid var(--border)' }}>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                            <Lock size={22} color="var(--accent)" /> Access Protocol
                        </h2>
                    </div>

                    <div className="form-group">
                        <label className="label" style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '0.75rem', display: 'block' }}>Current Cipher</label>
                        <input type="password" required minLength={6} className="input" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Verification required" style={{ height: 48, borderRadius: 14, background: 'var(--bg-secondary)', border: 'none', fontWeight: 600, fontSize: '0.95rem', padding: '0 1.25rem' }} />
                    </div>

                    <div className="form-group">
                        <label className="label" style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '0.75rem', display: 'block' }}>New Security Cipher</label>
                        <input type="password" required minLength={6} className="input" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min. 6 alphanumeric" style={{ height: 48, borderRadius: 14, background: 'var(--bg-secondary)', border: 'none', fontWeight: 600, fontSize: '0.95rem', padding: '0 1.25rem' }} />
                    </div>

                    <div className="form-group">
                        <label className="label" style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '0.75rem', display: 'block' }}>Confirm New Cipher</label>
                        <input type="password" required minLength={6} className="input" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Re-verify new cipher" style={{ height: 48, borderRadius: 14, background: 'var(--bg-secondary)', border: 'none', fontWeight: 600, fontSize: '0.95rem', padding: '0 1.25rem' }} />
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={savingPassword} style={{ marginTop: '0.5rem', height: 52, borderRadius: 16, fontWeight: 900, fontSize: '0.95rem', background: 'linear-gradient(135deg, #0f4098, #1e3a8a)', boxShadow: '0 8px 24px -8px rgba(15,64,152,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {savingPassword ? <div className="spinner-sm" /> : 'Renew Security Protocol'}
                    </button>
                </form>
            </div>
        </div>
    );
}
