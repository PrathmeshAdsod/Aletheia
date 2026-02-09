/**
 * Metric Card Component
 * Display key metrics in Command Center.
 */

import { ReactNode } from 'react';
import { GlassmorphCard } from './GlassmorphCard';

interface MetricCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon?: ReactNode;
    color?: 'red' | 'green' | 'neutral' | 'primary';
}

export function MetricCard({ title, value, subtitle, icon, color = 'primary' }: MetricCardProps) {
    const colorClasses = {
        red: 'text-red-flag',
        green: 'text-green-align',
        neutral: 'text-neutral',
        primary: 'text-primary'
    };

    return (
        <GlassmorphCard hover className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">{title}</p>
                {icon && <div className={colorClasses[color]}>{icon}</div>}
            </div>
            <div>
                <h2 className={`text-4xl font-bold ${colorClasses[color]}`}>{value}</h2>
                {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
            </div>
        </GlassmorphCard>
    );
}
