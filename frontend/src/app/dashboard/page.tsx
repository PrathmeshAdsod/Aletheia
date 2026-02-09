'use client';

/**
 * Command Center - Executive Dashboard (Team-Scoped)
 * Premium enterprise design with advanced analytics and proactive AI insights
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Activity,
    AlertTriangle,
    CheckCircle,
    Minus,
    TrendingUp,
    TrendingDown,
    Clock,
    BarChart3,
    ArrowUpRight,
    ArrowDownRight,
    Zap,
    Target,
    FileText,
    Lightbulb,
    Brain,
    Sparkles
} from 'lucide-react';
import { KPICard } from '@/components/KPICard';
import { Card } from '@/components/Card';
import { HealthDashboard } from '@/components/HealthScores';
import { StrategicPulse } from '@/components/StrategicPulse';
import { StrategicDNA } from '@/components/StrategicDNA';
import { RiskRadar } from '@/components/RiskRadar';
import { ExecutiveBriefing } from '@/components/ExecutiveBriefing';
import { TeamBenchmarks } from '@/components/TeamBenchmarks';
import { AccountabilityWidget } from '@/components/AccountabilityWidget';
import { useAuth } from '@/contexts/AuthContext';
import { useTeam } from '@/contexts/TeamContext';
import { metricsApi } from '@/lib/team-api';

interface ConsistencyMetrics {
    score: number;
    red_flags: number;
    green_alignments: number;
    neutral_count: number;
    unresolved_conflicts: number;
    total_decisions: number;
}

interface ProactiveInsight {
    id: string;
    type: string;
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    suggestedAction?: string;
}

interface AISummary {
    summary: string;
    topPriorities: string[];
    suggestedFocus: string;
}

export default function CommandCenter() {
    const { user, session } = useAuth();
    const { selectedTeam, loading: teamsLoading } = useTeam();
    const router = useRouter();

    const [metrics, setMetrics] = useState<ConsistencyMetrics | null>(null);
    const [insights, setInsights] = useState<ProactiveInsight[]>([]);
    const [aiSummary, setAiSummary] = useState<AISummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [insightsLoading, setInsightsLoading] = useState(true);

    useEffect(() => {
        if (!user && !teamsLoading) {
            router.push('/login');
        }
    }, [user, teamsLoading, router]);

    useEffect(() => {
        if (selectedTeam && session?.access_token) {
            fetchMetrics();
            fetchInsights();
            fetchAISummary();
            const interval = setInterval(fetchMetrics, 10000);
            return () => clearInterval(interval);
        }
    }, [selectedTeam, session]);

    async function fetchMetrics() {
        if (!selectedTeam || !session?.access_token) return;

        try {
            setLoading(true);
            const data = await metricsApi.getMetrics(session.access_token, selectedTeam.team.id);
            setMetrics(data);
        } catch (error) {
            console.error('Failed to fetch metrics:', error);
        } finally {
            setLoading(false);
        }
    }

    async function fetchInsights() {
        if (!selectedTeam || !session?.access_token) return;

        try {
            setInsightsLoading(true);
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/teams/${selectedTeam.team.id}/insights`,
                {
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`,
                        'x-team-id': selectedTeam.team.id,
                    },
                }
            );
            if (response.ok) {
                const data = await response.json();
                setInsights(data.insights || []);
            }
        } catch (error) {
            console.warn('Failed to fetch insights:', error);
        } finally {
            setInsightsLoading(false);
        }
    }

    async function fetchAISummary() {
        if (!selectedTeam || !session?.access_token) return;

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/teams/${selectedTeam.team.id}/insights/summary`,
                {
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`,
                        'x-team-id': selectedTeam.team.id,
                    },
                }
            );
            if (response.ok) {
                const data = await response.json();
                setAiSummary({
                    summary: data.summary || '',
                    topPriorities: data.topPriorities || [],
                    suggestedFocus: data.suggestedFocus || ''
                });
            }
        } catch (error) {
            console.warn('Failed to fetch AI summary:', error);
        }
    }

    if (teamsLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-text-secondary">Loading...</span>
                </div>
            </div>
        );
    }

    if (!selectedTeam) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center max-w-md">
                    <div className="w-16 h-16 bg-neutral-light rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Target className="w-8 h-8 text-text-tertiary" />
                    </div>
                    <h3 className="text-h3 text-text-primary mb-2">No Team Selected</h3>
                    <p className="text-text-secondary">Please contact an admin to be added to a team</p>
                </div>
            </div>
        );
    }

    // Calculate score sentiment
    const getScoreSentiment = (score: number) => {
        if (score >= 80) return { color: 'text-aligned', bg: 'bg-aligned-light', label: 'Healthy' };
        if (score >= 50) return { color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Needs Attention' };
        return { color: 'text-conflict', bg: 'bg-conflict-light', label: 'Critical' };
    };

    const getSeverityStyles = (severity: string) => {
        switch (severity) {
            case 'critical': return 'border-l-red-500 bg-red-50';
            case 'high': return 'border-l-orange-500 bg-orange-50';
            case 'medium': return 'border-l-yellow-500 bg-yellow-50';
            default: return 'border-l-blue-500 bg-blue-50';
        }
    };

    const scoreSentiment = metrics ? getScoreSentiment(metrics.score) : null;

    return (
        <div className="max-w-[1400px] mx-auto space-y-8 animate-fade-in">
            {/* Page Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-h1 text-text-primary mb-2">
                        Strategic Health
                    </h1>
                    <p className="text-body text-text-secondary">
                        Real-time decision alignment tracking for {selectedTeam.team.name}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-aligned-light rounded-full">
                        <div className="w-2 h-2 bg-aligned rounded-full animate-pulse" />
                        <span className="text-meta text-aligned font-medium">Live</span>
                    </div>
                </div>
            </div>

            {/* STRATEGIC INTELLIGENCE GRID */}
            {selectedTeam && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Column 1: Health & Risk */}
                    <div className="space-y-6">
                        <StrategicPulse />
                        <RiskRadar teamId={selectedTeam.team.id} />
                    </div>

                    {/* Column 2: Executive Intelligence */}
                    <div className="space-y-6">
                        <ExecutiveBriefing teamId={selectedTeam.team.id} />
                        <AccountabilityWidget teamId={selectedTeam.team.id} />
                    </div>

                    {/* Column 3: Identity & Benchmarks */}
                    <div className="space-y-6">
                        <StrategicDNA />
                        <TeamBenchmarks teamId={selectedTeam.team.id} />
                    </div>
                </div>
            )}

            {/* Tier 1: Health Scores Section */}
            <Card className="p-8">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-primary" />
                        <span className="text-meta text-text-secondary uppercase tracking-wider font-medium">
                            Team Health Scores
                        </span>
                    </div>
                </div>
                <HealthDashboard />
            </Card>

            {/* Primary KPI - Consistency Score */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1 p-8 relative overflow-hidden">
                    {/* Background Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />

                    <div className="relative">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <Target className="w-5 h-5 text-primary" />
                                <span className="text-meta text-text-secondary uppercase tracking-wider font-medium">
                                    Consistency Score
                                </span>
                            </div>
                            {scoreSentiment && (
                                <span className={`px-2.5 py-1 rounded-full text-meta font-medium ${scoreSentiment.bg} ${scoreSentiment.color}`}>
                                    {scoreSentiment.label}
                                </span>
                            )}
                        </div>

                        <div className="flex items-end gap-2 mb-4">
                            <span className="text-[72px] font-bold leading-none bg-gradient-primary bg-clip-text text-transparent">
                                {loading ? '--' : metrics?.score ?? 0}
                            </span>
                            <span className="text-2xl text-text-tertiary mb-3">%</span>
                        </div>

                        <div className="flex items-center gap-4 text-small">
                            <div className="flex items-center gap-1.5 text-aligned">
                                <TrendingUp className="w-4 h-4" />
                                <span>+5% this week</span>
                            </div>
                            <span className="text-text-tertiary">•</span>
                            <span className="text-text-secondary">
                                {metrics?.total_decisions ?? 0} decisions tracked
                            </span>
                        </div>
                    </div>
                </Card>

                {/* Secondary KPIs Grid */}
                <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Conflicts */}
                    <Card className="p-5 group hover:border-conflict/50 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                            <div className="p-2 bg-conflict-light rounded-lg">
                                <AlertTriangle className="w-4 h-4 text-conflict" />
                            </div>
                            {metrics && metrics.red_flags > 0 && (
                                <ArrowUpRight className="w-4 h-4 text-conflict opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                        </div>
                        <p className="text-[32px] font-semibold text-text-primary leading-none mb-1">
                            {loading ? '--' : metrics?.red_flags ?? 0}
                        </p>
                        <p className="text-small text-text-secondary">Active Conflicts</p>
                    </Card>

                    {/* Alignments */}
                    <Card className="p-5 group hover:border-aligned/50 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                            <div className="p-2 bg-aligned-light rounded-lg">
                                <CheckCircle className="w-4 h-4 text-aligned" />
                            </div>
                        </div>
                        <p className="text-[32px] font-semibold text-text-primary leading-none mb-1">
                            {loading ? '--' : metrics?.green_alignments ?? 0}
                        </p>
                        <p className="text-small text-text-secondary">Alignments</p>
                    </Card>

                    {/* Neutral */}
                    <Card className="p-5 group hover:border-neutral/50 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                            <div className="p-2 bg-neutral-light rounded-lg">
                                <Minus className="w-4 h-4 text-neutral" />
                            </div>
                        </div>
                        <p className="text-[32px] font-semibold text-text-primary leading-none mb-1">
                            {loading ? '--' : metrics?.neutral_count ?? 0}
                        </p>
                        <p className="text-small text-text-secondary">Neutral</p>
                    </Card>

                    {/* Pending Resolution */}
                    <Card className="p-5 group hover:border-primary/50 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                            <div className="p-2 bg-primary-light rounded-lg">
                                <Clock className="w-4 h-4 text-primary" />
                            </div>
                        </div>
                        <p className="text-[32px] font-semibold text-text-primary leading-none mb-1">
                            {loading ? '--' : metrics?.unresolved_conflicts ?? 0}
                        </p>
                        <p className="text-small text-text-secondary">Pending Review</p>
                    </Card>
                </div>
            </div>

            {/* Unresolved Conflicts Alert */}
            {metrics && metrics.unresolved_conflicts > 0 && (
                <Card className="p-6 border-l-4 border-l-conflict bg-gradient-to-r from-conflict-light/50 to-transparent">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-conflict-light rounded-xl">
                            <Activity className="text-conflict w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-h3 text-text-primary mb-1">
                                {metrics.unresolved_conflicts} Conflict{metrics.unresolved_conflicts > 1 ? 's' : ''} Require Attention
                            </h3>
                            <p className="text-small text-text-secondary mb-4">
                                Unresolved conflicts are impacting your consistency score. Review and resolve to improve strategic alignment.
                            </p>
                            <a
                                href="/dashboard/flags"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-conflict hover:bg-conflict/90 text-white rounded-lg text-small font-medium transition-colors"
                            >
                                Review Conflicts
                                <ArrowUpRight className="w-4 h-4" />
                            </a>
                        </div>
                    </div>
                </Card>
            )}

            {/* Quick Actions & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Quick Actions */}
                <Card>
                    <div className="p-5 border-b border-border">
                        <h3 className="text-h3 text-text-primary">Quick Actions</h3>
                    </div>
                    <div className="p-5 grid grid-cols-2 gap-3">
                        <a
                            href="/dashboard/auditor"
                            className="p-4 rounded-xl bg-neutral-light hover:bg-primary-light border border-transparent hover:border-primary/20 transition-all group"
                        >
                            <FileText className="w-5 h-5 text-text-tertiary group-hover:text-primary mb-2" />
                            <p className="text-small font-medium text-text-primary">Upload Document</p>
                            <p className="text-meta text-text-tertiary">Add decisions</p>
                        </a>
                        <a
                            href="/dashboard/chat"
                            className="p-4 rounded-xl bg-neutral-light hover:bg-primary-light border border-transparent hover:border-primary/20 transition-all group"
                        >
                            <Brain className="w-5 h-5 text-text-tertiary group-hover:text-primary mb-2" />
                            <p className="text-small font-medium text-text-primary">AI Chat</p>
                            <p className="text-meta text-text-tertiary">Get insights</p>
                        </a>
                        <a
                            href="/dashboard/nexus"
                            className="p-4 rounded-xl bg-neutral-light hover:bg-primary-light border border-transparent hover:border-primary/20 transition-all group"
                        >
                            <BarChart3 className="w-5 h-5 text-text-tertiary group-hover:text-primary mb-2" />
                            <p className="text-small font-medium text-text-primary">View Graph</p>
                            <p className="text-meta text-text-tertiary">Visualize decisions</p>
                        </a>
                        <a
                            href="/dashboard/flags"
                            className="p-4 rounded-xl bg-neutral-light hover:bg-primary-light border border-transparent hover:border-primary/20 transition-all group"
                        >
                            <AlertTriangle className="w-5 h-5 text-text-tertiary group-hover:text-primary mb-2" />
                            <p className="text-small font-medium text-text-primary">Review Flags</p>
                            <p className="text-meta text-text-tertiary">Resolve conflicts</p>
                        </a>
                    </div>
                </Card>

                {/* Recent Activity */}
                <Card>
                    <div className="p-5 border-b border-border flex items-center justify-between">
                        <h3 className="text-h3 text-text-primary">Recent Activity</h3>
                        <a href="/dashboard/timeline" className="text-small text-primary hover:text-primary-hover transition-colors">
                            View All
                        </a>
                    </div>
                    <div className="p-5">
                        {metrics && metrics.total_decisions > 0 ? (
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 py-3 border-b border-border last:border-0">
                                    <div className="w-2 h-2 bg-aligned rounded-full flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-small text-text-primary truncate">Decision graph updated</p>
                                        <p className="text-meta text-text-tertiary">Metrics recalculated</p>
                                    </div>
                                    <span className="text-meta text-text-tertiary flex-shrink-0">2m ago</span>
                                </div>
                                <div className="flex items-center gap-4 py-3 border-b border-border last:border-0">
                                    <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-small text-text-primary truncate">{metrics.total_decisions} decisions processed</p>
                                        <p className="text-meta text-text-tertiary">From document uploads</p>
                                    </div>
                                    <span className="text-meta text-text-tertiary flex-shrink-0">5m ago</span>
                                </div>
                                {metrics.unresolved_conflicts > 0 && (
                                    <div className="flex items-center gap-4 py-3 border-b border-border last:border-0">
                                        <div className="w-2 h-2 bg-conflict rounded-full flex-shrink-0 animate-pulse" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-small text-text-primary truncate">Conflicts detected</p>
                                            <p className="text-meta text-text-tertiary">{metrics.unresolved_conflicts} require review</p>
                                        </div>
                                        <span className="text-meta text-text-tertiary flex-shrink-0">1h ago</span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <div className="w-12 h-12 bg-neutral-light rounded-xl flex items-center justify-center mx-auto mb-3">
                                    <FileText className="w-6 h-6 text-text-tertiary" />
                                </div>
                                <p className="text-small text-text-tertiary mb-2">No activity yet</p>
                                <a href="/dashboard/auditor" className="text-small text-primary hover:text-primary-hover">
                                    Upload your first document →
                                </a>
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}

