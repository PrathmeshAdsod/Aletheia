'use client';

/**
 * Production-Ready Flags Page
 * - Pagination
 * - Filtering by severity
 * - Search
 * - Click to expand details
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Info, Search, Filter, ChevronDown, ChevronUp, X } from 'lucide-react';
import { Card } from '@/components/Card';
import { KPICard } from '@/components/KPICard';
import { useAuth } from '@/contexts/AuthContext';
import { useTeam } from '@/contexts/TeamContext';
import { metricsApi } from '@/lib/team-api';

interface ConflictFlag {
    flag_id: string;
    decision_a: string;
    decision_b: string;
    severity: number;
    detected_at: string;
    resolved: boolean;
    conflict_path?: string[];
}

export default function Flags() {
    const { user, session } = useAuth();
    const { selectedTeam } = useTeam();
    const router = useRouter();

    const [flags, setFlags] = useState<ConflictFlag[]>([]);
    const [filteredFlags, setFilteredFlags] = useState<ConflictFlag[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedFlag, setExpandedFlag] = useState<string | null>(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [severityFilter, setSeverityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
    const [showResolved, setShowResolved] = useState(false);

    if (!user) {
        router.push('/login');
        return null;
    }

    if (!selectedTeam) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <p className="text-text-secondary mb-4">No team selected</p>
                    <p className="text-text-tertiary text-sm">Please contact an admin to be added to a team</p>
                </div>
            </div>
        );
    }

    useEffect(() => {
        if (selectedTeam && session?.access_token) {
            fetchFlags();
        }
    }, [selectedTeam, session]);

    useEffect(() => {
        // Apply filters
        let filtered = [...flags];

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(f =>
                f.decision_a.toLowerCase().includes(searchTerm.toLowerCase()) ||
                f.decision_b.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Severity filter
        if (severityFilter !== 'all') {
            filtered = filtered.filter(f => {
                if (severityFilter === 'high') return f.severity >= 7;
                if (severityFilter === 'medium') return f.severity >= 4 && f.severity < 7;
                if (severityFilter === 'low') return f.severity < 4;
                return true;
            });
        }

        // Resolved filter
        if (!showResolved) {
            filtered = filtered.filter(f => !f.resolved);
        }

        setFilteredFlags(filtered);
        setCurrentPage(1); // Reset to first page on filter change
    }, [flags, searchTerm, severityFilter, showResolved]);

    async function fetchFlags() {
        if (!selectedTeam || !session?.access_token) return;

        try {
            setLoading(true);
            const data = await metricsApi.getFlags(session.access_token, selectedTeam.team.id);
            setFlags(data.flags || []);
        } catch (error) {
            console.error('Failed to fetch flags:', error);
        } finally {
            setLoading(false);
        }
    }

    const totalFlags = flags.length;
    const unresolvedFlags = flags.filter(f => !f.resolved).length;
    const avgSeverity = flags.length > 0
        ? (flags.reduce((sum, f) => sum + f.severity, 0) / flags.length).toFixed(1)
        : '0';

    // Pagination
    const totalPages = Math.ceil(filteredFlags.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedFlags = filteredFlags.slice(startIndex, startIndex + itemsPerPage);

    if (loading) {
        return <div className="text-center text-text-tertiary py-20">Loading flags...</div>;
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-h1 text-text-primary mb-2">Conflict Flags</h1>
                <p className="text-body text-text-secondary">
                    Conflict detection for {selectedTeam.team.name}
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KPICard
                    label="Total Conflicts"
                    value={totalFlags}
                    icon={<AlertTriangle size={20} />}
                    sentiment="conflict"
                />
                <KPICard
                    label="Unresolved"
                    value={unresolvedFlags}
                    icon={<AlertTriangle size={20} />}
                    sentiment="neutral"
                />
                <KPICard
                    label="Avg Severity"
                    value={avgSeverity}
                    icon={<Info size={20} />}
                    sentiment="neutral"
                />
            </div>

            {/* Filters */}
            <Card className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" size={18} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search decisions..."
                            className="w-full pl-10 pr-10 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-small text-text-primary placeholder:text-text-tertiary"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    {/* Severity Filter */}
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" size={18} />
                        <select
                            value={severityFilter}
                            onChange={(e) => setSeverityFilter(e.target.value as any)}
                            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-small text-text-primary appearance-none cursor-pointer"
                        >
                            <option value="all">All Severities</option>
                            <option value="high">High (7-10)</option>
                            <option value="medium">Medium (4-6)</option>
                            <option value="low">Low (1-3)</option>
                        </select>
                    </div>

                    {/* Show Resolved Toggle */}
                    <div className="flex items-center">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={showResolved}
                                onChange={(e) => setShowResolved(e.target.checked)}
                                className="w-4 h-4 text-primary border-border rounded focus:ring-primary cursor-pointer"
                            />
                            <span className="text-small text-text-secondary">Show resolved</span>
                        </label>
                    </div>
                </div>

                <div className="mt-4 text-small text-text-tertiary">
                    Showing {paginatedFlags.length} of {filteredFlags.length} conflicts
                </div>
            </Card>

            {/* Conflicts List */}
            <div>
                {filteredFlags.length === 0 ? (
                    <Card className="p-12 text-center">
                        <div className="inline-block p-4 bg-aligned-light rounded-full mb-4">
                            <AlertTriangle className="text-aligned" size={32} />
                        </div>
                        <h3 className="text-h3 text-text-primary mb-2">
                            {searchTerm || severityFilter !== 'all' ? 'No matches found' : 'No Conflicts Detected'}
                        </h3>
                        <p className="text-small text-text-secondary">
                            {searchTerm || severityFilter !== 'all'
                                ? 'Try adjusting your filters'
                                : 'Your institutional knowledge is consistent'}
                        </p>
                    </Card>
                ) : (
                    <>
                        <div className="space-y-4">
                            {paginatedFlags.map((flag) => {
                                const isExpanded = expandedFlag === flag.flag_id;

                                return (
                                    <Card
                                        key={flag.flag_id}
                                        className={`p-6 transition-all ${!flag.resolved ? 'border-l-4 border-l-conflict' : 'opacity-60'
                                            }`}
                                    >
                                        <div
                                            className="flex items-start justify-between cursor-pointer"
                                            onClick={() => setExpandedFlag(isExpanded ? null : flag.flag_id)}
                                        >
                                            <div className="flex items-start gap-3 flex-1">
                                                <div className={`p-2 rounded-lg ${flag.resolved ? 'bg-neutral-light' : 'bg-conflict-light'}`}>
                                                    <AlertTriangle
                                                        className={flag.resolved ? 'text-neutral' : 'text-conflict'}
                                                        size={20}
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="text-body font-semibold text-text-primary">
                                                            Conflict Detected
                                                        </h3>
                                                        <SeverityBadge severity={flag.severity} />
                                                        {flag.resolved && (
                                                            <span className="px-2 py-0.5 bg-aligned-light text-aligned text-meta rounded-full font-medium">
                                                                Resolved
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-meta text-text-tertiary">
                                                        {new Date(flag.detected_at).toLocaleString()}
                                                    </p>

                                                    {/* Preview */}
                                                    {!isExpanded && (
                                                        <div className="mt-3">
                                                            <p className="text-small text-text-secondary line-clamp-1">
                                                                <span className="font-medium">A:</span> {flag.decision_a}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <button className="p-2 hover:bg-neutral-light rounded-lg transition-colors">
                                                {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                            </button>
                                        </div>

                                        {/* Expanded Details */}
                                        {isExpanded && (
                                            <div className="mt-6 ml-11 space-y-4 animate-in fade-in duration-200">
                                                <div>
                                                    <p className="text-meta text-text-tertiary uppercase tracking-wider mb-1">
                                                        Decision A
                                                    </p>
                                                    <p className="text-small text-text-primary bg-neutral-light px-4 py-3 rounded-lg">
                                                        {flag.decision_a}
                                                    </p>
                                                </div>

                                                <div>
                                                    <p className="text-meta text-text-tertiary uppercase tracking-wider mb-1">
                                                        Decision B
                                                    </p>
                                                    <p className="text-small text-text-primary bg-neutral-light px-4 py-3 rounded-lg">
                                                        {flag.decision_b}
                                                    </p>
                                                </div>

                                                {flag.conflict_path && flag.conflict_path.length > 0 && (
                                                    <div>
                                                        <p className="text-meta text-text-tertiary uppercase tracking-wider mb-2">
                                                            Conflict Path ({flag.conflict_path.length} nodes)
                                                        </p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {flag.conflict_path.map((nodeId, i) => (
                                                                nodeId ? (
                                                                    <span
                                                                        key={i}
                                                                        className="px-2 py-1 bg-surface border border-border text-meta text-text-secondary rounded font-mono"
                                                                    >
                                                                        {nodeId.substring(0, 8)}...
                                                                    </span>
                                                                ) : null
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="mt-4 p-4 bg-primary-light rounded-lg">
                                                    <p className="text-meta font-semibold text-primary uppercase tracking-wider mb-1">
                                                        Recommendation
                                                    </p>
                                                    <p className="text-small text-text-primary">
                                                        Review both decisions and determine which should take precedence.
                                                        Update your documentation to resolve the contradiction.
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </Card>
                                );
                            })}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="mt-6 flex items-center justify-between">
                                <p className="text-small text-text-secondary">
                                    Page {currentPage} of {totalPages}
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="px-4 py-2 bg-surface border border-border rounded-lg text-small text-text-primary hover:bg-neutral-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-small font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

function SeverityBadge({ severity }: { severity: number }) {
    let colorClass = 'bg-neutral-light text-neutral';

    if (severity >= 7) {
        colorClass = 'bg-conflict text-white';
    } else if (severity >= 4) {
        colorClass = 'bg-conflict-light text-conflict';
    }

    return (
        <span className={`px-2 py-0.5 rounded-full text-meta font-semibold ${colorClass}`}>
            Severity {severity}/10
        </span>
    );
}
