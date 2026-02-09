/**
 * Upload Service
 * 
 * Orchestrates the complete upload flow:
 * 1. Hash file
 * 2. Check if already processed (Supabase lookup)
 * 3. If new → enqueue job (non-blocking)
 * 4. Background worker processes:
 *    - Gemini Flash extraction
 *    - Gemini Pro → CME JSON (with schema_version: "v1")
 *    - Store in Supabase + Neo4j
 *    - Run conflict detection
 * 5. Update job status
 * 
 * Returns job ID immediately for status polling.
 */

import { hashFile } from './hash';
import { supabaseService } from './supabase';
import { geminiService } from './gemini';
import { neo4jService } from './neo4j';
import { conflictDetectorService } from './conflict-detector';
import { jobQueueService } from './job-queue';
import { SourceType } from '../types/cme';

class UploadService {
    /**
     * Handle file upload (non-blocking).
     * Returns job ID immediately.
     * NOW TEAM-SCOPED: Requires teamId, organizationId, userId.
     */
    async handleUpload(
        teamId: string,
        organizationId: string,
        userId: string,
        fileBuffer: Buffer,
        fileName: string,
        sourceType: SourceType
    ): Promise<string> {
        // Step 1: Hash file
        const fileHash = hashFile(fileBuffer);
        console.log(`📄 File: ${fileName} (hash: ${fileHash.substring(0, 16)}...)`);

        // Step 2: Check for duplicate
        const isDuplicate = await supabaseService.isDuplicate(fileHash);
        if (isDuplicate) {
            throw new Error('File already processed (duplicate detected)');
        }

        // Step 3: Enqueue job (non-blocking)
        const jobId = await jobQueueService.enqueue(
            fileBuffer,
            fileName,
            fileHash,
            async (job) => {
                await this.processFile(
                    teamId,
                    organizationId,
                    userId,
                    job.fileBuffer,
                    job.fileName,
                    fileHash,
                    sourceType
                );
            }
        );

        return jobId;
    }

    /**
     * Process file in background worker.
     * Called by job queue.
     */
    private async processFile(
        teamId: string,
        organizationId: string,
        userId: string,
        fileBuffer: Buffer,
        fileName: string,
        fileHash: string,
        sourceType: SourceType
    ): Promise<void> {
        // Convert buffer to text (simplified - in production, handle PDFs, videos, etc.)
        const text = fileBuffer.toString('utf-8');

        // Step 4: Gemini extraction
        const decisions = await geminiService.processDocument(
            text,
            sourceType,
            fileName
        );

        if (decisions.length === 0) {
            console.log('⚠️  No decisions found in file');
            return;
        }

        // Step 5: Store in Supabase (with team/org context)
        await supabaseService.storeMetadata(
            teamId,
            organizationId,
            fileHash,
            decisions,
            sourceType,
            userId
        );
        console.log(`💾 Stored ${decisions.length} decisions in Supabase for team ${teamId}`);

        // Step 6: Store in Neo4j (with team context)
        for (const decision of decisions) {
            await neo4jService.storeDecision(teamId, organizationId, decision);
        }
        console.log(`🔗 Stored ${decisions.length} decisions in Neo4j graph for team ${teamId}`);

        // Step 6.5: Create temporal relationships
        await neo4jService.createTemporalRelationships(teamId, decisions, fileHash, fileName);

        // Step 7: Run conflict detection (team-scoped)
        const conflicts = await conflictDetectorService.detectConflicts(teamId);
        console.log(`🔴 Detected ${conflicts.length} conflicts for team ${teamId}`);
    }
}

export const uploadService = new UploadService();
