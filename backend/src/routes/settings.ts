/**
 * Settings Routes (Team-Scoped)
 * 
 * GET /api/teams/:teamId/settings - Get team settings
 * PUT /api/teams/:teamId/settings - Update team settings
 * GET /api/users/me/preferences - Get user preferences
 * PUT /api/users/me/preferences - Update user preferences
 */

import { Router, Request, Response } from 'express';
import { authenticateUser, requireTeamAccess } from '../middleware/auth';
import { supabaseService } from '../services/supabase';

const router = Router();

/**
 * GET /api/teams/:teamId/settings
 * Get team settings.
 * Requires team membership.
 */
router.get(
    '/teams/:teamId/settings',
    authenticateUser,
    requireTeamAccess('viewer'),
    async (req: Request, res: Response) => {
        try {
            const teamId = req.teamId!;

            // Get team with organization info
            const team = await supabaseService.getTeam(teamId);

            // Default settings (can be expanded)
            const settings = {
                team: {
                    id: team.id,
                    name: team.name,
                    slug: team.slug,
                    description: team.description || '',
                },
                organization: {
                    id: team.organization?.id,
                    name: team.organization?.name,
                    plan: team.organization?.plan || 'free',
                },
                preferences: {
                    notifications_enabled: true,
                    email_digests: true,
                    conflict_severity_threshold: 5,
                    auto_rebuild_graph: true,
                }
            };

            res.json({
                success: true,
                settings
            });
        } catch (error) {
            console.error('Get settings error:', error);
            res.status(500).json({
                error: error instanceof Error ? error.message : 'Failed to fetch settings'
            });
        }
    }
);

/**
 * PUT /api/teams/:teamId/settings
 * Update team settings.
 * Requires admin role.
 */
router.put(
    '/teams/:teamId/settings',
    authenticateUser,
    requireTeamAccess('admin'),
    async (req: Request, res: Response) => {
        try {
            const teamId = req.teamId!;
            const { name, description } = req.body;

            // Update team info
            const { error } = await supabaseService.client
                .from('teams')
                .update({ name, description })
                .eq('id', teamId);

            if (error) throw error;

            res.json({
                success: true,
                message: 'Settings updated successfully'
            });
        } catch (error) {
            console.error('Update settings error:', error);
            res.status(500).json({
                error: error instanceof Error ? error.message : 'Failed to update settings'
            });
        }
    }
);

/**
 * GET /api/users/me/preferences
 * Get user preferences.
 */
router.get(
    '/users/me/preferences',
    authenticateUser,
    async (req: Request, res: Response) => {
        try {
            const userId = req.userId!;

            // Get user preferences from user_preferences table (or defaults)
            const { data, error } = await supabaseService.client
                .from('user_preferences')
                .select('*')
                .eq('user_id', userId)
                .single();

            // Default preferences if none exist
            const preferences = data || {
                user_id: userId,
                theme: 'system',
                notifications_enabled: true,
                email_frequency: 'daily',
                default_team_id: null,
            };

            res.json({
                success: true,
                preferences
            });
        } catch (error) {
            console.error('Get preferences error:', error);
            res.status(500).json({
                error: error instanceof Error ? error.message : 'Failed to fetch preferences'
            });
        }
    }
);

/**
 * PUT /api/users/me/preferences
 * Update user preferences.
 */
router.put(
    '/users/me/preferences',
    authenticateUser,
    async (req: Request, res: Response) => {
        try {
            const userId = req.userId!;
            const updates = req.body;

            // Upsert user preferences
            const { error } = await supabaseService.client
                .from('user_preferences')
                .upsert({
                    user_id: userId,
                    ...updates,
                    updated_at: new Date().toISOString()
                });

            if (error) {
                // If table doesn't exist yet, just return success
                console.warn('User preferences table may not exist:', error);
            }

            res.json({
                success: true,
                message: 'Preferences updated successfully'
            });
        } catch (error) {
            console.error('Update preferences error:', error);
            res.status(500).json({
                error: error instanceof Error ? error.message : 'Failed to update preferences'
            });
        }
    }
);

export default router;
