/**
 * File Hashing Service
 * 
 * Prevents reprocessing the same file twice.
 * Uses SHA-256 for reliable duplicate detection.
 */

import crypto from 'crypto';

/**
 * Generate SHA-256 hash from file buffer.
 */
export function hashFile(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Generate SHA-256 hash from text content.
 */
export function hashText(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex');
}
