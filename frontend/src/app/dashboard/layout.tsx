'use client';

/**
 * Dashboard Layout - Premium Enterprise Design
 * Protected route wrapper with sidebar and top navigation
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
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Restore sidebar state from localStorage
        const savedState = localStorage.getItem('aletheia-sidebar-collapsed');
        if (savedState) {
            setSidebarCollapsed(JSON.parse(savedState));
        }
    }, []);

    useEffect(() => {
        // Only redirect if we're sure the user is not logged in
        if (mounted && !authLoading && !user) {
            router.push('/login');
        }
    }, [mounted, authLoading, user, router]);

    const handleSidebarCollapse = (collapsed: boolean) => {
        setSidebarCollapsed(collapsed);
        localStorage.setItem('aletheia-sidebar-collapsed', JSON.stringify(collapsed));
    };

    // Show loading while checking auth
    if (!mounted || authLoading || teamsLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-text-secondary">Loading Aletheia...</span>
                </div>
            </div>
        );
    }

    // Don't render if not authenticated
    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-background">
            <TopNav />
            <Sidebar collapsed={sidebarCollapsed} onCollapse={handleSidebarCollapse} />
            <main
                className={`
                    pt-16 min-h-screen transition-all duration-200
                    ${sidebarCollapsed ? 'pl-16' : 'pl-65'}
                `}
            >
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
