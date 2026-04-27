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
        <div style={{ padding: '2rem', maxWidth: 800, margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.25rem' }}>Profile Settings</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Manage your account details and security preferences.</p>
            </div>

            <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>

                {/* Personal Details Form */}
                <form onSubmit={handleUpdateProfile} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <User size={18} color="var(--primary)" /> Personal Information
                        </h2>
                    </div>

                    <div className="form-group">
                        <label className="label">Full Name</label>
                        <div style={{ position: 'relative' }}>
                            <User size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
                            <input type="text" className="input" required value={name} onChange={e => setName(e.target.value)} style={{ paddingLeft: '2.5rem' }} />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="label">Email Address</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
                            <input type="email" className="input" required value={email} onChange={e => setEmail(e.target.value)} style={{ paddingLeft: '2.5rem' }} />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="label">Phone Number (Optional)</label>
                        <div style={{ position: 'relative' }}>
                            <Phone size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
                            <input type="tel" className="input" value={phone} onChange={e => setPhone(e.target.value)} style={{ paddingLeft: '2.5rem' }} />
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', background: 'rgba(16,185,129,0.1)', padding: '0.75rem 1rem', borderRadius: '8px', color: '#10b981', fontSize: '0.85rem' }}>
                        <ShieldCheck size={18} />
                        <div>
                            <p style={{ fontWeight: 700 }}>Administrator Account</p>
                            <p style={{ opacity: 0.8 }}>You have full system access permissions.</p>
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={savingProfile} style={{ marginTop: '0.5rem' }}>
                        {savingProfile ? 'Saving...' : <><Save size={16} /> Save Changes</>}
                    </button>
                </form>

                {/* Password Form */}
                <form onSubmit={handleUpdatePassword} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', alignSelf: 'start' }}>
                    <div style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Lock size={18} color="var(--primary)" /> Change Password
                        </h2>
                    </div>

                    <div className="form-group">
                        <label className="label">Current Password</label>
                        <input type="password" required minLength={6} className="input" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Enter current password" />
                    </div>

                    <div className="form-group">
                        <label className="label">New Password</label>
                        <input type="password" required minLength={6} className="input" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min. 6 characters" />
                    </div>

                    <div className="form-group">
                        <label className="label">Confirm New Password</label>
                        <input type="password" required minLength={6} className="input" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm new password" />
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={savingPassword} style={{ marginTop: '0.5rem' }}>
                        {savingPassword ? 'Updating...' : 'Update Password'}
                    </button>
                </form>
            </div>
        </div>
    );
}
