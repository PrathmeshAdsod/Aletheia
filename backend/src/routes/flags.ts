/**
 * Flags Routes (Team-Scoped)
 * 
 * GET /api/teams/:teamId/flags - Get conflict flags for team
 * GET /api/teams/:teamId/metrics - Get consistency metrics for team
 */

import { Router, Request, Response } from 'express';
import { conflictDetectorService } from '../services/conflict-detector';
import { authenticateUser, requireTeamAccess } from '../middleware/auth';

const router = Router();

/**
 * GET /api/teams/:teamId/flags
 * Get all conflict flags for a team.
 */
router.get(
    '/teams/:teamId/flags',
    authenticateUser,
    requireTeamAccess('viewer'),
    async (req: Request, res: Response) => {
        try {
            const teamId = req.params.teamId as string;
            const flags = await conflictDetectorService.detectConflicts(teamId);

            return res.json({
                success: true,
                flags,
                count: flags.length
            });
        } catch (error) {
            console.error('Flags fetch error:', error);
            return res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : 'Failed to fetch flags'
            });
        }
    }
);

/**
 * GET /api/teams/:teamId/metrics
 * Get consistency score and metrics for a team.
 */
router.get(
    '/teams/:teamId/metrics',
    authenticateUser,
    requireTeamAccess('viewer'),
    async (req: Request, res: Response) => {
        try {
            const teamId = req.params.teamId as string;
            const metrics = await conflictDetectorService.calculateConsistencyScore(teamId);

            return res.json({
                success: true,
                ...metrics
            });
        } catch (error) {
            console.error('Metrics fetch error:', error);
            return res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : 'Failed to fetch metrics'
            });
        }
    }
);

export default router;
