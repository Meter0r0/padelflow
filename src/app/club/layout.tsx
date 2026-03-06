import AuthWrapper from '@/components/AuthWrapper';

export default function ClubLayout({
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
