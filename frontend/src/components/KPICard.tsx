/**
 * KPI Card Component
 * Clean metric display for executive dashboards
 */

import { ReactNode } from 'react';
import { Card } from './Card';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface KPICardProps {
    label: string;
    value: string | number;
    trend?: 'up' | 'down';
    trendValue?: string;
    icon?: ReactNode;
    sentiment?: 'conflict' | 'aligned' | 'neutral' | 'primary';
}

export function KPICard({ label, value, trend, trendValue, icon, sentiment = 'primary' }: KPICardProps) {
    const sentimentColors = {
        conflict: 'text-conflict',
        aligned: 'text-aligned',
        neutral: 'text-neutral',
        primary: 'text-primary'
    };

    return (
        <Card className="p-6">
            <div className="flex items-start justify-between mb-4">
                <span className="text-meta text-text-secondary uppercase tracking-wider font-medium">
                    {label}
                </span>
                {icon && <div className={sentimentColors[sentiment]}>{icon}</div>}
            </div>

            <div className="flex items-end justify-between">
                <h3 className={`text-display font-semibold ${sentimentColors[sentiment]}`}>
                    {value}
                </h3>

                {trend && trendValue && (
                    <div className={`flex items-center gap-1 text-small ${trend === 'up' ? 'text-aligned' : 'text-conflict'
                        }`}>
                        {trend === 'up' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                        <span>{trendValue}</span>
                    </div>
                )}
            </div>
        </Card>
    );
}
