/**
 * Job Queue Service
 * 
 * ARCHITECTURE: Phase 1 uses simple in-memory queue.
 * Clean interface allows swapping to BullMQ/Cloud Tasks later.
 * 
 * Prevents long video processing from blocking API threads.
 */

import { randomUUID } from 'crypto';
import { JobStatus } from '../types/cme';
import { supabaseService } from './supabase';

interface QueueJob {
    jobId: string;
    fileHash: string;
    fileBuffer: Buffer;
    fileName: string;
    processFunc: (job: QueueJob) => Promise<void>;
}

class JobQueueService {
    private queue: QueueJob[] = [];
    private processing: Set<string> = new Set();
    private maxConcurrent: number = 3; // Process 3 jobs concurrently

    constructor() {
        // Start worker loop
        this.startWorkers();
    }

    /**
     * Enqueue a new job for async processing.
     * Returns job ID immediately (non-blocking).
     */
    async enqueue(
        fileBuffer: Buffer,
        fileName: string,
        fileHash: string,
        processFunc: (job: QueueJob) => Promise<void>
    ): Promise<string> {
        const jobId = randomUUID();

        const job: QueueJob = {
            jobId,
            fileHash,
            fileBuffer,
            fileName,
            processFunc
        };

        this.queue.push(job);

        // Create job record in Supabase
        await supabaseService.createJob(jobId, fileHash, fileName);

        console.log(`📥 Job ${jobId} enqueued (queue size: ${this.queue.length})`);

        return jobId;
    }

    /**
     * Worker loop: Process jobs from queue.
     */
    private async startWorkers(): Promise<void> {
        setInterval(async () => {
            // Check if we can process more jobs
            if (this.processing.size >= this.maxConcurrent || this.queue.length === 0) {
                return;
            }

            const job = this.queue.shift();
            if (!job) return;

            this.processing.add(job.jobId);

            // Process job in background
            this.processJob(job).finally(() => {
                this.processing.delete(job.jobId);
            });
        }, 1000); // Check every second
    }

    /**
     * Process a single job.
     */
    private async processJob(job: QueueJob): Promise<void> {
        try {
            console.log(`⚙️  Processing job ${job.jobId}...`);

            // Update status to processing
            await supabaseService.updateJob(job.jobId, {
                status: 'processing'
            });

            // Execute the processing function
            await job.processFunc(job);

            // Mark as completed
            await supabaseService.updateJob(job.jobId, {
                status: 'completed',
                decisions_extracted: 0,
                completed_at: new Date().toISOString()
            });

            console.log(`✅ Job ${job.jobId} completed`);
        } catch (error) {
            console.error(`❌ Job ${job.jobId} failed:`, error);

            await supabaseService.updateJob(job.jobId, {
                status: 'failed',
                error_message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    /**
     * Get current queue stats (for monitoring).
     */
    getStats(): { queued: number; processing: number } {
        return {
            queued: this.queue.length,
            processing: this.processing.size
        };
    }
}

export const jobQueueService = new JobQueueService();
