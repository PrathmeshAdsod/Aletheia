'use client';

/**
 * Strategic DNA Component
 * Radar chart visualization of organizational identity fingerprint
 */

import { useEffect, useState, useRef } from 'react';
import {
    Dna,
    RefreshCw,
    Lightbulb,
    Users,
    ChevronRight
} from 'lucide-react';
import { Card } from './Card';
import { useAuth } from '@/contexts/AuthContext';
import { useTeam } from '@/contexts/TeamContext';

interface DNAInsight {
    dimension: string;
    observation: string;
    implication: string;
}

interface DNAContext {
    decisionCount: number;
    timespan: string;
    actorCount: number;
    dominantActors: string[];
}

interface StrategicDNAData {
    riskAppetite: number;
    decisionStyle: number;
    conflictTolerance: number;
    innovationBias: number;
    decisionEntropy: number;
    insights: DNAInsight[];
    analysisContext: DNAContext;
}

const dimensions = [
    { key: 'riskAppetite', label: 'Risk Appetite', low: 'Conservative', high: 'Aggressive' },
    { key: 'decisionStyle', label: 'Decision Style', low: 'Centralized', high: 'Distributed' },
    { key: 'conflictTolerance', label: 'Conflict Tolerance', low: 'Avoidant', high: 'Embracing' },
    { key: 'innovationBias', label: 'Innovation Bias', low: 'Stability', high: 'Disruption' },
    { key: 'decisionEntropy', label: 'Decision Entropy', low: 'Predictable', high: 'Chaotic' },
];

export function StrategicDNA() {
    const { session } = useAuth();
    const { selectedTeam } = useTeam();
    const [dna, setDNA] = useState<StrategicDNAData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (selectedTeam && session?.access_token) {
            fetchDNA();
        }
    }, [selectedTeam, session]);

    useEffect(() => {
        if (dna && canvasRef.current) {
            drawRadarChart();
        }
    }, [dna]);

    async function fetchDNA(refresh = false) {
        if (!selectedTeam || !session?.access_token) return;

        try {
            if (refresh) setRefreshing(true);
            else setLoading(true);

            const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/teams/${selectedTeam.team.id}/dna${refresh ? '?refresh=true' : ''}`;
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'x-team-id': selectedTeam.team.id,
                },
            });
            if (response.ok) {
                const data = await response.json();
                setDNA(data.dna);
            }
        } catch (error) {
            console.error('Failed to fetch DNA:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }

    function drawRadarChart() {
        const canvas = canvasRef.current;
        if (!canvas || !dna) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const size = 240;
        const center = size / 2;
        const radius = center - 40;

        // Set canvas size
        canvas.width = size;
        canvas.height = size;

        // Clear canvas
        ctx.clearRect(0, 0, size, size);

        // Draw background circles
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 1;
        for (let i = 1; i <= 4; i++) {
            ctx.beginPath();
            ctx.arc(center, center, (radius / 4) * i, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Draw axis lines and labels
        const values = [
            dna.riskAppetite,
            dna.decisionStyle,
            dna.conflictTolerance,
            dna.innovationBias,
            dna.decisionEntropy
        ];

        ctx.strokeStyle = '#d1d5db';
        ctx.fillStyle = '#6b7280';
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'center';

        for (let i = 0; i < 5; i++) {
            const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
            const x = center + Math.cos(angle) * radius;
            const y = center + Math.sin(angle) * radius;

            ctx.beginPath();
            ctx.moveTo(center, center);
            ctx.lineTo(x, y);
            ctx.stroke();

            // Label
            const labelX = center + Math.cos(angle) * (radius + 20);
            const labelY = center + Math.sin(angle) * (radius + 20);
            ctx.fillText(values[i].toString(), labelX, labelY + 4);
        }

        // Draw data polygon
        ctx.beginPath();
        ctx.fillStyle = 'rgba(99, 102, 241, 0.2)';
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 2;

        for (let i = 0; i < 5; i++) {
            const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
            const value = values[i] / 100;
            const x = center + Math.cos(angle) * radius * value;
            const y = center + Math.sin(angle) * radius * value;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }

        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Draw data points
        ctx.fillStyle = '#6366f1';
        for (let i = 0; i < 5; i++) {
            const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
            const value = values[i] / 100;
            const x = center + Math.cos(angle) * radius * value;
            const y = center + Math.sin(angle) * radius * value;

            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    const getValueLabel = (value: number, low: string, high: string) => {
        if (value < 35) return low;
        if (value > 65) return high;
        return 'Balanced';
    };

    if (loading) {
        return (
            <Card className="p-6">
                <div className="flex items-center justify-center h-64">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            </Card>
        );
    }

    if (!dna) {
        return (
            <Card className="p-6">
                <div className="text-center py-8">
                    <Dna className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
                    <p className="text-text-secondary">No DNA data available yet</p>
                    <p className="text-meta text-text-tertiary">Upload documents to analyze patterns</p>
                </div>
            </Card>
        );
    }

    return (
        <Card className="p-0 overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-border">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <Dna className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <h2 className="text-h3 text-text-primary">Strategic DNA</h2>
                            <p className="text-meta text-text-tertiary">Organizational identity fingerprint</p>
                        </div>
                    </div>
                    <button
                        onClick={() => fetchDNA(true)}
                        disabled={refreshing}
                        className="p-2 text-text-tertiary hover:text-text-secondary hover:bg-neutral-light rounded-lg transition-colors"
                    >
                        <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Radar Chart */}
            <div className="p-6 flex justify-center">
                <div className="relative">
                    <canvas ref={canvasRef} className="w-60 h-60" />
                    {/* Dimension labels around chart */}
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-xs text-text-secondary font-medium">
                        Risk
                    </div>
                    <div className="absolute top-1/4 -right-8 text-xs text-text-secondary font-medium">
                        Style
                    </div>
                    <div className="absolute bottom-8 -right-8 text-xs text-text-secondary font-medium">
                        Conflict
                    </div>
                    <div className="absolute bottom-8 -left-12 text-xs text-text-secondary font-medium">
                        Innovation
                    </div>
                    <div className="absolute top-1/4 -left-10 text-xs text-text-secondary font-medium">
                        Entropy
                    </div>
                </div>
            </div>

            {/* Dimension Details */}
            <div className="px-6 pb-4 space-y-3">
                {dimensions.map((dim) => {
                    const value = dna[dim.key as keyof StrategicDNAData] as number;
                    const label = getValueLabel(value, dim.low, dim.high);

                    return (
                        <div key={dim.key} className="flex items-center gap-3">
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-small text-text-secondary">{dim.label}</span>
                                    <span className={`text-meta font-medium ${value > 65 ? 'text-purple-600' :
                                            value < 35 ? 'text-blue-600' : 'text-text-tertiary'
                                        }`}>{label}</span>
                                </div>
                                <div className="h-1.5 bg-neutral-light rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-500"
                                        style={{ width: `${value}%` }}
                                    />
                                </div>
                            </div>
                            <span className="text-meta font-semibold text-text-primary w-8 text-right">{value}</span>
                        </div>
                    );
                })}
            </div>

            {/* Insights */}
            {dna.insights.length > 0 && (
                <div className="p-4 border-t border-border bg-amber-50">
                    <div className="flex items-start gap-3">
                        <Lightbulb className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-small font-medium text-amber-800 mb-1">
                                {dna.insights[0].dimension}
                            </p>
                            <p className="text-meta text-amber-700">
                                {dna.insights[0].implication}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Context Footer */}
            <div className="px-6 py-3 bg-neutral-light border-t border-border flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-meta text-text-tertiary">
                        <Users className="w-4 h-4" />
                        <span>{dna.analysisContext.actorCount} actors</span>
                    </div>
                    <span className="text-meta text-text-tertiary">
                        {dna.analysisContext.decisionCount} decisions
                    </span>
                </div>
                <span className="text-meta text-text-tertiary">
                    {dna.analysisContext.timespan}
                </span>
            </div>
        </Card>
    );
}
