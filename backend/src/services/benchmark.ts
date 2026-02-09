/**
 * Benchmark Service
 * Provides anonymous aggregate comparisons across teams
 */

import { SupabaseClient } from '@supabase/supabase-js';

export interface BenchmarkComparison {
    metric: string;
    yourValue: number;
    benchmarkAvg: number;
    benchmarkP25: number;
    benchmarkP50: number;
    benchmarkP75: number;
    percentile: number; // Where you fall (0-100)
    delta: number; // % difference from avg
    assessment: 'above' | 'average' | 'below';
    insight: string;
}

export interface BenchmarkResult {
    teamSizeBucket: 'small' | 'medium' | 'large' | 'enterprise';
    sampleSize: number;
    comparisons: BenchmarkComparison[];
    summary: string;
    strengths: string[];
    improvements: string[];
}

export interface TeamMetrics {
    decisionVelocity: number;       // decisions/day
    conflictRate: number;           // % of decisions with conflict
    resolutionTime: number;         // avg days to resolve conflict
    actorDistribution: number;      // Gini coefficient (0=equal, 1=concentrated)
    strategicRatio: number;         // % of critical/strategic decisions
    reversalRate: number;           // % of decisions that are reversals
    coherenceScore: number;         // 0-100
}

// Default benchmarks (to be replaced with real aggregate data)
const DEFAULT_BENCHMARKS: Record<string, Record<string, { avg: number; p25: number; p50: number; p75: number; sampleCount: number }>> = {
    small: {
        decisionVelocity: { avg: 3, p25: 1.5, p50: 3, p75: 5, sampleCount: 50 },
        conflictRate: { avg: 15, p25: 8, p50: 15, p75: 25, sampleCount: 50 },
        resolutionTime: { avg: 12, p25: 5, p50: 10, p75: 18, sampleCount: 50 },
        actorDistribution: { avg: 0.4, p25: 0.25, p50: 0.4, p75: 0.6, sampleCount: 50 },
        strategicRatio: { avg: 25, p25: 15, p50: 25, p75: 40, sampleCount: 50 },
        reversalRate: { avg: 10, p25: 5, p50: 10, p75: 18, sampleCount: 50 },
        coherenceScore: { avg: 65, p25: 50, p50: 65, p75: 80, sampleCount: 50 }
    },
    medium: {
        decisionVelocity: { avg: 8, p25: 4, p50: 8, p75: 12, sampleCount: 100 },
        conflictRate: { avg: 20, p25: 12, p50: 20, p75: 30, sampleCount: 100 },
        resolutionTime: { avg: 10, p25: 4, p50: 9, p75: 15, sampleCount: 100 },
        actorDistribution: { avg: 0.35, p25: 0.2, p50: 0.35, p75: 0.5, sampleCount: 100 },
        strategicRatio: { avg: 30, p25: 20, p50: 30, p75: 45, sampleCount: 100 },
        reversalRate: { avg: 8, p25: 4, p50: 8, p75: 14, sampleCount: 100 },
        coherenceScore: { avg: 70, p25: 55, p50: 70, p75: 82, sampleCount: 100 }
    },
    large: {
        decisionVelocity: { avg: 15, p25: 8, p50: 15, p75: 25, sampleCount: 75 },
        conflictRate: { avg: 22, p25: 15, p50: 22, p75: 32, sampleCount: 75 },
        resolutionTime: { avg: 8, p25: 3, p50: 7, p75: 12, sampleCount: 75 },
        actorDistribution: { avg: 0.3, p25: 0.15, p50: 0.3, p75: 0.45, sampleCount: 75 },
        strategicRatio: { avg: 35, p25: 25, p50: 35, p75: 50, sampleCount: 75 },
        reversalRate: { avg: 6, p25: 3, p50: 6, p75: 10, sampleCount: 75 },
        coherenceScore: { avg: 72, p25: 58, p50: 72, p75: 85, sampleCount: 75 }
    },
    enterprise: {
        decisionVelocity: { avg: 25, p25: 15, p50: 25, p75: 40, sampleCount: 40 },
        conflictRate: { avg: 25, p25: 18, p50: 25, p75: 35, sampleCount: 40 },
        resolutionTime: { avg: 6, p25: 2, p50: 5, p75: 9, sampleCount: 40 },
        actorDistribution: { avg: 0.25, p25: 0.1, p50: 0.25, p75: 0.4, sampleCount: 40 },
        strategicRatio: { avg: 40, p25: 30, p50: 40, p75: 55, sampleCount: 40 },
        reversalRate: { avg: 5, p25: 2, p50: 5, p75: 8, sampleCount: 40 },
        coherenceScore: { avg: 75, p25: 62, p50: 75, p75: 88, sampleCount: 40 }
    }
};

export interface CMEDecision {
    decision_id: string;
    actor: string;
    sentiment: string;
    importance: string;
    timestamp: string;
    created_at: string;
    decision: string;
    reasoning: string;
}

export class BenchmarkService {

    /**
     * Calculate team metrics from decisions
     */
    calculateTeamMetrics(decisions: CMEDecision[]): TeamMetrics {
        if (decisions.length === 0) {
            return {
                decisionVelocity: 0,
                conflictRate: 0,
                resolutionTime: 0,
                actorDistribution: 0,
                strategicRatio: 0,
                reversalRate: 0,
                coherenceScore: 50
            };
        }

        // Decision velocity
        const sorted = [...decisions].sort((a, b) =>
            new Date(a.timestamp || a.created_at).getTime() -
            new Date(b.timestamp || b.created_at).getTime()
        );
        const oldest = new Date(sorted[0].timestamp || sorted[0].created_at);
        const newest = new Date(sorted[sorted.length - 1].timestamp || sorted[sorted.length - 1].created_at);
        const daysDiff = Math.max(1, (newest.getTime() - oldest.getTime()) / (1000 * 60 * 60 * 24));
        const decisionVelocity = Math.round((decisions.length / daysDiff) * 10) / 10;

        // Conflict rate
        const conflicts = decisions.filter(d =>
            d.sentiment === 'conflict' || d.sentiment === 'red-flag'
        );
        const conflictRate = Math.round((conflicts.length / decisions.length) * 100);

        // Resolution time (simplified - days between conflicts)
        const resolutionTime = conflicts.length > 1 ?
            Math.round(daysDiff / conflicts.length) : 0;

        // Actor distribution (Gini coefficient)
        const actorCounts = new Map<string, number>();
        decisions.forEach(d => {
            actorCounts.set(d.actor, (actorCounts.get(d.actor) || 0) + 1);
        });
        const counts = [...actorCounts.values()].sort((a, b) => a - b);
        const n = counts.length;
        let gini = 0;
        counts.forEach((count, i) => {
            gini += (2 * (i + 1) - n - 1) * count;
        });
        const actorDistribution = n > 0 ? Math.round((gini / (n * decisions.length)) * 100) / 100 : 0;

        // Strategic ratio
        const strategic = decisions.filter(d =>
            d.importance === 'strategic' || d.importance === 'critical'
        );
        const strategicRatio = Math.round((strategic.length / decisions.length) * 100);

        // Reversal rate
        const reversalKeywords = ['reverse', 'undo', 'cancel', 'revert', 'rollback'];
        const reversals = decisions.filter(d => {
            const text = `${d.decision} ${d.reasoning}`.toLowerCase();
            return reversalKeywords.some(k => text.includes(k));
        });
        const reversalRate = Math.round((reversals.length / decisions.length) * 100);

        // Coherence score
        const aligned = decisions.filter(d =>
            d.sentiment === 'aligned' || d.sentiment === 'green-alignment'
        ).length;
        const rawCoherence = ((aligned - conflicts.length) / decisions.length + 1) / 2;
        const coherenceScore = Math.round(rawCoherence * 100);

        return {
            decisionVelocity,
            conflictRate,
            resolutionTime,
            actorDistribution,
            strategicRatio,
            reversalRate,
            coherenceScore
        };
    }

    /**
     * Determine team size bucket
     */
    getTeamSizeBucket(teamMembers: number): 'small' | 'medium' | 'large' | 'enterprise' {
        if (teamMembers <= 10) return 'small';
        if (teamMembers <= 50) return 'medium';
        if (teamMembers <= 200) return 'large';
        return 'enterprise';
    }

    /**
     * Get benchmark comparisons for a team
     */
    async getBenchmarks(
        supabase: SupabaseClient,
        decisions: CMEDecision[],
        teamMembers: number
    ): Promise<BenchmarkResult> {
        const metrics = this.calculateTeamMetrics(decisions);
        const bucket = this.getTeamSizeBucket(teamMembers);

        // Try to get real benchmarks from database first
        let benchmarks = DEFAULT_BENCHMARKS[bucket];
        let sampleSize = 50;

        try {
            const { data } = await supabase
                .from('benchmark_aggregates')
                .select('*')
                .eq('team_size_bucket', bucket);

            if (data && data.length > 0) {
                benchmarks = {};
                for (const row of data) {
                    benchmarks[row.metric_name] = {
                        avg: row.avg_value,
                        p25: row.p25_value,
                        p50: row.p50_value,
                        p75: row.p75_value,
                        sampleCount: row.sample_count
                    };
                    sampleSize = Math.max(sampleSize, row.sample_count);
                }
            }
        } catch (error) {
            console.error('Failed to fetch benchmarks:', error);
        }

        // Generate comparisons
        const comparisons = this.generateComparisons(metrics, benchmarks);

        // Identify strengths and improvements
        const strengths = comparisons
            .filter(c => c.assessment === 'above')
            .map(c => c.insight);

        const improvements = comparisons
            .filter(c => c.assessment === 'below')
            .map(c => c.insight);

        // Generate summary
        const summary = this.generateSummary(comparisons, bucket);

        return {
            teamSizeBucket: bucket,
            sampleSize,
            comparisons,
            summary,
            strengths: strengths.slice(0, 3),
            improvements: improvements.slice(0, 3)
        };
    }

    /**
     * Generate metric comparisons
     */
    private generateComparisons(
        metrics: TeamMetrics,
        benchmarks: Record<string, { avg: number; p25: number; p50: number; p75: number; sampleCount: number }>
    ): BenchmarkComparison[] {
        const comparisons: BenchmarkComparison[] = [];

        // Map metric names to display names and interpret direction
        const metricConfig: Record<keyof TeamMetrics, { name: string; higherIsBetter: boolean }> = {
            decisionVelocity: { name: 'Decision Velocity', higherIsBetter: true },
            conflictRate: { name: 'Conflict Rate', higherIsBetter: false },
            resolutionTime: { name: 'Conflict Resolution Time', higherIsBetter: false },
            actorDistribution: { name: 'Decision Concentration', higherIsBetter: false },
            strategicRatio: { name: 'Strategic Focus', higherIsBetter: true },
            reversalRate: { name: 'Reversal Rate', higherIsBetter: false },
            coherenceScore: { name: 'Coherence Score', higherIsBetter: true }
        };

        for (const [key, value] of Object.entries(metrics)) {
            const config = metricConfig[key as keyof TeamMetrics];
            const benchmark = benchmarks[key];

            if (!benchmark) continue;

            // Calculate percentile
            let percentile: number;
            if (value <= benchmark.p25) percentile = 25 * (value / benchmark.p25);
            else if (value <= benchmark.p50) percentile = 25 + 25 * ((value - benchmark.p25) / (benchmark.p50 - benchmark.p25));
            else if (value <= benchmark.p75) percentile = 50 + 25 * ((value - benchmark.p50) / (benchmark.p75 - benchmark.p50));
            else percentile = 75 + 25 * Math.min(1, (value - benchmark.p75) / benchmark.p75);

            const delta = benchmark.avg !== 0 ? Math.round(((value - benchmark.avg) / benchmark.avg) * 100) : 0;

            // Determine assessment based on direction
            let assessment: 'above' | 'average' | 'below';
            if (config.higherIsBetter) {
                assessment = value > benchmark.p75 ? 'above' : value < benchmark.p25 ? 'below' : 'average';
            } else {
                assessment = value < benchmark.p25 ? 'above' : value > benchmark.p75 ? 'below' : 'average';
            }

            // Generate insight
            const insight = this.generateMetricInsight(config.name, value, benchmark.avg, delta, assessment, config.higherIsBetter);

            comparisons.push({
                metric: config.name,
                yourValue: value,
                benchmarkAvg: benchmark.avg,
                benchmarkP25: benchmark.p25,
                benchmarkP50: benchmark.p50,
                benchmarkP75: benchmark.p75,
                percentile: Math.round(percentile),
                delta,
                assessment,
                insight
            });
        }

        return comparisons;
    }

    /**
     * Generate insight for a metric
     */
    private generateMetricInsight(
        name: string,
        _value: number,
        _avg: number,
        delta: number,
        assessment: string,
        higherIsBetter: boolean
    ): string {
        const magnitude = Math.abs(delta);

        if (assessment === 'above') {
            return `Strong ${name.toLowerCase()}: ${magnitude}% ${higherIsBetter ? 'above' : 'below'} average`;
        } else if (assessment === 'below') {
            return `${name} needs attention: ${magnitude}% ${higherIsBetter ? 'below' : 'above'} average`;
        }
        return `${name} is on par with similar teams`;
    }

    /**
     * Generate overall summary
     */
    private generateSummary(comparisons: BenchmarkComparison[], bucket: string): string {
        const above = comparisons.filter(c => c.assessment === 'above').length;
        const below = comparisons.filter(c => c.assessment === 'below').length;

        if (above > below + 2) {
            return `Your team outperforms most ${bucket} teams across key metrics. Keep up the excellent work!`;
        } else if (below > above + 2) {
            return `Several metrics fall below typical ${bucket} team performance. Focus on the improvement areas identified.`;
        }
        return `Your team performs on par with similar ${bucket} teams, with some areas of strength and opportunity.`;
    }

    /**
     * Update aggregate benchmarks (to be called periodically)
     */
    async updateBenchmarkAggregates(
        supabase: SupabaseClient,
        _teamId: string,
        decisions: CMEDecision[],
        teamMembers: number
    ): Promise<void> {
        const metrics = this.calculateTeamMetrics(decisions);
        const bucket = this.getTeamSizeBucket(teamMembers);

        // This would normally aggregate across many teams
        // For now, just update with team's own data as a contribution
        for (const [metricName, value] of Object.entries(metrics)) {
            try {
                await supabase.from('benchmark_aggregates')
                    .upsert({
                        team_size_bucket: bucket,
                        metric_name: metricName,
                        avg_value: value, // In production, this would be recalculated
                        p25_value: value * 0.7,
                        p50_value: value,
                        p75_value: value * 1.3,
                        sample_count: 1,
                        updated_at: new Date().toISOString()
                    }, {
                        onConflict: 'team_size_bucket,metric_name'
                    });
            } catch (err) {
                console.error('Failed to update benchmark:', err);
            }
        }
    }
}

export const benchmarkService = new BenchmarkService();
