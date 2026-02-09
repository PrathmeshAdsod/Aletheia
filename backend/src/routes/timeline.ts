/**
 * Timeline Routes (Team-Scoped)
 * 
 * GET /api/teams/:teamId/timeline - Get chronological timeline of all events
 */

import { Router, Request, Response } from 'express';
import { authenticateUser, requireTeamAccess } from '../middleware/auth';
import { supabaseService } from '../services/supabase';
import { conflictDetectorService } from '../services/conflict-detector';

const router = Router();

interface TimelineEvent {
    id: string;
    type: 'decision' | 'conflict' | 'resolution' | 'upload';
    title: string;
    description: string;
    timestamp: string;
    metadata?: {
        actor?: string;
        fileName?: string;
        fileHash?: string;
        decisionCount?: number;
        severity?: number;
        decisionId?: string;
        sentiment?: string;
        importance?: string;
    };
}

/**
 * GET /api/teams/:teamId/timeline
 * Get comprehensive timeline of all events for a team.
 * Combines: decisions, conflicts, uploads into unified chronological view.
 */
router.get(
    '/teams/:teamId/timeline',
    authenticateUser,
    requireTeamAccess('viewer'),
    async (req: Request, res: Response) => {
        try {
            const teamId = req.teamId!;
            const limit = parseInt(req.query.limit as string || '100', 10);

            const events: TimelineEvent[] = [];

            // 1. Get all decisions with file info
            const { data: decisions } = await supabaseService.client
                .from('decisions')
                .select('decision_id, full_json, file_hash, uploaded_at')
                .eq('team_id', teamId)
                .order('uploaded_at', { ascending: false })
                .limit(limit);

            if (decisions) {
                for (const dec of decisions) {
                    const json = dec.full_json || {};
                    events.push({
                        id: dec.decision_id,
                        type: 'decision',
                        title: 'Decision Extracted',
                        description: json.decision || 'Unnamed decision',
                        timestamp: dec.uploaded_at || new Date().toISOString(),
                        metadata: {
                            actor: json.actor || 'Unknown',
                            decisionId: dec.decision_id,
                            sentiment: json.sentiment,
                            importance: json.importance || 'medium',
                            fileHash: dec.file_hash,
                        }
                    });
                }
            }

            // 2. Get files (upload events)
            const { data: files } = await supabaseService.client
                .from('decisions')
                .select('file_hash, file_name, uploaded_at')
                .eq('team_id', teamId)
                .order('uploaded_at', { ascending: false });

            // Group by file_hash to create upload events
            if (files) {
                const fileGroups = new Map<string, { name: string; date: string; count: number }>();
                files.forEach(f => {
                    if (f.file_hash) {
                        if (!fileGroups.has(f.file_hash)) {
                            fileGroups.set(f.file_hash, {
                                name: f.file_name || 'Unknown file',
                                date: f.uploaded_at,
                                count: 0
                            });
                        }
                        const group = fileGroups.get(f.file_hash)!;
                        group.count++;
                    }
                });

                for (const [hash, info] of fileGroups) {
                    events.push({
                        id: `upload-${hash}`,
                        type: 'upload',
                        title: 'Document Uploaded',
                        description: `${info.name} processed successfully`,
                        timestamp: info.date,
                        metadata: {
                            fileName: info.name,
                            fileHash: hash,
                            decisionCount: info.count,
                        }
                    });
                }
            }

            // 3. Get conflicts (from Neo4j via conflict-detector)
            const conflicts = await conflictDetectorService.detectConflicts(teamId);
            for (const conflict of conflicts) {
                events.push({
                    id: conflict.flag_id,
                    type: 'conflict',
                    title: 'Conflict Detected',
                    description: `${conflict.decision_a.substring(0, 60)}${conflict.decision_a.length > 60 ? '...' : ''}`,
                    timestamp: conflict.detected_at,
                    metadata: {
                        severity: conflict.severity,
                    }
                });
            }

            // Sort all events by timestamp (newest first)
            events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

            // Limit results
            const limitedEvents = events.slice(0, limit);

            res.json({
                success: true,
                events: limitedEvents,
                count: limitedEvents.length,
                total: events.length,
            });
        } catch (error) {
            console.error('Timeline fetch error:', error);
            res.status(500).json({
                error: error instanceof Error ? error.message : 'Failed to fetch timeline'
            });
        }
    }
);

export default router;
