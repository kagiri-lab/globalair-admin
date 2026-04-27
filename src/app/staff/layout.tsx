import DashboardLayout from '../dashboard/layout';

export default function StaffLayout({ children }: { children: React.ReactNode }) {
    return (
        <DashboardLayout>
            {children}
        </DashboardLayout>
    );
}
