'use client';

/**
 * Command Center - Executive Dashboard (Team-Scoped)
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, AlertTriangle, CheckCircle, Minus, TrendingUp } from 'lucide-react';
import { KPICard } from '@/components/KPICard';
import { Card } from '@/components/Card';
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

export default function CommandCenter() {
    const { user, session } = useAuth();
    const { selectedTeam, loading: teamsLoading } = useTeam();
    const router = useRouter();

    const [metrics, setMetrics] = useState<ConsistencyMetrics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Redirect to login if not authenticated
        if (!user && !teamsLoading) {
            router.push('/login');
        }
    }, [user, teamsLoading, router]);

    useEffect(() => {
        if (selectedTeam && session?.access_token) {
            fetchMetrics();
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

    if (teamsLoading || loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-text-tertiary">Loading metrics...</div>
            </div>
        );
    }

    if (!selectedTeam) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <p className="text-text-secondary mb-4">No team selected</p>
                    <p className="text-text-tertiary text-sm">Please contact an admin to be added to a team</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-[1400px] mx-auto space-y-8">
            {/* Page Header */}
            <div>
                <h1 className="text-h1 text-text-primary mb-2">
                    {selectedTeam.team.name} - Health Dashboard
                </h1>
                <p className="text-body text-text-secondary">
                    Real-time institutional knowledge consistency tracking
                </p>
            </div>

            {/* KPI Grid - Scannable in < 5 seconds */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="p-6 col-span-1">
                    <div className="flex items-start justify-between mb-3">
                        <span className="text-meta text-text-secondary uppercase tracking-wider font-medium">
                            Consistency Score
                        </span>
                        <TrendingUp size={16} className="text-aligned" />
                    </div>
                    <div className="flex items-end justify-between">
                        <h3 className="text-[48px] font-semibold text-primary leading-none">
                            {metrics?.score ?? 0}%
                        </h3>
                    </div>
                    <p className="text-meta text-text-tertiary mt-3">
                        {metrics?.total_decisions ?? 0} decisions analyzed
                    </p>
                </Card>

                <KPICard
                    label="Conflicts"
                    value={metrics?.red_flags ?? 0}
                    icon={<AlertTriangle size={20} />}
                    sentiment="conflict"
                />
                <KPICard
                    label="Alignments"
                    value={metrics?.green_alignments ?? 0}
                    icon={<CheckCircle size={20} />}
                    sentiment="aligned"
                />
                <KPICard
                    label="Neutral"
                    value={metrics?.neutral_count ?? 0}
                    icon={<Minus size={20} />}
                    sentiment="neutral"
                />
            </div>

            {/* Unresolved Conflicts Alert */}
            {metrics && metrics.unresolved_conflicts > 0 && (
                <Card className="p-6 border-l-4 border-l-conflict">
                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-conflict-light rounded-lg">
                            <Activity className="text-conflict" size={20} />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-body font-semibold text-text-primary mb-1">
                                {metrics.unresolved_conflicts} Unresolved Conflicts Detected
                            </h3>
                            <p className="text-small text-text-secondary mb-3">
                                Navigate to Flags page to review and resolve conflicts preventing full consistency
                            </p>
                            <a
                                href="/dashboard/flags"
                                className="inline-block px-4 py-2 bg-conflict hover:bg-conflict-dark text-white rounded-lg text-small font-medium transition-colors"
                            >
                                Review Conflicts →
                            </a>
                        </div>
                    </div>
                </Card>
            )}

            {/* Recent Activity Table */}
            <Card>
                <div className="p-6 border-b border-border">
                    <h3 className="text-h3 text-text-primary">Recent Activity</h3>
                </div>
                <div className="p-6">
                    {metrics && metrics.total_decisions > 0 ? (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 bg-aligned rounded-full"></div>
                                    <span className="text-small text-text-primary">Decision graph updated</span>
                                </div>
                                <span className="text-meta text-text-tertiary">2 minutes ago</span>
                            </div>
                            <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                                    <span className="text-small text-text-primary">{metrics.total_decisions} decisions processed</span>
                                </div>
                                <span className="text-meta text-text-tertiary">5 minutes ago</span>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-small text-text-tertiary mb-3">No decisions yet</p>
                            <p className="text-small text-text-secondary">
                                Upload a document in the Auditor to get started
                            </p>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
}
