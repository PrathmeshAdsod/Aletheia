/**
 * API Client
 * Type-safe fetch wrappers for backend communication.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:8000' : '');

export interface JobStatus {
    job_id: string;
    status: 'queued' | 'processing' | 'completed' | 'failed';
    progress: number;
    file_hash: string;
    created_at: string;
    updated_at: string;
    error?: string;
}

export interface Decision {
    decision_id: string;
    schema_version: string;
    source_type: string;
    source_ref: string;
    actor: string;
    decision: string;
    reasoning: string;
    sentiment: 'RED' | 'GREEN' | 'NEUTRAL';
    timestamp?: string;
}

export interface GraphData {
    nodes: Array<{
        id: string;
        label: string;
        sentiment: string;
        actor: string;
        timestamp: string;
    }>;
    edges: Array<{
        source: string;
        target: string;
        type: string;
    }>;
}

export interface ConsistencyMetrics {
    score: number;
    red_flags: number;
    green_alignments: number;
    neutral_count: number;
    unresolved_conflicts: number;
    total_decisions: number;
}

class APIClient {
    /**
     * Upload a file for processing.
     */
    async uploadFile(file: File, sourceType: string = 'document'): Promise<{ job_id: string }> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('source_type', sourceType);

        const response = await fetch(`${API_URL}/api/upload`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Upload failed');
        }

        return response.json();
    }

    /**
     * Get job status by ID.
     */
    async getJobStatus(jobId: string): Promise<JobStatus> {
        const response = await fetch(`${API_URL}/api/upload/${jobId}/status`);

        if (!response.ok) {
            throw new Error('Failed to fetch job status');
        }

        return response.json();
    }

    /**
     * Get all decisions.
     */
    async getDecisions(limit: number = 50, offset: number = 0): Promise<Decision[]> {
        const response = await fetch(`${API_URL}/api/decisions?limit=${limit}&offset=${offset}`);

        if (!response.ok) {
            throw new Error('Failed to fetch decisions');
        }

        const data = await response.json();
        return data.decisions;
    }

    /**
     * Get graph data for visualization.
     */
    async getGraph(): Promise<GraphData> {
        const response = await fetch(`${API_URL}/api/graph`);

        if (!response.ok) {
            throw new Error('Failed to fetch graph');
        }

        return response.json();
    }

    /**
     * Get consistency metrics.
     */
    async getMetrics(): Promise<ConsistencyMetrics> {
        const response = await fetch(`${API_URL}/api/metrics`);

        if (!response.ok) {
            throw new Error('Failed to fetch metrics');
        }

        return response.json();
    }

    /**
     * Query Oracle.
     */
    async queryOracle(question: string): Promise<{ answer: string; citations: string[] } | { error: string }> {
        const response = await fetch(`${API_URL}/api/oracle/query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question })
        });

        if (!response.ok) {
            throw new Error('Oracle query failed');
        }

        return response.json();
    }

    /**
     * Get conflict flags.
     */
    async getFlags(): Promise<any[]> {
        const response = await fetch(`${API_URL}/api/flags`);

        if (!response.ok) {
            throw new Error('Failed to fetch flags');
        }

        const data = await response.json();
        return data.flags;
    }
}

export const apiClient = new APIClient();
