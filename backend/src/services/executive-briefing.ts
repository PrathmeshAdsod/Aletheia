/**
 * Executive Briefing Service
 * Generates daily AI-powered strategic briefings
 */

import { GoogleGenAI } from '@google/genai';
import { SupabaseClient } from '@supabase/supabase-js';
import { supabaseService } from './supabase';
import { strategicPulseService, PulseSnapshot } from './strategic-pulse';
import { strategicDNAService, StrategicDNA } from './strategic-dna';
import { riskRadarService, RiskRadarResult } from './risk-radar';

// Initialize Gemini
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

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

export interface ExecutiveBriefing {
    id: string;
    generatedAt: string;
    headline: string;
    executiveSummary: string;
    sections: BriefingSection[];
    recommendations: string[];
    focusAreas: string[];
    metrics: BriefingMetrics;
}

export interface BriefingSection {
    title: string;
    icon: string;
    content: string;
    severity?: 'info' | 'warning' | 'critical';
}

export interface BriefingMetrics {
    pulseScore: number;
    pulseTrend: 'up' | 'down' | 'stable';
    riskScore: number;
    decisionVelocity: number;
    activeRisks: number;
}

export class ExecutiveBriefingService {

    /**
     * Generate a comprehensive executive briefing
     */
    /**
     * Try to get a cached briefing
     */
    async getCachedBriefing(teamId: string): Promise<ExecutiveBriefing | null> {
        try {
            const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();

            const { data: cached } = await supabaseService.client
                .from('proactive_insights')
                .select('evidence, created_at, title, description, suggested_action')
                .eq('team_id', teamId)
                .eq('category', 'briefing')
                .gte('created_at', twelveHoursAgo)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (cached && cached.evidence) {
                const evidence = cached.evidence as any;

                return {
                    id: `briefing-cached-${Date.now()}`,
                    generatedAt: cached.created_at,
                    headline: cached.title || '📊 Daily Strategic Intelligence',
                    executiveSummary: cached.description || '',
                    sections: evidence.sections || [],
                    recommendations: [cached.suggested_action].filter(Boolean),
                    focusAreas: [],
                    metrics: evidence.metrics || {
                        pulseScore: 50,
                        pulseTrend: 'stable' as const,
                        riskScore: 0,
                        decisionVelocity: 0,
                        activeRisks: 0
                    }
                };
            }
        } catch (err) {
            // Silent fail
        }
        return null;
    }

    /**
     * Generate a comprehensive executive briefing
     * Cached for 12 hours (2 requests/day limit)
     */
    async generateBriefing(teamId: string, decisions: CMEDecision[]): Promise<ExecutiveBriefing> {
        // 1. Check cache
        try {
            const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();

            const { data: cached } = await supabaseService.client
                .from('proactive_insights')
                .select('evidence, created_at, title, description, suggested_action')
                .eq('team_id', teamId)
                .eq('category', 'briefing')
                .gte('created_at', twelveHoursAgo)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (cached && cached.evidence) {
                const evidence = cached.evidence as any;

                // Reconstruct briefing from cached data
                const cachedBriefing: ExecutiveBriefing = {
                    id: `briefing-cached-${Date.now()}`,
                    generatedAt: cached.created_at,
                    headline: cached.title || '📊 Daily Strategic Intelligence',
                    executiveSummary: cached.description || '',
                    sections: evidence.sections || [],
                    recommendations: [cached.suggested_action].filter(Boolean),
                    focusAreas: [],
                    metrics: evidence.metrics || {
                        pulseScore: 50,
                        pulseTrend: 'stable' as const,
                        riskScore: 0,
                        decisionVelocity: 0,
                        activeRisks: 0
                    }
                };

                return cachedBriefing;
            }
        } catch (err) {
            // Silent fail
        }

        // Gather intelligence from all sources
        const [pulse, dna, risks] = await Promise.all([
            strategicPulseService.calculatePulse(decisions),
            strategicDNAService.calculateDNA(decisions),
            riskRadarService.scanRisks(decisions)
        ]);

        // Get recent activity
        const recentDecisions = this.getRecentDecisions(decisions, 7);
        const yesterdayDecisions = this.getRecentDecisions(decisions, 1);

        // Build briefing sections
        const sections = this.buildSections(pulse, dna, risks, recentDecisions, yesterdayDecisions);

        // Generate AI executive summary
        const aiSummary = await this.generateAISummary(pulse, dna, risks, recentDecisions);

        // Generate recommendations
        const recommendations = this.generateRecommendations(pulse, dna, risks);

        // Identify focus areas
        const focusAreas = this.identifyFocusAreas(pulse, risks, recentDecisions);

        const briefing: ExecutiveBriefing = {
            id: `briefing-${Date.now()}`,
            generatedAt: new Date().toISOString(),
            headline: this.generateHeadline(pulse, risks),
            executiveSummary: aiSummary,
            sections,
            recommendations,
            focusAreas,
            metrics: {
                pulseScore: pulse.pulseScore,
                pulseTrend: pulse.velocityTrend === 'accelerating' ? 'up' :
                    pulse.velocityTrend === 'decelerating' ? 'down' : 'stable',
                riskScore: risks.riskScore,
                decisionVelocity: pulse.velocity,
                activeRisks: risks.signals.length
            }
        };

        // Cache the result
        // We do this via storeBriefing, but we should make sure we don't double-call it if the caller does it.
        // The caller (route) calls storeBriefing.
        // But to ensure we obey the limit, we should probably return a flag or just rely on the fact that if we just generated it, the caller will store it.
        // However, if we Return cached, the caller will try to store it again?
        // storeBriefing inserts a new record. We don't want to duplicate cached records.
        // Implication: The route handler calls `storeBriefing`.
        // If we return a cached briefing, the route handler will insert it again into DB as a new row?
        // Yes.
        // So we should probably handle storage HERE and tell the route not to store, or just handle it purely here.
        // But the route handler is: `const briefing = await ...; executiveBriefingService.storeBriefing(...)`
        // I can't easily change the route to "know" if it was cached without changing return type.
        // Actually, I can just NOT store it in the route if I move storage logic inside here (for fresh generation).
        // Let's move storage logic inside here for fresh generation.
        // The route handler's `storeBriefing` call is "async, don't wait".

        // Better approach:
        // Update the route to NOT call storeBriefing.
        // Call storeBriefing internally here ONLY when generating new.

        // Let's implement that.
        this.storeBriefing(supabaseService.client, teamId, briefing).catch(() => {});

        return briefing;
    }

    /**
     * Get decisions from last N days
     */
    private getRecentDecisions(decisions: CMEDecision[], days: number): CMEDecision[] {
        const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        return decisions.filter(d =>
            new Date(d.timestamp || d.created_at) >= cutoff
        );
    }

    /**
     * Generate headline based on current state
     */
    private generateHeadline(pulse: PulseSnapshot, risks: RiskRadarResult): string {
        if (risks.overallRisk === 'critical') {
            return '🚨 Critical Risks Require Immediate Attention';
        }

        const phaseHeadlines: Record<string, string> = {
            'expansion': '📈 Growth Mode Active - Momentum Building',
            'stabilization': '⚖️ Steady Operations - Strategic Focus Maintained',
            'pivot': '🔄 Strategic Transition Underway',
            'churn': '⚠️ Alignment Challenges Detected',
            'crisis': '🆘 Crisis Response Required'
        };

        return phaseHeadlines[pulse.phase] || '📊 Daily Strategic Intelligence';
    }

    /**
     * Build briefing sections
     */
    private buildSections(
        pulse: PulseSnapshot,
        dna: StrategicDNA,
        risks: RiskRadarResult,
        recentDecisions: CMEDecision[],
        yesterdayDecisions: CMEDecision[]
    ): BriefingSection[] {
        const sections: BriefingSection[] = [];

        // Section 1: What Happened
        if (yesterdayDecisions.length > 0) {
            const actors = [...new Set(yesterdayDecisions.map(d => d.actor))];
            const critical = yesterdayDecisions.filter(d => d.importance === 'critical').length;

            sections.push({
                title: 'What Changed Yesterday',
                icon: '📅',
                content: `${yesterdayDecisions.length} decision${yesterdayDecisions.length > 1 ? 's' : ''} made by ${actors.join(', ')}. ${critical > 0 ? `${critical} critical decision${critical > 1 ? 's' : ''} require follow-up.` : ''}`
            });
        }

        // Section 2: Current Health
        sections.push({
            title: 'Strategic Health',
            icon: '🫀',
            content: `Pulse Score: ${pulse.pulseScore}/100 (${pulse.phase} phase). Decision velocity: ${pulse.velocity}/day. Coherence: ${pulse.coherenceScore}%.`,
            severity: pulse.pulseScore < 50 ? 'warning' : 'info'
        });

        // Section 3: Risk Overview
        if (risks.signals.length > 0) {
            const criticalRisks = risks.signals.filter(s => s.severity === 'critical' || s.severity === 'high');
            sections.push({
                title: 'Risk Summary',
                icon: '⚠️',
                content: `${risks.signals.length} risk signal${risks.signals.length > 1 ? 's' : ''} detected. ${criticalRisks.length > 0 ? `${criticalRisks.length} require immediate attention.` : 'No critical issues.'}`,
                severity: criticalRisks.length > 0 ? 'critical' : 'warning'
            });
        }

        // Section 4: DNA Insight
        if (dna.insights.length > 0) {
            sections.push({
                title: 'Organizational Pattern',
                icon: '🧬',
                content: dna.insights[0].implication
            });
        }

        // Section 5: Projections
        if (pulse.projections.length > 0) {
            const urgentProjection = pulse.projections.find(p => p.daysToThreshold && p.daysToThreshold < 14);
            if (urgentProjection) {
                sections.push({
                    title: 'Trajectory Warning',
                    icon: '📉',
                    content: `If current trends continue, ${urgentProjection.metric} may drop below ${urgentProjection.threshold} in ~${urgentProjection.daysToThreshold} days.`,
                    severity: 'warning'
                });
            }
        }

        // Section 6: Activity Summary
        const actorActivity = new Map<string, number>();
        recentDecisions.forEach(d => {
            actorActivity.set(d.actor, (actorActivity.get(d.actor) || 0) + 1);
        });
        const topActors = [...actorActivity.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([actor, count]) => `${actor} (${count})`);

        if (topActors.length > 0) {
            sections.push({
                title: '7-Day Activity',
                icon: '📊',
                content: `Most active: ${topActors.join(', ')}. Total: ${recentDecisions.length} decisions this week.`
            });
        }

        return sections;
    }

    /**
     * Generate AI executive summary
     */
    private async generateAISummary(
        pulse: PulseSnapshot,
        dna: StrategicDNA,
        risks: RiskRadarResult,
        recentDecisions: CMEDecision[]
    ): Promise<string> {
        try {
            const prompt = `You are a strategic advisor generating a brief executive summary. Be concise (2-3 sentences max).

Current State:
- Pulse Score: ${pulse.pulseScore}/100 (${pulse.phase} phase)
- Decision Velocity: ${pulse.velocity}/day
- Coherence: ${pulse.coherenceScore}%
- Risk Level: ${risks.overallRisk} (${risks.signals.length} signals)
- Recent Decisions: ${recentDecisions.length} in last 7 days

DNA Profile:
- Risk Appetite: ${dna.riskAppetite}
- Innovation Bias: ${dna.innovationBias}
- Conflict Tolerance: ${dna.conflictTolerance}

${risks.signals.length > 0 ? `Top Risk: ${risks.signals[0].title}` : ''}

Generate a crisp 2-3 sentence executive summary that captures the most important insight. Start with the key takeaway, then add context. Be direct and actionable.`;

            const response = await genAI.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt
            });

            // Extract text from response - handle multiple SDK response formats
            let text = '';
            const responseAny = response as any;

            // Try response.response.text() method
            if (responseAny.response && typeof responseAny.response.text === 'function') {
                try {
                    text = responseAny.response.text();
                } catch (e) {
                    // Silent fallback
                }
            }

            // Fallback: try direct text property
            if (!text && typeof responseAny.text === 'string') {
                text = responseAny.text;
            }

            // Fallback: try candidates structure
            if (!text && responseAny.response?.candidates?.[0]?.content?.parts?.[0]?.text) {
                text = responseAny.response.candidates[0].content.parts[0].text;
            }

            if (!text || text.trim().length === 0) {
                return this.getFallbackSummary(pulse, risks);
            }

            return text.trim();
        } catch (error) {
            return this.getFallbackSummary(pulse, risks);
        }
    }

    private getFallbackSummary(pulse: PulseSnapshot, risks: RiskRadarResult): string {
        return `Organization is in ${pulse.phase} phase with a pulse score of ${pulse.pulseScore}/100. ${risks.signals.length > 0 ? `${risks.signals.length} risk signal${risks.signals.length > 1 ? 's' : ''} require attention.` : 'No critical risks detected.'} Current decision velocity is ${pulse.velocity} decisions per day.`;
    }

    /**
     * Generate actionable recommendations
     */
    private generateRecommendations(
        pulse: PulseSnapshot,
        dna: StrategicDNA,
        risks: RiskRadarResult
    ): string[] {
        const recommendations: string[] = [];

        // Risk-based recommendations
        for (const signal of risks.signals.slice(0, 2)) {
            if (signal.severity === 'critical' || signal.severity === 'high') {
                recommendations.push(signal.suggestedAction);
            }
        }

        // Pulse-based recommendations
        if (pulse.phase === 'churn') {
            recommendations.push('Prioritize alignment: schedule leadership sync to resolve conflicts before new initiatives');
        }

        if (pulse.coherenceScore < 50) {
            recommendations.push('Improve strategic coherence: document and communicate core decision criteria');
        }

        // DNA-based recommendations
        if (dna.decisionStyle < 30 && dna.riskAppetite > 60) {
            recommendations.push('Balance centralized decisions with delegation to support bold moves');
        }

        if (dna.conflictTolerance < 30) {
            recommendations.push('Create safe spaces for healthy debate to surface important disagreements');
        }

        return recommendations.slice(0, 4);
    }

    /**
     * Identify focus areas for today
     */
    private identifyFocusAreas(
        pulse: PulseSnapshot,
        risks: RiskRadarResult,
        recentDecisions: CMEDecision[]
    ): string[] {
        const areas: string[] = [];

        // From risks
        if (risks.signals.some(s => s.type === 'decision_decay')) {
            areas.push('Strategic decision review');
        }

        if (risks.signals.some(s => s.type === 'actor_overload')) {
            areas.push('Decision delegation');
        }

        // From pulse
        if (pulse.conflictMomentum > 0) {
            areas.push('Conflict resolution');
        }

        if (pulse.phase === 'pivot') {
            areas.push('Strategic clarity');
        }

        // From activity
        const criticalPending = recentDecisions.filter(d =>
            d.importance === 'critical' && d.sentiment === 'conflict'
        );
        if (criticalPending.length > 0) {
            areas.push('Critical decision follow-up');
        }

        // Default
        if (areas.length === 0) {
            areas.push('Maintain momentum', 'Monitor key metrics');
        }

        return areas.slice(0, 3);
    }

    /**
     * Store briefing to database
     */
    async storeBriefing(supabase: SupabaseClient, teamId: string, briefing: ExecutiveBriefing): Promise<void> {
        try {
            await supabase.from('proactive_insights').insert({
                team_id: teamId,
                category: 'briefing',
                severity: 'info',
                title: briefing.headline,
                description: briefing.executiveSummary,
                evidence: {
                    sections: briefing.sections,
                    metrics: briefing.metrics
                },
                suggested_action: briefing.recommendations[0] || null,
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hour expiry
            });
        } catch (err) {
            // Silent fail
        }
    }
}

export const executiveBriefingService = new ExecutiveBriefingService();
