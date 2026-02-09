/**
 * Analytics Service - The Central Intelligence Brain
 * 
 * Tier 1 Foundation: Calculates 5 health scores with:
 * - Numeric importance weights (1, 2, 3, 5)
 * - Clamped formulas (0-100)
 * - Score history tracking
 * 
 * Architecture: Modular design for Tier 2+ integration
 * 
 * IMPORTANT: Uses neo4j-based conflict detection as source of truth
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config/env';
import { HealthScores, ImportanceLevel, CMEDecision, ScoreHistoryEntry } from '../types/cme';
import { conflictDetectorService } from './conflict-detector';

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
     * Uses neo4j-based conflict detection as source of truth
     * Formula: (decisions_without_conflicts / total_decisions) * 100
     */
    async calculateAlignment(teamId: string): Promise<number> {
        // Get total decisions
        const { count: totalDecisions } = await this.client
            .from('decisions')
            .select('*', { count: 'exact', head: true })
            .eq('team_id', teamId);

        if (!totalDecisions || totalDecisions === 0) return 100;

        // Use conflict-detector which queries Neo4j (source of truth)
        const conflicts = await conflictDetectorService.detectConflicts(teamId);
        const unresolvedConflicts = conflicts.filter(c => !c.resolved);

        // Get unique decision IDs involved in conflicts
        const conflictedDecisionIds = new Set<string>();
        unresolvedConflicts.forEach(c => {
            c.conflict_path.forEach(id => conflictedDecisionIds.add(id));
        });

        const decisionsWithoutConflicts = Math.max(0, totalDecisions - conflictedDecisionIds.size);
        return this.clamp((decisionsWithoutConflicts / totalDecisions) * 100);
    }

    /**
     * Calculate Stability Score
     * Uses conflict count as proxy for instability
     * Formula: 100 - (conflict_count * 2)
     */
    async calculateStability(teamId: string): Promise<number> {
        // Use conflict-detector which queries Neo4j
        const conflicts = await conflictDetectorService.detectConflicts(teamId);
        const unresolvedCount = conflicts.filter(c => !c.resolved).length;

        // Reduce score based on number of conflicts (softer penalty)
        return this.clamp(100 - (unresolvedCount * 2));
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
     * Based on conflict severity distribution
     * Lower severity conflicts = better resolution maturity
     */
    async calculateResolution(teamId: string): Promise<number> {
        // Use conflict-detector which queries Neo4j
        const conflicts = await conflictDetectorService.detectConflicts(teamId);
        const unresolvedConflicts = conflicts.filter(c => !c.resolved);

        if (unresolvedConflicts.length === 0) return 100;

        // Average severity (1-10 scale)
        const avgSeverity = unresolvedConflicts.reduce((sum, c) => sum + c.severity, 0) / unresolvedConflicts.length;

        // Convert to score: lower severity = higher maturity
        const rawScore = 100 - (avgSeverity * 10);
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

        // Use conflict-detector which queries Neo4j
        const conflicts = await conflictDetectorService.detectConflicts(teamId);
        const unresolvedCount = conflicts.filter(c => !c.resolved).length;

        return {
            scores,
            history,
            decisionCount: decisionCount || 0,
            conflictCount: unresolvedCount,
        };
    }
}

export const analyticsService = new AnalyticsService();
