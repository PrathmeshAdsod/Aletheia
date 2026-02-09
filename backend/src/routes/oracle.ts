/**
 * Oracle Routes (Team-Scoped)
 * 
 * POST /api/teams/:teamId/oracle/query - Ask questions about team decisions
 * 
 * CRITICAL: Retrieval-only responses with mandatory citations.
 * Prevents hallucination by only answering from verified decisions.
 */

import { Router, Request, Response } from 'express';
import { authenticateUser, requireTeamAccess } from '../middleware/auth';
import { geminiService } from '../services/gemini';
import { supabaseService } from '../services/supabase';

const router = Router();

/**
 * POST /api/teams/:teamId/oracle/query
 * Ask a question about team decisions.
 * Returns answer with citations OR "No verified decision found".
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

            if (!question || typeof question !== 'string') {
                return res.status(400).json({ error: 'Question is required' });
            }

            // Retrieve relevant decisions (team-scoped)
            const allDecisions = await supabaseService.getDecisions(teamId, 100, 0);

            // Filter decisions relevant to the question (basic keyword matching)
            // TODO: Implement proper vector similarity search
            const relevantDecisions = allDecisions.filter(d => {
                const text = `${d.decision} ${d.reasoning}`.toLowerCase();
                const keywords = question.toLowerCase().split(' ');
                return keywords.some(kw => text.includes(kw));
            });

            // Query Gemini with RAG pipeline
            const result = await geminiService.queryWithCitations(question, relevantDecisions);

            res.json(result);
        } catch (error) {
            console.error('Oracle query error:', error);
            res.status(500).json({
                error: error instanceof Error ? error.message : 'Query failed'
            });
        }
    }
);

export default router;
