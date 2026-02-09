/**
 * Strategic Intelligence Routes
 * API endpoints for Strategic Story and Accountability Engine
 */

import { Router, Request, Response } from 'express';
import { supabaseService } from '../services/supabase';
import { strategicStoryService } from '../services/strategic-story';
import { accountabilityEngineService } from '../services/accountability-engine';
import { authenticateUser, requireTeamAccess } from '../middleware/auth';

const router = Router();

/**
 * GET /api/teams/:teamId/story
 * Get strategic evolution story
 */
router.get(
    '/teams/:teamId/story',
    authenticateUser,
    requireTeamAccess,
    async (req: Request, res: Response): Promise<void> => {
        try {
            const { teamId } = req.params;
            const refresh = req.query.refresh === 'true';
            const supabase = supabaseService.client;

            // Try cache first
            if (!refresh) {
                const cached = await strategicStoryService.getLatestStory(supabase, teamId);
                if (cached) {
                    res.json({ success: true, story: cached, cached: true });
                    return;
                }
            }

            // Fetch decisions
            const { data: decisions, error } = await supabase
                .from('decisions')
                .select('*')
                .eq('team_id', teamId)
                .order('created_at', { ascending: true });

            if (error) {
                console.error('Error fetching decisions for story:', error);
                res.status(500).json({ error: 'Failed to fetch decisions' });
                return;
            }

            // Generate story
            const story = await strategicStoryService.generateStory(teamId, decisions || []);

            res.json({ success: true, story, cached: false });
        } catch (error) {
            console.error('Error generating strategic story:', error);
            res.status(500).json({ error: 'Failed to generate strategic story' });
        }
    }
);

/**
 * GET /api/teams/:teamId/accountability
 * Get accountability analysis
 */
router.get(
    '/teams/:teamId/accountability',
    authenticateUser,
    requireTeamAccess,
    async (req: Request, res: Response): Promise<void> => {
        try {
            const { teamId } = req.params;
            const supabase = supabaseService.client;

            // Fetch decisions
            const { data: decisions, error } = await supabase
                .from('decisions')
                .select('*')
                .eq('team_id', teamId)
                .order('created_at', { ascending: true });

            if (error) {
                console.error('Error fetching decisions for accountability:', error);
                res.status(500).json({ error: 'Failed to fetch decisions' });
                return;
            }

            // Run accountability analysis
            const analysis = await accountabilityEngineService.analyzeAccountability(decisions || []);

            // Store insights (async)
            accountabilityEngineService.storeInsights(supabase, teamId, analysis.insights).catch(console.error);

            res.json({
                success: true,
                ...analysis,
                analyzedAt: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error analyzing accountability:', error);
            res.status(500).json({ error: 'Failed to analyze accountability' });
        }
    }
);

/**
 * GET /api/teams/:teamId/memory-gaps
 * Get critical memory gaps (top accountability issues)
 */
router.get(
    '/teams/:teamId/memory-gaps',
    authenticateUser,
    requireTeamAccess,
    async (req: Request, res: Response): Promise<void> => {
        try {
            const { teamId } = req.params;
            const supabase = supabaseService.client;

            // Fetch decisions
            const { data: decisions, error } = await supabase
                .from('decisions')
                .select('*')
                .eq('team_id', teamId)
                .order('created_at', { ascending: true });

            if (error) {
                res.status(500).json({ error: 'Failed to fetch decisions' });
                return;
            }

            const analysis = await accountabilityEngineService.analyzeAccountability(decisions || []);
            
            // Return only critical and high severity
            const criticalGaps = analysis.insights.filter(i => 
                i.severity === 'critical' || i.severity === 'high'
            );

            res.json({
                success: true,
                gaps: criticalGaps,
                totalGaps: analysis.insights.length,
                accountabilityScore: analysis.overallAccountabilityScore
            });
        } catch (error) {
            console.error('Error fetching memory gaps:', error);
            res.status(500).json({ error: 'Failed to fetch memory gaps' });
        }
    }
);

export default router;
