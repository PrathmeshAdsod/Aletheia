/**
 * Authentication & Authorization Middleware
 * 
 * Implements Supabase Auth integration with team-scoped access control.
 * 
 * Middleware chain:
 * 1. authenticateUser - Verifies JWT, extracts user_id
 * 2. requireTeamAccess - Checks team membership
 * 3. requireRole - Enforces role-based permissions
 */

import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { config } from '../config/env';

// Extend Express Request to include auth fields
declare global {
    namespace Express {
        interface Request {
            userId?: string;
            teamId?: string;
            organizationId?: string;
            userRole?: 'admin' | 'member' | 'viewer';
        }
    }
}

const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_KEY);

/**
 * Middleware 1: Authenticate user via Supabase Auth
 * Verifies JWT and extracts user_id from auth.users
 */
export async function authenticateUser(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        // Extract token from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('❌ [Auth] No token provided');
            res.status(401).json({ error: 'No authentication token provided' });
            return;
        }

        const token = authHeader.split(' ')[1];

        // Verify token with Supabase Auth
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            res.status(401).json({ error: 'Invalid or expired token' });
            return;
        }

        // Attach user_id to request
        req.userId = user.id;
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(401).json({ error: 'Authentication failed' });
    }
}

/**
 * Middleware 2: Require team access
 * Checks if user is a member of the specified team
 * Optionally enforces minimum role level
 */
export function requireTeamAccess(minRole?: 'admin' | 'member' | 'viewer') {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const teamIdParam = req.params.teamId;
            const teamId = Array.isArray(teamIdParam) ? teamIdParam[0] : teamIdParam;
            const userId = req.userId;

            if (!userId) {
                res.status(401).json({ error: 'User not authenticated' });
                return;
            }

            if (!teamId) {
                console.log('❌ [Auth] Team ID missing in request params');
                res.status(400).json({ error: 'Team ID required' });
                return;
            }

            console.log(`🔐 [Auth] Checking access for user ${userId} to team ${teamId}`);

            // Check team membership
            const { data: membership, error } = await supabase
                .from('team_members')
                .select('role, team:teams(organization_id)')
                .eq('team_id', teamId)
                .eq('user_id', userId)
                .single();

            if (error || !membership) {
                res.status(403).json({ error: 'Access denied: Not a member of this team' });
                return;
            }

            // Check role if minimum role specified
            if (minRole && !hasMinRole(membership.role as string, minRole)) {
                res.status(403).json({
                    error: `Access denied: Requires ${minRole} role or higher`
                });
                return;
            }

            // Attach team context to request
            req.teamId = teamId;
            req.userRole = membership.role as 'admin' | 'member' | 'viewer';
            req.organizationId = (membership.team as any).organization_id;

            next();
        } catch (error) {
            console.error('Team access check error:', error);
            res.status(500).json({ error: 'Authorization check failed' });
        }
    };
}

/**
 * Helper: Check if user has minimum required role
 * Role hierarchy: admin > member > viewer
 */
function hasMinRole(userRole: string, requiredRole: string): boolean {
    const roleHierarchy: Record<string, number> = {
        admin: 3,
        member: 2,
        viewer: 1
    };

    const userLevel = roleHierarchy[userRole] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 0;

    return userLevel >= requiredLevel;
}

/**
 * Middleware 3: Require specific role (strict)
 * Use requireTeamAccess(minRole) for most cases instead
 */
export function requireRole(...allowedRoles: ('admin' | 'member' | 'viewer')[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
        const userRole = req.userRole;

        if (!userRole || !allowedRoles.includes(userRole)) {
            res.status(403).json({
                error: `Access denied: Requires one of ${allowedRoles.join(', ')} roles`
            });
            return;
        }

        next();
    };
}

/**
 * Optional: Skip auth for development/testing
 * REMOVE IN PRODUCTION
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
    if (config.NODE_ENV === 'development' && req.headers['x-skip-auth'] === 'true') {
        // For testing: allow requests with demo user
        req.userId = 'demo-user-id';
        console.warn('⚠️  AUTH SKIPPED - Development mode only');
    }
    next();
}
