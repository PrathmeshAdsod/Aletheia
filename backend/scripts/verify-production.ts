#!/usr/bin/env node

/**
 * Production Setup Script
 * Verifies all environment variables and database connections
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import neo4j from 'neo4j-driver';
import { GoogleGenerativeAI } from '@google/generative-ai';

config();

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

interface CheckResult {
    service: string;
    status: 'pass' | 'fail' | 'warn';
    message: string;
}

const results: CheckResult[] = [];

function log(color: string, message: string) {
    console.log(`${color}${message}${RESET}`);
}

function checkEnvVar(name: string): string | null {
    const value = process.env[name];
    if (!value) {
        results.push({
            service: 'Environment',
            status: 'fail',
            message: `Missing ${name}`
        });
        return null;
    }
    return value;
}

async function checkSupabase() {
    log(BLUE, '\n🔍 Checking Supabase connection...');

    const url = checkEnvVar('SUPABASE_URL');
    const key = checkEnvVar('SUPABASE_SERVICE_KEY');

    if (!url || !key) {
        return;
    }

    try {
        const supabase = createClient(url, key);

        // Test connection by querying decisions table
        const { data, error } = await supabase
            .from('decisions')
            .select('count')
            .limit(1);

        if (error) {
            results.push({
                service: 'Supabase',
                status: 'fail',
                message: `Connection failed: ${error.message}`
            });
        } else {
            results.push({
                service: 'Supabase',
                status: 'pass',
                message: 'Connected successfully'
            });
        }
    } catch (error) {
        results.push({
            service: 'Supabase',
            status: 'fail',
            message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
    }
}

async function checkNeo4j() {
    log(BLUE, '\n🔍 Checking Neo4j connection...');

    const uri = checkEnvVar('NEO4J_URI');
    const username = checkEnvVar('NEO4J_USERNAME');
    const password = checkEnvVar('NEO4J_PASSWORD');

    if (!uri || !username || !password) {
        return;
    }

    const driver = neo4j.driver(uri, neo4j.auth.basic(username, password));

    try {
        await driver.verifyConnectivity();

        const session = driver.session();
        const result = await session.run('MATCH (n) RETURN count(n) as count');
        const count = result.records[0].get('count').toNumber();

        await session.close();

        results.push({
            service: 'Neo4j',
            status: 'pass',
            message: `Connected successfully (${count} nodes)`
        });
    } catch (error) {
        results.push({
            service: 'Neo4j',
            status: 'fail',
            message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
    } finally {
        await driver.close();
    }
}

async function checkGemini() {
    log(BLUE, '\n🔍 Checking Gemini API...');

    const apiKey = checkEnvVar('GEMINI_API_KEY');

    if (!apiKey) {
        return;
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const result = await model.generateContent('Test connection');
        const response = await result.response;

        if (response.text()) {
            results.push({
                service: 'Gemini API',
                status: 'pass',
                message: 'API key valid'
            });
        }
    } catch (error) {
        results.push({
            service: 'Gemini API',
            status: 'fail',
            message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
    }
}

function printResults() {
    log(BLUE, '\n═══════════════════════════════════');
    log(BLUE, '   PRODUCTION SETUP VERIFICATION');
    log(BLUE, '═══════════════════════════════════\n');

    const columnWidth = 20;

    results.forEach(result => {
        const statusIcon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️';
        const color = result.status === 'pass' ? GREEN : result.status === 'fail' ? RED : YELLOW;
        const service = result.service.padEnd(columnWidth);

        log(color, `${statusIcon} ${service} ${result.message}`);
    });

    const passed = results.filter(r => r.status === 'pass').length;
    const failed = results.filter(r => r.status === 'fail').length;
    const warned = results.filter(r => r.status === 'warn').length;

    log(BLUE, '\n═══════════════════════════════════');
    log(GREEN, `✅ Passed: ${passed}`);
    if (failed > 0) log(RED, `❌ Failed: ${failed}`);
    if (warned > 0) log(YELLOW, `⚠️  Warnings: ${warned}`);
    log(BLUE, '═══════════════════════════════════\n');

    if (failed === 0) {
        log(GREEN, '🚀 All systems ready for production!');
        log(GREEN, '   Run: npm start');
    } else {
        log(RED, '⚠️  Please fix the failed checks before deploying.');
        log(YELLOW, '   See production_deployment_guide.md for help.');
        process.exit(1);
    }
}

async function main() {
    log(GREEN, '\n🚀 Aletheia Production Setup Verification\n');

    // Check all required environment variables
    log(BLUE, '📋 Checking environment variables...');
    checkEnvVar('SUPABASE_URL');
    checkEnvVar('SUPABASE_ANON_KEY');
    checkEnvVar('SUPABASE_SERVICE_KEY');
    checkEnvVar('NEO4J_URI');
    checkEnvVar('NEO4J_USERNAME');
    checkEnvVar('NEO4J_PASSWORD');
    checkEnvVar('GEMINI_API_KEY');

    // Test actual connections
    await checkSupabase();
    await checkNeo4j();
    await checkGemini();

    // Print results
    printResults();
}

main().catch(error => {
    log(RED, `\n❌ Setup verification failed: ${error.message}`);
    process.exit(1);
});
