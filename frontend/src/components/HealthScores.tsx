/**
 * Health Score Components
 * 
 * Tier 1: Executive-grade health visualization
 * - 2 large hero gauges (Alignment, Stability)
 * - 3 smaller metric cards (Velocity, Resolution, Clarity)
 * - Trend sparklines
 */

'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTeam } from '@/contexts/TeamContext';

interface HealthScores {
    alignment: number;
    stability: number;
    velocity: number;
    resolution: number;
    clarity: number;
    overall: number;
}

interface ScoreHistoryEntry {
    recorded_at: string;
    scores: HealthScores;
}

interface HealthData {
    scores: HealthScores;
    history: ScoreHistoryEntry[];
    stats: {
        decisionCount: number;
        conflictCount: number;
    };
}

// Color based on score
function getScoreColor(score: number): string {
    if (score >= 80) return 'text-aligned';
    if (score >= 60) return 'text-primary';
    if (score >= 40) return 'text-warning';
    return 'text-conflict';
}

function getScoreBgColor(score: number): string {
    if (score >= 80) return 'bg-aligned';
    if (score >= 60) return 'bg-primary';
    if (score >= 40) return 'bg-warning';
    return 'bg-conflict';
}

// Circular gauge component
export function ScoreGauge({
    score,
    label,
    size = 'large',
    showTrend = false,
    trend = 0,
}: {
    score: number;
    label: string;
    size?: 'large' | 'small';
    showTrend?: boolean;
    trend?: number;
}) {
    const radius = size === 'large' ? 70 : 40;
    const strokeWidth = size === 'large' ? 10 : 6;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    const viewBoxSize = (radius + strokeWidth) * 2;
    const center = radius + strokeWidth;

    return (
        <div className="flex flex-col items-center">
            <div className="relative">
                <svg
                    width={viewBoxSize}
                    height={viewBoxSize}
                    className="transform -rotate-90"
                >
                    {/* Background circle */}
                    <circle
                        cx={center}
                        cy={center}
                        r={radius}
                        stroke="currentColor"
                        strokeWidth={strokeWidth}
                        fill="none"
                        className="text-neutral-light dark:text-neutral-dark"
                    />
                    {/* Score arc */}
                    <circle
                        cx={center}
                        cy={center}
                        r={radius}
                        stroke="currentColor"
                        strokeWidth={strokeWidth}
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        className={`${getScoreColor(score)} transition-all duration-1000`}
                    />
                </svg>
                {/* Score text in center */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`font-bold ${size === 'large' ? 'text-3xl' : 'text-xl'} text-text-primary`}>
                        {Math.round(score)}
                    </span>
                    {showTrend && trend !== 0 && (
                        <span className={`text-xs ${trend > 0 ? 'text-aligned' : 'text-conflict'}`}>
                            {trend > 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}
                        </span>
                    )}
                </div>
            </div>
            <span className={`mt-2 font-medium ${size === 'large' ? 'text-base' : 'text-sm'} text-text-secondary`}>
                {label}
            </span>
        </div>
    );
}

// Sparkline for trend visualization
export function Sparkline({ data, color = 'primary' }: { data: number[]; color?: string }) {
    if (data.length < 2) return null;

    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const width = 80;
    const height = 24;

    const points = data.map((value, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((value - min) / range) * height;
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg width={width} height={height} className="inline-block">
            <polyline
                points={points}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`text-${color}`}
            />
        </svg>
    );
}

// Metric card component
export function MetricCard({
    label,
    score,
    history = [],
    icon,
}: {
    label: string;
    score: number;
    history?: number[];
    icon?: React.ReactNode;
}) {
    return (
        <div className="p-4 bg-surface rounded-xl border border-border hover:border-border-hover transition-colors">
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-text-secondary">{label}</span>
                {icon && <span className="text-text-tertiary">{icon}</span>}
            </div>
            <div className="flex items-end justify-between">
                <div className="flex items-baseline gap-2">
                    <span className={`text-2xl font-bold ${getScoreColor(score)}`}>
                        {Math.round(score)}
                    </span>
                    <span className="text-xs text-text-tertiary">/100</span>
                </div>
                {history.length > 1 && (
                    <Sparkline data={history} color="primary" />
                )}
            </div>
        </div>
    );
}

// Full health dashboard section
export function HealthDashboard() {
    const { session } = useAuth();
    const { selectedTeam } = useTeam();
    const [health, setHealth] = useState<HealthData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (selectedTeam && session?.access_token) {
            fetchHealth();
        }
    }, [selectedTeam, session]);

    async function fetchHealth() {
        if (!selectedTeam || !session?.access_token) return;

        try {
            setLoading(true);
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/teams/${selectedTeam.team.id}/health`,
                {
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`,
                        'x-team-id': selectedTeam.team.id,
                    },
                }
            );

            if (response.ok) {
                const data = await response.json();
                setHealth(data);
            }
        } catch (error) {
            console.error('Failed to fetch health:', error);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="animate-pulse space-y-4">
                <div className="flex gap-8 justify-center">
                    <div className="w-40 h-40 bg-neutral-light dark:bg-neutral-dark rounded-full" />
                    <div className="w-40 h-40 bg-neutral-light dark:bg-neutral-dark rounded-full" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-24 bg-neutral-light dark:bg-neutral-dark rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    if (!health) {
        return (
            <div className="text-center py-8 text-text-secondary">
                No health data available
            </div>
        );
    }

    // Extract history for sparklines
    const getHistoryFor = (key: keyof HealthScores) =>
        health.history.map(h => h.scores[key]);

    return (
        <div className="space-y-6">
            {/* Hero gauges row */}
            <div className="flex justify-center gap-12">
                <ScoreGauge
                    score={health.scores.alignment}
                    label="Alignment"
                    size="large"
                    showTrend
                    trend={health.history.length > 1
                        ? health.scores.alignment - health.history[0].scores.alignment
                        : 0
                    }
                />
                <ScoreGauge
                    score={health.scores.stability}
                    label="Stability"
                    size="large"
                    showTrend
                    trend={health.history.length > 1
                        ? health.scores.stability - health.history[0].scores.stability
                        : 0
                    }
                />
            </div>

            {/* Secondary metrics row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricCard
                    label="Velocity"
                    score={health.scores.velocity}
                    history={getHistoryFor('velocity')}
                />
                <MetricCard
                    label="Resolution"
                    score={health.scores.resolution}
                    history={getHistoryFor('resolution')}
                />
                <MetricCard
                    label="Clarity"
                    score={health.scores.clarity}
                    history={getHistoryFor('clarity')}
                />
            </div>

            {/* Stats summary */}
            <div className="flex justify-center gap-8 text-sm text-text-secondary">
                <span><strong className="text-text-primary">{health.stats.decisionCount}</strong> decisions</span>
                <span><strong className={health.stats.conflictCount > 0 ? 'text-conflict' : 'text-text-primary'}>{health.stats.conflictCount}</strong> active conflicts</span>
            </div>
        </div>
    );
}
