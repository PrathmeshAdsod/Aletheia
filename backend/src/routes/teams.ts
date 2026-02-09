/**
 * Team Management Routes
 * 
 * Handles organization and team CRUD operations.
 * All endpoints require authentication.
 * Some endpoints require specific roles (admin).
 */

import { Router, Request, Response } from 'express';
import { authenticateUser, requireTeamAccess } from '../middleware/auth';
import { supabaseService } from '../services/supabase';

const router = Router();

// ==========================================
// ORGANIZATION ROUTES
// ==========================================

/**
 * POST /api/organizations
 * Create a new organization.
 * User becomes the first admin of the organization.
 */
router.post('/organizations', authenticateUser, async (req: Request, res: Response) => {
    try {
        const { name, slug, plan = 'free' } = req.body;
        const userId = req.userId;

        if (!name || !slug) {
            return res.status(400).json({ error: 'Name and slug are required' });
        }

        // Create organization
        const organization = await supabaseService.createOrganization(name, slug, plan);

        res.status(201).json({
            success: true,
            organization
        });
    } catch (error) {
        console.error('Create organization error:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to create organization'
        });
    }
});

/**
 * POST /api/organizations/:orgId/teams
 * Create a new team within an organization.
 * Only organization members can create teams.
 */
router.post('/organizations/:orgId/teams', authenticateUser, async (req: Request, res: Response) => {
    try {
        const { orgId } = req.params;
        const { name, slug, description } = req.body;
        const userId = req.userId;

        if (!name || !slug) {
            return res.status(400).json({ error: 'Name and slug are required' });
        }

        // Create team
        const team = await supabaseService.createTeam(orgId, name, slug, description);

        // Add creator as admin
        await supabaseService.addTeamMember(team.id, userId!, 'admin');

        res.status(201).json({
            success: true,
            team
        });
    } catch (error) {
        console.error('Create team error:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to create team'
        });
    }
});

// ==========================================
// TEAM MEMBER ROUTES
// ==========================================

/**
 * GET /api/teams/:teamId/members
 * Get all members of a team.
 * Requires team membership.
 */
router.get('/teams/:teamId/members', authenticateUser, requireTeamAccess('viewer'), async (req: Request, res: Response) => {
    try {
        const teamId = req.teamId!;

        const members = await supabaseService.getTeamMembers(teamId);

        res.json({
            success: true,
            members
        });
    } catch (error) {
        console.error('Get team members error:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to fetch team members'
        });
    }
});

/**
 * POST /api/teams/:teamId/members
 * Add a member to a team.
 * Requires admin role.
 */
router.post('/teams/:teamId/members', authenticateUser, requireTeamAccess('admin'), async (req: Request, res: Response) => {
    try {
        const teamId = req.teamId!;
        const userId = req.userId!;
        const { user_id, role = 'member' } = req.body;

        if (!user_id) {
            return res.status(400).json({ error: 'user_id is required' });
        }

        if (!['admin', 'member', 'viewer'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }

        await supabaseService.addTeamMember(teamId, user_id, role, userId);

        res.status(201).json({
            success: true,
            message: 'Member added successfully'
        });
    } catch (error) {
        console.error('Add team member error:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to add team member'
        });
    }
});

/**
 * PUT /api/teams/:teamId/members/:userId/role
 * Update a team member's role.
 * Requires admin role.
 */
router.put('/teams/:teamId/members/:userId/role', authenticateUser, requireTeamAccess('admin'), async (req: Request, res: Response) => {
    try {
        const teamId = req.teamId!;
        const { userId } = req.params;
        const { role } = req.body;

        if (!role || !['admin', 'member', 'viewer'].includes(role)) {
            return res.status(400).json({ error: 'Valid role is required' });
        }

        await supabaseService.updateTeamMemberRole(teamId, userId, role);

        res.json({
            success: true,
            message: 'Role updated successfully'
        });
    } catch (error) {
        console.error('Update role error:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to update role'
        });
    }
});

/**
 * DELETE /api/teams/:teamId/members/:userId
 * Remove a member from a team.
 * Requires admin role.
 */
router.delete('/teams/:teamId/members/:userId', authenticateUser, requireTeamAccess('admin'), async (req: Request, res: Response) => {
    try {
        const teamId = req.teamId!;
        const { userId } = req.params;

        // Prevent removing yourself
        if (userId === req.userId) {
            return res.status(400).json({ error: 'Cannot remove yourself from the team' });
        }

        await supabaseService.removeTeamMember(teamId, userId);

        res.json({
            success: true,
            message: 'Member removed successfully'
        });
    } catch (error) {
        console.error('Remove member error:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to remove member'
        });
    }
});

// ==========================================
// USER ROUTES
// ==========================================

/**
 * GET /api/users/me/teams
 * Get all teams the current user is a member of.
 */
router.get('/users/me/teams', authenticateUser, async (req: Request, res: Response) => {
    try {
        const userId = req.userId!;

        const teams = await supabaseService.getUserTeams(userId);

        res.json({
            success: true,
            teams
        });
    } catch (error) {
        console.error('Get user teams error:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to fetch teams'
        });
    }
});

/**
 * GET /api/teams/:teamId
 * Get team details.
 * Requires team membership.
 */
router.get('/teams/:teamId', authenticateUser, requireTeamAccess('viewer'), async (req: Request, res: Response) => {
    try {
        const teamId = req.teamId!;

        const team = await supabaseService.getTeam(teamId);

        res.json({
            success: true,
            team
        });
    } catch (error) {
        console.error('Get team error:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to fetch team'
        });
    }
});

export default router;
