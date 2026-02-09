/**
 * Strategic Evolution Story Engine
 * Generates cohesive narratives of organizational evolution
 */

import { GoogleGenAI } from '@google/genai';
import { SupabaseClient } from '@supabase/supabase-js';
import { supabaseService } from './supabase';

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

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

interface InflectionPoint {
    timestamp: string;
    type: 'pivot' | 'conflict_resolution' | 'strategic_shift' | 'crisis';
    description: string;
    impactScore: number;
    relatedDecisions: string[];
}

interface StrategicTheme {
    theme: string;
    firstSeen: string;
    lastSeen: string;
    strength: number;
    trajectory: 'emerging' | 'stable' | 'fading' | 'abandoned';
    keyDecisions: string[];
}

export interface StrategicStory {
    id: string;
    generatedAt: string;
    timespan: { start: string; end: string };
    
    // Core narrative
    executiveSummary: string;
    fullNarrative: string;
    
    // Structural elements
    chapters: StoryChapter[];
    inflectionPoints: InflectionPoint[];
    themes: StrategicTheme[];
    
    // Insights
    currentTrajectory: string;
    hiddenTensions: string[];
    emergingPatterns: string[];
    
    // Metadata
    decisionCount: number;
    conflictCount: number;
    resolutionRate: number;
}

interface StoryChapter {
    title: string;
    period: string;
    narrative: string;
    keyDecisions: Array<{ id: string; summary: string }>;
    sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
}

export class StrategicStoryService {
    
    /**
     * Generate complete strategic story for a team
     */
    async generateStory(teamId: string, decisions: Decision[]): Promise<StrategicStory> {
        if (decisions.length === 0) {
            return this.getEmptyStory(teamId);
        }

        // Sort chronologically
        const sorted = [...decisions].sort((a, b) => 
            new Date(a.timestamp || a.created_at).getTime() - 
            new Date(b.timestamp || b.created_at).getTime()
        );

        // Detect structural elements
        const inflectionPoints = this.detectInflectionPoints(sorted);
        const themes = this.extractThemes(sorted);
        const chapters = this.createChapters(sorted, inflectionPoints);

        // Generate AI narrative
        const { executiveSummary, fullNarrative, currentTrajectory, hiddenTensions, emergingPatterns } = 
            await this.generateNarrative(sorted, inflectionPoints, themes, chapters);

        // Calculate metrics
        const conflictCount = sorted.filter(d => d.sentiment === 'conflict' || d.sentiment === 'red-flag').length;
        const resolutionRate = this.calculateResolutionRate(sorted);

        const story: StrategicStory = {
            id: `story-${Date.now()}`,
            generatedAt: new Date().toISOString(),
            timespan: {
                start: sorted[0].timestamp || sorted[0].created_at,
                end: sorted[sorted.length - 1].timestamp || sorted[sorted.length - 1].created_at
            },
            executiveSummary,
            fullNarrative,
            chapters,
            inflectionPoints,
            themes,
            currentTrajectory,
            hiddenTensions,
            emergingPatterns,
            decisionCount: decisions.length,
            conflictCount,
            resolutionRate
        };

        // Store in database
        await this.storeStory(supabaseService.client, teamId, story);

        return story;
    }

    /**
     * Detect inflection points in decision timeline
     */
    private detectInflectionPoints(decisions: Decision[]): InflectionPoint[] {
        const points: InflectionPoint[] = [];
        
        // Detect strategic pivots (importance + sentiment shifts)
        for (let i = 5; i < decisions.length; i++) {
            const window = decisions.slice(i - 5, i + 1);
            const criticalCount = window.filter(d => d.importance === 'critical' || d.importance === 'strategic').length;
            
            if (criticalCount >= 3) {
                const conflictBefore = decisions.slice(Math.max(0, i - 10), i).filter(d => d.sentiment === 'conflict').length;
                const conflictAfter = decisions.slice(i, Math.min(decisions.length, i + 10)).filter(d => d.sentiment === 'conflict').length;
                
                if (conflictBefore > 2 && conflictAfter < 2) {
                    points.push({
                        timestamp: decisions[i].timestamp || decisions[i].created_at,
                        type: 'conflict_resolution',
                        description: `Major conflict resolution period led by ${decisions[i].actor}`,
                        impactScore: 0.8,
                        relatedDecisions: window.map(d => d.decision_id)
                    });
                } else if (criticalCount >= 4) {
                    points.push({
                        timestamp: decisions[i].timestamp || decisions[i].created_at,
                        type: 'strategic_shift',
                        description: `Strategic pivot: ${decisions[i].decision.substring(0, 60)}...`,
                        impactScore: 0.9,
                        relatedDecisions: window.map(d => d.decision_id)
                    });
                }
            }
        }

        return points.slice(0, 8); // Top 8 inflection points
    }

    /**
     * Extract strategic themes from decisions
     */
    private extractThemes(decisions: Decision[]): StrategicTheme[] {
        const themeMap = new Map<string, { decisions: Decision[], firstSeen: string, lastSeen: string }>();
        
        // Simple keyword-based theme extraction
        const themeKeywords = {
            'growth': ['grow', 'expand', 'scale', 'increase', 'launch'],
            'efficiency': ['optimize', 'streamline', 'reduce', 'automate', 'improve'],
            'innovation': ['new', 'innovative', 'experiment', 'pilot', 'transform'],
            'quality': ['quality', 'excellence', 'standard', 'improve', 'enhance'],
            'customer': ['customer', 'user', 'client', 'experience', 'satisfaction'],
            'team': ['hire', 'team', 'culture', 'people', 'talent'],
            'technology': ['tech', 'platform', 'system', 'infrastructure', 'tool'],
            'market': ['market', 'competitive', 'positioning', 'brand', 'sales']
        };

        decisions.forEach(d => {
            const text = `${d.decision} ${d.reasoning}`.toLowerCase();
            
            Object.entries(themeKeywords).forEach(([theme, keywords]) => {
                if (keywords.some(k => text.includes(k))) {
                    if (!themeMap.has(theme)) {
                        themeMap.set(theme, {
                            decisions: [],
                            firstSeen: d.timestamp || d.created_at,
                            lastSeen: d.timestamp || d.created_at
                        });
                    }
                    const entry = themeMap.get(theme)!;
                    entry.decisions.push(d);
                    entry.lastSeen = d.timestamp || d.created_at;
                }
            });
        });

        const themes: StrategicTheme[] = [];
        const now = Date.now();

        themeMap.forEach((data, theme) => {
            const daysSinceLastSeen = (now - new Date(data.lastSeen).getTime()) / (1000 * 60 * 60 * 24);
            const strength = data.decisions.length / decisions.length;
            
            let trajectory: 'emerging' | 'stable' | 'fading' | 'abandoned' = 'stable';
            if (daysSinceLastSeen > 60) trajectory = 'abandoned';
            else if (daysSinceLastSeen > 30) trajectory = 'fading';
            else if (data.decisions.length < 3) trajectory = 'emerging';

            themes.push({
                theme,
                firstSeen: data.firstSeen,
                lastSeen: data.lastSeen,
                strength,
                trajectory,
                keyDecisions: data.decisions.slice(0, 5).map(d => d.decision_id)
            });
        });

        return themes.sort((a, b) => b.strength - a.strength).slice(0, 10);
    }

    /**
     * Create narrative chapters
     */
    private createChapters(decisions: Decision[], inflectionPoints: InflectionPoint[]): StoryChapter[] {
        const chapters: StoryChapter[] = [];
        const chunkSize = Math.ceil(decisions.length / 4); // 4 chapters

        for (let i = 0; i < 4; i++) {
            const start = i * chunkSize;
            const end = Math.min((i + 1) * chunkSize, decisions.length);
            const chunk = decisions.slice(start, end);

            if (chunk.length === 0) continue;

            const conflicts = chunk.filter(d => d.sentiment === 'conflict').length;
            const aligned = chunk.filter(d => d.sentiment === 'aligned').length;
            
            let sentiment: 'positive' | 'negative' | 'neutral' | 'mixed' = 'neutral';
            if (aligned > conflicts * 2) sentiment = 'positive';
            else if (conflicts > aligned * 2) sentiment = 'negative';
            else if (conflicts > 0 && aligned > 0) sentiment = 'mixed';

            const startDate = new Date(chunk[0].timestamp || chunk[0].created_at);
            const endDate = new Date(chunk[chunk.length - 1].timestamp || chunk[chunk.length - 1].created_at);

            chapters.push({
                title: this.generateChapterTitle(i, chunk, inflectionPoints),
                period: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
                narrative: this.generateChapterNarrative(chunk),
                keyDecisions: chunk.filter(d => d.importance === 'critical' || d.importance === 'strategic')
                    .slice(0, 3)
                    .map(d => ({ id: d.decision_id, summary: d.decision.substring(0, 80) })),
                sentiment
            });
        }

        return chapters;
    }

    private generateChapterTitle(index: number, decisions: Decision[], inflectionPoints: InflectionPoint[]): string {
        const titles = ['Foundation', 'Growth', 'Transformation', 'Maturity'];
        const relevantPoint = inflectionPoints.find(p => {
            const pointTime = new Date(p.timestamp).getTime();
            const chapterStart = new Date(decisions[0].timestamp || decisions[0].created_at).getTime();
            const chapterEnd = new Date(decisions[decisions.length - 1].timestamp || decisions[decisions.length - 1].created_at).getTime();
            return pointTime >= chapterStart && pointTime <= chapterEnd;
        });

        if (relevantPoint) {
            if (relevantPoint.type === 'strategic_shift') return 'Strategic Pivot';
            if (relevantPoint.type === 'conflict_resolution') return 'Alignment Phase';
            if (relevantPoint.type === 'crisis') return 'Crisis Response';
        }

        return titles[index] || `Phase ${index + 1}`;
    }

    private generateChapterNarrative(decisions: Decision[]): string {
        const actors = [...new Set(decisions.map(d => d.actor))];
        const critical = decisions.filter(d => d.importance === 'critical').length;
        const conflicts = decisions.filter(d => d.sentiment === 'conflict').length;

        return `During this period, ${actors.length} key decision-maker${actors.length > 1 ? 's' : ''} made ${decisions.length} decisions, including ${critical} critical choices. ${conflicts > 0 ? `${conflicts} conflict${conflicts > 1 ? 's' : ''} emerged, requiring resolution.` : 'The team maintained strong alignment.'}`;
    }

    /**
     * Generate AI-powered narrative
     */
    private async generateNarrative(
        decisions: Decision[],
        inflectionPoints: InflectionPoint[],
        themes: StrategicTheme[],
        chapters: StoryChapter[]
    ): Promise<{
        executiveSummary: string;
        fullNarrative: string;
        currentTrajectory: string;
        hiddenTensions: string[];
        emergingPatterns: string[];
    }> {
        const prompt = `You are a strategic analyst writing an executive briefing on organizational evolution.

DECISION TIMELINE (${decisions.length} decisions):
${decisions.slice(0, 20).map(d => `- ${d.actor}: ${d.decision} (${d.importance}, ${d.sentiment})`).join('\n')}

INFLECTION POINTS:
${inflectionPoints.map(p => `- ${p.type}: ${p.description}`).join('\n')}

STRATEGIC THEMES:
${themes.map(t => `- ${t.theme} (${t.trajectory}, strength: ${Math.round(t.strength * 100)}%)`).join('\n')}

CHAPTERS:
${chapters.map(c => `${c.title} (${c.period}): ${c.sentiment}`).join('\n')}

Generate:
1. Executive Summary (2-3 sentences): High-level strategic evolution
2. Full Narrative (4-5 paragraphs): Cohesive story with temporal flow, conflicts, resolutions, and trajectory
3. Current Trajectory (1 sentence): Where the organization is headed
4. Hidden Tensions (2-3 items): Unresolved issues or contradictions
5. Emerging Patterns (2-3 items): New trends or shifts

Format as JSON:
{
  "executiveSummary": "...",
  "fullNarrative": "...",
  "currentTrajectory": "...",
  "hiddenTensions": ["...", "..."],
  "emergingPatterns": ["...", "..."]
}`;

        try {
            const response = await genAI.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt
            });

            let text = '';
            const responseAny = response as any;
            
            if (responseAny.response && typeof responseAny.response.text === 'function') {
                text = responseAny.response.text();
            } else if (typeof responseAny.text === 'string') {
                text = responseAny.text;
            } else if (responseAny.response?.candidates?.[0]?.content?.parts?.[0]?.text) {
                text = responseAny.response.candidates[0].content.parts[0].text;
            }

            const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleaned);

            return {
                executiveSummary: parsed.executiveSummary || this.getFallbackSummary(decisions),
                fullNarrative: parsed.fullNarrative || this.getFallbackNarrative(decisions, themes),
                currentTrajectory: parsed.currentTrajectory || 'Continued strategic evolution',
                hiddenTensions: parsed.hiddenTensions || [],
                emergingPatterns: parsed.emergingPatterns || []
            };
        } catch (error) {
            console.error('AI narrative generation failed:', error);
            return {
                executiveSummary: this.getFallbackSummary(decisions),
                fullNarrative: this.getFallbackNarrative(decisions, themes),
                currentTrajectory: 'Continued strategic evolution',
                hiddenTensions: [],
                emergingPatterns: []
            };
        }
    }

    private getFallbackSummary(decisions: Decision[]): string {
        return `Over ${decisions.length} decisions, the organization has evolved through multiple strategic phases, balancing growth initiatives with operational excellence.`;
    }

    private getFallbackNarrative(decisions: Decision[], themes: StrategicTheme[]): string {
        const topThemes = themes.slice(0, 3).map(t => t.theme).join(', ');
        return `The organization's strategic journey spans ${decisions.length} key decisions, with primary focus on ${topThemes}. The evolution shows a pattern of deliberate decision-making with periodic strategic shifts to adapt to changing conditions.`;
    }

    private calculateResolutionRate(decisions: Decision[]): number {
        const conflicts = decisions.filter(d => d.sentiment === 'conflict');
        if (conflicts.length === 0) return 100;

        // Simple heuristic: conflicts followed by aligned decisions
        let resolved = 0;
        conflicts.forEach((conflict, idx) => {
            const afterConflict = decisions.slice(idx + 1, idx + 6);
            if (afterConflict.some(d => d.sentiment === 'aligned')) {
                resolved++;
            }
        });

        return Math.round((resolved / conflicts.length) * 100);
    }

    private getEmptyStory(teamId: string): StrategicStory {
        return {
            id: `story-empty-${Date.now()}`,
            generatedAt: new Date().toISOString(),
            timespan: { start: new Date().toISOString(), end: new Date().toISOString() },
            executiveSummary: 'No decisions recorded yet. Upload documents to begin building your strategic story.',
            fullNarrative: 'Your organizational story will appear here once decisions are tracked.',
            chapters: [],
            inflectionPoints: [],
            themes: [],
            currentTrajectory: 'Getting started',
            hiddenTensions: [],
            emergingPatterns: [],
            decisionCount: 0,
            conflictCount: 0,
            resolutionRate: 100
        };
    }

    /**
     * Store story in database
     */
    async storeStory(supabase: SupabaseClient, teamId: string, story: StrategicStory): Promise<void> {
        try {
            await supabase.from('strategic_stories').insert({
                team_id: teamId,
                story_data: story,
                timespan_start: story.timespan.start,
                timespan_end: story.timespan.end,
                decision_count: story.decisionCount
            });
        } catch (err) {
            console.error('Failed to store strategic story:', err);
        }
    }

    /**
     * Get latest story for team
     */
    async getLatestStory(supabase: SupabaseClient, teamId: string): Promise<StrategicStory | null> {
        try {
            const { data, error } = await supabase
                .from('strategic_stories')
                .select('story_data')
                .eq('team_id', teamId)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (error || !data) return null;
            return data.story_data as StrategicStory;
        } catch {
            return null;
        }
    }
}

export const strategicStoryService = new StrategicStoryService();
