// ================================
// ALETHEIA NEO4J PRODUCTION SCHEMA
// ================================
// Run in Neo4j Browser: https://workspace-preview.neo4j.io/
// OR in your AuraDB instance

// ================================
// CONSTRAINTS: Ensure data integrity
// ================================

// Unique decision IDs
CREATE CONSTRAINT decision_id_unique IF NOT EXISTS
FOR (d:Decision) REQUIRE d.decision_id IS UNIQUE;

// ================================
// INDEXES: Performance optimization
// ================================

// Actor lookup (who made decisions)
CREATE INDEX decision_actor IF NOT EXISTS FOR (d:Decision) ON (d.actor);

// Timestamp lookup (chronological queries)
CREATE INDEX decision_timestamp IF NOT EXISTS FOR (d:Decision) ON (d.timestamp);

// Sentiment-based queries
CREATE INDEX decision_sentiment IF NOT EXISTS FOR (d:Decision) ON (d.sentiment);

// Source type filtering
CREATE INDEX decision_source_type IF NOT EXISTS FOR (d:Decision) ON (d.source_type);

// ================================
// SAMPLE DATA: Test the setup
// ================================

// Create initial test decision
CREATE (d:Decision {
  decision_id: "prod-init-001",
  actor: "system",
  decision: "Aletheia production instance initialized",
  reasoning: "Setting up production Neo4j graph database",
  sentiment: "NEUTRAL",
  source_type: "system",
  timestamp: datetime(),
  constraints: [],
  precedents: []
});

// ================================
// VERIFICATION QUERIES
// ================================

// 1. Check constraints
SHOW CONSTRAINTS;

// 2. Check indexes
SHOW INDEXES;

// 3. Count all nodes
MATCH (n) RETURN count(n) AS total_nodes;

// 4. View all decisions
MATCH (d:Decision)
RETURN d.decision_id, d.actor, d.decision, d.timestamp
ORDER BY d.timestamp DESC
LIMIT 10;

// 5. Check relationships
MATCH (a:Decision)-[r]->(b:Decision)
RETURN type(r), count(*) AS relationship_count;

// ================================
// EXAMPLE QUERIES FOR PRODUCTION
// ================================

// Find all decisions by an actor
MATCH (d:Decision {actor: "john@company.com"})
RETURN d.decision_id, d.decision, d.timestamp
ORDER BY d.timestamp DESC;

// Find conflicting decisions (opposing sentiments)
MATCH (a:Decision)-[r:CONTRADICTS]->(b:Decision)
WHERE a.sentiment = "POSITIVE" AND b.sentiment = "NEGATIVE"
RETURN a.decision_id, b.decision_id, r.reason, r.severity
ORDER BY r.severity DESC;

// Find decision chains (causal paths)
MATCH path = (start:Decision)-[*1..5]->(end:Decision)
WHERE start.decision_id = "specific-decision-id"
RETURN path
LIMIT 50;

// Find decisions within time range
MATCH (d:Decision)
WHERE d.timestamp >= datetime('2026-02-01T00:00:00Z')
  AND d.timestamp <= datetime('2026-02-28T23:59:59Z')
RETURN d.decision_id, d.decision, d.timestamp
ORDER BY d.timestamp;

// ================================
// CLEANUP (use cautiously!)
// ================================

// Delete test data (run ONLY if needed)
// MATCH (d:Decision {decision_id: "prod-init-001"})
// DELETE d;

// Delete ALL data (DANGEROUS - only for reset)
// MATCH (n) DETACH DELETE n;

// ✅ Neo4j production schema ready!
// Your graph database is initialized and optimized for production use.
