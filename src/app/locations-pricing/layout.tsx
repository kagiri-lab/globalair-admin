import DashboardLayout from '@/app/dashboard/layout';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Locations & Pricing',
};

export default function LocationsPricingLayout({ children }: { children: React.ReactNode }) {
    return <DashboardLayout>{children}</DashboardLayout>;
}
