import DashboardLayout from '@/app/dashboard/layout';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Support Hub',
};

export default function SupportLayout({ children }: { children: React.ReactNode }) {
    return <DashboardLayout>{children}</DashboardLayout>;
}
