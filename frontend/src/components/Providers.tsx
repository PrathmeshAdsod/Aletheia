'use client';

/**
 * Providers Component
 * Client-side wrapper for all context providers
 * Needed because root layout is a server component in Next.js App Router
 */

import { ReactNode } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { TeamProvider } from '@/contexts/TeamContext';
import { ThemeProvider } from '@/contexts/ThemeContext';

interface ProvidersProps {
    children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
    return (
        <ThemeProvider>
            <AuthProvider>
                <TeamProvider>
                    {children}
                </TeamProvider>
            </AuthProvider>
        </ThemeProvider>
    );
}
