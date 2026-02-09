'use client';

/**
 * Strategic Pulse Component
 * Visual display of organizational pulse with phase and projections
 */

import { useEffect, useState } from 'react';
import {
    Activity,
    TrendingUp,
    TrendingDown,
    Minus,
    AlertTriangle,
    Zap,
    Target,
    ArrowRight
} from 'lucide-react';
import { Card } from './Card';
import { useAuth } from '@/contexts/AuthContext';
import { useTeam } from '@/contexts/TeamContext';

interface PulseSignal {
    type: string;
    strength: number;
    description: string;
}

interface PulseProjection {
    metric: string;
    current: number;
    projected: number;
    daysToThreshold: number | null;
    threshold: number;
    direction: 'up' | 'down' | 'stable';
    confidence: number;
}

interface PulseData {
    pulseScore: number;
    velocity: number;
    velocityTrend: 'accelerating' | 'stable' | 'decelerating';
    conflictMomentum: number;
    coherenceScore: number;
    phase: 'expansion' | 'stabilization' | 'pivot' | 'churn' | 'crisis';
    signals: PulseSignal[];
    projections: PulseProjection[];
}

const phaseConfig: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    expansion: {
        label: 'Expansion',
        color: 'text-green-600',
        bg: 'bg-green-100',
        icon: <TrendingUp className="w-4 h-4" />
    },
    stabilization: {
        label: 'Stabilization',
        color: 'text-blue-600',
        bg: 'bg-blue-100',
        icon: <Minus className="w-4 h-4" />
    },
    pivot: {
        label: 'Pivot',
        color: 'text-yellow-600',
        bg: 'bg-yellow-100',
        icon: <ArrowRight className="w-4 h-4" />
    },
    churn: {
        label: 'Churn',
        color: 'text-orange-600',
        bg: 'bg-orange-100',
        icon: <AlertTriangle className="w-4 h-4" />
    },
    crisis: {
        label: 'Crisis',
        color: 'text-red-600',
        bg: 'bg-red-100',
        icon: <Zap className="w-4 h-4" />
    }
};

export function StrategicPulse() {
    const { session } = useAuth();
    const { selectedTeam } = useTeam();
    const [pulse, setPulse] = useState<PulseData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (selectedTeam && session?.access_token) {
            fetchPulse();
        }
    }, [selectedTeam, session]);

    async function fetchPulse() {
        if (!selectedTeam || !session?.access_token) return;

        try {
            setLoading(true);
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/teams/${selectedTeam.team.id}/pulse`,
                {
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`,
                        'x-team-id': selectedTeam.team.id,
                    },
                }
            );
            if (response.ok) {
                const data = await response.json();
                setPulse(data.pulse);
            }
        } catch (error) {
            console.error('Failed to fetch pulse:', error);
        } finally {
            setLoading(false);
        }
    }

    const getPulseColor = (score: number) => {
        if (score >= 70) return 'from-green-500 to-emerald-500';
        if (score >= 50) return 'from-yellow-500 to-amber-500';
        if (score >= 30) return 'from-orange-500 to-red-400';
        return 'from-red-500 to-red-600';
    };

    const getVelocityIcon = () => {
        if (!pulse) return <Minus className="w-4 h-4" />;
        switch (pulse.velocityTrend) {
            case 'accelerating': return <TrendingUp className="w-4 h-4 text-green-500" />;
            case 'decelerating': return <TrendingDown className="w-4 h-4 text-red-500" />;
            default: return <Minus className="w-4 h-4 text-gray-500" />;
        }
    };

    if (loading) {
        return (
            <Card className="p-6">
                <div className="flex items-center justify-center h-48">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            </Card>
        );
    }

    if (!pulse) {
        return (
            <Card className="p-6">
                <div className="text-center py-8">
                    <Activity className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
                    <p className="text-text-secondary">No pulse data available yet</p>
                    <p className="text-meta text-text-tertiary">Upload documents to generate insights</p>
                </div>
            </Card>
        );
    }

    const phaseInfo = phaseConfig[pulse.phase] || phaseConfig.stabilization;
    const criticalProjection = pulse.projections.find(p => p.daysToThreshold && p.daysToThreshold < 21);

    return (
        <Card className="p-0 overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-border bg-gradient-to-br from-surface to-neutral-light">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary-light rounded-lg">
                            <Activity className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-h3 text-text-primary">Strategic Pulse</h2>
                            <p className="text-meta text-text-tertiary">Real-time health monitoring</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-aligned-light rounded-full">
                        <div className="w-2 h-2 bg-aligned rounded-full animate-pulse" />
                        <span className="text-meta text-aligned font-medium">Live</span>
                    </div>
                </div>

                {/* Pulse Score */}
                <div className="flex items-end gap-4">
                    <div className="flex-1">
                        <div className="flex items-end gap-2 mb-2">
                            <span className={`text-6xl font-bold bg-gradient-to-r ${getPulseColor(pulse.pulseScore)} bg-clip-text text-transparent`}>
                                {pulse.pulseScore}
                            </span>
                            <span className="text-2xl text-text-tertiary mb-2">/100</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-3 bg-neutral-light rounded-full overflow-hidden">
                            <div
                                className={`h-full bg-gradient-to-r ${getPulseColor(pulse.pulseScore)} transition-all duration-1000`}
                                style={{ width: `${pulse.pulseScore}%` }}
                            />
                        </div>
                    </div>

                    {/* Phase Badge */}
                    <div className={`px-4 py-2 rounded-xl ${phaseInfo.bg} flex items-center gap-2`}>
                        <span className={phaseInfo.color}>{phaseInfo.icon}</span>
                        <span className={`font-medium ${phaseInfo.color}`}>{phaseInfo.label}</span>
                    </div>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-3 divide-x divide-border">
                <div className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                        {getVelocityIcon()}
                        <span className="text-2xl font-semibold text-text-primary">{pulse.velocity}</span>
                    </div>
                    <p className="text-meta text-text-tertiary">decisions/day</p>
                </div>
                <div className="p-4 text-center">
                    <span className="text-2xl font-semibold text-text-primary">{pulse.coherenceScore}%</span>
                    <p className="text-meta text-text-tertiary">coherence</p>
                </div>
                <div className="p-4 text-center">
                    <span className={`text-2xl font-semibold ${pulse.conflictMomentum > 0 ? 'text-red-500' :
                            pulse.conflictMomentum < 0 ? 'text-green-500' : 'text-text-primary'
                        }`}>
                        {pulse.conflictMomentum > 0 ? '+' : ''}{pulse.conflictMomentum}
                    </span>
                    <p className="text-meta text-text-tertiary">conflict trend</p>
                </div>
            </div>

            {/* Projection Warning */}
            {criticalProjection && (
                <div className="p-4 bg-yellow-50 border-t border-yellow-200">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-small font-medium text-yellow-800">
                                Trajectory Warning
                            </p>
                            <p className="text-meta text-yellow-700">
                                If current momentum continues, {criticalProjection.metric.toLowerCase()} may drop below {criticalProjection.threshold} in ~{criticalProjection.daysToThreshold} days
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Signals */}
            {pulse.signals.length > 0 && (
                <div className="p-4 border-t border-border">
                    <p className="text-meta text-text-tertiary mb-2 uppercase tracking-wider">Active Signals</p>
                    <div className="space-y-2">
                        {pulse.signals.slice(0, 3).map((signal, i) => (
                            <div key={i} className="flex items-center gap-2 text-small text-text-secondary">
                                <div className={`w-2 h-2 rounded-full ${signal.strength > 0.7 ? 'bg-red-500' :
                                        signal.strength > 0.4 ? 'bg-yellow-500' : 'bg-blue-500'
                                    }`} />
                                {signal.description}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </Card>
    );
}
