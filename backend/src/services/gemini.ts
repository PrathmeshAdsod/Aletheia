/**
 * Google Gemini 3 Service
 *
 * Models used:
 * - gemini-3-flash : fast + cheap initial cluster extraction
 * - gemini-3-pro   : structured CME decision extraction + Oracle RAG
 *
 * IMPORTANT:
 * - All secrets MUST come from .env
 * - This file is safe to commit
 */

import { GoogleGenAI } from '@google/genai';
import crypto from 'crypto';

import { config } from '../config/env';
import { CMEDecision, SourceType } from '../types/cme';

class GeminiService {
    private ai: GoogleGenAI;

    constructor() {
        this.ai = new GoogleGenAI({
            apiKey: config.GEMINI_API_KEY
        });
    }

    // --------------------------------------------------
    // Internal helper: safely extract text from SDK response
    // --------------------------------------------------
    private extractText(response: any): string {
        if (!response) return '';

        // SDK variants differ — try all known shapes
        if (typeof response.text === 'string') return response.text;
        if (typeof response.outputText === 'string') return response.outputText;

        if (Array.isArray(response.candidates)) {
            const content = response.candidates[0]?.content;
            if (typeof content === 'string') return content;
            if (Array.isArray(content?.parts)) {
                return content.parts.map((p: any) => p.text || '').join('');
            }
        }

        // Last resort
        return JSON.stringify(response);
    }

    // --------------------------------------------------
    // Phase 1: Fast cluster extraction (Gemini 3 Flash)
    // --------------------------------------------------
    async extractClusters(text: string): Promise<string[]> {
        const prompt = `
Analyze the following text and extract ONLY decision clusters.

A decision cluster is where someone:
- makes a choice
- commits to an approach
- approves / rejects something
- blocks or enables another decision

Text:
${text}

RULES:
- Return ONLY raw text segments
- One cluster per line
- No explanations
`;

        const response = await this.ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt
        });

        const rawText = this.extractText(response);

        return rawText
            .split('\n')
            .map(line => line.trim())
            .filter(Boolean);
    }

    // --------------------------------------------------
    // Phase 2: Structured CME extraction (Gemini 3 Pro)
    // --------------------------------------------------

    /**
     * Simple importance extraction heuristics
     * AI suggests importance based on keywords
     */
    private extractImportance(decision: string, reasoning: string): 'low' | 'medium' | 'strategic' | 'critical' {
        const text = `${decision} ${reasoning}`.toLowerCase();

        // Critical indicators
        const criticalKeywords = ['critical', 'must', 'mandatory', 'blocker', 'blocking', 'urgent', 'immediately', 'essential', 'non-negotiable'];
        if (criticalKeywords.some(k => text.includes(k))) return 'critical';

        // Strategic indicators
        const strategicKeywords = ['strategy', 'strategic', 'architecture', 'long-term', 'long term', 'vision', 'roadmap', 'foundation', 'core', 'fundamental'];
        if (strategicKeywords.some(k => text.includes(k))) return 'strategic';

        // Low priority indicators
        const lowKeywords = ['minor', 'optional', 'nice to have', 'could', 'might', 'consider', 'maybe', 'low priority'];
        if (lowKeywords.some(k => text.includes(k))) return 'low';

        // Default
        return 'medium';
    }

    async extractDecisions(
        clusters: string[],
        sourceType: SourceType,
        sourceRef: string
    ): Promise<CMEDecision[]> {
        const prompt = `
You are a STRICT decision extraction engine.

OUTPUT FORMAT:
Return ONLY valid JSON.
NO markdown.
NO explanations.

JSON ARRAY SCHEMA:
[
  {
    "actor": "person_or_team",
    "decision": "what was decided",
    "reasoning": "why",
    "constraints": ["constraint1", "constraint2"],
    "sentiment": "RED | GREEN | NEUTRAL",
    "precedents": []
  }
]

SENTIMENT RULES:
- RED     → conflict / contradiction / blocking
- GREEN   → alignment / approval / enabling
- NEUTRAL → independent decision

Clusters:
${clusters.map((c, i) => `${i + 1}. ${c}`).join('\n')}
`;

        const response = await this.ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt
        });

        let rawText = this.extractText(response)
            .replace(/```json/gi, '')
            .replace(/```/g, '')
            .trim();

        try {
            const parsed = JSON.parse(rawText);

            if (!Array.isArray(parsed)) {
                throw new Error('Gemini response is not an array');
            }

            return parsed.map((d: any) => {
                const decisionId = crypto
                    .createHash('sha256')
                    .update(`${d.actor}:${d.decision}:${sourceRef}`)
                    .digest('hex');

                // AI-suggest importance
                const aiImportance = this.extractImportance(d.decision || '', d.reasoning || '');

                return {
                    decision_id: decisionId,
                    schema_version: 'v1',
                    source_type: sourceType,
                    source_ref: sourceRef,
                    actor: d.actor || 'unknown',
                    decision: d.decision || '',
                    reasoning: d.reasoning || '',
                    constraints: d.constraints || [],
                    sentiment: d.sentiment || 'NEUTRAL',
                    precedents: d.precedents || [],
                    timestamp: new Date().toISOString(),
                    // Tier 1: AI-suggested importance
                    importance: aiImportance,
                    importance_source: 'ai' as const,
                } as CMEDecision;
            });
        } catch (error) {
            console.error('❌ Gemini Pro JSON parse failed');
            console.error('Raw response:', rawText);
            console.error(error);
            return [];
        }
    }

    // --------------------------------------------------
    // Full ingestion pipeline
    // --------------------------------------------------
    async processDocument(
        text: string,
        sourceType: SourceType,
        sourceRef: string
    ): Promise<CMEDecision[]> {
        console.log('🔍 Gemini 3 Flash → extracting clusters');
        const clusters = await this.extractClusters(text);

        if (clusters.length === 0) {
            console.warn('⚠️ No decision clusters found');
            return [];
        }

        console.log(`📦 ${clusters.length} clusters found`);
        console.log('🧠 Gemini 3 Pro → structuring decisions');

        const decisions = await this.extractDecisions(
            clusters,
            sourceType,
            sourceRef
        );

        console.log(`✅ ${decisions.length} decisions extracted`);
        return decisions;
    }

    // --------------------------------------------------
    // Oracle: Retrieval-only RAG (NO hallucination)
    // --------------------------------------------------
    async queryWithCitations(
        question: string,
        relevantDecisions: CMEDecision[]
    ): Promise<{ answer: string; citations: string[] } | { error: string }> {
        if (relevantDecisions.length === 0) {
            return { error: 'No verified decision found' };
        }

        const context = relevantDecisions
            .map(
                d =>
                    `[${d.decision_id.slice(0, 8)}] ${d.decision} (by ${d.actor}, reasoning: ${d.reasoning})`
            )
            .join('\n');

        const prompt = `
You are Aletheia Oracle.

CRITICAL RULES:
1. You may ONLY answer using the decisions below
2. Every statement MUST cite a decision ID
3. If the answer is not found → reply exactly: "No verified decision found"

Question:
${question}

Decisions:
${context}

Answer format:
"According to decision [abc12345], ..."
`;

        const response = await this.ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt
        });

        const answer = this.extractText(response);

        return {
            answer,
            citations: relevantDecisions.map(d => d.decision_id)
        };
    }

    // --------------------------------------------------
    // Team AI Chat: Conversational with context
    // --------------------------------------------------
    async chat(
        message: string,
        context: string,
        conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
    ): Promise<{ response: string; sources: string[] }> {
        // Build conversation history (limit to last 5 exchanges for token efficiency)
        const recentHistory = conversationHistory.slice(-10);
        const historyText = recentHistory
            .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
            .join('\n');

        const systemPrompt = `You are Aletheia, an AI assistant for team decision management.

CONTEXT FROM TEAM'S KNOWLEDGE BASE:
${context || 'No specific decisions found relevant to this query.'}

CONVERSATION HISTORY:
${historyText || 'This is the start of the conversation.'}

GUIDELINES:
1. Be helpful, conversational, and professional
2. When referencing team decisions, cite them clearly with [#] notation
3. If asked about topics not in the context, you may provide general guidance but clarify it's not from the team's documented decisions
4. Keep responses concise but thorough
5. If you don't know something, say so honestly

User's message: ${message}

Respond naturally while incorporating relevant context from the team's decisions when applicable:`;

        const response = await this.ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: systemPrompt
        });

        const responseText = this.extractText(response);

        // Extract source references from context (decision numbers mentioned)
        const sourceMatches = responseText.match(/\[#?\d+\]/g) || [];
        const sources = [...new Set(sourceMatches.map(s => s.replace(/\[#?|\]/g, '')))];

        return {
            response: responseText,
            sources
        };
    }
}

// --------------------------------------------------
// Singleton export
// --------------------------------------------------
export const geminiService = new GeminiService();
