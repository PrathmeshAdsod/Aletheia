/**
 * Strategic DNA Service
 * Calculates organizational identity fingerprint across 5 dimensions
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

export interface StrategicDNA {
    riskAppetite: number;       // 0=conservative, 100=aggressive
    decisionStyle: number;      // 0=centralized, 100=distributed
    conflictTolerance: number;  // 0=avoidant, 100=embracing
    innovationBias: number;     // 0=stability, 100=disruption
    decisionEntropy: number;    // 0=predictable, 100=chaotic
    insights: DNAInsight[];
    analysisContext: DNAContext;
}

export interface DNAInsight {
    dimension: string;
    observation: string;
    implication: string;
}

export interface DNAContext {
    decisionCount: number;
    timespan: string;
    actorCount: number;
    dominantActors: string[];
}

export class StrategicDNAService {

    /**
     * Calculate Strategic DNA from team decisions
     */
    async calculateDNA(decisions: CMEDecision[]): Promise<StrategicDNA> {
        if (decisions.length === 0) {
            return this.getDefaultDNA();
        }

        // Calculate each dimension
        const riskAppetite = this.calculateRiskAppetite(decisions);
        const decisionStyle = this.calculateDecisionStyle(decisions);
        const conflictTolerance = this.calculateConflictTolerance(decisions);
        const innovationBias = this.calculateInnovationBias(decisions);
        const decisionEntropy = this.calculateDecisionEntropy(decisions);

        // Generate insights based on DNA profile
        const insights = this.generateInsights({
            riskAppetite,
            decisionStyle,
            conflictTolerance,
            innovationBias,
            decisionEntropy
        });

        // Build analysis context
        const analysisContext = this.buildContext(decisions);

        return {
            riskAppetite,
            decisionStyle,
            conflictTolerance,
            innovationBias,
            decisionEntropy,
            insights,
            analysisContext
        };
    }

    /**
     * Risk Appetite: Conservative (0) ↔ Aggressive (100)
     * Based on: decision keywords, importance levels, action verbs
     */
    private calculateRiskAppetite(decisions: CMEDecision[]): number {
        const aggressiveKeywords = [
            'bold', 'aggressive', 'disrupt', 'transform', 'revolutionize',
            'gamble', 'bet', 'risk', 'ambitious', 'radical', 'breakthrough',
            'all-in', 'double down', 'accelerate', 'expand rapidly'
        ];

        const conservativeKeywords = [
            'careful', 'cautious', 'conservative', 'measured', 'gradual',
            'safe', 'stable', 'maintain', 'preserve', 'protect', 'minimize risk',
            'incremental', 'steady', 'slow', 'wait'
        ];

        let aggressiveScore = 0;
        let conservativeScore = 0;

        decisions.forEach(d => {
            const text = `${d.decision || ''} ${d.reasoning || ''}`.toLowerCase();

            aggressiveKeywords.forEach(k => {
                if (text.includes(k)) aggressiveScore++;
            });

            conservativeKeywords.forEach(k => {
                if (text.includes(k)) conservativeScore++;
            });

            // High-importance decisions with conflict sentiment suggest risk-taking
            if (d.importance === 'critical' || d.importance === 'strategic') {
                aggressiveScore += 0.5;
            }
        });

        const total = aggressiveScore + conservativeScore;
        if (total === 0) return 50;

        return Math.round((aggressiveScore / total) * 100);
    }

    /**
     * Decision Style: Centralized (0) ↔ Distributed (100)
     * Based on: actor distribution, decision concentration
     */
    private calculateDecisionStyle(decisions: CMEDecision[]): number {
        const actorCounts = new Map<string, number>();

        decisions.forEach(d => {
            const actor = d.actor || 'Unknown';
            actorCounts.set(actor, (actorCounts.get(actor) || 0) + 1);
        });

        const actors = [...actorCounts.entries()];
        if (actors.length === 0) return 50;

        // Calculate Gini coefficient (0 = equal distribution, 1 = one person decides all)
        const total = decisions.length;
        const counts = actors.map(a => a[1]).sort((a, b) => a - b);
        const n = counts.length;

        let gini = 0;
        counts.forEach((count, i) => {
            gini += (2 * (i + 1) - n - 1) * count;
        });
        gini = gini / (n * total);

        // Convert: 0 gini = distributed (100), 1 gini = centralized (0)
        return Math.round((1 - gini) * 100);
    }

    /**
     * Conflict Tolerance: Avoidant (0) ↔ Embracing (100)
     * Based on: conflict sentiment ratio, conflict resolution patterns
     */
    private calculateConflictTolerance(decisions: CMEDecision[]): number {
        const conflictDecisions = decisions.filter(d =>
            d.sentiment === 'conflict' || d.sentiment === 'red-flag'
        );

        const conflictKeywords = [
            'disagree', 'challenge', 'debate', 'oppose', 'contrary',
            'different view', 'push back', 'question', 'reconsider'
        ];

        const avoidanceKeywords = [
            'consensus', 'agree', 'align', 'unanimous', 'smooth',
            'compromise', 'settle', 'avoid conflict', 'harmony'
        ];

        let embracingScore = conflictDecisions.length;
        let avoidantScore = 0;

        decisions.forEach(d => {
            const text = `${d.decision || ''} ${d.reasoning || ''}`.toLowerCase();

            conflictKeywords.forEach(k => {
                if (text.includes(k)) embracingScore++;
            });

            avoidanceKeywords.forEach(k => {
                if (text.includes(k)) avoidantScore++;
            });
        });

        const total = embracingScore + avoidantScore;
        if (total === 0) return 50;

        return Math.round((embracingScore / total) * 100);
    }

    /**
     * Innovation Bias: Stability (0) ↔ Disruption (100)
     * Based on: change-oriented keywords, new initiatives
     */
    private calculateInnovationBias(decisions: CMEDecision[]): number {
        const innovationKeywords = [
            'new', 'innovative', 'create', 'launch', 'experiment',
            'disrupt', 'transform', 'reimagine', 'pioneer', 'breakthrough',
            'cutting-edge', 'novel', 'first', 'revolutionize', 'modernize'
        ];

        const stabilityKeywords = [
            'maintain', 'preserve', 'continue', 'existing', 'current',
            'established', 'traditional', 'proven', 'reliable', 'consistent',
            'sustain', 'keep', 'stick with', 'standard'
        ];

        let innovationScore = 0;
        let stabilityScore = 0;

        decisions.forEach(d => {
            const text = `${d.decision || ''} ${d.reasoning || ''}`.toLowerCase();

            innovationKeywords.forEach(k => {
                if (text.includes(k)) innovationScore++;
            });

            stabilityKeywords.forEach(k => {
                if (text.includes(k)) stabilityScore++;
            });
        });

        const total = innovationScore + stabilityScore;
        if (total === 0) return 50;

        return Math.round((innovationScore / total) * 100);
    }

    /**
     * Decision Entropy: Predictable (0) ↔ Chaotic (100)
     * Based on: decision reversals, consistency of patterns
     */
    private calculateDecisionEntropy(decisions: CMEDecision[]): number {
        // Check for reversal patterns
        const reversalKeywords = [
            'reverse', 'undo', 'cancel', 'change direction', 'pivot',
            'reconsider', 'go back', 'opposite', 'instead', 'actually'
        ];

        let reversalCount = 0;

        decisions.forEach(d => {
            const text = `${d.decision || ''} ${d.reasoning || ''}`.toLowerCase();
            reversalKeywords.forEach(k => {
                if (text.includes(k)) reversalCount++;
            });
        });

        // Calculate sentiment volatility
        const sentimentChanges = this.calculateSentimentVolatility(decisions);

        // Higher reversals and volatility = higher entropy
        const reversalRatio = decisions.length > 0 ? reversalCount / decisions.length : 0;
        const entropyScore = (reversalRatio * 50) + (sentimentChanges * 50);

        return Math.round(Math.min(100, entropyScore));
    }

    /**
     * Calculate sentiment volatility (how often sentiment changes between sequential decisions)
     */
    private calculateSentimentVolatility(decisions: CMEDecision[]): number {
        if (decisions.length < 2) return 0;

        const sorted = [...decisions]
            .filter(d => d && (d.timestamp || d.created_at))
            .sort((a, b) =>
                new Date(a.timestamp || a.created_at).getTime() -
                new Date(b.timestamp || b.created_at).getTime()
            );

        if (sorted.length < 2) return 0;

        let changes = 0;
        for (let i = 1; i < sorted.length; i++) {
            if (sorted[i].sentiment !== sorted[i - 1].sentiment) {
                changes++;
            }
        }

        return changes / (sorted.length - 1);
    }

    /**
     * Generate insights based on DNA profile
     */
    private generateInsights(dna: Omit<StrategicDNA, 'insights' | 'analysisContext'>): DNAInsight[] {
        const insights: DNAInsight[] = [];

        // Risk + Conflict tension
        if (dna.riskAppetite > 70 && dna.conflictTolerance < 40) {
            insights.push({
                dimension: 'Risk-Conflict Tension',
                observation: `High risk appetite (${dna.riskAppetite}) with low conflict tolerance (${dna.conflictTolerance})`,
                implication: 'Bold decisions may face resistance without healthy debate mechanisms'
            });
        }

        // Centralized + High entropy
        if (dna.decisionStyle < 30 && dna.decisionEntropy > 60) {
            insights.push({
                dimension: 'Leadership Volatility',
                observation: `Centralized decision-making (${dna.decisionStyle}) with high entropy (${dna.decisionEntropy})`,
                implication: 'Frequent changes from central authority may create confusion'
            });
        }

        // Innovation + Conservative
        if (dna.innovationBias > 70 && dna.riskAppetite < 30) {
            insights.push({
                dimension: 'Innovation Paradox',
                observation: `Strong innovation language (${dna.innovationBias}) but conservative risk profile (${dna.riskAppetite})`,
                implication: 'Innovation aspirations may not translate to action without risk tolerance'
            });
        }

        // Distributed + Low conflict tolerance
        if (dna.decisionStyle > 70 && dna.conflictTolerance < 30) {
            insights.push({
                dimension: 'Consensus Risk',
                observation: `Distributed decisions (${dna.decisionStyle}) with conflict avoidance (${dna.conflictTolerance})`,
                implication: 'Distributed authority with low conflict tolerance may lead to watered-down decisions'
            });
        }

        // High entropy warning
        if (dna.decisionEntropy > 70) {
            insights.push({
                dimension: 'Stability Warning',
                observation: `High decision entropy (${dna.decisionEntropy})`,
                implication: 'Frequent reversals and changes may indicate strategic confusion'
            });
        }

        // Strong profile celebration
        if (dna.riskAppetite > 60 && dna.innovationBias > 60 && dna.conflictTolerance > 50) {
            insights.push({
                dimension: 'Growth Mindset',
                observation: 'Strong alignment of risk appetite, innovation, and healthy conflict',
                implication: 'Organization is well-positioned for ambitious initiatives'
            });
        }

        return insights;
    }

    /**
     * Build analysis context metadata
     */
    private buildContext(decisions: CMEDecision[]): DNAContext {
        const actorCounts = new Map<string, number>();
        decisions.forEach(d => {
            actorCounts.set(d.actor, (actorCounts.get(d.actor) || 0) + 1);
        });

        const sortedActors = [...actorCounts.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(a => a[0]);

        const dates = decisions.map(d => new Date(d.timestamp || d.created_at));
        const oldest = Math.min(...dates.map(d => d.getTime()));
        const newest = Math.max(...dates.map(d => d.getTime()));
        const daySpan = Math.ceil((newest - oldest) / (1000 * 60 * 60 * 24));

        return {
            decisionCount: decisions.length,
            timespan: `${daySpan} days`,
            actorCount: actorCounts.size,
            dominantActors: sortedActors
        };
    }

    /**
     * Get default DNA for teams with no decisions
     */
    private getDefaultDNA(): StrategicDNA {
        return {
            riskAppetite: 50,
            decisionStyle: 50,
            conflictTolerance: 50,
            innovationBias: 50,
            decisionEntropy: 0,
            insights: [],
            analysisContext: {
                decisionCount: 0,
                timespan: '0 days',
                actorCount: 0,
                dominantActors: []
            }
        };
    }

    /**
     * Store DNA snapshot to database
     */
    async storeDNA(supabase: SupabaseClient, teamId: string, dna: StrategicDNA): Promise<void> {
        const { error } = await supabase.from('strategic_dna').insert({
            team_id: teamId,
            risk_appetite: dna.riskAppetite,
            decision_style: dna.decisionStyle,
            conflict_tolerance: dna.conflictTolerance,
            innovation_bias: dna.innovationBias,
            decision_entropy: dna.decisionEntropy,
            analysis_context: {
                ...dna.analysisContext,
                insights: dna.insights
            }
        });

        if (error) {
            console.error('Failed to store DNA snapshot:', error);
        } else {
            console.log('✅ Stored new Strategic DNA snapshot');
        }
    }

    /**
     * Get latest DNA for a team
     */
    async getLatestDNA(supabase: SupabaseClient, teamId: string): Promise<StrategicDNA | null> {
        const { data, error } = await supabase
            .from('strategic_dna')
            .select('*')
            .eq('team_id', teamId)
            .order('calculated_at', { ascending: false })
            .limit(1)
            .single();

        if (error || !data) {
            return null;
        }

        return {
            riskAppetite: data.risk_appetite,
            decisionStyle: data.decision_style,
            conflictTolerance: data.conflict_tolerance,
            innovationBias: data.innovation_bias,
            decisionEntropy: data.decision_entropy,
            insights: data.analysis_context?.insights || [],
            analysisContext: data.analysis_context || {
                decisionCount: 0,
                timespan: '0 days',
                actorCount: 0,
                dominantActors: []
            }
        };
    }
}

export const strategicDNAService = new StrategicDNAService();
