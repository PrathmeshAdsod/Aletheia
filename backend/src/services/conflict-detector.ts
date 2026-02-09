/**
 * Conflict Detection Service
 * 
 * Detects contradicting decisions in the graph and calculates consistency score.
 * 
 * CONSISTENCY SCORE FORMULA (enterprise-grade):
 * 100 - (RED flags × weight) - (Unresolved conflicts)
 * 
 * This provides a clear, explainable metric for stakeholders.
 */

import { neo4jService } from './neo4j';
import { ConflictFlag, ConsistencyMetrics } from '../types/cme';
import { randomUUID } from 'crypto';

class ConflictDetectorService {
    // Configurable weights per severity (1-10 scale)
    private readonly SEVERITY_WEIGHT = 10;
    private readonly UNRESOLVED_WEIGHT = 5;

    /**
     * Detect conflicts in the decision graph (team-scoped).
     * Returns conflict flags with paths and decision labels.
     */
    async detectConflicts(teamId: string): Promise<ConflictFlag[]> {
        const conflictPaths = await neo4jService.findConflictPaths();

        const flags: ConflictFlag[] = [];

        // Get all unique decision IDs from paths
        const allDecisionIds = new Set<string>();
        conflictPaths.forEach(path => path.forEach(id => allDecisionIds.add(id)));

        // Fetch decision details from Supabase
        const { supabaseService } = require('./supabase');
        const decisionsMap = new Map<string, string>();

        if (allDecisionIds.size > 0) {
            const { data: decisions } = await supabaseService.client
                .from('decisions')
                .select('decision_id, full_json')
                .in('decision_id', Array.from(allDecisionIds))
                .eq('team_id', teamId);

            if (decisions) {
                decisions.forEach((dec: any) => {
                    const label = dec.full_json?.decision || dec.full_json?.label || dec.decision_id;
                    decisionsMap.set(dec.decision_id, label);
                });
            }
        }

        for (const path of conflictPaths) {
            if (path.length >= 2) {
                const decisionIdA = path[0];
                const decisionIdB = path[path.length - 1];

                flags.push({
                    flag_id: randomUUID(),
                    decision_a: decisionsMap.get(decisionIdA) || decisionIdA,
                    decision_b: decisionsMap.get(decisionIdB) || decisionIdB,
                    severity: Math.min(10, path.length), // Longer paths = higher severity
                    conflict_path: path,
                    detected_at: new Date().toISOString(),
                    resolved: false
                });
            }
        }

        return flags;
    }

    /**
     * Calculate consistency score (team-scoped).
     * 
     * Formula: 100 - (RED flags × weight) - (Unresolved conflicts × weight)
     * 
     * Returns 0-100 score where:
     * - 100 = Perfect consistency
     * - 0 = Maximum conflicts
     */
    async calculateConsistencyScore(teamId: string): Promise<ConsistencyMetrics> {
        const { nodes } = await neo4jService.getAllDecisions(teamId);

        const redCount = nodes.filter(n => n.sentiment === 'RED').length;
        const greenCount = nodes.filter(n => n.sentiment === 'GREEN').length;
        const neutralCount = nodes.filter(n => n.sentiment === 'NEUTRAL').length;

        const conflicts = await this.detectConflicts(teamId);
        const unresolvedConflicts = conflicts.filter(c => !c.resolved).length;

        // Calculate score with configurable weights
        let score = 100;
        score -= redCount * this.SEVERITY_WEIGHT;
        score -= unresolvedConflicts * this.UNRESOLVED_WEIGHT;

        // Clamp to 0-100
        score = Math.max(0, Math.min(100, score));

        return {
            score,
            red_flags: redCount,
            green_alignments: greenCount,
            neutral_count: neutralCount,
            unresolved_conflicts: unresolvedConflicts,
            total_decisions: nodes.length
        };
    }
}

export const conflictDetectorService = new ConflictDetectorService();
