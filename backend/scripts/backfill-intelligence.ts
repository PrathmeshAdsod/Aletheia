
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load env vars
dotenv.config({ path: resolve(__dirname, '../.env') });

// Import services directly (assuming we can run this with ts-node or similar)
// We need to mock the services or import them. Since this is a script, importing is fine.
// However, typescript paths might be tricky. Let's try to keep it simple.
import { strategicPulseService } from '../src/services/strategic-pulse';
import { strategicDNAService } from '../src/services/strategic-dna';
import { config } from '../src/config/env';

async function backfill() {
    console.log('🚀 Starting Strategic Intelligence Backfill...');

    // Initialize Supabase
    const supabaseUrl = process.env.SUPABASE_URL || config.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || config.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Get all teams
    console.log('📦 Fetching teams...');
    const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .select('id, name');

    if (teamsError) {
        console.error('❌ Failed to fetch teams:', teamsError);
        process.exit(1);
    }

    console.log(`Found ${teams.length} teams.`);

    for (const team of teams) {
        console.log(`\nProcessing Team: ${team.name} (${team.id})`);

        // 2. Fetch decisions
        const { data: decisions, error: decisionsError } = await supabase
            .from('decisions')
            .select('*')
            .eq('team_id', team.id);

        if (decisionsError) {
            console.error(`  ❌ Error fetching decisions:`, decisionsError);
            continue;
        }

        console.log(`  Found ${decisions.length} decisions.`);

        if (decisions.length === 0) {
            console.log('  ⚠️ No decisions, generating default zero-state data...');
        }

        // 3. Calculate and Store Pulse
        try {
            console.log('  💓 Calculating Pulse...');
            const pulse = await strategicPulseService.calculatePulse(decisions || []);
            await strategicPulseService.storePulse(supabase, team.id, pulse);
            console.log('  ✅ Pulse stored.');
        } catch (e) {
            console.error('  ❌ Failed to store Pulse:', e);
        }

        // 4. Calculate and Store DNA
        try {
            console.log('  🧬 Calculating DNA...');
            const dna = await strategicDNAService.calculateDNA(decisions || []);
            await strategicDNAService.storeDNA(supabase, team.id, dna);
            console.log('  ✅ DNA stored.');
        } catch (e) {
            console.error('  ❌ Failed to store DNA:', e);
        }
    }

    console.log('\n✨ Backfill complete.');
}

backfill().catch(console.error);
