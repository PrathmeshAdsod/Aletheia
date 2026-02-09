/**
 * Environment Configuration
 * 
 * CRITICAL SECURITY: All secrets loaded from process.env
 * Server startup FAILS if any required variable is missing.
 * 
 * This is production-grade fail-fast validation.
 */

import dotenv from 'dotenv';

dotenv.config();

interface EnvConfig {
    // Server
    PORT: number;
    NODE_ENV: string;

    // Supabase
    SUPABASE_URL: string;
    SUPABASE_SERVICE_KEY: string;

    // Neo4j AuraDB
    NEO4J_URI: string;
    NEO4J_USERNAME: string;
    NEO4J_PASSWORD: string;

    // Google Gemini API
    GEMINI_API_KEY: string;

    // Integrations (optional for MVP)
    SLACK_BOT_TOKEN?: string;
    SLACK_SIGNING_SECRET?: string;
    GITHUB_TOKEN?: string;
    GITHUB_WEBHOOK_SECRET?: string;

    // Frontend URL (for CORS)
    FRONTEND_URL: string;
}

/**
 * Validates and returns typed environment configuration.
 * Throws error if required variables are missing.
 */
function validateEnv(): EnvConfig {
    const required = [
        'SUPABASE_URL',
        'SUPABASE_SERVICE_KEY',
        'NEO4J_URI',
        'NEO4J_USERNAME',
        'NEO4J_PASSWORD',
        'GEMINI_API_KEY'
    ];

    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
        console.error('❌ FATAL: Missing required environment variables:');
        missing.forEach(key => console.error(`   - ${key}`));
        console.error('\n💡 Check backend/.env and fill in all values.');
        process.exit(1);
    }

    return {
        PORT: parseInt(process.env.PORT || '8000', 10),
        NODE_ENV: process.env.NODE_ENV || 'production',
        SUPABASE_URL: process.env.SUPABASE_URL!,
        SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY!,
        NEO4J_URI: process.env.NEO4J_URI!,
        NEO4J_USERNAME: process.env.NEO4J_USERNAME!,
        NEO4J_PASSWORD: process.env.NEO4J_PASSWORD!,
        GEMINI_API_KEY: process.env.GEMINI_API_KEY!,
        SLACK_BOT_TOKEN: process.env.SLACK_BOT_TOKEN,
        SLACK_SIGNING_SECRET: process.env.SLACK_SIGNING_SECRET,
        GITHUB_TOKEN: process.env.GITHUB_TOKEN,
        GITHUB_WEBHOOK_SECRET: process.env.GITHUB_WEBHOOK_SECRET,
        FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000'
    };
}

export const config = validateEnv();
