/**
 * Neo4j AuraDB Service
 * 
 * Manages decision graph:
 * - Decision nodes
 * - Relationships: CAUSES, BLOCKS, DEPENDS_ON
 * - Temporal queries
 * - Conflict path detection
 */

import neo4j, { Driver, Session } from 'neo4j-driver';
import { config } from '../config/env';
import { CMEDecision, RelationType } from '../types/cme';

class Neo4jService {
    private driver: Driver;

    constructor() {
        this.driver = neo4j.driver(
            config.NEO4J_URI,
            neo4j.auth.basic(config.NEO4J_USERNAME, config.NEO4J_PASSWORD)
        );
    }

    /**
     * Get a session for running queries.
     */
    private getSession(): Session {
        return this.driver.session();
    }

    /**
     * Test database connection.
     */
    async testConnection(): Promise<boolean> {
        const session = this.getSession();
        try {
            await session.run('RETURN 1');
            return true;
        } catch (error) {
            console.error('Neo4j connection failed:', error);
            return false;
        } finally {
            await session.close();
        }
    }

    /**
     * Create a decision node in the graph (team-scoped).
     */
    async createDecisionNode(teamId: string, organizationId: string, decision: CMEDecision): Promise<void> {
        const session = this.getSession();
        try {
            await session.run(
                `
        MERGE (d:Decision {decision_id: $decision_id})
        SET d.schema_version = $schema_version,
            d.source_type = $source_type,
            d.source_ref = $source_ref,
            d.actor = $actor,
            d.decision = $decision,
            d.reasoning = $reasoning,
            d.sentiment = $sentiment,
            d.timestamp = $timestamp,
            d.team_id = $team_id,
            d.organization_id = $organization_id
        `,
                {
                    decision_id: decision.decision_id,
                    schema_version: decision.schema_version,
                    source_type: decision.source_type,
                    source_ref: decision.source_ref,
                    actor: decision.actor,
                    decision: decision.decision,
                    reasoning: decision.reasoning,
                    sentiment: decision.sentiment,
                    timestamp: decision.timestamp || new Date().toISOString(),
                    team_id: teamId,
                    organization_id: organizationId
                }
            );
        } finally {
            await session.close();
        }
    }

    /**
     * Create relationships between decisions.
     * Supports: CAUSES, BLOCKS, DEPENDS_ON
     */
    async createRelationship(
        fromId: string,
        toId: string,
        relationType: RelationType
    ): Promise<void> {
        const session = this.getSession();
        try {
            await session.run(
                `
        MATCH (a:Decision {decision_id: $fromId})
        MATCH (b:Decision {decision_id: $toId})
        MERGE (a)-[r:${relationType}]->(b)
        SET r.created_at = $timestamp
        `,
                {
                    fromId,
                    toId,
                    timestamp: new Date().toISOString()
                }
            );
        } finally {
            await session.close();
        }
    }

    /**
     * Store a complete decision with its precedents (team-scoped).
     */
    async storeDecision(teamId: string, organizationId: string, decision: CMEDecision): Promise<void> {
        // Create the decision node
        await this.createDecisionNode(teamId, organizationId, decision);

        // Create relationships to precedents
        if (decision.precedents && decision.precedents.length > 0) {
            for (const precedentId of decision.precedents) {
                await this.createRelationship(
                    precedentId,
                    decision.decision_id,
                    RelationType.CAUSES
                );
            }
        }
    }

    /**
     * Find conflicting decision paths.
     * Returns decision IDs in RED flag paths.
     */
    async findConflictPaths(): Promise<string[][]> {
        const session = this.getSession();
        try {
            const result = await session.run(
                `
        MATCH path = (a:Decision {sentiment: 'RED'})-[*1..3]-(b:Decision {sentiment: 'RED'})
        WHERE a.decision_id <> b.decision_id
        RETURN [node in nodes(path) | node.decision_id] as conflict_path
        LIMIT 50
        `
            );

            return result.records.map(record => record.get('conflict_path'));
        } finally {
            await session.close();
        }
    }

    /**
     * Get all decisions for graph visualization (team-scoped).
     */
    async getAllDecisions(teamId: string): Promise<{ nodes: any[]; edges: any[] }> {
        const session = this.getSession();
        try {
            const result = await session.run(
                `
        MATCH (d:Decision {team_id: $team_id})
        OPTIONAL MATCH (d)-[r]->(other:Decision {team_id: $team_id})
        RETURN d, collect({type: type(r), target: other.decision_id}) as relationships
        `,
                { team_id: teamId }
            );

            const nodes = result.records.map(record => {
                const node = record.get('d').properties;
                return {
                    id: node.decision_id,
                    label: node.decision.substring(0, 50),
                    sentiment: node.sentiment,
                    actor: node.actor,
                    timestamp: node.timestamp,
                    schema_version: node.schema_version
                };
            });

            const edges: any[] = [];
            result.records.forEach(record => {
                const sourceId = record.get('d').properties.decision_id;
                const rels = record.get('relationships');

                rels.forEach((rel: any) => {
                    if (rel.target) {
                        edges.push({
                            source: sourceId,
                            target: rel.target,
                            type: rel.type
                        });
                    }
                });
            });

            return { nodes, edges };
        } finally {
            await session.close();
        }
    }

    /**
     * Create temporal relationships between decisions.
     * - NEXT: Sequential relationship within upload
     * - FROM_FILE: Link decisions to their source file
     */
    async createTemporalRelationships(
        teamId: string,
        decisions: CMEDecision[],
        fileHash: string,
        fileName: string
    ): Promise<void> {
        if (decisions.length === 0) return;

        const session = this.getSession();
        try {
            // Create FILE node
            await session.run(
                `
                MERGE (f:File {file_hash: $file_hash})
                SET f.file_name = $file_name,
                    f.team_id = $team_id,
                    f.uploaded_at = $uploaded_at
                `,
                {
                    file_hash: fileHash,
                    file_name: fileName,
                    team_id: teamId,
                    uploaded_at: new Date().toISOString()
                }
            );

            // Create FROM_FILE relationships
            for (const decision of decisions) {
                await session.run(
                    `
                    MATCH (d:Decision {decision_id: $decision_id})
                    MATCH (f:File {file_hash: $file_hash})
                    MERGE (d)-[:FROM_FILE]->(f)
                    `,
                    {
                        decision_id: decision.decision_id,
                        file_hash: fileHash
                    }
                );
            }

            // Create NEXT relationships between sequential decisions
            for (let i = 0; i < decisions.length - 1; i++) {
                await session.run(
                    `
                    MATCH (curr:Decision {decision_id: $curr_id})
                    MATCH (next:Decision {decision_id: $next_id})
                    MERGE (curr)-[:NEXT {sequence: $sequence}]->(next)
                    `,
                    {
                        curr_id: decisions[i].decision_id,
                        next_id: decisions[i + 1].decision_id,
                        sequence: i
                    }
                );
            }

            console.log(`🔗 Created temporal relationships: ${decisions.length} decisions linked to file ${fileName}`);
        } finally {
            await session.close();
        }
    }

    /**
     * Rebuild graph relationships for a team after file reordering.
     * Updates NEXT relationships to reflect new sequence.
     */
    async rebuildGraphForTeam(teamId: string): Promise<void> {
        const session = this.getSession();
        try {
            // First, remove existing NEXT relationships for this team
            await session.run(
                `
                MATCH (d1:Decision {team_id: $team_id})-[r:NEXT]->(d2:Decision)
                DELETE r
                `,
                { team_id: teamId }
            );

            // Recreate NEXT relationships based on current upload_sequence
            await session.run(
                `
                MATCH (d:Decision {team_id: $team_id})
                WITH d ORDER BY d.upload_sequence
                WITH collect(d) AS decisions
                UNWIND range(0, size(decisions)-2) AS i
                WITH decisions[i] AS curr, decisions[i+1] AS next, i
                WHERE curr.file_hash = next.file_hash
                MERGE (curr)-[:NEXT {sequence: i}]->(next)
                `,
                { team_id: teamId }
            );

            console.log(`🔄 Rebuilt graph relationships for team ${teamId}`);
        } finally {
            await session.close();
        }
    }

    /**
     * Close driver connection (call on server shutdown).
     */
    async close(): Promise<void> {
        await this.driver.close();
    }
}

export const neo4jService = new Neo4jService();
