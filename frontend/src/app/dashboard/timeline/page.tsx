'use client';

/**
 * Timeline Page - Temporal Decision Intelligence
 * Shows chronological decision history with conflict/resolution events
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Clock,
    FileText,
    AlertTriangle,
    CheckCircle,
    Upload,
    GitBranch,
    Filter,
    Calendar
} from 'lucide-react';
import { Card } from '@/components/Card';
import { useAuth } from '@/contexts/AuthContext';
import { useTeam } from '@/contexts/TeamContext';

interface TimelineEvent {
    id: string;
    type: 'decision' | 'conflict' | 'resolution' | 'upload';
    title: string;
    description: string;
    timestamp: string;
    metadata?: {
        actor?: string;
        fileName?: string;
        decisionCount?: number;
        severity?: number;
    };
}

export default function TimelinePage() {
    const { user, session } = useAuth();
    const { selectedTeam, loading: teamsLoading } = useTeam();
    const router = useRouter();
    const [events, setEvents] = useState<TimelineEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'decisions' | 'conflicts' | 'uploads'>('all');

    useEffect(() => {
        if (!user && !teamsLoading) {
            router.push('/login');
        }
    }, [user, teamsLoading, router]);

    useEffect(() => {
        if (selectedTeam && session?.access_token) {
            fetchTimelineEvents();
        }
    }, [selectedTeam, session]);

    async function fetchTimelineEvents() {
        if (!selectedTeam || !session?.access_token) return;

        try {
            setLoading(true);
            // Simulate timeline data - in production this would fetch from API
            // TODO: Add actual timeline API endpoint
            const mockEvents: TimelineEvent[] = [
                {
                    id: '1',
                    type: 'upload',
                    title: 'Document Uploaded',
                    description: 'strategy_q1_2026.pdf processed successfully',
                    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
                    metadata: { fileName: 'strategy_q1_2026.pdf', decisionCount: 12 }
                },
                {
                    id: '2',
                    type: 'conflict',
                    title: 'Conflict Detected',
                    description: 'Budget allocation contradicts previous Q4 decision',
                    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
                    metadata: { severity: 7 }
                },
                {
                    id: '3',
                    type: 'decision',
                    title: 'Decision Extracted',
                    description: 'Engineering team approved Kubernetes migration',
                    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
                    metadata: { actor: 'Engineering Lead' }
                },
                {
                    id: '4',
                    type: 'resolution',
                    title: 'Conflict Resolved',
                    description: 'Marketing timeline updated to align with product roadmap',
                    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
                },
            ];
            setEvents(mockEvents);
        } catch (error) {
            console.error('Failed to fetch timeline:', error);
        } finally {
            setLoading(false);
        }
    }

    const getEventIcon = (type: TimelineEvent['type']) => {
        switch (type) {
            case 'upload':
                return <Upload className="w-4 h-4 text-primary" />;
            case 'conflict':
                return <AlertTriangle className="w-4 h-4 text-conflict" />;
            case 'resolution':
                return <CheckCircle className="w-4 h-4 text-aligned" />;
            case 'decision':
                return <GitBranch className="w-4 h-4 text-text-secondary" />;
        }
    };

    const getEventColor = (type: TimelineEvent['type']) => {
        switch (type) {
            case 'upload':
                return 'bg-primary';
            case 'conflict':
                return 'bg-conflict';
            case 'resolution':
                return 'bg-aligned';
            case 'decision':
                return 'bg-neutral';
        }
    };

    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now.getTime() - date.getTime();

        if (diff < 1000 * 60) return 'Just now';
        if (diff < 1000 * 60 * 60) return `${Math.floor(diff / (1000 * 60))}m ago`;
        if (diff < 1000 * 60 * 60 * 24) return `${Math.floor(diff / (1000 * 60 * 60))}h ago`;
        return date.toLocaleDateString();
    };

    const filteredEvents = events.filter(event => {
        if (filter === 'all') return true;
        if (filter === 'decisions') return event.type === 'decision';
        if (filter === 'conflicts') return event.type === 'conflict' || event.type === 'resolution';
        if (filter === 'uploads') return event.type === 'upload';
        return true;
    });

    if (teamsLoading || loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-text-secondary">Loading timeline...</span>
                </div>
            </div>
        );
    }

    if (!selectedTeam) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <Clock className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
                    <p className="text-text-secondary">No team selected</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-h1 text-text-primary mb-2">Timeline</h1>
                    <p className="text-body text-text-secondary">
                        Chronological view of decision evolution in {selectedTeam.team.name}
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
                {(['all', 'decisions', 'conflicts', 'uploads'] as const).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-lg text-small font-medium transition-colors ${filter === f
                                ? 'bg-primary text-white'
                                : 'bg-neutral-light text-text-secondary hover:bg-border'
                            }`}
                    >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>

            {/* Timeline */}
            <Card className="p-6">
                {filteredEvents.length > 0 ? (
                    <div className="relative">
                        {/* Timeline Line */}
                        <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-border" />

                        <div className="space-y-6">
                            {filteredEvents.map((event, index) => (
                                <div key={event.id} className="relative flex gap-4">
                                    {/* Timeline Dot */}
                                    <div className={`w-10 h-10 rounded-full ${getEventColor(event.type)} flex items-center justify-center flex-shrink-0 z-10 ring-4 ring-surface`}>
                                        {getEventIcon(event.type)}
                                    </div>

                                    {/* Event Content */}
                                    <div className="flex-1 pb-6">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <h3 className="text-body font-medium text-text-primary">{event.title}</h3>
                                                <p className="text-small text-text-secondary mt-0.5">{event.description}</p>
                                                {event.metadata && (
                                                    <div className="flex items-center gap-3 mt-2">
                                                        {event.metadata.actor && (
                                                            <span className="text-meta text-text-tertiary">
                                                                by {event.metadata.actor}
                                                            </span>
                                                        )}
                                                        {event.metadata.decisionCount && (
                                                            <span className="px-2 py-0.5 bg-primary-light text-primary text-meta rounded-full">
                                                                {event.metadata.decisionCount} decisions
                                                            </span>
                                                        )}
                                                        {event.metadata.severity && (
                                                            <span className="px-2 py-0.5 bg-conflict-light text-conflict text-meta rounded-full">
                                                                Severity {event.metadata.severity}/10
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            <span className="text-meta text-text-tertiary whitespace-nowrap">
                                                {formatTimestamp(event.timestamp)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <div className="w-16 h-16 bg-neutral-light rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Clock className="w-8 h-8 text-text-tertiary" />
                        </div>
                        <h3 className="text-h3 text-text-primary mb-2">No Timeline Events</h3>
                        <p className="text-text-secondary mb-4">
                            Upload documents to start tracking decision evolution
                        </p>
                        <a
                            href="/dashboard/auditor"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-small font-medium hover:bg-primary-hover transition-colors"
                        >
                            <Upload className="w-4 h-4" />
                            Upload Document
                        </a>
                    </div>
                )}
            </Card>
        </div>
    );
}
