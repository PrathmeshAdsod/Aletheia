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
    public client: SupabaseClient;

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
     * Get all members of a team with user profile info.
     */
    async getTeamMembers(teamId: string): Promise<any[]> {
        const { data, error } = await this.client
            .from('team_members')
            .select('user_id, role, created_at')
            .eq('team_id', teamId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching team members:', error);
            throw error;
        }

        // Fetch user profiles for members
        const userIds = (data || []).map(m => m.user_id);
        const userProfiles = await this.getUserProfiles(userIds);

        return (data || []).map(member => ({
            user_id: member.user_id,
            role: member.role,
            joined_at: member.created_at,
            name: userProfiles.get(member.user_id) || member.user_id.substring(0, 8),
        }));
    }

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
     * Get user profiles by IDs from auth.users table.
     * Returns a map of user_id to display name (email fallback).
     */
    async getUserProfiles(userIds: string[]): Promise<Map<string, string>> {
        const profileMap = new Map<string, string>();
        if (!userIds.length) return profileMap;

        // Unique user IDs only
        const uniqueIds = [...new Set(userIds.filter(id => id))];

        try {
            // Query auth.users through admin API (service role key required)
            for (const userId of uniqueIds) {
                const { data } = await this.client.auth.admin.getUserById(userId);
                if (data?.user) {
                    const name = data.user.user_metadata?.full_name
                        || data.user.user_metadata?.name
                        || data.user.email?.split('@')[0]
                        || userId.substring(0, 8);
                    profileMap.set(userId, name);
                }
            }
        } catch (error) {
            console.error('Error fetching user profiles:', error);
            // Return IDs as fallback
            uniqueIds.forEach(id => profileMap.set(id, id.substring(0, 8)));
        }

        return profileMap;
    }

    /**
     * Get uploaded files for a team with user display names.
     */
    async getUploadedFiles(teamId: string): Promise<any[]> {
        const { data, error } = await this.client
            .from('decisions')
            .select('file_hash, source_ref, uploaded_at, uploaded_by, upload_sequence')
            .eq('team_id', teamId)
            .order('upload_sequence', { ascending: true });

        if (error) {
            console.error('Error fetching files:', error);
            throw error;
        }

        // Group by file_hash
        const fileMap = new Map();
        const uploaderIds: string[] = [];

        data.forEach(row => {
            if (!fileMap.has(row.file_hash)) {
                fileMap.set(row.file_hash, {
                    file_hash: row.file_hash,
                    file_name: row.source_ref,
                    uploaded_at: row.uploaded_at,
                    uploaded_by: row.uploaded_by,
                    upload_sequence: row.upload_sequence,
                    decision_count: 1
                });
                if (row.uploaded_by) {
                    uploaderIds.push(row.uploaded_by);
                }
            } else {
                fileMap.get(row.file_hash).decision_count++;
            }
        });

        // Fetch user profiles
        const userProfiles = await this.getUserProfiles(uploaderIds);

        // Map user IDs to names
        const files = Array.from(fileMap.values()).map(file => ({
            ...file,
            uploaded_by_name: file.uploaded_by ? userProfiles.get(file.uploaded_by) : null,
        }));

        // Sort by sequence
        files.sort((a, b) => (a.upload_sequence || 0) - (b.upload_sequence || 0));

        return files;
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
     * Update file sequence (for file reordering).
     * Updates all decisions from a file to a new base sequence.
     */
    async updateFileSequence(teamId: string, fileHash: string, newSequence: number): Promise<void> {
        // Get all decision IDs for this file
        const { data: decisions, error: fetchError } = await this.client
            .from('decisions')
            .select('decision_id')
            .eq('team_id', teamId)
            .eq('file_hash', fileHash)
            .order('upload_sequence', { ascending: true });

        if (fetchError) {
            console.error('Error fetching decisions for reorder:', fetchError);
            throw fetchError;
        }

        // Base sequence: newSequence * 10000 to leave room for decisions within the file
        const baseSequence = newSequence * 10000;

        // Update each decision with incrementing sequence
        for (let i = 0; i < (decisions?.length || 0); i++) {
            const { error } = await this.client
                .from('decisions')
                .update({ upload_sequence: baseSequence + i })
                .eq('decision_id', decisions![i].decision_id);

            if (error) {
                console.error('Error updating file sequence:', error);
                throw error;
            }
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
