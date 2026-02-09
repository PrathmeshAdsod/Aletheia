/**
 * Strategic Pulse Service
 * Calculates organizational health metrics, phase classification, and trajectory projections
 */

import { SupabaseClient } from '@supabase/supabase-js';

export interface CMEDecision {
    decision_id: string;
    team_id: string;
    decision: string;
    reasoning: string;
    actor: string;
    sentiment: string;
    importance: string;
    timestamp: string;
    created_at: string;
}

export interface PulseSnapshot {
    pulseScore: number;
    velocity: number;
    velocityTrend: 'accelerating' | 'stable' | 'decelerating';
    conflictMomentum: number;
    coherenceScore: number;
    phase: 'expansion' | 'stabilization' | 'pivot' | 'churn' | 'crisis';
    signals: PulseSignal[];
    projections: PulseProjection[];
}

export interface PulseSignal {
    type: string;
    strength: number;
    description: string;
}

export interface PulseProjection {
    metric: string;
    current: number;
    projected: number;
    daysToThreshold: number | null;
    threshold: number;
    direction: 'up' | 'down' | 'stable';
    confidence: number;
}

export class StrategicPulseService {

    /**
     * Calculate the current strategic pulse for a team
     */
    async calculatePulse(decisions: CMEDecision[]): Promise<PulseSnapshot> {
        if (!decisions || decisions.length === 0) {
            return this.getEmptyPulse();
        }

        // Sort by timestamp descending
        const sorted = [...decisions].filter(d => d && (d.timestamp || d.created_at)).sort((a, b) =>
            new Date(b.timestamp || b.created_at).getTime() -
            new Date(a.timestamp || a.created_at).getTime()
        );

        if (sorted.length === 0) return this.getEmptyPulse();

        // Calculate core metrics
        const velocity = this.calculateVelocity(sorted);
        const velocityTrend = this.calculateVelocityTrend(sorted);
        const conflictMomentum = this.calculateConflictMomentum(sorted);
        const coherenceScore = this.calculateCoherence(sorted);

        // Detect current phase
        const phase = this.detectPhase(sorted, velocity, conflictMomentum, coherenceScore);

        // Calculate overall pulse score
        const pulseScore = this.calculatePulseScore(velocity, conflictMomentum, coherenceScore, phase);

        // Gather signals
        const signals = this.detectSignals(sorted, velocity, conflictMomentum, coherenceScore);

        // Generate projections
        const projections = this.generateProjections(sorted, pulseScore, conflictMomentum, coherenceScore);

        return {
            pulseScore,
            velocity,
            velocityTrend,
            conflictMomentum,
            coherenceScore,
            phase,
            signals,
            projections
        };
    }

    /**
     * Calculate decision velocity (decisions per day)
     */
    private calculateVelocity(decisions: CMEDecision[]): number {
        if (decisions.length < 2) return decisions.length;

        const newest = new Date(decisions[0].timestamp || decisions[0].created_at);
        const oldest = new Date(decisions[decisions.length - 1].timestamp || decisions[decisions.length - 1].created_at);
        const daysDiff = Math.max(1, (newest.getTime() - oldest.getTime()) / (1000 * 60 * 60 * 24));

        return Math.round((decisions.length / daysDiff) * 10) / 10;
    }

    /**
     * Calculate velocity trend over time
     */
    private calculateVelocityTrend(decisions: CMEDecision[]): 'accelerating' | 'stable' | 'decelerating' {
        if (decisions.length < 5) return 'stable';

        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

        const recentCount = decisions.filter(d =>
            new Date(d.timestamp || d.created_at).getTime() >= oneWeekAgo.getTime()
        ).length;

        const previousCount = decisions.filter(d => {
            const date = new Date(d.timestamp || d.created_at);
            return date >= twoWeeksAgo && date < oneWeekAgo;
        }).length;

        const ratio = previousCount > 0 ? recentCount / previousCount : recentCount;

        if (ratio > 1.3) return 'accelerating';
        if (ratio < 0.7) return 'decelerating';
        return 'stable';
    }

    /**
     * Calculate conflict momentum (positive = rising, negative = falling)
     */
    private calculateConflictMomentum(decisions: CMEDecision[]): number {
        if (decisions.length < 3) return 0;

        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

        const recentConflicts = decisions.filter(d =>
            new Date(d.timestamp || d.created_at).getTime() >= oneWeekAgo.getTime() &&
            (d.sentiment === 'conflict' || d.sentiment === 'red-flag')
        ).length;

        const previousConflicts = decisions.filter(d => {
            const date = new Date(d.timestamp || d.created_at);
            return date >= twoWeeksAgo && date < oneWeekAgo &&
                (d.sentiment === 'conflict' || d.sentiment === 'red-flag');
        }).length;

        // Momentum: positive means conflicts are rising
        return recentConflicts - previousConflicts;
    }

    /**
     * Calculate strategic coherence (how aligned decisions are)
     */
    private calculateCoherence(decisions: CMEDecision[]): number {
        if (decisions.length === 0) return 100;

        const aligned = decisions.filter(d =>
            d.sentiment === 'aligned' || d.sentiment === 'green-alignment'
        ).length;

        const conflicting = decisions.filter(d =>
            d.sentiment === 'conflict' || d.sentiment === 'red-flag'
        ).length;

        const total = decisions.length;

        // Coherence = (aligned - conflicting) / total, normalized to 0-100
        const rawScore = ((aligned - conflicting) / total + 1) / 2;
        return Math.round(rawScore * 100);
    }

    /**
     * Detect the current strategic phase
     */
    private detectPhase(
        decisions: CMEDecision[],
        velocity: number,
        conflictMomentum: number,
        coherence: number
    ): 'expansion' | 'stabilization' | 'pivot' | 'churn' | 'crisis' {

        // Get recent decisions for keyword analysis
        const recentDecisions = decisions.slice(0, Math.min(20, decisions.length));
        const recentText = recentDecisions.map(d => `${d.decision || ''} ${d.reasoning || ''}`).join(' ').toLowerCase();

        // Crisis indicators
        const crisisKeywords = ['urgent', 'emergency', 'crisis', 'critical', 'immediately', 'failure'];
        const hasCrisisSignals = crisisKeywords.some(k => recentText.includes(k));
        if (hasCrisisSignals && conflictMomentum > 2) return 'crisis';

        // High conflict with low coherence = churn
        if (conflictMomentum > 1 && coherence < 40) return 'churn';

        // Pivot indicators
        const pivotKeywords = ['change direction', 'pivot', 'shift strategy', 'new approach', 'reconsider'];
        const hasPivotSignals = pivotKeywords.some(k => recentText.includes(k));
        if (hasPivotSignals || (velocity < 3 && coherence < 50)) return 'pivot';

        // Expansion indicators
        const expansionKeywords = ['grow', 'expand', 'scale', 'launch', 'new market', 'hire', 'invest'];
        const hasExpansionSignals = expansionKeywords.some(k => recentText.includes(k));
        if (hasExpansionSignals && velocity > 5 && coherence > 60) return 'expansion';

        // Default to stabilization
        if (coherence > 70 && Math.abs(conflictMomentum) <= 1) return 'stabilization';

        // Moderate activity with some tension = pivot consideration
        return coherence > 50 ? 'stabilization' : 'pivot';
    }

    /**
     * Calculate overall pulse score (0-100)
     */
    private calculatePulseScore(
        velocity: number,
        conflictMomentum: number,
        coherence: number,
        phase: string
    ): number {
        // Base score from coherence (major factor)
        let score = coherence * 0.5;

        // Velocity contribution (some activity is good, too much or too little is concerning)
        const velocityScore = velocity > 0 ? Math.min(velocity / 10, 1) * 20 : 0;
        if (velocity > 15) score += 10; // Very active might be overwhelming
        else score += velocityScore;

        // Conflict momentum penalty
        score -= Math.max(0, conflictMomentum) * 5;
        score += Math.max(0, -conflictMomentum) * 2; // Falling conflicts is good

        // Phase adjustments
        const phaseBonus: Record<string, number> = {
            'expansion': 10,
            'stabilization': 15,
            'pivot': -5,
            'churn': -15,
            'crisis': -25
        };
        score += phaseBonus[phase] || 0;

        return Math.round(Math.max(0, Math.min(100, score)));
    }

    /**
     * Detect notable signals
     */
    private detectSignals(
        decisions: CMEDecision[],
        velocity: number,
        conflictMomentum: number,
        coherence: number
    ): PulseSignal[] {
        const signals: PulseSignal[] = [];

        // Actor concentration
        const actorCounts = new Map<string, number>();
        decisions.forEach(d => {
            actorCounts.set(d.actor, (actorCounts.get(d.actor) || 0) + 1);
        });
        const topActor = [...actorCounts.entries()].sort((a, b) => b[1] - a[1])[0];
        if (topActor && topActor[1] > decisions.length * 0.5) {
            signals.push({
                type: 'actor_concentration',
                strength: topActor[1] / decisions.length,
                description: `${topActor[0]} is making ${Math.round(topActor[1] / decisions.length * 100)}% of decisions`
            });
        }

        // Velocity signal
        if (velocity > 10) {
            signals.push({
                type: 'high_velocity',
                strength: Math.min(velocity / 20, 1),
                description: `High decision activity: ${velocity} decisions/day`
            });
        } else if (velocity < 1 && decisions.length > 5) {
            signals.push({
                type: 'low_velocity',
                strength: 1 - velocity,
                description: 'Decision-making has slowed significantly'
            });
        }

        // Conflict rising
        if (conflictMomentum > 2) {
            signals.push({
                type: 'rising_conflict',
                strength: Math.min(conflictMomentum / 5, 1),
                description: 'Conflict rate is increasing'
            });
        }

        // Low coherence
        if (coherence < 40) {
            signals.push({
                type: 'low_coherence',
                strength: 1 - coherence / 100,
                description: 'Strategic alignment is weak'
            });
        }

        return signals;
    }

    /**
     * Generate trajectory projections
     */
    private generateProjections(
        _decisions: CMEDecision[],
        currentPulse: number,
        conflictMomentum: number,
        coherence: number
    ): PulseProjection[] {
        const projections: PulseProjection[] = [];

        // Pulse score projection
        if (conflictMomentum !== 0) {
            const pulseSlope = -conflictMomentum * 3; // Rough estimate
            const projectedPulse = currentPulse + pulseSlope * 2; // 2 weeks out
            const daysToWarning = pulseSlope < 0 ? Math.ceil((currentPulse - 50) / (-pulseSlope / 7)) : null;

            projections.push({
                metric: 'Pulse Score',
                current: currentPulse,
                projected: Math.round(Math.max(0, Math.min(100, projectedPulse))),
                daysToThreshold: daysToWarning && daysToWarning > 0 ? daysToWarning : null,
                threshold: 50,
                direction: pulseSlope > 0 ? 'up' : pulseSlope < 0 ? 'down' : 'stable',
                confidence: 0.6
            });
        }

        // Coherence projection
        if (conflictMomentum > 0) {
            const coherenceSlope = -conflictMomentum * 2;
            const projectedCoherence = coherence + coherenceSlope * 2;
            const daysToLow = coherenceSlope < 0 ? Math.ceil((coherence - 40) / (-coherenceSlope / 7)) : null;

            projections.push({
                metric: 'Coherence',
                current: coherence,
                projected: Math.round(Math.max(0, Math.min(100, projectedCoherence))),
                daysToThreshold: daysToLow && daysToLow > 0 ? daysToLow : null,
                threshold: 40,
                direction: coherenceSlope > 0 ? 'up' : coherenceSlope < 0 ? 'down' : 'stable',
                confidence: 0.5
            });
        }

        return projections;
    }

    /**
     * Get empty pulse for teams with no decisions
     */
    private getEmptyPulse(): PulseSnapshot {
        return {
            pulseScore: 50,
            velocity: 0,
            velocityTrend: 'stable',
            conflictMomentum: 0,
            coherenceScore: 100,
            phase: 'stabilization',
            signals: [],
            projections: []
        };
    }

    /**
     * Store pulse snapshot to database
     */
    async storePulse(supabase: SupabaseClient, teamId: string, pulse: PulseSnapshot): Promise<void> {
        const { error } = await supabase.from('strategic_pulse').insert({
            team_id: teamId,
            pulse_score: pulse.pulseScore,
            velocity: pulse.velocity,
            velocity_trend: pulse.velocityTrend,
            conflict_momentum: pulse.conflictMomentum,
            coherence_score: pulse.coherenceScore,
            phase: pulse.phase,
            signals: pulse.signals,
            projections: pulse.projections
        });

        if (error) {
            console.error('Failed to store pulse snapshot:', error);
        } else {
            console.log('✅ Stored new Strategic Pulse snapshot');
        }
    }

    /**
     * Get latest pulse for a team
     */
    async getLatestPulse(supabase: SupabaseClient, teamId: string): Promise<PulseSnapshot | null> {
        const { data, error } = await supabase
            .from('strategic_pulse')
            .select('*')
            .eq('team_id', teamId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error || !data) {
            return null;
        }

        return {
            pulseScore: data.pulse_score,
            velocity: data.velocity,
            velocityTrend: data.velocity_trend,
            conflictMomentum: data.conflict_momentum,
            coherenceScore: data.coherence_score,
            phase: data.phase,
            signals: data.signals || [],
            projections: data.projections || []
        };
    }

    /**
     * Get historical pulse data for trends
     */
    async getPulseHistory(
        supabase: SupabaseClient,
        teamId: string,
        days: number = 30
    ): Promise<PulseSnapshot[]> {
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

        const { data, error } = await supabase
            .from('strategic_pulse')
            .select('*')
            .eq('team_id', teamId)
            .gte('created_at', since)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Failed to fetch pulse history:', error);
            return [];
        }

        return (data || []).map(row => ({
            pulseScore: row.pulse_score,
            velocity: row.velocity,
            velocityTrend: row.velocity_trend,
            conflictMomentum: row.conflict_momentum,
            coherenceScore: row.coherence_score,
            phase: row.phase,
            signals: row.signals || [],
            projections: row.projections || []
        }));
    }
}

export const strategicPulseService = new StrategicPulseService();
