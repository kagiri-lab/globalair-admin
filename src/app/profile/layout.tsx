import DashboardLayout from '@/app/dashboard/layout';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Profile Settings',
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
    return <DashboardLayout>{children}</DashboardLayout>;
}
