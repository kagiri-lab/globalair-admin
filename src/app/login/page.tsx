'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { ShieldCheck, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useState, useEffect, Suspense } from 'react';
import { useAdminAuth } from '@/lib/auth';

const schema = z.object({
    email: z.string().email('Invalid email'),
    password: z.string().min(1, 'Password required'),
});
type F = z.infer<typeof schema>;

function LoginForm() {
    const { user, login } = useAdminAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [showPw, setShowPw] = useState(false);
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<F>({ resolver: zodResolver(schema) });

    useEffect(() => {
        // If user is already logged in AND not explicitly coming here due to expiry
        // we might want to redirect, but user says they want to stay at login.
        // Actually, usually you SHOULD stay at login if you manually navigated there.
    }, [user]);

    useEffect(() => {
        if (searchParams.get('expired')) {
            toast.error('Your session has expired. Please login again.', { id: 'session-expired' });
        }
    }, [searchParams]);

    const onSubmit = async (data: F) => {
        try {
            await login(data.email, data.password);
            toast.success('Welcome back, Admin');
            router.push('/dashboard');
        } catch (err: any) {
            toast.error(err.message === 'Not authorized as admin' ? 'Access denied — admin only' : err.response?.data?.message || 'Login failed');
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: 'radial-gradient(ellipse at 50% 0%, rgba(59,130,246,0.08) 0%, var(--bg-primary) 60%)' }}>
            <div style={{ width: '100%', maxWidth: 400 }}>
                <div style={{ textAlign: 'center', marginBottom: '2.25rem' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                        <img src="/logo.png" alt="Logo" style={{ height: 60, objectFit: 'contain' }} />
                    </div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.25rem' }}>Admin Portal</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Global Air Cargo internal administration</p>
                </div>

                <div className="card" style={{ padding: '2rem' }}>
                    <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div>
                            <label className="label">Admin Email</label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input {...register('email')} type="email" className={`input ${errors.email ? 'error' : ''}`} style={{ paddingLeft: '2.25rem' }} placeholder="admin@globalaircargo.com" />
                            </div>
                            {errors.email && <p className="field-error">{errors.email.message}</p>}
                        </div>

                        <div>
                            <label className="label">Password</label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input {...register('password')} type={showPw ? 'text' : 'password'} className={`input ${errors.password ? 'error' : ''}`} style={{ paddingLeft: '2.25rem', paddingRight: '2.5rem' }} placeholder="Admin password" />
                                <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                            {errors.password && <p className="field-error">{errors.password.message}</p>}
                        </div>

                        <button type="submit" className="btn btn-primary btn-full" disabled={isSubmitting} style={{ padding: '0.75rem', fontSize: '0.95rem', marginTop: '0.25rem' }}>
                            {isSubmitting ? <><div className="spinner" /> Signing in…</> : <><ShieldCheck size={16} /> Sign In to Admin Panel</>}
                        </button>
                    </form>
                </div>

                <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                    🔒 Restricted access — authorized personnel only
                </p>
            </div>
        </div>
    );
}

export default function AdminLoginPage() {
    return (
        <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="spinner" /></div>}>
            <LoginForm />
        </Suspense>
    );
}
