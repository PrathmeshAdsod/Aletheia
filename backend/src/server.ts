/**
 * Aletheia Backend Server
 * 
 * Production-grade Express.js API with:
 * - Environment validation (fail-fast if secrets missing)
 * - CORS configuration
 * - Error handling middleware
 * - Modular route organization
 */

import express from 'express';
import cors from 'cors';
import { config } from './config/env';
import { neo4jService } from './services/neo4j';
import teamsRoutes from './routes/teams';
import uploadRoutes from './routes/upload';
import decisionRoutes from './routes/decisions';
import flagRoutes from './routes/flags';
import oracleRoutes from './routes/oracle';
import integrationRoutes from './routes/integrations';
import analyticsRoutes from './routes/analytics';
import timelineRoutes from './routes/timeline';
import settingsRoutes from './routes/settings';
import notificationsRoutes from './routes/notifications';
import chatRoutes from './routes/chat';
import insightsRoutes from './routes/insights';
import intelligenceRoutes from './routes/intelligence';

const app = express();

// Middleware
app.use(cors({
    origin: config.FRONTEND_URL,
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (_req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// API Routes (Team-scoped)
app.use('/api', teamsRoutes);      // Team management
app.use('/api', uploadRoutes);     // Team-scoped upload
app.use('/api', decisionRoutes);   // Team-scoped decisions & graph
app.use('/api', oracleRoutes);     // Team-scoped Oracle queries
app.use('/api', flagRoutes);       // Flags (to be updated for teams)
app.use('/api', integrationRoutes); // Integrations (to be updated for teams)
app.use('/api', analyticsRoutes);  // Tier 1: Health scores & analytics
app.use('/api', timelineRoutes);   // Timeline: Chronological events
app.use('/api', settingsRoutes);   // Settings: Team & user preferences
app.use('/api', notificationsRoutes); // Notifications: Team notifications
app.use('/api', chatRoutes);       // Chat: Team AI conversations
app.use('/api', insightsRoutes);   // Insights: Proactive AI recommendations
app.use('/api', intelligenceRoutes); // Intelligence: Strategic Pulse & DNA

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Server error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: config.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
async function startServer() {
    try {
        // Test Neo4j connection
        console.log('🔗 Testing Neo4j connection...');
        const neo4jHealthy = await neo4jService.testConnection();

        if (!neo4jHealthy) {
            console.error('❌ Neo4j connection failed. Check your credentials.');
            process.exit(1);
        }

        console.log('✅ Neo4j connected');

        // Start Express server
        app.listen(config.PORT, () => {
            console.log(`\n🚀 Aletheia Backend Running`);
            console.log(`   Port: ${config.PORT}`);
            console.log(`   Environment: ${config.NODE_ENV}`);
            console.log(`   Frontend URL: ${config.FRONTEND_URL}`);
            console.log(`\n📚 Team-Scoped API Endpoints:`);
            console.log(`   🏢 Organizations & Teams:`)
            console.log(`      POST /api/organizations - Create organization`);
            console.log(`      POST /api/organizations/:orgId/teams - Create team`);
            console.log(`      GET  /api/users/me/teams - List my teams`);
            console.log(`   📤 Uploads:`);
            console.log(`      POST /api/teams/:teamId/upload - Upload file`);
            console.log(`      GET  /api/teams/:teamId/upload/:jobId/status - Check status`);
            console.log(`   📊 Decisions & Graph:`);
            console.log(`      GET  /api/teams/:teamId/decisions - Get decisions`);
            console.log(`      GET  /api/teams/:teamId/graph - Get graph`);
            console.log(`      GET  /api/teams/:teamId/files - List files`);
            console.log(`   🔮 Oracle:`);
            console.log(`      POST /api/teams/:teamId/oracle/query - Ask Oracle`);
            console.log(`\n✨ Multi-tenant architecture ready\n`);
        });
    } catch (error) {
        console.error('❌ Fatal error during startup:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully...');
    await neo4jService.close();
    process.exit(0);
});

startServer();
