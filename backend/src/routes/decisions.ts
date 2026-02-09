/**
 * Decision & Graph Routes (Team-Scoped)
 * 
 * GET /api/teams/:teamId/decisions - Query all team decisions
 * GET /api/teams/:teamId/graph - Get graph data for visualization
 * GET /api/teams/:teamId/files - List uploaded files
 * GET /api/teams/:teamId/files/:hash/decisions - Get decisions from specific file
 */

import { Router, Request, Response } from 'express';
import { authenticateUser, requireTeamAccess } from '../middleware/auth';
import { supabaseService } from '../services/supabase';
import { neo4jService } from '../services/neo4j';

const router = Router();

/**
 * GET /api/teams/:teamId/decisions
 * Get all decisions with pagination.
 * Requires team membership.
 */
router.get(
    '/teams/:teamId/decisions',
    authenticateUser,
    requireTeamAccess('viewer'),
    async (req: Request, res: Response) => {
        try {
            const teamId = req.teamId!;
            const limit = parseInt(req.query.limit as string || '50', 10);
            const offset = parseInt(req.query.offset as string || '0', 10);

            const decisions = await supabaseService.getDecisions(teamId, limit, offset);

            res.json({
                decisions,
                count: decisions.length,
                limit,
                offset
            });
        } catch (error) {
            console.error('Decisions fetch error:', error);
            res.status(500).json({
                error: error instanceof Error ? error.message : 'Failed to fetch decisions'
            });
        }
    }
);

/**
 * GET /api/teams/:teamId/graph
 * Get complete graph for visualization (team-scoped).
 * Requires team membership.
 */
router.get(
    '/teams/:teamId/graph',
    authenticateUser,
    requireTeamAccess('viewer'),
    async (req: Request, res: Response) => {
        try {
            const teamId = req.teamId!;

            const graph = await neo4jService.getAllDecisions(teamId);

            res.json(graph);
        } catch (error) {
            console.error('Graph fetch error:', error);
            res.status(500).json({
                error: error instanceof Error ? error.message : 'Failed to fetch graph'
            });
        }
    }
);

/**
 * GET /api/teams/:teamId/files
 * List all uploaded files for the team.
 * Requires team membership.
 */
router.get(
    '/teams/:teamId/files',
    authenticateUser,
    requireTeamAccess('viewer'),
    async (req: Request, res: Response) => {
        try {
            const teamId = req.teamId!;

            const files = await supabaseService.getUploadedFiles(teamId);

            res.json({
                success: true,
                files
            });
        } catch (error) {
            console.error('Files fetch error:', error);
            res.status(500).json({
                error: error instanceof Error ? error.message : 'Failed to fetch files'
            });
        }
    }
);

/**
 * GET /api/teams/:teamId/files/:hash/decisions
 * Get all decisions from a specific file.
 * Requires team membership.
 */
router.get(
    '/teams/:teamId/files/:hash/decisions',
    authenticateUser,
    requireTeamAccess('viewer'),
    async (req: Request, res: Response) => {
        try {
            const teamId = req.teamId!;
            const { hash } = req.params;

            const decisions = await supabaseService.getDecisionsByFileHash(teamId, hash);

            res.json({
                success: true,
                decisions,
                count: decisions.length
            });
        } catch (error) {
            console.error('File decisions fetch error:', error);
            res.status(500).json({
                error: error instanceof Error ? error.message : 'Failed to fetch file decisions'
            });
        }
    }
);

/**
 * DELETE /api/teams/:teamId/files/:hash
 * Delete a file and all its decisions (Admin only).
 * Requires admin role.
 */
router.delete(
    '/teams/:teamId/files/:hash',
    authenticateUser,
    requireTeamAccess('admin'),
    async (req: Request, res: Response) => {
        try {
            const teamId = req.teamId!;
            const { hash } = req.params;

            // TODO: Implement deleteFile method in supabaseService
            // Should delete from decisions table and Neo4j

            res.json({
                success: true,
                message: 'File deletion not yet implemented'
            });
        } catch (error) {
            console.error('File delete error:', error);
            res.status(500).json({
                error: error instanceof Error ? error.message : 'Failed to delete file'
            });
        }
    }
);

export default router;
