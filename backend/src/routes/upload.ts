/**
 * Upload Routes (Team-Scoped)
 * 
 * POST /api/teams/:teamId/upload - Non-blocking file upload
 * GET /api/teams/:teamId/upload/:jobId/status - Poll job progress
 */

import { Router, Request, Response } from 'express';
import multer from 'multer';
import { authenticateUser, requireTeamAccess } from '../middleware/auth';
import { uploadService } from '../services/upload';
import { supabaseService } from '../services/supabase';
import { SourceType } from '../types/cme';

const router = Router();

// Configure multer for file uploads (memory storage)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

/**
 * POST /api/teams/:teamId/upload
 * Upload a file for processing.
 * Returns job ID immediately (non-blocking).
 * Requires Member role or higher.
 */
router.post(
    '/teams/:teamId/upload',
    authenticateUser,
    requireTeamAccess('member'),
    upload.single('file'),
    async (req: Request, res: Response) => {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No file provided' });
            }

            const teamId = req.teamId!;
            const organizationId = req.organizationId!;
            const userId = req.userId!;
            const sourceType = (req.body.source_type || 'document') as SourceType;

            const jobId = await uploadService.handleUpload(
                teamId,
                organizationId,
                userId,
                req.file.buffer,
                req.file.originalname,
                sourceType
            );

            return res.json({
                success: true,
                job_id: jobId,
                message: 'File upload queued for processing'
            });
        } catch (error) {
            console.error('Upload error:', error);
            return res.status(500).json({
                error: error instanceof Error ? error.message : 'Upload failed'
            });
        }
    }
);

/**
 * GET /api/teams/:teamId/upload/:jobId/status
 * Get job processing status.
 * Requires team membership.
 */
router.get(
    '/teams/:teamId/upload/:jobId/status',
    authenticateUser,
    requireTeamAccess('viewer'),
    async (req: Request, res: Response) => {
        try {
            const { jobId } = req.params;

            const job = await supabaseService.getJob(jobId);

            if (!job) {
                return res.status(404).json({ error: 'Job not found' });
            }

            // Verify job belongs to this team
            if (job.team_id !== req.teamId) {
                return res.status(403).json({ error: 'Access denied' });
            }

            return res.json(job);
        } catch (error) {
            console.error('Status check error:', error);
            return res.status(500).json({
                error: error instanceof Error ? error.message : 'Status check failed'
            });
        }
    }
);

export default router;
