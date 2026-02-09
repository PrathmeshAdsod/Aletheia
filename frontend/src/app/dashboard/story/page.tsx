'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTeam } from '@/contexts/TeamContext';
import { BookOpen, TrendingUp, AlertCircle, Sparkles, RefreshCw, Clock } from 'lucide-react';
import { Card } from '@/components/Card';

interface StrategicStory {
    executiveSummary: string;
    fullNarrative: string;
    chapters: Array<{
        title: string;
        period: string;
        narrative: string;
        sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
    }>;
    currentTrajectory: string;
    hiddenTensions: string[];
    emergingPatterns: string[];
    decisionCount: number;
    resolutionRate: number;
    themes: Array<{ theme: string; trajectory: string; strength: number }>;
}

export default function StrategicStoryPage() {
    const { user, session } = useAuth();
    const { selectedTeam } = useTeam();
    const router = useRouter();
    const [story, setStory] = useState<StrategicStory | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) router.push('/login');
    }, [user, router]);

    useEffect(() => {
        if (selectedTeam && session?.access_token) {
            fetchStory();
        }
    }, [selectedTeam, session]);

    const fetchStory = async (refresh = false) => {
        if (!selectedTeam || !session?.access_token) return;

        try {
            setLoading(true);
            const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/teams/${selectedTeam.team.id}/story${refresh ? '?refresh=true' : ''}`;
            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${session.access_token}` }
            });

            if (!response.ok) throw new Error('Failed to fetch story');

            const data = await response.json();
            setStory(data.story);
        } catch (err) {
            console.error('Error fetching story:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-5xl mx-auto space-y-6">
                <div className="h-8 w-64 bg-slate-200 rounded animate-pulse" />
                <Card className="p-8 space-y-4">
                    <div className="h-6 w-full bg-slate-100 rounded animate-pulse" />
                </Card>
            </div>
        );
    }

    if (!story) return null;

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-h1 text-text-primary mb-2 flex items-center gap-3">
                        <BookOpen className="w-8 h-8 text-primary" />
                        Strategic Evolution Story
                    </h1>
                </div>
                <button onClick={() => fetchStory(true)} className="btn-secondary flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                </button>
            </div>

            <Card className="p-8 bg-gradient-to-br from-primary/5 to-transparent border-l-4 border-l-primary">
                <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <h2 className="text-h2 text-text-primary">Executive Summary</h2>
                </div>
                <p className="text-lg text-text-primary leading-relaxed">{story.executiveSummary}</p>
            </Card>

            <div className="grid grid-cols-3 gap-4">
                <Card className="p-6">
                    <div className="text-meta text-text-tertiary uppercase tracking-wider mb-2">Decisions</div>
                    <div className="text-4xl font-semibold text-primary">{story.decisionCount}</div>
                </Card>
                <Card className="p-6">
                    <div className="text-meta text-text-tertiary uppercase tracking-wider mb-2">Resolution Rate</div>
                    <div className="text-4xl font-semibold text-aligned">{story.resolutionRate}%</div>
                </Card>
                <Card className="p-6">
                    <div className="text-meta text-text-tertiary uppercase tracking-wider mb-2">Themes</div>
                    <div className="text-4xl font-semibold text-text-primary">{story.themes?.length || 0}</div>
                </Card>
            </div>

            <Card className="p-8">
                <h2 className="text-h2 text-text-primary mb-6">The Story</h2>
                <p className="text-body text-text-primary leading-relaxed whitespace-pre-line">{story.fullNarrative}</p>
            </Card>

            {story.chapters?.map((chapter, idx) => (
                <Card key={idx} className="p-6 border-l-4" style={{
                    borderLeftColor: chapter.sentiment === 'positive' ? '#10b981' :
                        chapter.sentiment === 'negative' ? '#ef4444' : '#6b7280'
                }}>
                    <h3 className="text-h3 text-text-primary">{chapter.title}</h3>
                    <p className="text-small text-text-tertiary flex items-center gap-2 mt-1">
                        <Clock className="w-4 h-4" />
                        {chapter.period}
                    </p>
                    <p className="text-body text-text-secondary mt-4">{chapter.narrative}</p>
                </Card>
            ))}

            <Card className="p-8 bg-gradient-to-br from-aligned/5 to-transparent">
                <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-aligned" />
                    <h2 className="text-h2 text-text-primary">Current Trajectory</h2>
                </div>
                <p className="text-lg text-text-primary">{story.currentTrajectory}</p>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {story.hiddenTensions?.length > 0 && (
                    <Card className="p-6">
                        <h3 className="text-h3 text-text-primary mb-4">Hidden Tensions</h3>
                        <ul className="space-y-2">
                            {story.hiddenTensions.map((tension, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-small text-text-secondary">
                                    <AlertCircle className="w-4 h-4 text-conflict mt-0.5 flex-shrink-0" />
                                    {tension}
                                </li>
                            ))}
                        </ul>
                    </Card>
                )}

                {story.emergingPatterns?.length > 0 && (
                    <Card className="p-6">
                        <h3 className="text-h3 text-text-primary mb-4">Emerging Patterns</h3>
                        <ul className="space-y-2">
                            {story.emergingPatterns.map((pattern, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-small text-text-secondary">
                                    <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                    {pattern}
                                </li>
                            ))}
                        </ul>
                    </Card>
                )}
            </div>
        </div>
    );
}
