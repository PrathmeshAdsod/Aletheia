'use client';

/**
 * Protected Route Wrapper for Dashboard
 * Only checks auth, doesn't auto-redirect
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { TopNav } from '@/components/TopNav';
import { useAuth } from '@/contexts/AuthContext';
import { useTeam } from '@/contexts/TeamContext';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading: authLoading } = useAuth();
    const { loading: teamsLoading } = useTeam();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        // Only redirect if we're sure the user is not logged in
        if (mounted && !authLoading && !user) {
            router.push('/login');
        }
    }, [mounted, authLoading, user, router]);

    // Show loading while checking auth
    if (!mounted || authLoading || teamsLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-text-secondary">Loading...</div>
            </div>
        );
    }

    // Don't render if not authenticated
    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-background flex">
            <Sidebar />
            <div className="flex-1 flex flex-col ml-64">
                <TopNav />
                <main className="flex-1 p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
