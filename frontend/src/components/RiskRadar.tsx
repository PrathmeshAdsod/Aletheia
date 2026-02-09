import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Shield, AlertTriangle, Activity, Eye, Zap, RefreshCw } from 'lucide-react';
import { Card } from '@/components/Card';

interface RiskSignal {
    type: string;
    strength: number; // 0-1
    description: string;
    detectedAt: string;
}

interface RiskAnalysis {
    overallRisk: number; // 0-100
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    signals: RiskSignal[];
    activeDetectors: {
        philosophicalDrift: boolean;
        decisionDecay: boolean;
        actorOverload: boolean;
        blindSpots: boolean;
        hiddenTensions: boolean;
        reversalPatterns: boolean;
    };
    summary: string;
}

interface RiskRadarProps {
    teamId: string;
}

export function RiskRadar({ teamId }: RiskRadarProps) {
    const { session } = useAuth();
    const token = session?.access_token;

    const [risks, setRisks] = useState<RiskAnalysis | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchRisks = async () => {
        if (!teamId || !token) return;

        try {
            setLoading(true);
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/teams/${teamId}/risks`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to fetch risk analysis');

            const data = await response.json();
            
            // Ensure activeDetectors exists with default values
            if (data.success && !data.activeDetectors) {
                data.activeDetectors = {
                    philosophicalDrift: false,
                    decisionDecay: false,
                    actorOverload: false,
                    blindSpots: false,
                    hiddenTensions: false,
                    reversalPatterns: false
                };
            }
            
            setRisks(data);
        } catch (err) {
            console.error('Error fetching risk radar:', err);
            setError('Failed to load risk analysis');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRisks();
    }, [teamId, token]);

    if (loading) return (
        <Card className="h-full p-6 animate-pulse">
            <div className="h-6 w-32 bg-slate-200 rounded mb-4" />
            <div className="space-y-4">
                <div className="h-20 bg-slate-100 rounded" />
                <div className="h-20 bg-slate-100 rounded" />
            </div>
        </Card>
    );

    if (error) return (
        <Card className="h-full p-6 border-red-200 bg-red-50">
            <div className="text-red-500 text-sm">{error}</div>
        </Card>
    );

    if (!risks) return null;

    const riskColor = getRiskColor(risks.riskLevel);
    const riskBg = getRiskBg(risks.riskLevel);
    const riskBorder = getRiskBorder(risks.riskLevel);

    return (
        <Card className="h-full p-6 relative overflow-hidden flex flex-col">
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-${riskColor}-100/20 to-transparent rounded-bl-full pointer-events-none`} />

            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                        <Shield className={`w-5 h-5 text-${riskColor}-600`} />
                        Risk Radar
                    </h3>
                    <p className="text-sm text-slate-500">Targeted early warning system</p>
                </div>
                <div className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${riskBg} ${riskBorder} text-${riskColor}-700 border`}>
                    {risks.riskLevel} RISK ({risks.overallRisk})
                </div>
            </div>

            <div className="space-y-6 flex-1">
                {/* Active Signals */}
                <div>
                    <h4 className="text-xs font-semibold uppercase text-slate-500 mb-3 tracking-wider">Active Signals</h4>
                    {risks.signals.length === 0 ? (
                        <div className="text-sm text-slate-500 italic flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-100">
                            <Shield className="w-4 h-4 text-green-500" />
                            No significant risks detected
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {risks.signals.map((signal, idx) => (
                                <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                    <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                                    <div className="flex-1">
                                        <div className="text-sm font-medium text-slate-900">{formatSignalType(signal.type)}</div>
                                        <div className="text-xs text-slate-600 mt-1 mb-2">{signal.description}</div>
                                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                            <div
                                                className="bg-amber-500 h-full rounded-full"
                                                style={{ width: `${signal.strength * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Detector Status Grid */}
                <div>
                    <h4 className="text-xs font-semibold uppercase text-slate-500 mb-3 tracking-wider">Active Detectors</h4>
                    <div className="grid grid-cols-2 gap-2">
                        <DetectorStatus label="Philosophical Drift" active={risks.activeDetectors?.philosophicalDrift || false} icon={Activity} />
                        <DetectorStatus label="Decision Decay" active={risks.activeDetectors?.decisionDecay || false} icon={RefreshCw} />
                        <DetectorStatus label="Actor Overload" active={risks.activeDetectors?.actorOverload || false} icon={Zap} />
                        <DetectorStatus label="Blind Spots" active={risks.activeDetectors?.blindSpots || false} icon={Eye} />
                    </div>
                </div>

                <div className="text-[10px] text-slate-400 text-center pt-2 mt-auto">
                    Refreshed automatically based on decision stream
                </div>
            </div>
        </Card>
    );
}

function DetectorStatus({ label, active, icon: Icon }: { label: string, active: boolean, icon: any }) {
    return (
        <div className={`flex items-center gap-2 p-2 rounded border ${active ? 'bg-indigo-50 border-indigo-100 text-indigo-700' : 'bg-slate-50 border-slate-100 text-slate-400'
            }`}>
            <Icon className="w-3.5 h-3.5" />
            <span className="text-xs font-medium truncate">{label}</span>
            <div className={`w-1.5 h-1.5 rounded-full ml-auto flex-shrink-0 ${active ? 'bg-indigo-500 animate-pulse' : 'bg-slate-300'}`} />
        </div>
    );
}

function getRiskColor(level: string) {
    switch (level) {
        case 'critical': return 'red';
        case 'high': return 'orange';
        case 'medium': return 'amber';
        case 'low': return 'green';
        default: return 'slate';
    }
}

function getRiskBg(level: string) {
    switch (level) {
        case 'critical': return 'bg-red-50';
        case 'high': return 'bg-orange-50';
        case 'medium': return 'bg-amber-50';
        case 'low': return 'bg-green-50';
        default: return 'bg-slate-50';
    }
}

function getRiskBorder(level: string) {
    switch (level) {
        case 'critical': return 'border-red-200';
        case 'high': return 'border-orange-200';
        case 'medium': return 'border-amber-200';
        case 'low': return 'border-green-200';
        default: return 'border-slate-200';
    }
}

function formatSignalType(type: string) {
    return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}
