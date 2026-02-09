/**
 * Insights Routes (Team-Scoped)
 * 
 * GET /api/teams/:teamId/insights - Get proactive insights for the team
 * GET /api/teams/:teamId/insights/summary - Get AI-generated summary
 * 
 * Proactive intelligence that helps teams stay ahead
 */

import { Router, Request, Response } from 'express';
import { authenticateUser, requireTeamAccess } from '../middleware/auth';
import { supabaseService } from '../services/supabase';
import { insightsService } from '../services/insights';

const router = Router();

/**
 * GET /api/teams/:teamId/insights
 * Get proactive insights for the team.
 * Includes conflict warnings, action items, stale decisions.
 */
router.get(
    '/teams/:teamId/insights',
    authenticateUser,
    requireTeamAccess('viewer'),
    async (req: Request, res: Response) => {
        try {
            const teamId = req.teamId!;

            // Get all decisions for analysis
            const decisions = await supabaseService.getDecisions(teamId, 100, 0);

            // Generate proactive insights
            const insights = await insightsService.generateInsights(decisions);

            res.json({
                success: true,
                insights,
                generated_at: new Date().toISOString(),
                decision_count: decisions.length
            });
        } catch (error) {
            console.error('Insights error:', error);
            res.status(500).json({
                error: error instanceof Error ? error.message : 'Failed to generate insights'
            });
        }
    }
);

/**
 * GET /api/teams/:teamId/insights/summary
 * Get AI-generated summary and recommendations.
 */
router.get(
    '/teams/:teamId/insights/summary',
    authenticateUser,
    requireTeamAccess('viewer'),
    async (req: Request, res: Response) => {
        try {
            const teamId = req.teamId!;

            // Get decisions for analysis
            const decisions = await supabaseService.getDecisions(teamId, 50, 0);

            // Generate AI summary
            const summary = await insightsService.getAISummary(teamId, decisions);

            res.json({
                success: true,
                ...summary,
                generated_at: new Date().toISOString()
            });
        } catch (error) {
            console.error('Summary error:', error);
            res.status(500).json({
                error: error instanceof Error ? error.message : 'Failed to generate summary'
            });
        }
    }
);

export default router;
