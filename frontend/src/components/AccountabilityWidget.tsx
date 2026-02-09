import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Brain, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { Card } from '@/components/Card';

interface AccountabilityInsight {
    id: string;
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    suggestedAction: string;
}

interface AccountabilityWidgetProps {
    teamId: string;
}

export function AccountabilityWidget({ teamId }: AccountabilityWidgetProps) {
    const { session } = useAuth();
    const [insights, setInsights] = useState<AccountabilityInsight[]>([]);
    const [score, setScore] = useState<number>(100);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (teamId && session?.access_token) {
            fetchAccountability();
        }
    }, [teamId, session]);

    const fetchAccountability = async () => {
        if (!teamId || !session?.access_token) return;

        try {
            setLoading(true);
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/teams/${teamId}/memory-gaps`,
                { headers: { 'Authorization': `Bearer ${session.access_token}` } }
            );

            if (!response.ok) throw new Error('Failed to fetch');

            const data = await response.json();
            setInsights(data.gaps || []);
            setScore(data.accountabilityScore || 100);
        } catch (err) {
            console.error('Error fetching accountability:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Card className="p-6 animate-pulse">
                <div className="h-6 w-40 bg-slate-200 rounded mb-4" />
                <div className="h-20 bg-slate-100 rounded" />
            </Card>
        );
    }

    const scoreColor = score >= 80 ? 'text-aligned' : score >= 60 ? 'text-yellow-600' : 'text-conflict';
    const scoreBg = score >= 80 ? 'bg-aligned-light' : score >= 60 ? 'bg-yellow-100' : 'bg-conflict-light';

    return (
        <Card className="p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-full pointer-events-none" />

            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                        <Brain className="w-5 h-5 text-primary" />
                        Strategic Memory
                    </h3>
                    <p className="text-sm text-slate-500">Accountability & follow-through</p>
                </div>
                <button onClick={fetchAccountability} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <RefreshCw className="w-4 h-4 text-slate-400" />
                </button>
            </div>

            <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">Accountability Score</span>
                    <span className={`text-2xl font-bold ${scoreColor}`}>{score}</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${scoreBg}`} style={{ width: `${score}%` }} />
                </div>
            </div>

            {insights.length === 0 ? (
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-100">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-700">No critical gaps detected</span>
                </div>
            ) : (
                <div className="space-y-3">
                    <div className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
                        Critical Gaps ({insights.length})
                    </div>
                    {insights.slice(0, 3).map((insight) => (
                        <div key={insight.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                            <div className="flex items-start gap-2">
                                <AlertTriangle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                                    insight.severity === 'critical' ? 'text-red-500' :
                                    insight.severity === 'high' ? 'text-orange-500' : 'text-yellow-500'
                                }`} />
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-slate-900 truncate">{insight.title}</div>
                                    <div className="text-xs text-slate-600 mt-1 line-clamp-2">{insight.description}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {insights.length > 3 && (
                        <div className="text-xs text-slate-500 text-center pt-2">
                            +{insights.length - 3} more gaps
                        </div>
                    )}
                </div>
            )}
        </Card>
    );
}
