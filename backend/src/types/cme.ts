/**
 * CME Decision Schema Types
 * 
 * CRITICAL: All decisions include schema_version for backward compatibility
 * as the system evolves over time.
 */

export enum SentimentType {
    RED = 'RED',       // Conflict detected
    GREEN = 'GREEN',   // Alignment confirmed
    NEUTRAL = 'NEUTRAL' // No conflict or alignment
}

export enum SourceType {
    VIDEO = 'video',
    SLACK = 'slack',
    GITHUB = 'github',
    DOCUMENT = 'document'
}

export enum RelationType {
    CAUSES = 'CAUSES',
    BLOCKS = 'BLOCKS',
    DEPENDS_ON = 'DEPENDS_ON'
}

export interface CMEDecision {
    decision_id: string;           // SHA-256 hash
    schema_version: string;        // CRITICAL: Version tracking (e.g., "v1")
    source_type: SourceType;
    source_ref: string;            // Timestamp or URL
    actor: string;                 // Person or team
    decision: string;              // What was decided
    reasoning: string;             // Why it was decided
    constraints: string[];         // List of constraints
    sentiment: SentimentType;
    precedents: string[];          // List of decision_ids
    timestamp?: string;            // ISO 8601 timestamp
}

export interface ConflictFlag {
    flag_id: string;
    decision_a: string;            // First conflicting decision_id
    decision_b: string;            // Second conflicting decision_id
    severity: number;              // 1-10 scale
    conflict_path: string[];       // Decision IDs in conflict path
    detected_at: string;           // ISO timestamp
    resolved: boolean;
}

export interface JobStatus {
    job_id: string;
    status: 'queued' | 'processing' | 'completed' | 'failed';
    progress: number;              // 0-100
    file_hash: string;
    created_at: string;
    updated_at: string;
    error?: string;
    result?: {
        decisions_extracted: number;
        conflicts_detected: number;
    };
}

export interface ConsistencyMetrics {
    score: number;                 // 0-100
    red_flags: number;
    green_alignments: number;
    neutral_count: number;
    unresolved_conflicts: number;
    total_decisions: number;
}
