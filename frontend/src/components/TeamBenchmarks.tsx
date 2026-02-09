import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { BarChart3, TrendingUp, TrendingDown, Users, Trophy } from 'lucide-react';
import { Card } from '@/components/Card';

interface BenchmarkComparison {
    metric: string;
    yourValue: number;
    benchmarkAvg: number;
    percentile: number;
    delta: number;
    assessment: 'above' | 'average' | 'below';
    insight: string;
}

interface BenchmarkData {
    teamSizeBucket: string;
    sampleSize: number;
    comparisons: BenchmarkComparison[];
    summary: string;
    strengths: string[];
    improvements: string[];
}

interface TeamBenchmarksProps {
    teamId: string;
}

export function TeamBenchmarks({ teamId }: TeamBenchmarksProps) {
    const { session } = useAuth();
    const token = session?.access_token;

    const [data, setData] = useState<BenchmarkData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchBenchmarks = async () => {
        if (!teamId || !token) return;

        try {
            setLoading(true);
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/teams/${teamId}/benchmarks`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to fetch benchmarks');

            const result = await response.json();
            if (result.success && result.benchmarks) {
                setData(result.benchmarks);
            } else {
                setData(result); // Fallback if structure is flat
            }
        } catch (err) {
            console.error('Error fetching benchmarks:', err);
            setError('Failed to load benchmarks');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBenchmarks();
    }, [teamId, token]);

    if (loading) return (
        <Card className="h-full p-6 animate-pulse">
            <div className="h-6 w-40 bg-slate-200 rounded mb-4" />
            <div className="space-y-6">
                {[1, 2, 3].map(i => (
                    <div key={i} className="space-y-2">
                        <div className="flex justify-between">
                            <div className="h-4 w-24 bg-slate-200 rounded" />
                            <div className="h-4 w-16 bg-slate-200 rounded" />
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded" />
                    </div>
                ))}
            </div>
        </Card>
    );

    if (error) return (
        <Card className="h-full p-6 border-red-200 bg-red-50">
            <div className="text-red-500 text-sm">{error}</div>
        </Card>
    );

    if (!data) return null;

    // Helper to find metric
    const getMetric = (name: string) => data.comparisons?.find(c => c.metric === name);

    const velocity = getMetric('Decision Velocity');
    const coherence = getMetric('Coherence Score');
    const conflict = getMetric('Conflict Rate');

    return (
        <Card className="h-full p-6 border-slate-200 shadow-sm flex flex-col">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-purple-600" />
                        Industry Benchmarks
                    </h3>
                    <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-1">
                        <Users className="w-3 h-3" />
                        vs {data.teamSizeBucket} Teams ({data.sampleSize} samples)
                    </p>
                </div>
            </div>

            <div className="space-y-6 flex-1">
                {/* Metrics List */}
                <div className="space-y-5">
                    {velocity && (
                        <BenchmarkItem
                            label="Decision Velocity"
                            metric={velocity}
                            color="bg-blue-500"
                        />
                    )}
                    {coherence && (
                        <BenchmarkItem
                            label="Strategic Alignment"
                            metric={coherence}
                            color="bg-emerald-500"
                        />
                    )}
                    {conflict && (
                        <BenchmarkItem
                            label="Conflict Rate"
                            metric={conflict}
                            color="bg-amber-500"
                        />
                    )}
                </div>

                {/* Key Insight */}
                {data.summary && (
                    <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-100 flex gap-3">
                        <Trophy className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                        <div className="text-sm text-purple-800 leading-snug">
                            {data.summary}
                        </div>
                    </div>
                )}

                <div className="text-[10px] text-slate-400 text-center mt-auto pt-2">
                    Based on anonymized data from {data.sampleSize} similar teams
                </div>
            </div>
        </Card>
    );
}

function BenchmarkItem({ label, metric, color }: { label: string, metric: BenchmarkComparison, color: string }) {
    if (!metric) return null;

    const isPositive = metric.delta >= 0;
    const DeltaIcon = isPositive ? TrendingUp : TrendingDown;
    const deltaColor = isPositive ? 'text-green-600' : 'text-red-600';

    return (
        <div>
            <div className="flex justify-between items-end mb-1.5">
                <span className="text-sm font-medium text-slate-700">{label}</span>
                <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Top {100 - metric.percentile}%</span>
                    <span className={`text-xs font-bold ${deltaColor} flex items-center bg-slate-50 px-1 py-0.5 rounded border border-slate-100`}>
                        <DeltaIcon className="w-3 h-3 mr-1" />
                        {Math.abs(metric.delta)}% {isPositive ? 'above' : 'below'} avg
                    </span>
                </div>
            </div>

            <div className="relative pt-1">
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1 px-0.5 font-medium uppercase tracking-wide">
                    <span>Low</span>
                    <span>Average</span>
                    <span>Top Tier</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden relative">
                    {/* Average Marker */}
                    <div className="absolute top-0 bottom-0 w-0.5 bg-slate-300 z-10" style={{ left: '50%' }} />

                    {/* Value Bar */}
                    <div
                        className={`h-full rounded-full ${color}`}
                        style={{ width: `${metric.percentile}%` }}
                    />
                </div>
            </div>
        </div>
    );
}
