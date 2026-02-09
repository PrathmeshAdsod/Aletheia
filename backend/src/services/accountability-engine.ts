/**
 * Accountability & Strategic Memory Engine
 * Detects neglected strategy, aging conflicts, and accountability gaps
 */

import { SupabaseClient } from '@supabase/supabase-js';

interface Decision {
    decision_id: string;
    decision: string;
    reasoning: string;
    actor: string;
    sentiment: string;
    importance: string;
    timestamp: string;
    created_at: string;
}

export interface AccountabilityInsight {
    id: string;
    type: 'neglected_decision' | 'abandoned_theme' | 'repeated_reversal' | 'unresolved_conflict' | 'actor_concentration' | 'orphaned_decision';
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    evidence: string[];
    suggestedAction: string;
    impactScore: number; // 0-100
    detectedAt: string;
    relatedDecisions: string[];
}

export interface MemoryAnalysis {
    insights: AccountabilityInsight[];
    overallAccountabilityScore: number; // 0-100
    criticalGaps: number;
    summary: string;
}

export class AccountabilityEngineService {

    /**
     * Run complete accountability analysis
     */
    async analyzeAccountability(decisions: Decision[]): Promise<MemoryAnalysis> {
        if (decisions.length === 0) {
            return {
                insights: [],
                overallAccountabilityScore: 100,
                criticalGaps: 0,
                summary: 'No decisions to analyze yet.'
            };
        }

        const insights: AccountabilityInsight[] = [];

        // Run all detectors
        insights.push(...this.detectNeglectedDecisions(decisions));
        insights.push(...this.detectAbandonedThemes(decisions));
        insights.push(...this.detectRepeatedReversals(decisions));
        insights.push(...this.detectAgingConflicts(decisions));
        insights.push(...this.detectActorConcentration(decisions));
        insights.push(...this.detectOrphanedDecisions(decisions));

        // Sort by severity and impact
        insights.sort((a, b) => {
            const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
            const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
            if (severityDiff !== 0) return severityDiff;
            return b.impactScore - a.impactScore;
        });

        const criticalGaps = insights.filter(i => i.severity === 'critical' || i.severity === 'high').length;
        const overallAccountabilityScore = this.calculateAccountabilityScore(insights, decisions.length);

        return {
            insights: insights.slice(0, 20), // Top 20 insights
            overallAccountabilityScore,
            criticalGaps,
            summary: this.generateSummary(insights, overallAccountabilityScore)
        };
    }

    /**
     * Detect high-importance decisions not referenced recently
     */
    private detectNeglectedDecisions(decisions: Decision[]): AccountabilityInsight[] {
        const insights: AccountabilityInsight[] = [];
        const now = Date.now();
        const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
        const sixtyDaysAgo = now - (60 * 24 * 60 * 60 * 1000);

        const criticalDecisions = decisions.filter(d => 
            d.importance === 'critical' || d.importance === 'strategic'
        );

        criticalDecisions.forEach(decision => {
            const decisionTime = new Date(decision.timestamp || decision.created_at).getTime();
            const daysSince = (now - decisionTime) / (1000 * 60 * 60 * 24);

            // Check if decision was referenced in subsequent decisions
            const laterDecisions = decisions.filter(d => {
                const dTime = new Date(d.timestamp || d.created_at).getTime();
                return dTime > decisionTime;
            });

            const referenced = laterDecisions.some(d => 
                d.decision.toLowerCase().includes(decision.decision.toLowerCase().split(' ').slice(0, 3).join(' ')) ||
                d.reasoning.toLowerCase().includes(decision.decision.toLowerCase().split(' ').slice(0, 3).join(' '))
            );

            if (!referenced && decisionTime < sixtyDaysAgo) {
                insights.push({
                    id: `neglected-${decision.decision_id}`,
                    type: 'neglected_decision',
                    severity: decisionTime < thirtyDaysAgo ? 'critical' : 'high',
                    title: `Critical Decision Neglected: ${decision.decision.substring(0, 50)}...`,
                    description: `This ${decision.importance} decision was made ${Math.round(daysSince)} days ago by ${decision.actor} but has not been referenced or followed up in subsequent decisions.`,
                    evidence: [decision.decision_id],
                    suggestedAction: `Review implementation status and create follow-up action items for: "${decision.decision}"`,
                    impactScore: decision.importance === 'critical' ? 90 : 75,
                    detectedAt: new Date().toISOString(),
                    relatedDecisions: [decision.decision_id]
                });
            }
        });

        return insights;
    }

    /**
     * Detect strategic themes that disappeared abruptly
     */
    private detectAbandonedThemes(decisions: Decision[]): AccountabilityInsight[] {
        const insights: AccountabilityInsight[] = [];
        const themeKeywords = {
            'growth': ['grow', 'expand', 'scale', 'increase'],
            'efficiency': ['optimize', 'streamline', 'reduce', 'automate'],
            'innovation': ['new', 'innovative', 'experiment', 'pilot'],
            'customer': ['customer', 'user', 'client', 'experience'],
            'quality': ['quality', 'excellence', 'standard', 'improve']
        };

        Object.entries(themeKeywords).forEach(([theme, keywords]) => {
            const themeDecisions = decisions.filter(d => {
                const text = `${d.decision} ${d.reasoning}`.toLowerCase();
                return keywords.some(k => text.includes(k));
            });

            if (themeDecisions.length >= 3) {
                const lastMention = new Date(themeDecisions[themeDecisions.length - 1].timestamp || themeDecisions[themeDecisions.length - 1].created_at);
                const daysSince = (Date.now() - lastMention.getTime()) / (1000 * 60 * 60 * 24);

                if (daysSince > 45) {
                    insights.push({
                        id: `abandoned-theme-${theme}`,
                        type: 'abandoned_theme',
                        severity: daysSince > 90 ? 'high' : 'medium',
                        title: `Strategic Theme Abandoned: ${theme.charAt(0).toUpperCase() + theme.slice(1)}`,
                        description: `The "${theme}" theme appeared in ${themeDecisions.length} decisions but hasn't been mentioned in ${Math.round(daysSince)} days. This may indicate a strategic shift or neglected priority.`,
                        evidence: themeDecisions.slice(-3).map(d => d.decision_id),
                        suggestedAction: `Clarify if "${theme}" is still a strategic priority. If yes, create action items. If no, formally document the strategic shift.`,
                        impactScore: 70,
                        detectedAt: new Date().toISOString(),
                        relatedDecisions: themeDecisions.map(d => d.decision_id)
                    });
                }
            }
        });

        return insights;
    }

    /**
     * Detect repeated reversals
     */
    private detectRepeatedReversals(decisions: Decision[]): AccountabilityInsight[] {
        const insights: AccountabilityInsight[] = [];
        const reversalKeywords = ['reverse', 'undo', 'cancel', 'change direction', 'go back', 'reconsider'];

        const reversals = decisions.filter(d => {
            const text = `${d.decision} ${d.reasoning}`.toLowerCase();
            return reversalKeywords.some(k => text.includes(k));
        });

        if (reversals.length >= 3) {
            const actors = [...new Set(reversals.map(d => d.actor))];
            
            insights.push({
                id: `repeated-reversals`,
                type: 'repeated_reversal',
                severity: reversals.length >= 5 ? 'critical' : 'high',
                title: `Pattern of Decision Reversals Detected`,
                description: `${reversals.length} decision reversals detected across ${actors.length} decision-maker(s). This pattern suggests unclear decision criteria or insufficient upfront analysis.`,
                evidence: reversals.map(d => d.decision_id),
                suggestedAction: 'Establish clearer decision-making frameworks and criteria. Consider implementing decision review checkpoints before commitment.',
                impactScore: 85,
                detectedAt: new Date().toISOString(),
                relatedDecisions: reversals.map(d => d.decision_id)
            });
        }

        return insights;
    }

    /**
     * Detect aging unresolved conflicts
     */
    private detectAgingConflicts(decisions: Decision[]): AccountabilityInsight[] {
        const insights: AccountabilityInsight[] = [];
        const conflicts = decisions.filter(d => d.sentiment === 'conflict' || d.sentiment === 'red-flag');

        conflicts.forEach((conflict, idx) => {
            const conflictTime = new Date(conflict.timestamp || conflict.created_at).getTime();
            const daysSince = (Date.now() - conflictTime) / (1000 * 60 * 60 * 24);

            // Check if conflict was resolved
            const laterDecisions = decisions.slice(idx + 1);
            const resolved = laterDecisions.some(d => {
                const text = `${d.decision} ${d.reasoning}`.toLowerCase();
                const conflictText = conflict.decision.toLowerCase();
                return d.sentiment === 'aligned' && (
                    text.includes(conflictText.split(' ').slice(0, 3).join(' ')) ||
                    text.includes('resolve') || text.includes('address')
                );
            });

            if (!resolved && daysSince > 30) {
                insights.push({
                    id: `aging-conflict-${conflict.decision_id}`,
                    type: 'unresolved_conflict',
                    severity: daysSince > 60 ? 'critical' : 'high',
                    title: `Unresolved Conflict: ${conflict.decision.substring(0, 50)}...`,
                    description: `This conflict has been unresolved for ${Math.round(daysSince)} days. Prolonged conflicts erode team alignment and decision quality.`,
                    evidence: [conflict.decision_id],
                    suggestedAction: `Schedule conflict resolution session for: "${conflict.decision}". Assign owner and deadline.`,
                    impactScore: 80,
                    detectedAt: new Date().toISOString(),
                    relatedDecisions: [conflict.decision_id]
                });
            }
        });

        return insights;
    }

    /**
     * Detect actor concentration risks
     */
    private detectActorConcentration(decisions: Decision[]): AccountabilityInsight[] {
        const insights: AccountabilityInsight[] = [];
        const actorCounts = new Map<string, number>();

        decisions.forEach(d => {
            actorCounts.set(d.actor, (actorCounts.get(d.actor) || 0) + 1);
        });

        const sortedActors = [...actorCounts.entries()].sort((a, b) => b[1] - a[1]);
        const topActor = sortedActors[0];

        if (topActor && topActor[1] > decisions.length * 0.5) {
            const percentage = Math.round((topActor[1] / decisions.length) * 100);
            
            insights.push({
                id: `actor-concentration-${topActor[0]}`,
                type: 'actor_concentration',
                severity: percentage > 70 ? 'high' : 'medium',
                title: `Decision Power Concentration: ${topActor[0]}`,
                description: `${topActor[0]} is making ${percentage}% of all decisions (${topActor[1]} of ${decisions.length}). This concentration creates bottleneck risk and single point of failure.`,
                evidence: decisions.filter(d => d.actor === topActor[0]).slice(0, 5).map(d => d.decision_id),
                suggestedAction: `Distribute decision authority. Identify decisions that can be delegated to other team members. Consider decision-making frameworks.`,
                impactScore: 75,
                detectedAt: new Date().toISOString(),
                relatedDecisions: decisions.filter(d => d.actor === topActor[0]).map(d => d.decision_id)
            });
        }

        return insights;
    }

    /**
     * Detect orphaned decisions (no follow-up despite importance)
     */
    private detectOrphanedDecisions(decisions: Decision[]): AccountabilityInsight[] {
        const insights: AccountabilityInsight[] = [];
        
        const strategicDecisions = decisions.filter(d => 
            d.importance === 'strategic' || d.importance === 'critical'
        );

        strategicDecisions.forEach((decision, idx) => {
            const decisionTime = new Date(decision.timestamp || decision.created_at).getTime();
            const next10Decisions = decisions.slice(idx + 1, idx + 11);
            
            // Check if any subsequent decisions reference this one
            const hasFollowUp = next10Decisions.some(d => {
                const text = `${d.decision} ${d.reasoning}`.toLowerCase();
                const keywords = decision.decision.toLowerCase().split(' ').slice(0, 4);
                return keywords.some(k => k.length > 3 && text.includes(k));
            });

            const daysSince = (Date.now() - decisionTime) / (1000 * 60 * 60 * 24);

            if (!hasFollowUp && daysSince > 14 && next10Decisions.length >= 5) {
                insights.push({
                    id: `orphaned-${decision.decision_id}`,
                    type: 'orphaned_decision',
                    severity: 'medium',
                    title: `Orphaned Strategic Decision: ${decision.decision.substring(0, 50)}...`,
                    description: `This ${decision.importance} decision by ${decision.actor} has no visible follow-up actions in subsequent decisions. Strategic decisions should create ripple effects.`,
                    evidence: [decision.decision_id],
                    suggestedAction: `Create implementation plan and track execution for: "${decision.decision}"`,
                    impactScore: 65,
                    detectedAt: new Date().toISOString(),
                    relatedDecisions: [decision.decision_id]
                });
            }
        });

        return insights;
    }

    /**
     * Calculate overall accountability score
     */
    private calculateAccountabilityScore(insights: AccountabilityInsight[], decisionCount: number): number {
        if (decisionCount === 0) return 100;

        let penalties = 0;
        insights.forEach(insight => {
            switch (insight.severity) {
                case 'critical': penalties += 15; break;
                case 'high': penalties += 10; break;
                case 'medium': penalties += 5; break;
                case 'low': penalties += 2; break;
            }
        });

        return Math.max(0, Math.min(100, 100 - penalties));
    }

    /**
     * Generate summary
     */
    private generateSummary(insights: AccountabilityInsight[], score: number): string {
        const critical = insights.filter(i => i.severity === 'critical').length;
        const high = insights.filter(i => i.severity === 'high').length;

        if (score >= 80) {
            return `Strong accountability: ${insights.length} minor gaps detected. The organization maintains good strategic follow-through.`;
        } else if (score >= 60) {
            return `Moderate accountability: ${critical + high} significant gaps require attention. Some strategic decisions lack follow-up.`;
        } else {
            return `Accountability concerns: ${critical} critical and ${high} high-severity gaps detected. Strategic memory and follow-through need improvement.`;
        }
    }

    /**
     * Store insights in database
     */
    async storeInsights(supabase: SupabaseClient, teamId: string, insights: AccountabilityInsight[]): Promise<void> {
        try {
            const records = insights.map(insight => ({
                team_id: teamId,
                category: 'accountability',
                severity: insight.severity,
                title: insight.title,
                description: insight.description,
                evidence: insight.evidence,
                suggested_action: insight.suggestedAction,
                expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
            }));

            await supabase.from('proactive_insights').insert(records);
        } catch (err) {
            console.error('Failed to store accountability insights:', err);
        }
    }
}

export const accountabilityEngineService = new AccountabilityEngineService();
