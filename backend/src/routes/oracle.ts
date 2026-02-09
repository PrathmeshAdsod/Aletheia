/**
 * Oracle Routes (Team-Scoped)
 * 
 * POST /api/teams/:teamId/oracle/query - Ask questions about team decisions
 * GET /api/teams/:teamId/oracle/history - Get query history
 * 
 * CRITICAL: Retrieval-only responses with mandatory citations.
 * Prevents hallucination by only answering from verified decisions.
 */

import { Router, Request, Response } from 'express';
import { authenticateUser, requireTeamAccess } from '../middleware/auth';
import { geminiService } from '../services/gemini';
import { supabaseService } from '../services/supabase';
import { chatRetriever } from '../services/chat-retriever';

const router = Router();

/**
 * POST /api/teams/:teamId/oracle/query
 * Ask a question about team decisions.
 * Returns answer with citations OR "No verified decision found".
 * Stores query in history for persistence.
 * Requires team membership (viewer or higher).
 */
router.post(
    '/teams/:teamId/oracle/query',
    authenticateUser,
    requireTeamAccess('viewer'),
    async (req: Request, res: Response) => {
        try {
            const { question } = req.body;
            const teamId = req.teamId!;
            const userId = req.userId!;

            if (!question || typeof question !== 'string') {
                return res.status(400).json({ error: 'Question is required' });
            }

            // Use smart retrieval instead of basic keyword matching
            const allDecisions = await supabaseService.getDecisions(teamId, 100, 0);
            const retrieval = chatRetriever.retrieve(question, allDecisions);

            // Query Gemini with RAG pipeline
            const result = await geminiService.queryWithCitations(question, retrieval.decisions);

            // Store query in history for persistence
            if ('answer' in result) {
                await storeOracleQuery(teamId, userId, question, result.answer, result.citations);
            }

            res.json({
                ...result,
                context: {
                    decisionsUsed: retrieval.decisions.length,
                    tokensUsed: retrieval.tokenCount
                }
            });
        } catch (error) {
            console.error('Oracle query error:', error);
            res.status(500).json({
                error: error instanceof Error ? error.message : 'Query failed'
            });
        }
    }
);

/**
 * GET /api/teams/:teamId/oracle/history
 * Get Oracle query history for the team.
 * Requires team membership (viewer or higher).
 */
router.get(
    '/teams/:teamId/oracle/history',
    authenticateUser,
    requireTeamAccess('viewer'),
    async (req: Request, res: Response) => {
        try {
            const teamId = req.teamId!;
            const limit = parseInt(req.query.limit as string || '20', 10);

            const { data, error } = await supabaseService.client
                .from('oracle_queries')
                .select('*')
                .eq('team_id', teamId)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) {
                console.error('Error fetching oracle history:', error);
                // Return empty array on error (table might not exist yet)
                return res.json({ success: true, queries: [] });
            }

            res.json({
                success: true,
                queries: data || []
            });
        } catch (error) {
            console.error('Oracle history error:', error);
            res.status(500).json({
                error: error instanceof Error ? error.message : 'Failed to get history'
            });
        }
    }
);

// Helper function to store Oracle query
async function storeOracleQuery(
    teamId: string,
    userId: string,
    question: string,
    answer: string,
    citations: string[]
): Promise<void> {
    try {
        await supabaseService.client
            .from('oracle_queries')
            .insert({
                team_id: teamId,
                user_id: userId,
                question,
                answer,
                citations
            });
    } catch (error) {
        // Log but don't throw - graceful degradation
        console.warn('Failed to store oracle query:', error);
    }
}

export default router;

