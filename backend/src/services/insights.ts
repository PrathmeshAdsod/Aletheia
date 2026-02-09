/**
 * Proactive Insights Service
 * 
 * AI-driven analysis that proactively:
 * - Detects potential conflicts before they escalate
 * - Suggests action items based on decision patterns
 * - Identifies stale decisions needing review
 * - Highlights strategic alignment opportunities
 * 
 * Designed to make the app "think ahead" for the team
 */

import { CMEDecision } from '../types/cme';
import { geminiService } from './gemini';

// Insight types for different proactive suggestions
export type InsightType =
    | 'conflict_warning'    // Early conflict detection
    | 'action_required'     // Suggested follow-ups
    | 'review_needed'       // Stale decisions
    | 'alignment_opportunity'  // Cross-team alignment
    | 'pattern_detected'    // Recurring patterns
    | 'priority_shift';     // Priority changes detected

export interface ProactiveInsight {
    id: string;
    type: InsightType;
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    relatedDecisionIds: string[];
    suggestedAction?: string;
    createdAt: string;
}

interface ConflictScore {
    decisionA: CMEDecision;
    decisionB: CMEDecision;
    conflictProbability: number;
    reason: string;
}

class ProactiveInsightsService {

    /**
     * Generate all proactive insights for a team
     */
    async generateInsights(decisions: CMEDecision[]): Promise<ProactiveInsight[]> {
        if (decisions.length === 0) {
            return [];
        }

        const insights: ProactiveInsight[] = [];

        // Run all analysis in parallel for efficiency
        const [conflicts, stale, patterns] = await Promise.all([
            this.detectPotentialConflicts(decisions),
            this.findStaleDecisions(decisions),
            this.detectPatterns(decisions)
        ]);

        insights.push(...conflicts);
        insights.push(...stale);
        insights.push(...patterns);

        // Sort by severity
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        insights.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

        return insights.slice(0, 10); // Cap at 10 insights
    }

    /**
     * Detect potential conflicts between recent decisions
     */
    private async detectPotentialConflicts(decisions: CMEDecision[]): Promise<ProactiveInsight[]> {
        const insights: ProactiveInsight[] = [];
        const recent = decisions.slice(0, 20); // Focus on recent decisions

        // Simple conflict detection based on sentiment and keywords
        const conflictPairs: ConflictScore[] = [];

        for (let i = 0; i < recent.length; i++) {
            for (let j = i + 1; j < recent.length; j++) {
                const score = this.calculateConflictScore(recent[i], recent[j]);
                if (score.conflictProbability > 0.6) {
                    conflictPairs.push(score);
                }
            }
        }

        // Create insights for high-probability conflicts
        for (const pair of conflictPairs.slice(0, 3)) {
            insights.push({
                id: `conflict-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                type: 'conflict_warning',
                title: 'Potential Decision Conflict Detected',
                description: `"${pair.decisionA.decision.substring(0, 50)}..." may conflict with "${pair.decisionB.decision.substring(0, 50)}..." - ${pair.reason}`,
                severity: pair.conflictProbability > 0.8 ? 'high' : 'medium',
                relatedDecisionIds: [pair.decisionA.decision_id, pair.decisionB.decision_id],
                suggestedAction: 'Review these decisions and clarify priorities with stakeholders.',
                createdAt: new Date().toISOString()
            });
        }

        return insights;
    }

    /**
     * Calculate conflict probability between two decisions
     */
    private calculateConflictScore(a: CMEDecision, b: CMEDecision): ConflictScore {
        let probability = 0;
        let reason = '';

        // Different actors with opposing sentiments
        if (a.actor !== b.actor) {
            if ((a.sentiment === 'RED' && b.sentiment === 'GREEN') ||
                (a.sentiment === 'GREEN' && b.sentiment === 'RED')) {
                probability += 0.4;
                reason = 'Opposing sentiments from different actors';
            }
        }

        // Keyword overlap detection (simplified)
        const aWords = new Set(a.decision.toLowerCase().split(/\s+/));
        const bWords = new Set(b.decision.toLowerCase().split(/\s+/));
        const intersection = [...aWords].filter(w => bWords.has(w) && w.length > 4);

        if (intersection.length > 2) {
            probability += 0.3;
            reason += reason ? '; ' : '';
            reason += `Overlapping terms: ${intersection.slice(0, 3).join(', ')}`;
        }

        // Constraint conflicts
        const aConstraints = (a.constraints || []).join(' ').toLowerCase();
        const bConstraints = (b.constraints || []).join(' ').toLowerCase();

        const negationWords = ['not', 'never', 'avoid', 'prevent', 'block', 'stop'];
        for (const neg of negationWords) {
            if (aConstraints.includes(neg) || bConstraints.includes(neg)) {
                probability += 0.2;
                reason += reason ? '; ' : '';
                reason += 'Constraint language suggests restrictions';
                break;
            }
        }

        return {
            decisionA: a,
            decisionB: b,
            conflictProbability: Math.min(probability, 1),
            reason: reason || 'General pattern analysis'
        };
    }

    /**
     * Find decisions that may be stale and need review
     */
    private async findStaleDecisions(decisions: CMEDecision[]): Promise<ProactiveInsight[]> {
        const insights: ProactiveInsight[] = [];
        const now = new Date();
        const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

        // Find strategic decisions older than 3 months
        const stale = decisions.filter(d => {
            if (!d.timestamp) return false;
            const decisionDate = new Date(d.timestamp);
            return decisionDate < threeMonthsAgo &&
                (d.importance === 'strategic' || d.importance === 'critical');
        });

        if (stale.length > 0) {
            insights.push({
                id: `stale-${Date.now()}`,
                type: 'review_needed',
                title: `${stale.length} Strategic Decisions Need Review`,
                description: `You have ${stale.length} strategic or critical decisions that are over 3 months old. Consider reviewing them to ensure they're still aligned with current goals.`,
                severity: stale.length > 5 ? 'high' : 'medium',
                relatedDecisionIds: stale.slice(0, 5).map(d => d.decision_id),
                suggestedAction: 'Schedule a quarterly decision review meeting.',
                createdAt: new Date().toISOString()
            });
        }

        return insights;
    }

    /**
     * Detect interesting patterns in decisions
     */
    private async detectPatterns(decisions: CMEDecision[]): Promise<ProactiveInsight[]> {
        const insights: ProactiveInsight[] = [];

        // Pattern: High concentration of decisions from one actor
        const actorCounts = new Map<string, number>();
        for (const d of decisions.slice(0, 50)) {
            actorCounts.set(d.actor, (actorCounts.get(d.actor) || 0) + 1);
        }

        const topActor = [...actorCounts.entries()].sort((a, b) => b[1] - a[1])[0];
        if (topActor && topActor[1] > decisions.length * 0.4 && decisions.length > 5) {
            insights.push({
                id: `pattern-actor-${Date.now()}`,
                type: 'pattern_detected',
                title: 'Decision Concentration Detected',
                description: `${topActor[0]} has made ${topActor[1]} of the last ${Math.min(50, decisions.length)} decisions (${Math.round(topActor[1] / Math.min(50, decisions.length) * 100)}%). Consider broadening decision-making participation.`,
                severity: 'low',
                relatedDecisionIds: [],
                suggestedAction: 'Consider involving more team members in decision-making.',
                createdAt: new Date().toISOString()
            });
        }

        // Pattern: Many RED sentiment decisions
        const redDecisions = decisions.filter(d => d.sentiment === 'RED');
        if (redDecisions.length > decisions.length * 0.3 && decisions.length > 5) {
            insights.push({
                id: `pattern-red-${Date.now()}`,
                type: 'priority_shift',
                title: 'High Conflict Rate Detected',
                description: `${Math.round(redDecisions.length / decisions.length * 100)}% of recent decisions have conflict markers. The team may benefit from an alignment session.`,
                severity: 'medium',
                relatedDecisionIds: redDecisions.slice(0, 3).map(d => d.decision_id),
                suggestedAction: 'Schedule a team alignment meeting to address underlying friction.',
                createdAt: new Date().toISOString()
            });
        }

        return insights;
    }

    /**
     * Get AI-generated summary and recommendations
     */
    async getAISummary(decisions: CMEDecision[]): Promise<{
        summary: string;
        topPriorities: string[];
        suggestedFocus: string;
    }> {
        if (decisions.length === 0) {
            return {
                summary: 'No decisions found yet. Upload documents to start building your decision graph.',
                topPriorities: [],
                suggestedFocus: 'Upload your first document to get started.'
            };
        }

        // Build compact context from recent strategic decisions
        const strategic = decisions
            .filter(d => d.importance === 'strategic' || d.importance === 'critical')
            .slice(0, 10);

        const context = strategic.length > 0
            ? strategic.map(d => `- ${d.decision} (by ${d.actor})`).join('\n')
            : decisions.slice(0, 5).map(d => `- ${d.decision} (by ${d.actor})`).join('\n');

        try {
            const prompt = `Based on these team decisions, provide a brief JSON response:
            
${context}

Return ONLY valid JSON:
{
  "summary": "One sentence summary of the team's direction",
  "topPriorities": ["Priority 1", "Priority 2", "Priority 3"],
  "suggestedFocus": "One actionable suggestion for the week"
}`;

            const response = await geminiService.chat(prompt, '', []);

            // Try to parse JSON from response
            const jsonMatch = response.response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return {
                    summary: parsed.summary || 'Analysis in progress...',
                    topPriorities: parsed.topPriorities || [],
                    suggestedFocus: parsed.suggestedFocus || 'Continue current initiatives.'
                };
            }
        } catch (error) {
            console.warn('AI summary generation failed:', error);
        }

        // Fallback
        return {
            summary: `Your team has ${decisions.length} decisions recorded.`,
            topPriorities: decisions.slice(0, 3).map(d => d.decision.substring(0, 50)),
            suggestedFocus: 'Review recent decisions and identify follow-up actions.'
        };
    }
}

export const insightsService = new ProactiveInsightsService();
