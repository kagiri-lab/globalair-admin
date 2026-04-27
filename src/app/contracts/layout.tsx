import DashboardLayout from '../dashboard/layout';

export default function ContractsLayout({ children }: { children: React.ReactNode }) {
    return (
        <DashboardLayout>
            {children}
        </DashboardLayout>
    );
}
