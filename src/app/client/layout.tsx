import AuthWrapper from '@/components/AuthWrapper';

export default function ClientLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthWrapper>
            {children}
        </AuthWrapper>
    );
}
