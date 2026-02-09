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
    requireTeamAccess,
    async (req: Request, res: Response): Promise<void> => {
        try {
            const { teamId } = req.params;
            const supabase = supabaseService.client;

            // Fetch all decisions for the team
            const { data: decisions, error } = await supabase
                .from('cme_decisions')
                .select('*')
                .eq('team_id', teamId)
                .order('timestamp', { ascending: false });

            if (error) {
                console.error('Error fetching decisions for pulse:', error);
                res.status(500).json({ error: 'Failed to fetch decisions' });
                return;
            }

            // Calculate current pulse
            const pulse = await strategicPulseService.calculatePulse(decisions || []);

            // Store snapshot (async, don't wait)
            strategicPulseService.storePulse(supabase, teamId, pulse).catch(console.error);

            res.json({
                success: true,
                pulse,
                calculatedAt: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error calculating pulse:', error);
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
    requireTeamAccess,
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
    requireTeamAccess,
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
                .from('cme_decisions')
                .select('*')
                .eq('team_id', teamId)
                .order('timestamp', { ascending: false });

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
    requireTeamAccess,
    async (req: Request, res: Response): Promise<void> => {
        try {
            const { teamId } = req.params;
            const supabase = supabaseService.client;

            // Fetch all decisions
            const { data: decisions, error } = await supabase
                .from('cme_decisions')
                .select('*')
                .eq('team_id', teamId)
                .order('timestamp', { ascending: false });

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
    requireTeamAccess,
    async (req: Request, res: Response): Promise<void> => {
        try {
            const { teamId } = req.params;
            const supabase = supabaseService.client;

            // Fetch decisions
            const { data: decisions, error } = await supabase
                .from('cme_decisions')
                .select('*')
                .eq('team_id', teamId)
                .order('timestamp', { ascending: false });

            if (error) {
                console.error('Error fetching decisions for risks:', error);
                res.status(500).json({ error: 'Failed to fetch decisions' });
                return;
            }

            // Scan for risks
            const riskResult = await riskRadarService.scanRisks(decisions || []);

            // Store risk signals (async)
            riskRadarService.storeRiskScan(supabase, teamId, riskResult).catch(console.error);

            res.json({
                success: true,
                ...riskResult,
                scannedAt: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error scanning risks:', error);
            res.status(500).json({ error: 'Failed to scan for risks' });
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
    requireTeamAccess,
    async (req: Request, res: Response): Promise<void> => {
        try {
            const { teamId } = req.params;
            const supabase = supabaseService.client;

            // Fetch decisions
            const { data: decisions, error } = await supabase
                .from('cme_decisions')
                .select('*')
                .eq('team_id', teamId)
                .order('timestamp', { ascending: false });

            if (error) {
                console.error('Error fetching decisions for briefing:', error);
                res.status(500).json({ error: 'Failed to fetch decisions' });
                return;
            }

            // Generate briefing
            const briefing = await executiveBriefingService.generateBriefing(decisions || []);

            // Store briefing (async)
            executiveBriefingService.storeBriefing(supabase, teamId, briefing).catch(console.error);

            res.json({
                success: true,
                briefing
            });
        } catch (error) {
            console.error('Error generating briefing:', error);
            res.status(500).json({ error: 'Failed to generate executive briefing' });
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
    requireTeamAccess,
    async (req: Request, res: Response): Promise<void> => {
        try {
            const { teamId } = req.params;
            const supabase = supabaseService.client;

            // Fetch decisions
            const { data: decisions, error: decisionsError } = await supabase
                .from('cme_decisions')
                .select('*')
                .eq('team_id', teamId)
                .order('timestamp', { ascending: false });

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
