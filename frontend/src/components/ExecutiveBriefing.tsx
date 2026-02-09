import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Newspaper, ChevronRight, RefreshCw, Zap, Target } from 'lucide-react';
import { Card } from '@/components/Card';

interface BriefingSection {
    title: string;
    icon: string;
    content: string;
    severity?: 'info' | 'warning' | 'critical';
    priority?: 'high' | 'medium' | 'low'; // keep for backward compat if needed, but backend uses severity
}

interface ExecutiveBriefingData {
    generatedAt: string;
    executiveSummary: string;
    sections: BriefingSection[];
    keyInsights?: string[]; // Backend sends recommendations/focusAreas, map accordingly if needed
    recommendations?: string[];
    focusAreas?: string[];
}

interface ExecutiveBriefingProps {
    teamId: string;
}

export function ExecutiveBriefing({ teamId }: ExecutiveBriefingProps) {
    const { session } = useAuth();
    const token = session?.access_token;

    const [briefing, setBriefing] = useState<ExecutiveBriefingData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchBriefing = async () => {
        if (!teamId || !token) return;

        try {
            console.log('🔍 [Frontend] Fetching briefing...');
            setLoading(true);
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/teams/${teamId}/briefing`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                console.error('❌ [Frontend] Briefing fetch failed:', response.status, response.statusText);
                throw new Error('Failed to fetch briefing');
            }

            const data = await response.json();
            console.log('🔍 [Frontend] Briefing response:', data);
            
            // Handle both direct briefing and nested briefing.briefing structure
            const briefingData = data.briefing || data;
            
            if (!briefingData.executiveSummary) {
                console.warn('⚠️ [Frontend] No executive summary in briefing data');
            }
            
            setBriefing(briefingData);
        } catch (err) {
            console.error('Error fetching briefing:', err);
            setError('Failed to load briefing');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        console.log('🔍 [Frontend] ExecutiveBriefing mounted, teamId:', teamId);
        fetchBriefing();
    }, [teamId, token]);

    if (loading) return (
        <Card className="h-full p-6 animate-pulse flex flex-col space-y-4">
            <div className="flex justify-between">
                <div className="h-6 w-40 bg-slate-200 rounded" />
                <div className="h-8 w-8 bg-slate-200 rounded-full" />
            </div>
            <div className="h-32 w-full bg-slate-100 rounded" />
            <div className="grid grid-cols-2 gap-3">
                <div className="h-10 w-full bg-slate-100 rounded" />
                <div className="h-10 w-full bg-slate-100 rounded" />
            </div>
            <div className="space-y-2">
                <div className="h-4 w-1/3 bg-slate-200 rounded" />
                <div className="h-4 w-full bg-slate-100 rounded" />
                <div className="h-4 w-5/6 bg-slate-100 rounded" />
            </div>
            <div className="text-xs text-slate-400 text-center mt-2">
                Generating AI briefing... This may take a moment.
            </div>
        </Card>
    );

    if (error) return (
        <Card className="h-full p-6 border-red-200 bg-red-50">
            <div className="flex items-start gap-3">
                <div className="text-red-500">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <div className="flex-1">
                    <div className="text-sm font-medium text-red-800 mb-1">Failed to load briefing</div>
                    <div className="text-xs text-red-600">{error}</div>
                    <button 
                        onClick={fetchBriefing}
                        className="mt-3 text-xs text-red-700 hover:text-red-900 underline"
                    >
                        Try again
                    </button>
                </div>
            </div>
        </Card>
    );

    if (!briefing || !briefing.executiveSummary) {
        return (
            <Card className="h-full p-6 border-yellow-200 bg-yellow-50">
                <div className="flex items-start gap-3">
                    <div className="text-yellow-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <div className="text-sm font-medium text-yellow-800 mb-1">No briefing available</div>
                        <div className="text-xs text-yellow-700">Upload some documents to generate your first briefing</div>
                    </div>
                </div>
            </Card>
        );
    }

    return (
        <Card className="h-full p-0 flex flex-col overflow-hidden border-slate-200 shadow-sm">
            <div className="p-6 pb-4 border-b border-slate-100">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                            <Newspaper className="w-5 h-5 text-blue-600" />
                            Daily Briefing
                        </h3>
                        <p className="text-sm text-slate-500">
                            {new Date(briefing.generatedAt).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                        </p>
                    </div>
                    <button onClick={fetchBriefing} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <RefreshCw className="w-4 h-4 text-slate-400" />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* AI Summary */}
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-yellow-100/30 to-transparent rounded-bl-full pointer-events-none" />
                    <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-slate-800">
                        <Zap className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        Executive Summary
                    </div>
                    <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap font-medium relative z-10">
                        {briefing.executiveSummary}
                    </div>
                </div>

                {/* Key Focus Areas */}
                {briefing.focusAreas && briefing.focusAreas.length > 0 && (
                    <div className="grid grid-cols-2 gap-3">
                        {briefing.focusAreas.slice(0, 4).map((area, i) => (
                            <div key={i} className="flex items-start gap-2 p-3 rounded bg-white border border-slate-100 shadow-sm hover:border-indigo-100 transition-colors">
                                <Target className="w-3.5 h-3.5 text-indigo-500 mt-0.5 shrink-0" />
                                <span className="text-xs text-slate-600 font-medium leading-tight">{area}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Detailed Sections */}
                <div className="space-y-5">
                    {briefing.sections.map((section, idx) => (
                        <div key={idx} className="border-t border-slate-100 pt-4 first:border-0 first:pt-0">
                            <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-900 mb-2">
                                <span className="text-lg">{section.icon}</span>
                                {section.title}
                                {section.severity === 'critical' && (
                                    <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-red-100 text-red-700 rounded-full">
                                        Critical
                                    </span>
                                )}
                            </h4>
                            <p className="text-xs text-slate-500 leading-relaxed whitespace-pre-wrap">
                                {section.content}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </Card>
    );
}
