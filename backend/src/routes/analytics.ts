/**
 * Analytics Routes
 * 
 * Tier 1: Health scores and metrics API
 */

import { Router, Request, Response } from 'express';
import { authenticateUser, requireTeamAccess } from '../middleware/auth';
import { analyticsService } from '../services/analytics';

const router = Router();

/**
 * GET /api/teams/:teamId/health
 * Get team health scores and history
 */
router.get('/teams/:teamId/health', authenticateUser, requireTeamAccess('viewer'), async (req: Request, res: Response) => {
    try {
        const teamId = req.teamId!;
        const metrics = await analyticsService.getTeamMetrics(teamId);

        res.json({
            success: true,
            scores: metrics.scores,
            history: metrics.history,
            stats: {
                decisionCount: metrics.decisionCount,
                conflictCount: metrics.conflictCount,
            }
        });
    } catch (error) {
        console.error('Get health scores error:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to calculate health scores'
        });
    }
});

/**
 * POST /api/teams/:teamId/health/snapshot
 * Manually trigger a score snapshot (also called by scheduled job)
 */
router.post('/teams/:teamId/health/snapshot', authenticateUser, requireTeamAccess('admin'), async (req: Request, res: Response) => {
    try {
        const teamId = req.teamId!;
        await analyticsService.storeScoreSnapshot(teamId);

        res.json({
            success: true,
            message: 'Score snapshot stored'
        });
    } catch (error) {
        console.error('Store snapshot error:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to store snapshot'
        });
    }
});

/**
 * GET /api/teams/:teamId/health/history
 * Get score history for trend charts
 */
router.get('/teams/:teamId/health/history', authenticateUser, requireTeamAccess('viewer'), async (req: Request, res: Response) => {
    try {
        const teamId = req.teamId!;
        const days = parseInt(req.query.days as string) || 30;
        const history = await analyticsService.getScoreHistory(teamId, days);

        res.json({
            success: true,
            history
        });
    } catch (error) {
        console.error('Get score history error:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to fetch score history'
        });
    }
});

export default router;
