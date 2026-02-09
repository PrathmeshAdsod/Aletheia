/**
 * Clean Card Component
 * Premium white card with subtle shadow - Notion/Linear style
 */

import { ReactNode } from 'react';

interface CardProps {
    children: ReactNode;
    className?: string;
    hover?: boolean;
    style?: React.CSSProperties;
}

export function Card({ children, className = '', hover = false, style }: CardProps) {
    return (
        <div
            className={`
        card
        ${hover ? 'card-hover cursor-pointer' : ''}
        ${className}
      `}
            style={style}
        >
            {children}
        </div>
    );
}
