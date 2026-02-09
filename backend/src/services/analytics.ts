/**
 * Analytics Service - The Central Intelligence Brain
 * 
 * Tier 1 Foundation: Calculates 5 health scores with:
 * - Numeric importance weights (1, 2, 3, 5)
 * - Clamped formulas (0-100)
 * - Score history tracking
 * 
 * Architecture: Modular design for Tier 2+ integration
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config/env';
import { HealthScores, ImportanceLevel, CMEDecision, ScoreHistoryEntry } from '../types/cme';

// Numeric weights for importance levels
const IMPORTANCE_WEIGHTS: Record<ImportanceLevel, number> = {
    [ImportanceLevel.LOW]: 1,
    [ImportanceLevel.MEDIUM]: 2,
    [ImportanceLevel.STRATEGIC]: 3,
    [ImportanceLevel.CRITICAL]: 5,
};

// Max possible weight (critical)
const MAX_WEIGHT = IMPORTANCE_WEIGHTS[ImportanceLevel.CRITICAL];

// Threshold configs
const RESOLUTION_THRESHOLD_DAYS = 30;
const VELOCITY_BASELINE_PER_WEEK = 10; // Decisions per week baseline

class AnalyticsService {
    private client: SupabaseClient;

    constructor() {
        this.client = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_KEY);
    }

    /**
     * Get numeric weight for importance level
     */
    getImportanceWeight(importance: ImportanceLevel | string | undefined): number {
        if (!importance) return IMPORTANCE_WEIGHTS[ImportanceLevel.MEDIUM];
        return IMPORTANCE_WEIGHTS[importance as ImportanceLevel] || IMPORTANCE_WEIGHTS[ImportanceLevel.MEDIUM];
    }

    /**
     * Clamp value to 0-100 range
     */
    private clamp(value: number, min = 0, max = 100): number {
        return Math.max(min, Math.min(max, value));
    }

    /**
     * Calculate Alignment Score
     * Formula: (decisions_without_conflicts / total_decisions) * 100
     */
    async calculateAlignment(teamId: string): Promise<number> {
        // Get total decisions
        const { count: totalDecisions } = await this.client
            .from('decisions')
            .select('*', { count: 'exact', head: true })
            .eq('team_id', teamId);

        if (!totalDecisions || totalDecisions === 0) return 100;

        // Get decisions involved in unresolved conflicts
        const { data: conflicts } = await this.client
            .from('conflicts')
            .select('decision_a_id, decision_b_id')
            .eq('team_id', teamId)
            .eq('resolved', false);

        const conflictedDecisionIds = new Set<string>();
        (conflicts || []).forEach(c => {
            conflictedDecisionIds.add(c.decision_a_id);
            conflictedDecisionIds.add(c.decision_b_id);
        });

        const decisionsWithoutConflicts = totalDecisions - conflictedDecisionIds.size;
        return this.clamp((decisionsWithoutConflicts / totalDecisions) * 100);
    }

    /**
     * Calculate Stability Score
     * Formula: 100 - (churn_rate * 10)
     * Churn = reversals or updates per week
     */
    async calculateStability(teamId: string): Promise<number> {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        // Count decisions modified/reversed in last week
        // For now, we use conflict count as proxy for instability
        const { count: recentConflicts } = await this.client
            .from('conflicts')
            .select('*', { count: 'exact', head: true })
            .eq('team_id', teamId)
            .gte('detected_at', oneWeekAgo.toISOString());

        const churnRate = recentConflicts || 0;
        return this.clamp(100 - (churnRate * 10));
    }

    /**
     * Calculate Velocity Score
     * Formula: Normalized decisions/week vs baseline
     */
    async calculateVelocity(teamId: string): Promise<number> {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const { count: recentDecisions } = await this.client
            .from('decisions')
            .select('*', { count: 'exact', head: true })
            .eq('team_id', teamId)
            .gte('uploaded_at', oneWeekAgo.toISOString());

        const decisionsThisWeek = recentDecisions || 0;
        // Normalize: 50 = baseline, scale from 0-100
        const normalized = (decisionsThisWeek / VELOCITY_BASELINE_PER_WEEK) * 50;
        return this.clamp(normalized);
    }

    /**
     * Calculate Resolution Maturity Score
     * Formula: max(0, 100 - min(100, (avg_conflict_age_days / threshold) * 100))
     * Clamped to prevent negatives
     */
    async calculateResolution(teamId: string): Promise<number> {
        const { data: unresolvedConflicts } = await this.client
            .from('conflicts')
            .select('detected_at')
            .eq('team_id', teamId)
            .eq('resolved', false);

        if (!unresolvedConflicts || unresolvedConflicts.length === 0) return 100;

        const now = new Date();
        let totalAgeDays = 0;
        unresolvedConflicts.forEach(c => {
            const detectedAt = new Date(c.detected_at);
            const ageDays = (now.getTime() - detectedAt.getTime()) / (1000 * 60 * 60 * 24);
            totalAgeDays += ageDays;
        });

        const avgAgeDays = totalAgeDays / unresolvedConflicts.length;
        const rawScore = 100 - Math.min(100, (avgAgeDays / RESOLUTION_THRESHOLD_DAYS) * 100);
        return this.clamp(rawScore);
    }

    /**
     * Calculate Strategic Clarity Score
     * Weighted formula: (sum(decision_weight) / max_possible_weight) * 100
     * Uses importance weights for intelligent scoring
     */
    async calculateClarity(teamId: string): Promise<number> {
        const { data: decisions } = await this.client
            .from('decisions')
            .select('full_json')
            .eq('team_id', teamId);

        if (!decisions || decisions.length === 0) return 0;

        let totalWeight = 0;
        decisions.forEach(d => {
            const decision = d.full_json as CMEDecision;
            const weight = this.getImportanceWeight(decision.importance);
            totalWeight += weight;
        });

        const maxPossibleWeight = decisions.length * MAX_WEIGHT;
        return this.clamp((totalWeight / maxPossibleWeight) * 100);
    }

    /**
     * Calculate all 5 health scores
     */
    async calculateHealthScores(teamId: string): Promise<HealthScores> {
        const [alignment, stability, velocity, resolution, clarity] = await Promise.all([
            this.calculateAlignment(teamId),
            this.calculateStability(teamId),
            this.calculateVelocity(teamId),
            this.calculateResolution(teamId),
            this.calculateClarity(teamId),
        ]);

        // Weighted composite score
        // Alignment and Stability are most important (weight 2)
        // Others weight 1
        const overall = this.clamp(
            (alignment * 2 + stability * 2 + velocity + resolution + clarity) / 7
        );

        return {
            alignment: Math.round(alignment * 10) / 10,
            stability: Math.round(stability * 10) / 10,
            velocity: Math.round(velocity * 10) / 10,
            resolution: Math.round(resolution * 10) / 10,
            clarity: Math.round(clarity * 10) / 10,
            overall: Math.round(overall * 10) / 10,
        };
    }

    /**
     * Store daily score snapshot
     */
    async storeScoreSnapshot(teamId: string): Promise<void> {
        const scores = await this.calculateHealthScores(teamId);

        const { count: decisionCount } = await this.client
            .from('decisions')
            .select('*', { count: 'exact', head: true })
            .eq('team_id', teamId);

        const { count: conflictCount } = await this.client
            .from('conflicts')
            .select('*', { count: 'exact', head: true })
            .eq('team_id', teamId)
            .eq('resolved', false);

        await this.client
            .from('score_history')
            .upsert({
                team_id: teamId,
                recorded_at: new Date().toISOString().split('T')[0], // Date only
                alignment_score: scores.alignment,
                stability_score: scores.stability,
                velocity_score: scores.velocity,
                resolution_score: scores.resolution,
                clarity_score: scores.clarity,
                overall_score: scores.overall,
                decision_count: decisionCount || 0,
                conflict_count: conflictCount || 0,
            }, {
                onConflict: 'team_id,recorded_at'
            });
    }

    /**
     * Get score history for trend visualization
     */
    async getScoreHistory(teamId: string, days: number = 30): Promise<ScoreHistoryEntry[]> {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const { data, error } = await this.client
            .from('score_history')
            .select('*')
            .eq('team_id', teamId)
            .gte('recorded_at', startDate.toISOString())
            .order('recorded_at', { ascending: true });

        if (error || !data) return [];

        return data.map(row => ({
            recorded_at: row.recorded_at,
            scores: {
                alignment: row.alignment_score,
                stability: row.stability_score,
                velocity: row.velocity_score,
                resolution: row.resolution_score,
                clarity: row.clarity_score,
                overall: row.overall_score,
            },
            decision_count: row.decision_count,
            conflict_count: row.conflict_count,
        }));
    }

    /**
     * Get team metrics summary (for dashboard)
     */
    async getTeamMetrics(teamId: string): Promise<{
        scores: HealthScores;
        history: ScoreHistoryEntry[];
        decisionCount: number;
        conflictCount: number;
    }> {
        const scores = await this.calculateHealthScores(teamId);
        const history = await this.getScoreHistory(teamId);

        const { count: decisionCount } = await this.client
            .from('decisions')
            .select('*', { count: 'exact', head: true })
            .eq('team_id', teamId);

        const { count: conflictCount } = await this.client
            .from('conflicts')
            .select('*', { count: 'exact', head: true })
            .eq('team_id', teamId)
            .eq('resolved', false);

        return {
            scores,
            history,
            decisionCount: decisionCount || 0,
            conflictCount: conflictCount || 0,
        };
    }
}

export const analyticsService = new AnalyticsService();
