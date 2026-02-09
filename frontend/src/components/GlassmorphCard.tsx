/**
 * Glassmorphism Card Component
 * Reusable card with blur, depth, and layered styling.
 */

import { ReactNode } from 'react';

interface GlassmorphCardProps {
    children: ReactNode;
    className?: string;
    hover?: boolean;
}

export function GlassmorphCard({ children, className = '', hover = false }: GlassmorphCardProps) {
    return (
        <div
            className={`
        glass rounded-2xl p-6 shadow-glass
        ${hover ? 'hover:glass-strong hover:shadow-glass-sm hover:scale-[1.02]' : ''}
        ${className}
      `}
        >
            {children}
        </div>
    );
}
