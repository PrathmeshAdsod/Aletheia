/**
 * Chat Retriever Service
 * 
 * Smart context retrieval for Team AI Chat with:
 * - TF-IDF scoring for relevance ranking
 * - Token budgeting to stay within limits
 * - Importance weighting (critical > strategic > medium > low)
 * - Recency boost for newer decisions
 * 
 * Designed for production efficiency - no external ML dependencies
 */

import { CMEDecision } from '../types/cme';

// Token budget constants
const MAX_CONTEXT_TOKENS = 2000;
const TOKENS_PER_CHAR = 0.25; // Approximate: 4 chars per token

interface RetrievalResult {
    decisions: CMEDecision[];
    tokenCount: number;
    scores: Map<string, number>;
}

interface ScoredDecision {
    decision: CMEDecision;
    score: number;
    tokenEstimate: number;
}

/**
 * Simple TF-IDF implementation for decision ranking
 */
class TFIDFScorer {
    private idfCache: Map<string, number> = new Map();
    private documents: string[] = [];

    /**
     * Build IDF index from decision corpus
     */
    buildIndex(decisions: CMEDecision[]): void {
        this.documents = decisions.map(d =>
            `${d.decision} ${d.reasoning} ${d.actor}`.toLowerCase()
        );

        // Calculate IDF for all unique terms
        const termDocCounts = new Map<string, number>();
        const allTerms = new Set<string>();

        for (const doc of this.documents) {
            const terms = this.tokenize(doc);
            const uniqueTerms = new Set(terms);
            uniqueTerms.forEach(term => {
                allTerms.add(term);
                termDocCounts.set(term, (termDocCounts.get(term) || 0) + 1);
            });
        }

        // IDF = log(N / df) where N is total docs, df is doc frequency
        const N = this.documents.length;
        allTerms.forEach(term => {
            const df = termDocCounts.get(term) || 1;
            this.idfCache.set(term, Math.log(N / df) + 1); // +1 smoothing
        });
    }

    /**
     * Score a query against a decision
     */
    score(query: string, decisionText: string): number {
        const queryTerms = this.tokenize(query.toLowerCase());
        const docTerms = this.tokenize(decisionText.toLowerCase());

        if (queryTerms.length === 0 || docTerms.length === 0) return 0;

        // Calculate TF-IDF score
        let score = 0;
        const docTermFreq = new Map<string, number>();
        docTerms.forEach(term => {
            docTermFreq.set(term, (docTermFreq.get(term) || 0) + 1);
        });

        for (const term of queryTerms) {
            const tf = (docTermFreq.get(term) || 0) / docTerms.length;
            const idf = this.idfCache.get(term) || 1;
            score += tf * idf;
        }

        // Normalize by query length
        return score / queryTerms.length;
    }

    /**
     * Simple tokenizer - splits on non-alphanumeric, removes stopwords
     */
    private tokenize(text: string): string[] {
        const stopwords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
            'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
            'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought',
            'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as',
            'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between',
            'and', 'but', 'or', 'nor', 'so', 'yet', 'both', 'either', 'neither', 'not',
            'only', 'own', 'same', 'than', 'too', 'very', 'just', 'also', 'now', 'here',
            'there', 'when', 'where', 'why', 'how', 'all', 'each', 'every', 'both',
            'few', 'more', 'most', 'other', 'some', 'such', 'no', 'any', 'this', 'that']);

        return text
            .split(/[^a-zA-Z0-9]+/)
            .filter(term => term.length > 2 && !stopwords.has(term));
    }
}

/**
 * Chat Retriever - main service class
 */
class ChatRetrieverService {
    private tfidf = new TFIDFScorer();

    /**
     * Retrieve relevant decisions for a query within token budget
     */
    retrieve(query: string, decisions: CMEDecision[], maxTokens = MAX_CONTEXT_TOKENS): RetrievalResult {
        if (decisions.length === 0) {
            return { decisions: [], tokenCount: 0, scores: new Map() };
        }

        // Build TF-IDF index
        this.tfidf.buildIndex(decisions);

        // Score each decision
        const scored: ScoredDecision[] = decisions.map(decision => {
            const text = `${decision.decision} ${decision.reasoning} ${decision.actor}`;

            // Base TF-IDF score
            let score = this.tfidf.score(query, text);

            // Apply importance multiplier
            score *= this.getImportanceMultiplier(decision.importance);

            // Apply recency boost (decay for older decisions)
            score *= this.getRecencyMultiplier(decision.timestamp);

            // Estimate tokens for this decision
            const tokenEstimate = this.estimateTokens(decision);

            return { decision, score, tokenEstimate };
        });

        // Sort by score descending
        scored.sort((a, b) => b.score - a.score);

        // Select decisions within token budget
        const selected: CMEDecision[] = [];
        const scores = new Map<string, number>();
        let totalTokens = 0;

        for (const item of scored) {
            // Skip zero-score items
            if (item.score <= 0) continue;

            // Check if adding this would exceed budget
            if (totalTokens + item.tokenEstimate > maxTokens) {
                // If we have at least 3 decisions, stop; otherwise keep trying
                if (selected.length >= 3) break;
                continue;
            }

            selected.push(item.decision);
            scores.set(item.decision.decision_id, item.score);
            totalTokens += item.tokenEstimate;

            // Cap at 10 decisions max
            if (selected.length >= 10) break;
        }

        return { decisions: selected, tokenCount: totalTokens, scores };
    }

    /**
     * Format decisions into compact context string
     */
    formatContext(decisions: CMEDecision[]): string {
        if (decisions.length === 0) {
            return 'No relevant decisions found in the team\'s knowledge base.';
        }

        return decisions.map((d, i) => {
            const date = d.timestamp ? new Date(d.timestamp).toLocaleDateString() : 'Unknown';
            return `[${i + 1}] "${d.decision}" - by ${d.actor} (${date})
   Reasoning: ${d.reasoning?.substring(0, 150) || 'N/A'}${d.reasoning && d.reasoning.length > 150 ? '...' : ''}
   Source: ${d.source_ref || 'Unknown'}`;
        }).join('\n\n');
    }

    /**
     * Importance multiplier for scoring
     */
    private getImportanceMultiplier(importance?: string): number {
        switch (importance) {
            case 'critical': return 2.0;
            case 'strategic': return 1.5;
            case 'medium': return 1.0;
            case 'low': return 0.7;
            default: return 1.0;
        }
    }

    /**
     * Recency multiplier - newer decisions get higher weight
     */
    private getRecencyMultiplier(timestamp?: string): number {
        if (!timestamp) return 0.8;

        const decisionDate = new Date(timestamp);
        const now = new Date();
        const monthsAgo = (now.getTime() - decisionDate.getTime()) / (1000 * 60 * 60 * 24 * 30);

        // Decay: 1.0 for recent, 0.6 for 12+ months old
        if (monthsAgo < 1) return 1.0;
        if (monthsAgo < 3) return 0.95;
        if (monthsAgo < 6) return 0.85;
        if (monthsAgo < 12) return 0.75;
        return 0.6;
    }

    /**
     * Estimate token count for a decision
     */
    private estimateTokens(decision: CMEDecision): number {
        const text = `${decision.decision} ${decision.reasoning} ${decision.actor} ${decision.source_ref}`;
        return Math.ceil(text.length * TOKENS_PER_CHAR);
    }
}

export const chatRetriever = new ChatRetrieverService();
