/**
 * Intelligence Routes
 * API endpoints for Strategic Pulse, DNA, Intelligence, Risk Radar, 
 * Executive Briefings, and Benchmarks
 */

import { Router, Request, Response } from 'express';
import { supabaseService } from '../services/supabase';
import { strategicPulseService, PulseSnapshot } from '../services/strategic-pulse';
import { strategicDNAService, StrategicDNA } from '../services/strategic-dna';
import { riskRadarService } from '../services/risk-radar';
import { executiveBriefingService } from '../services/executive-briefing';
import { benchmarkService } from '../services/benchmark';
import { authenticateUser, requireTeamAccess } from '../middleware/auth';

const router = Router();

/**
 * GET /api/teams/:teamId/pulse
 * Get current strategic pulse for a team
 */
router.get(
    '/teams/:teamId/pulse',
    authenticateUser,
    requireTeamAccess('viewer'),
    async (req: Request, res: Response): Promise<void> => {
        const { teamId } = req.params;
        console.log(`🔍 [API] GET /teams/${teamId}/pulse - Request started`);

        try {
            const refresh = req.query.refresh === 'true';
            const supabase = supabaseService.client;

            // Try to get cached Pulse first (unless refresh requested)
            if (!refresh) {
                console.log(`🔍 [API] Checking for cached Pulse data...`);
                const cached = await strategicPulseService.getLatestPulse(supabase, teamId);
                if (cached) {
                    console.log(`✅ [API] Cached Pulse data found. Returning immediately.`);
                    res.json({
                        success: true,
                        pulse: cached,
                        cached: true
                    });
                    return;
                }
                console.log(`⚠️ [API] No cached Pulse data found (or it returned null). Proceeding to calculate.`);
            } else {
                console.log(`🔄 [API] Refresh requested. Skipping cache check.`);
            }

            // Fetch all decisions for the team
            console.log(`📦 [API] Fetching decisions from database...`);
            const { data: decisions, error } = await supabase
                .from('decisions')
                .select('*')
                .eq('team_id', teamId)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('❌ [API] Error fetching decisions:', error);
                res.status(500).json({ error: 'Failed to fetch decisions' });
                return;
            }
            console.log(`📦 [API] Fetched ${decisions?.length || 0} decisions.`);

            // Calculate current pulse
            console.log(`⚙️ [API] Calculating Pulse...`);
            const pulse = await strategicPulseService.calculatePulse(decisions || []);
            console.log(`✅ [API] Pulse calculation complete. Score: ${pulse.pulseScore}`);

            // Store snapshot (async, don't wait)
            console.log(`💾 [API] Initiating background storage of Pulse snapshot...`);
            strategicPulseService.storePulse(supabase, teamId, pulse).catch(err =>
                console.error('❌ [API] Background storage failed:', err)
            );

            res.json({
                success: true,
                pulse,
                cached: false,
                calculatedAt: new Date().toISOString()
            });
            console.log(`🚀 [API] Response sent.`);
        } catch (error) {
            console.error('❌ [API] Critical error in pulse route:', error);
            res.status(500).json({ error: 'Failed to calculate strategic pulse' });
        }
    }
);

/**
 * GET /api/teams/:teamId/pulse/history
 * Get historical pulse data for trends
 */
router.get(
    '/teams/:teamId/pulse/history',
    authenticateUser,
    requireTeamAccess('viewer'),
    async (req: Request, res: Response): Promise<void> => {
        try {
            const { teamId } = req.params;
            const days = parseInt(req.query.days as string) || 30;
            const supabase = supabaseService.client;

            const history = await strategicPulseService.getPulseHistory(supabase, teamId, days);

            res.json({
                success: true,
                history,
                days
            });
        } catch (error) {
            console.error('Error fetching pulse history:', error);
            res.status(500).json({ error: 'Failed to fetch pulse history' });
        }
    }
);

/**
 * GET /api/teams/:teamId/dna
 * Get strategic DNA (organizational identity) for a team
 */
router.get(
    '/teams/:teamId/dna',
    authenticateUser,
    requireTeamAccess('viewer'),
    async (req: Request, res: Response): Promise<void> => {
        try {
            const { teamId } = req.params;
            const refresh = req.query.refresh === 'true';
            const supabase = supabaseService.client;

            // Try to get cached DNA first (unless refresh requested)
            if (!refresh) {
                const cached = await strategicDNAService.getLatestDNA(supabase, teamId);
                if (cached) {
                    res.json({
                        success: true,
                        dna: cached,
                        cached: true
                    });
                    return;
                }
            }

            // Fetch all decisions for the team
            const { data: decisions, error } = await supabase
                .from('decisions')
                .select('*')
                .eq('team_id', teamId)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching decisions for DNA:', error);
                res.status(500).json({ error: 'Failed to fetch decisions' });
                return;
            }

            // Calculate DNA
            const dna = await strategicDNAService.calculateDNA(decisions || []);

            // Store snapshot (async, don't wait)
            strategicDNAService.storeDNA(supabase, teamId, dna).catch(console.error);

            res.json({
                success: true,
                dna,
                cached: false,
                calculatedAt: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error calculating DNA:', error);
            res.status(500).json({ error: 'Failed to calculate strategic DNA' });
        }
    }
);

/**
 * GET /api/teams/:teamId/intelligence
 * Get combined intelligence summary (pulse + DNA + key insights)
 */
router.get(
    '/teams/:teamId/intelligence',
    authenticateUser,
    requireTeamAccess('viewer'),
    async (req: Request, res: Response): Promise<void> => {
        try {
            const { teamId } = req.params;
            const supabase = supabaseService.client;

            // Fetch all decisions
            const { data: decisions, error } = await supabase
                .from('decisions')
                .select('*')
                .eq('team_id', teamId)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching decisions:', error);
                res.status(500).json({ error: 'Failed to fetch decisions' });
                return;
            }

            // Calculate both pulse and DNA in parallel
            const [pulse, dna] = await Promise.all([
                strategicPulseService.calculatePulse(decisions || []),
                strategicDNAService.calculateDNA(decisions || [])
            ]);

            // Store snapshots (async, don't wait)
            // This ensures data is captured when users view the dashboard
            Promise.all([
                strategicPulseService.storePulse(supabase, teamId, pulse),
                strategicDNAService.storeDNA(supabase, teamId, dna)
            ]).catch(err => console.error('Failed to background store intelligence:', err));

            // Generate executive summary
            const summary = generateExecutiveSummary(pulse, dna, decisions?.length || 0);

            res.json({
                success: true,
                intelligence: {
                    pulse,
                    dna,
                    summary,
                    decisionCount: decisions?.length || 0,
                    calculatedAt: new Date().toISOString()
                }
            });
        } catch (error) {
            console.error('Error generating intelligence:', error);
            res.status(500).json({ error: 'Failed to generate intelligence summary' });
        }
    }
);

/**
 * GET /api/teams/:teamId/risks
 * Get risk radar analysis
 */
router.get(
    '/teams/:teamId/risks',
    authenticateUser,
    requireTeamAccess('viewer'),
    async (req: Request, res: Response): Promise<void> => {
        const { teamId } = req.params;
        console.log(`🔍 [API] GET /teams/${teamId}/risks - Request started`);

        try {
            const supabase = supabaseService.client;

            // Fetch decisions
            console.log(`📦 [API] Fetching decisions for risks...`);
            const { data: decisions, error } = await supabase
                .from('decisions')
                .select('*')
                .eq('team_id', teamId)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('❌ [API] Error fetching decisions for risks:', error);
                res.status(500).json({ error: 'Failed to fetch decisions' });
                return;
            }
            console.log(`📦 [API] Fetched ${decisions?.length || 0} decisions.`);

            // Scan for risks
            console.log(`⚙️ [API] Scanning risks logic...`);
            try {
                const riskResult = await riskRadarService.scanRisks(decisions || []);
                console.log(`✅ [API] Risk scan complete. Score: ${riskResult.riskScore}`);

                // Store risk signals (async)
                console.log(`💾 [API] Storing risk scan (async)...`);
                riskRadarService.storeRiskScan(supabase, teamId, riskResult).catch(err => {
                    console.error('⚠️ [API] Failed to background store risk scan:', err);
                });

                res.json({
                    success: true,
                    ...riskResult,
                    scannedAt: new Date().toISOString()
                });
                console.log(`🚀 [API] Risks response sent.`);
            } catch (scanErr: any) {
                console.error('❌ [API] scanRisks threw error:', scanErr);
                console.error('Stack:', scanErr.stack);
                throw scanErr;
            }

        } catch (error: any) {
            console.error('❌ [API] Error scanning risks:', error);
            console.error('Stack:', error.stack);
            res.status(500).json({ error: 'Failed to scan for risks', details: error.message });
        }
    }
);

/**
 * GET /api/teams/:teamId/briefing
 * Get executive briefing
 */
router.get(
    '/teams/:teamId/briefing',
    authenticateUser,
    requireTeamAccess('viewer'),
    async (req: Request, res: Response): Promise<void> => {
        const { teamId } = req.params;
        console.log(`🔍 [API] GET /teams/${teamId}/briefing - Request started`);

        try {
            const supabase = supabaseService.client;

            // 1. Try to get cached briefing first (fast path)
            console.log(`🔍 [API] Checking for cached Briefing...`);
            let cachedBriefing = null;
            try {
                cachedBriefing = await executiveBriefingService.getCachedBriefing(teamId);
                console.log(`✅ [API] Cache check result: ${cachedBriefing ? 'HIT' : 'MISS'}`);
            } catch (cacheErr) {
                console.warn('⚠️ [API] Cache check failed, ignoring:', cacheErr);
            }

            if (cachedBriefing) {
                console.log(`✅ [API] Cached Briefing found. Serving immediately.`);
                res.json({
                    success: true,
                    briefing: cachedBriefing
                });
                return;
            }
            console.log(`⚠️ [API] No cached Briefing found. Proceeding to generate.`);

            // 2. Fetch decisions only if no cache
            console.log(`📦 [API] Fetching decisions for briefing generation...`);
            const { data: decisions, error } = await supabase
                .from('decisions')
                .select('*')
                .eq('team_id', teamId)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('❌ [API] Error fetching decisions:', error);
                res.status(500).json({ error: 'Failed to fetch decisions' });
                return;
            }
            console.log(`📦 [API] Fetched ${decisions?.length || 0} decisions.`);

            // If no decisions, return empty briefing
            if (!decisions || decisions.length === 0) {
                console.log('⚠️ [API] No decisions found. Returning empty briefing template.');
                res.json({
                    success: true,
                    briefing: {
                        generatedAt: new Date().toISOString(),
                        executiveSummary: 'No decisions have been uploaded yet. Upload documents to generate your first briefing.',
                        sections: [],
                        recommendations: ['Upload documents via the Auditor page to get started'],
                        focusAreas: ['Document upload', 'Team onboarding']
                    }
                });
                return;
            }

            // Generate briefing (handles caching and storage internally)
            console.log('⚙️ [API] Calling executiveBriefingService.generateBriefing...');
            try {
                const briefing = await executiveBriefingService.generateBriefing(teamId, decisions || []);
                console.log('✅ [API] Briefing generation complete.');

                res.json({
                    success: true,
                    briefing: {
                        generatedAt: briefing.generatedAt,
                        executiveSummary: briefing.executiveSummary,
                        sections: briefing.sections,
                        recommendations: briefing.recommendations,
                        focusAreas: briefing.focusAreas
                    }
                });
                console.log(`🚀 [API] Briefing response sent.`);
            } catch (genError) {
                console.error('❌ [API] generateBriefing threw error:', genError);
                throw genError; // Re-throw to be caught by outer catch
            }

        } catch (error: any) {
            console.error('❌ [API] Critical error in briefing route:', error);
            console.error('Stack:', error.stack);
            res.status(500).json({ error: 'Failed to generate executive briefing', details: error.message });
        }
    }
);

/**
 * GET /api/teams/:teamId/benchmarks
 * Get benchmark comparisons
 */
router.get(
    '/teams/:teamId/benchmarks',
    authenticateUser,
    requireTeamAccess('viewer'),
    async (req: Request, res: Response): Promise<void> => {
        try {
            const { teamId } = req.params;
            const supabase = supabaseService.client;

            // Fetch decisions
            const { data: decisions, error: decisionsError } = await supabase
                .from('decisions')
                .select('*')
                .eq('team_id', teamId)
                .order('created_at', { ascending: false });

            if (decisionsError) {
                console.error('Error fetching decisions for benchmarks:', decisionsError);
                res.status(500).json({ error: 'Failed to fetch decisions' });
                return;
            }

            // Get team member count
            const { count: memberCount } = await supabase
                .from('team_members')
                .select('*', { count: 'exact', head: true })
                .eq('team_id', teamId);

            // Get benchmarks
            const benchmarks = await benchmarkService.getBenchmarks(
                supabase,
                decisions || [],
                memberCount || 5
            );

            res.json({
                success: true,
                benchmarks
            });
        } catch (error) {
            console.error('Error fetching benchmarks:', error);
            res.status(500).json({ error: 'Failed to fetch benchmarks' });
        }
    }
);

/**
 * Generate executive summary from pulse and DNA
 */
function generateExecutiveSummary(
    pulse: PulseSnapshot,
    dna: StrategicDNA,
    decisionCount: number
): {
    headline: string;
    status: 'healthy' | 'attention' | 'critical';
    keyFindings: string[];
    recommendations: string[];
} {
    const findings: string[] = [];
    const recommendations: string[] = [];

    // Determine overall status
    let status: 'healthy' | 'attention' | 'critical' = 'healthy';
    if (pulse.pulseScore < 40 || pulse.phase === 'crisis') {
        status = 'critical';
    } else if (pulse.pulseScore < 60 || pulse.phase === 'churn') {
        status = 'attention';
    }

    // Generate headline based on phase and pulse
    const phaseLabels: Record<string, string> = {
        expansion: 'Growth Mode Active',
        stabilization: 'Operating Steadily',
        pivot: 'Strategic Transition Underway',
        churn: 'Alignment Challenges Detected',
        crisis: 'Immediate Attention Required'
    };
    const headline = phaseLabels[pulse.phase] || 'Strategic Analysis Complete';

    // Key findings from pulse
    if (pulse.conflictMomentum > 2) {
        findings.push('Conflict rate is rising - may need intervention');
    }
    if (pulse.coherenceScore < 50) {
        findings.push(`Strategic coherence is low (${pulse.coherenceScore}%) - decisions may lack alignment`);
    }
    if (pulse.velocity > 10) {
        findings.push(`High decision velocity (${pulse.velocity}/day) - ensure quality isn't sacrificed`);
    }

    // Key findings from DNA
    dna.insights.forEach(insight => {
        findings.push(insight.observation);
    });

    // Add projections as findings
    pulse.projections.forEach(proj => {
        if (proj.daysToThreshold && proj.daysToThreshold < 21) {
            findings.push(`${proj.metric} projected to reach warning level in ~${proj.daysToThreshold} days`);
        }
    });

    // Generate recommendations
    if (dna.decisionStyle < 30) {
        recommendations.push('Consider distributing decision authority to prevent bottlenecks');
    }
    if (dna.conflictTolerance < 30 && dna.riskAppetite > 60) {
        recommendations.push('Build mechanisms for healthy debate to support bold moves');
    }
    if (pulse.phase === 'churn') {
        recommendations.push('Focus on resolving open conflicts before new initiatives');
    }
    if (dna.decisionEntropy > 70) {
        recommendations.push('Establish clearer decision criteria to reduce reversals');
    }
    if (decisionCount < 5) {
        recommendations.push('Upload more documents to improve analysis accuracy');
    }

    return {
        headline,
        status,
        keyFindings: findings.slice(0, 5),
        recommendations: recommendations.slice(0, 3)
    };
}

export default router;
