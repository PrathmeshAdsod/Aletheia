/**
 * Risk Radar Service
 * Detects early warning signals for organizational risks
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
    tags?: string[];
}

export interface RiskSignal {
    id: string;
    type: 'philosophical_drift' | 'decision_decay' | 'actor_overload' | 'blind_spot' | 'hidden_tension' | 'reversal_pattern';
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    evidence: RiskEvidence[];
    suggestedAction: string;
    detectedAt: string;
}

export interface RiskEvidence {
    decisionId?: string;
    actor?: string;
    metric?: string;
    value?: number;
    threshold?: number;
    description: string;
}

export interface RiskRadarResult {
    overallRisk: 'low' | 'medium' | 'high' | 'critical';
    riskScore: number; // 0-100
    signals: RiskSignal[];
    activeDetectors: {
        philosophicalDrift: boolean;
        decisionDecay: boolean;
        actorOverload: boolean;
        blindSpots: boolean;
        hiddenTensions: boolean;
        reversalPatterns: boolean;
    };
    summary: string;
}

export class RiskRadarService {

    /**
     * Scan for all risk signals
     */
    async scanRisks(decisions: CMEDecision[]): Promise<RiskRadarResult> {
        if (decisions.length === 0) {
            return {
                overallRisk: 'low',
                riskScore: 0,
                signals: [],
                activeDetectors: {
                    philosophicalDrift: false,
                    decisionDecay: false,
                    actorOverload: false,
                    blindSpots: false,
                    hiddenTensions: false,
                    reversalPatterns: false
                },
                summary: 'No decisions to analyze yet.'
            };
        }

        const signals: RiskSignal[] = [];

        // Run all detectors
        const driftSignals = this.detectPhilosophicalDrift(decisions);
        signals.push(...driftSignals);

        const decaySignals = this.detectDecisionDecay(decisions);
        signals.push(...decaySignals);

        const overloadSignals = this.detectActorOverload(decisions);
        signals.push(...overloadSignals);

        const blindSpotSignals = this.detectBlindSpots(decisions);
        signals.push(...blindSpotSignals);

        const tensionSignals = this.detectHiddenTensions(decisions);
        signals.push(...tensionSignals);

        const reversalSignals = this.detectReversalPatterns(decisions);
        signals.push(...reversalSignals);

        // Sort by severity
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        signals.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

        // Calculate overall risk
        const riskScore = this.calculateRiskScore(signals);
        const overallRisk = this.getRiskLevel(riskScore);

        // Generate summary
        const summary = this.generateSummary(signals, overallRisk);

        return {
            overallRisk,
            riskScore,
            signals,
            activeDetectors: {
                philosophicalDrift: driftSignals.length > 0,
                decisionDecay: decaySignals.length > 0,
                actorOverload: overloadSignals.length > 0,
                blindSpots: blindSpotSignals.length > 0,
                hiddenTensions: tensionSignals.length > 0,
                reversalPatterns: reversalSignals.length > 0
            },
            summary
        };
    }

    /**
     * Detect philosophical drift - decisions contradicting core values/patterns
     */
    private detectPhilosophicalDrift(decisions: CMEDecision[]): RiskSignal[] {
        const signals: RiskSignal[] = [];

        // Group decisions by time periods
        const recentDecisions = decisions.slice(0, Math.min(10, decisions.length));
        const olderDecisions = decisions.slice(10);

        if (olderDecisions.length < 5) return signals;

        // Keywords that indicate core values
        const coreValueKeywords = [
            'core', 'principle', 'value', 'mission', 'always', 'never',
            'fundamental', 'essential', 'non-negotiable', 'priority'
        ];

        // Find core decisions from older period
        const coreDecisions = olderDecisions.filter(d =>
            coreValueKeywords.some(k =>
                (d.decision || '').toLowerCase().includes(k) ||
                (d.reasoning || '').toLowerCase().includes(k)
            )
        );

        // Check if recent decisions contradict core decisions
        for (const recent of recentDecisions) {
            for (const core of coreDecisions) {
                // Simple contradiction check: same topic but opposite sentiment
                const recentText = `${recent.decision || ''} ${recent.reasoning || ''}`.toLowerCase();
                const coreText = `${core.decision || ''} ${core.reasoning || ''}`.toLowerCase();

                // Check for negation patterns
                const contradictionPatterns = [
                    { positive: 'invest in', negative: 'cut' },
                    { positive: 'expand', negative: 'reduce' },
                    { positive: 'hire', negative: 'layoff' },
                    { positive: 'prioritize', negative: 'deprioritize' },
                    { positive: 'focus on', negative: 'abandon' }
                ];

                for (const pattern of contradictionPatterns) {
                    if (
                        (coreText.includes(pattern.positive) && recentText.includes(pattern.negative)) ||
                        (coreText.includes(pattern.negative) && recentText.includes(pattern.positive))
                    ) {
                        signals.push({
                            id: `drift-${recent.decision_id}`,
                            type: 'philosophical_drift',
                            severity: 'high',
                            title: 'Philosophical Drift Detected',
                            description: `Recent decision may contradict earlier core principle`,
                            evidence: [
                                { decisionId: core.decision_id, description: `Core: "${(core.decision || '').slice(0, 50)}..."` },
                                { decisionId: recent.decision_id, description: `Recent: "${(recent.decision || '').slice(0, 50)}..."` }
                            ],
                            suggestedAction: 'Review alignment between recent decisions and core principles',
                            detectedAt: new Date().toISOString()
                        });
                        break;
                    }
                }
            }
        }

        return signals.slice(0, 2); // Cap at 2 drift signals
    }

    /**
     * Detect decision decay - strategic decisions going stale
     */
    private detectDecisionDecay(decisions: CMEDecision[]): RiskSignal[] {
        const signals: RiskSignal[] = [];
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

        // Find strategic/critical decisions that are aging
        const strategicDecisions = decisions.filter(d =>
            d.importance === 'strategic' || d.importance === 'critical'
        );

        const staleDecisions = strategicDecisions.filter(d => {
            const decisionDate = new Date(d.timestamp || d.created_at || now);
            return decisionDate < thirtyDaysAgo;
        });

        const veryStaleDecisions = strategicDecisions.filter(d => {
            const decisionDate = new Date(d.timestamp || d.created_at || now);
            return decisionDate < sixtyDaysAgo;
        });

        if (veryStaleDecisions.length > 0) {
            signals.push({
                id: 'decay-critical',
                type: 'decision_decay',
                severity: 'high',
                title: `${veryStaleDecisions.length} Strategic Decisions Need Review`,
                description: `Critical/strategic decisions over 60 days old may need reassessment`,
                evidence: veryStaleDecisions.slice(0, 3).map(d => ({
                    decisionId: d.decision_id,
                    description: `"${(d.decision || '').slice(0, 40)}..." (${d.importance})`
                })),
                suggestedAction: 'Schedule strategic review session to validate these decisions',
                detectedAt: new Date().toISOString()
            });
        } else if (staleDecisions.length > 2) {
            signals.push({
                id: 'decay-warning',
                type: 'decision_decay',
                severity: 'medium',
                title: `${staleDecisions.length} Decisions Aging`,
                description: `Strategic decisions over 30 days old - consider review`,
                evidence: staleDecisions.slice(0, 3).map(d => ({
                    decisionId: d.decision_id,
                    description: `"${(d.decision || '').slice(0, 40)}..."`
                })),
                suggestedAction: 'Plan upcoming review of strategic decisions',
                detectedAt: new Date().toISOString()
            });
        }

        return signals;
    }

    /**
     * Detect actor overload - single person making too many decisions
     */
    private detectActorOverload(decisions: CMEDecision[]): RiskSignal[] {
        const signals: RiskSignal[] = [];

        // Recent decisions only (last 30 days)
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const recentDecisions = decisions.filter(d =>
            new Date(d.timestamp || d.created_at || now) >= thirtyDaysAgo
        );

        if (recentDecisions.length < 5) return signals;

        // Count decisions by actor
        const actorCounts = new Map<string, number>();
        recentDecisions.forEach(d => {
            const actor = d.actor || 'Unknown Actor';
            actorCounts.set(actor, (actorCounts.get(actor) || 0) + 1);
        });

        const sortedActors = [...actorCounts.entries()].sort((a, b) => b[1] - a[1]);
        const [topActor, topCount] = sortedActors[0] || ['Unknown Actor', 0];
        const percentage = (topCount / recentDecisions.length) * 100;

        if (percentage > 70) {
            signals.push({
                id: 'overload-critical',
                type: 'actor_overload',
                severity: 'critical',
                title: 'Critical Decision Concentration',
                description: `${topActor} is making ${Math.round(percentage)}% of all decisions`,
                evidence: [{
                    actor: topActor,
                    metric: 'decision_share',
                    value: percentage,
                    threshold: 70,
                    description: `${topCount} of ${recentDecisions.length} recent decisions`
                }],
                suggestedAction: 'Distribute decision authority to prevent bottleneck and burnout',
                detectedAt: new Date().toISOString()
            });
        } else if (percentage > 50) {
            signals.push({
                id: 'overload-warning',
                type: 'actor_overload',
                severity: 'medium',
                title: 'High Decision Concentration',
                description: `${topActor} is making ${Math.round(percentage)}% of decisions`,
                evidence: [{
                    actor: topActor,
                    metric: 'decision_share',
                    value: percentage,
                    threshold: 50,
                    description: `${topCount} of ${recentDecisions.length} recent decisions`
                }],
                suggestedAction: 'Consider delegating more decisions to distribute load',
                detectedAt: new Date().toISOString()
            });
        }

        return signals;
    }

    /**
     * Detect blind spots - areas with no recent decisions
     */
    private detectBlindSpots(decisions: CMEDecision[]): RiskSignal[] {
        const signals: RiskSignal[] = [];

        // Common strategic areas to check
        const strategicAreas = [
            { keywords: ['customer', 'user', 'client'], name: 'Customer Focus' },
            { keywords: ['revenue', 'sales', 'growth', 'market'], name: 'Revenue/Growth' },
            { keywords: ['team', 'hire', 'culture', 'talent'], name: 'Team/Culture' },
            { keywords: ['product', 'feature', 'roadmap'], name: 'Product Development' },
            { keywords: ['risk', 'security', 'compliance'], name: 'Risk/Compliance' },
            { keywords: ['cost', 'budget', 'expense', 'efficiency'], name: 'Cost Management' }
        ];

        const now = new Date();
        const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        const recentDecisions = decisions.filter(d =>
            new Date(d.timestamp || d.created_at || now) >= ninetyDaysAgo
        );

        if (recentDecisions.length < 10) return signals;

        const blindSpots: string[] = [];

        for (const area of strategicAreas) {
            const areaDecisions = recentDecisions.filter(d => {
                const text = `${d.decision || ''} ${d.reasoning || ''}`.toLowerCase();
                return area.keywords.some(k => text.includes(k));
            });

            if (areaDecisions.length === 0) {
                blindSpots.push(area.name);
            }
        }

        if (blindSpots.length >= 3) {
            signals.push({
                id: 'blindspot-multiple',
                type: 'blind_spot',
                severity: 'high',
                title: `${blindSpots.length} Strategic Blind Spots`,
                description: `No recent decisions in: ${blindSpots.join(', ')}`,
                evidence: blindSpots.map(area => ({
                    description: `No decisions touching "${area}" in 90 days`
                })),
                suggestedAction: 'Review strategic coverage and ensure all key areas are addressed',
                detectedAt: new Date().toISOString()
            });
        } else if (blindSpots.length > 0) {
            signals.push({
                id: 'blindspot-warning',
                type: 'blind_spot',
                severity: 'low',
                title: 'Potential Blind Spots',
                description: `Areas with no recent attention: ${blindSpots.join(', ')}`,
                evidence: blindSpots.map(area => ({
                    description: `No decisions touching "${area}" in 90 days`
                })),
                suggestedAction: 'Consider if these areas need strategic attention',
                detectedAt: new Date().toISOString()
            });
        }

        return signals;
    }

    /**
     * Detect hidden tensions between actors
     */
    private detectHiddenTensions(decisions: CMEDecision[]): RiskSignal[] {
        const signals: RiskSignal[] = [];

        // Find conflict decisions and track actors involved
        const conflictDecisions = decisions.filter(d =>
            d.sentiment === 'conflict' || d.sentiment === 'red-flag'
        );

        if (conflictDecisions.length < 2) return signals;

        // Track actor pairs in conflicts
        const actorConflicts = new Map<string, Map<string, number>>();

        // Simple proximity-based conflict detection
        for (let i = 0; i < conflictDecisions.length - 1; i++) {
            const d1 = conflictDecisions[i];
            const d2 = conflictDecisions[i + 1];

            const actor1 = d1.actor || 'Unknown';
            const actor2 = d2.actor || 'Unknown';

            // If different actors have conflicts close together
            if (actor1 !== actor2) {
                const key = [actor1, actor2].sort().join('|');
                const count = actorConflicts.get(key)?.get('count') || 0;

                if (!actorConflicts.has(key)) {
                    actorConflicts.set(key, new Map());
                }
                actorConflicts.get(key)!.set('count', count + 1);
            }
        }

        // Find actors with multiple conflicts
        for (const [key, data] of actorConflicts) {
            const count = data.get('count') || 0;
            if (count >= 2) {
                const [actor1, actor2] = key.split('|');
                signals.push({
                    id: `tension-${key}`,
                    type: 'hidden_tension',
                    severity: count >= 3 ? 'high' : 'medium',
                    title: 'Recurring Tension Pattern',
                    description: `${actor1} and ${actor2} frequently appear in conflicting decisions`,
                    evidence: [{
                        description: `${count} conflict decisions involve these actors`
                    }],
                    suggestedAction: 'Facilitate alignment discussion between these stakeholders',
                    detectedAt: new Date().toISOString()
                });
            }
        }

        return signals.slice(0, 2); // Cap at 2 tension signals
    }

    /**
     * Detect reversal patterns - decisions being frequently undone
     */
    private detectReversalPatterns(decisions: CMEDecision[]): RiskSignal[] {
        const signals: RiskSignal[] = [];

        const reversalKeywords = [
            'reverse', 'undo', 'cancel', 'revert', 'rollback',
            'go back', 'reconsider', 'change course', 'pivot away'
        ];

        const reversalDecisions = decisions.filter(d => {
            const text = `${d.decision || ''} ${d.reasoning || ''}`.toLowerCase();
            return reversalKeywords.some(k => text.includes(k));
        });

        const reversalRate = decisions.length > 0 ? reversalDecisions.length / decisions.length : 0;

        if (reversalRate > 0.2) {
            signals.push({
                id: 'reversal-critical',
                type: 'reversal_pattern',
                severity: 'high',
                title: 'High Decision Reversal Rate',
                description: `${Math.round(reversalRate * 100)}% of decisions involve reversals`,
                evidence: reversalDecisions.slice(0, 3).map(d => ({
                    decisionId: d.decision_id,
                    description: `"${(d.decision || '').slice(0, 40)}..."`
                })),
                suggestedAction: 'Improve decision-making process to reduce churn',
                detectedAt: new Date().toISOString()
            });
        } else if (reversalRate > 0.1 && reversalDecisions.length >= 3) {
            signals.push({
                id: 'reversal-warning',
                type: 'reversal_pattern',
                severity: 'medium',
                title: 'Notable Reversal Pattern',
                description: `${reversalDecisions.length} decisions involve reversals`,
                evidence: reversalDecisions.slice(0, 2).map(d => ({
                    decisionId: d.decision_id,
                    description: `"${(d.decision || '').slice(0, 40)}..."`
                })),
                suggestedAction: 'Review decision criteria to prevent frequent reversals',
                detectedAt: new Date().toISOString()
            });
        }

        return signals;
    }

    /**
     * Calculate overall risk score (0-100)
     */
    private calculateRiskScore(signals: RiskSignal[]): number {
        if (signals.length === 0) return 0;

        const severityScores = { critical: 30, high: 20, medium: 10, low: 5 };
        let totalScore = 0;

        for (const signal of signals) {
            totalScore += severityScores[signal.severity];
        }

        return Math.min(100, totalScore);
    }

    /**
     * Get risk level from score
     */
    private getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
        if (score >= 70) return 'critical';
        if (score >= 40) return 'high';
        if (score >= 20) return 'medium';
        return 'low';
    }

    /**
     * Generate human-readable summary
     */
    private generateSummary(signals: RiskSignal[], _overallRisk: string): string {
        if (signals.length === 0) {
            return 'No significant risk signals detected. Organization appears healthy.';
        }

        const critical = signals.filter(s => s.severity === 'critical').length;
        const high = signals.filter(s => s.severity === 'high').length;

        if (critical > 0) {
            return `${critical} critical risk${critical > 1 ? 's' : ''} require immediate attention. Review risk details for action items.`;
        } else if (high > 0) {
            return `${high} high-priority risk${high > 1 ? 's' : ''} detected. Consider addressing these in your next planning session.`;
        } else {
            return `${signals.length} minor risk signal${signals.length > 1 ? 's' : ''} detected. No immediate action required but worth monitoring.`;
        }
    }

    /**
     * Store risk scan result
     */
    async storeRiskScan(supabase: SupabaseClient, teamId: string, result: RiskRadarResult): Promise<void> {
        // Store as proactive insights
        for (const signal of result.signals.slice(0, 5)) { // Cap at 5
            try {
                await supabase.from('proactive_insights').insert({
                    team_id: teamId,
                    category: 'risk',
                    severity: signal.severity,
                    title: signal.title,
                    description: signal.description,
                    evidence: signal.evidence,
                    suggested_action: signal.suggestedAction,
                    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 day expiry
                });
            } catch (err) {
                console.error('Failed to store risk signal:', err);
            }
        }
    }
}

export const riskRadarService = new RiskRadarService();
