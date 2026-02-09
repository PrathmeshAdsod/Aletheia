/**
 * Supabase Client Service
 * 
 * Handles PostgreSQL operations for:
 * - Users, Organizations, Projects
 * - Decision storage in PostgreSQL (indexed)
 * - File hash tracking (duplicate detection)
 * - Upload job tracking
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config/env';
import { CMEDecision, JobStatus } from '../types/cme';

class SupabaseService {
    private client: SupabaseClient;

    constructor() {
        this.client = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_KEY);
    }

    /**
     * Check if a file with this hash has already been processed.
     * Returns true if duplicate exists.
     */
    async isDuplicate(fileHash: string): Promise<boolean> {
        const { data, error } = await this.client
            .from('decisions')
            .select('file_hash')
            .eq('file_hash', fileHash)
            .limit(1);

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
            console.error('Error checking duplicate:', error);
            throw error;
        }

        return (data && data.length > 0) || false;
    }

    /**
     * Store decisions from file processing into decisions table.
     * NOW TEAM-SCOPED: Requires teamId and organizationId.
     */
    async storeMetadata(
        teamId: string,
        organizationId: string,
        fileHash: string,
        decisions: CMEDecision[],
        sourceType: string,
        uploadedBy?: string
    ): Promise<void> {
        // Get current max sequence number (within team)
        const { data: maxSeqData } = await this.client
            .from('decisions')
            .select('upload_sequence')
            .eq('team_id', teamId)
            .order('upload_sequence', { ascending: false })
            .limit(1);

        const startSequence = (maxSeqData && maxSeqData[0]?.upload_sequence || 0) + 1;

        // Insert each decision as a separate row with team/org IDs
        const rows = decisions.map((decision, index) => ({
            decision_id: decision.decision_id,
            source_type: sourceType,
            source_ref: decision.source_ref || null,
            full_json: decision,
            file_hash: fileHash,
            upload_sequence: startSequence + index,
            schema_version: decision.schema_version || 'v1',
            team_id: teamId,
            organization_id: organizationId,
            uploaded_by: uploadedBy || null
        }));

        const { error } = await this.client
            .from('decisions')
            .insert(rows);

        if (error) {
            console.error('Error storing decisions:', error);
            throw error;
        }
    }

    /**
     * Create a new job record for async processing.
     */
    async createJob(jobId: string, fileHash: string, fileName: string): Promise<void> {
        const { error } = await this.client
            .from('upload_jobs')
            .insert({
                job_id: jobId,
                file_hash: fileHash,
                file_name: fileName,
                status: 'pending',
                started_at: new Date().toISOString()
            });

        if (error) {
            console.error('Error creating job:', error);
            throw error;
        }
    }

    /**
     * Update job status and progress.
     */
    async updateJob(jobId: string, updates: Partial<{
        status: string;
        decisions_extracted: number;
        error_message?: string;
        completed_at?: string;
    }>): Promise<void> {
        const { error } = await this.client
            .from('upload_jobs')
            .update(updates)
            .eq('job_id', jobId);

        if (error) {
            console.error('Error updating job:', error);
            throw error;
        }
    }

    /**
     * Get job status by ID.
     */
    async getJob(jobId: string): Promise<JobStatus | null> {
        const { data, error } = await this.client
            .from('upload_jobs')
            .select('*')
            .eq('job_id', jobId)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('Error fetching job:', error);
            throw error;
        }

        if (!data) return null;

        // Map to JobStatus interface
        return {
            job_id: data.job_id,
            status: data.status as 'queued' | 'processing' | 'completed' | 'failed',
            progress: data.decisions_extracted || 0,
            file_hash: data.file_hash,
            created_at: data.created_at,
            updated_at: data.updated_at,
            error: data.error_message
        };
    }

    /**
     * Get decisions for a specific team (team-scoped).
     */
    async getDecisions(teamId: string, limit: number = 50, offset: number = 0): Promise<CMEDecision[]> {
        const { data, error } = await this.client
            .from('decisions')
            .select('full_json')
            .eq('team_id', teamId)
            .order('upload_sequence', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error('Error fetching decisions:', error);
            throw error;
        }

        // Extract full_json from each row
        return data.map(row => row.full_json);
    }

    /**
     * Store conflict in conflicts table.
     */
    async storeConflict(conflict: {
        flag_type: string;
        severity: number;
        decision_a_id: string;
        decision_b_id: string;
        conflict_reason: string;
    }): Promise<void> {
        const { error } = await this.client
            .from('conflicts')
            .insert(conflict);

        if (error) {
            console.error('Error storing conflict:', error);
            throw error;
        }
    }

    /**
     * Get unresolved conflicts for a team (team-scoped).
     */
    async getConflicts(teamId: string): Promise<any[]> {
        const { data, error } = await this.client
            .from('conflicts')
            .select('*')
            .eq('team_id', teamId)
            .eq('resolved', false)
            .order('severity', { ascending: false });

        if (error) {
            console.error('Error fetching conflicts:', error);
            throw error;
        }

        return data || [];
    }

    // =========================================
    // TEAM MANAGEMENT METHODS
    // =========================================

    /**
     * Get team membership for a user in a specific team.
     */
    async getTeamMembership(userId: string, teamId: string): Promise<{ role: string; organizationId: string } | null> {
        const { data, error } = await this.client
            .from('team_members')
            .select('role, team:teams(organization_id)')
            .eq('user_id', userId)
            .eq('team_id', teamId)
            .single();

        if (error || !data) return null;

        return {
            role: data.role,
            organizationId: (data.team as any).organization_id
        };
    }

    /**
     * Get all teams for a user.
     */
    async getUserTeams(userId: string): Promise<any[]> {
        const { data, error } = await this.client
            .from('team_members')
            .select(`
                role,
                team:teams(
                    id,
                    name,
                    slug,
                    description,
                    organization:organizations(id, name, slug)
                )
            `)
            .eq('user_id', userId);

        if (error) {
            console.error('Error fetching user teams:', error);
            throw error;
        }

        return data || [];
    }

    /**
     * Get uploaded files for a team.
     */
    async getUploadedFiles(teamId: string): Promise<any[]> {
        const { data, error } = await this.client
            .from('decisions')
            .select('file_hash, source_ref, uploaded_at, uploaded_by')
            .eq('team_id', teamId)
            .order('uploaded_at', { ascending: false });

        if (error) {
            console.error('Error fetching files:', error);
            throw error;
        }

        // Group by file_hash
        const fileMap = new Map();
        data.forEach(row => {
            if (!fileMap.has(row.file_hash)) {
                fileMap.set(row.file_hash, {
                    file_hash: row.file_hash,
                    file_name: row.source_ref,
                    uploaded_at: row.uploaded_at,
                    uploaded_by: row.uploaded_by,
                    decision_count: 1
                });
            } else {
                fileMap.get(row.file_hash).decision_count++;
            }
        });

        return Array.from(fileMap.values());
    }

    /**
     * Get decisions from a specific file.
     */
    async getDecisionsByFileHash(teamId: string, fileHash: string): Promise<CMEDecision[]> {
        const { data, error } = await this.client
            .from('decisions')
            .select('full_json')
            .eq('team_id', teamId)
            .eq('file_hash', fileHash)
            .order('upload_sequence', { ascending: true });

        if (error) {
            console.error('Error fetching decisions by file:', error);
            throw error;
        }

        return data.map(row => row.full_json);
    }

    /**
     * Update decision sequence (for reordering).
     */
    async updateSequence(decisionId: string, newSequence: number): Promise<void> {
        const { error } = await this.client
            .from('decisions')
            .update({ upload_sequence: newSequence })
            .eq('decision_id', decisionId);

        if (error) {
            console.error('Error updating sequence:', error);
            throw error;
        }
    }

    /**
     * Create organization.
     */
    async createOrganization(name: string, slug: string, plan: string = 'free'): Promise<any> {
        const { data, error } = await this.client
            .from('organizations')
            .insert({ name, slug, plan })
            .select()
            .single();

        if (error) {
            console.error('Error creating organization:', error);
            throw error;
        }

        return data;
    }

    /**
     * Create team within organization.
     */
    async createTeam(organizationId: string, name: string, slug: string, description?: string): Promise<any> {
        const { data, error } = await this.client
            .from('teams')
            .insert({ organization_id: organizationId, name, slug, description })
            .select()
            .single();

        if (error) {
            console.error('Error creating team:', error);
            throw error;
        }

        return data;
    }

    /**
     * Add member to team.
     */
    async addTeamMember(teamId: string, userId: string, role: string, invitedBy?: string): Promise<void> {
        const { error } = await this.client
            .from('team_members')
            .insert({ team_id: teamId, user_id: userId, role, invited_by: invitedBy });

        if (error) {
            console.error('Error adding team member:', error);
            throw error;
        }
    }

    /**
     * Update team member role.
     */
    async updateTeamMemberRole(teamId: string, userId: string, newRole: string): Promise<void> {
        const { error } = await this.client
            .from('team_members')
            .update({ role: newRole })
            .eq('team_id', teamId)
            .eq('user_id', userId);

        if (error) {
            console.error('Error updating team member role:', error);
            throw error;
        }
    }

    /**
     * Remove team member.
     */
    async removeTeamMember(teamId: string, userId: string): Promise<void> {
        const { error } = await this.client
            .from('team_members')
            .delete()
            .eq('team_id', teamId)
            .eq('user_id', userId);

        if (error) {
            console.error('Error removing team member:', error);
            throw error;
        }
    }

    /**
     * Get team details.
     */
    async getTeam(teamId: string): Promise<any> {
        const { data, error } = await this.client
            .from('teams')
            .select('*, organization:organizations(*)')
            .eq('id', teamId)
            .single();

        if (error) {
            console.error('Error fetching team:', error);
            throw error;
        }

        return data;
    }
}

export const supabaseService = new SupabaseService();
