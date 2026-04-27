import DashboardLayout from '@/app/dashboard/layout';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Settings',
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
    return <DashboardLayout>{children}</DashboardLayout>;
}
