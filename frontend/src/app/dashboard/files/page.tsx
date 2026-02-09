'use client';

/**
 * Files Page - Document Management with Drag-Drop Reordering
 * Shows uploaded files with processing status and decision counts
 */

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    FolderOpen,
    FileText,
    Upload,
    CheckCircle,
    Clock,
    AlertCircle,
    Search,
    GripVertical,
    ChevronRight
} from 'lucide-react';
import { Card } from '@/components/Card';
import { useAuth } from '@/contexts/AuthContext';
import { useTeam } from '@/contexts/TeamContext';

interface UploadedFile {
    id: string;
    fileName: string;
    fileHash: string;
    status: 'processing' | 'completed' | 'failed';
    decisionCount: number;
    uploadedAt: string;
    uploadedBy?: string;
    uploadedByName?: string;
}

export default function FilesPage() {
    const { user, session } = useAuth();
    const { selectedTeam, loading: teamsLoading } = useTeam();
    const router = useRouter();
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const [isReordering, setIsReordering] = useState(false);

    useEffect(() => {
        if (!user && !teamsLoading) {
            router.push('/login');
        }
    }, [user, teamsLoading, router]);

    useEffect(() => {
        if (selectedTeam && session?.access_token) {
            fetchFiles();
        }
    }, [selectedTeam, session]);

    async function fetchFiles() {
        if (!selectedTeam || !session?.access_token) return;

        try {
            setLoading(true);
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/teams/${selectedTeam.team.id}/files`,
                {
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`,
                        'x-team-id': selectedTeam.team.id,
                    },
                }
            );

            if (response.ok) {
                const data = await response.json();
                const mappedFiles: UploadedFile[] = (data.files || []).map((f: any) => ({
                    id: f.file_hash || f.id || crypto.randomUUID(),
                    fileName: f.file_name || f.fileName || 'Unknown',
                    fileHash: f.file_hash || f.fileHash,
                    status: f.status || 'completed',
                    decisionCount: f.decision_count ?? f.decisionCount ?? 0,
                    uploadedAt: f.uploaded_at || f.uploadedAt || new Date().toISOString(),
                    uploadedBy: f.uploaded_by || f.uploadedBy,
                    uploadedByName: f.uploaded_by_name || f.uploadedByName,
                }));
                setFiles(mappedFiles);
            }
        } catch (error) {
            console.error('Failed to fetch files:', error);
        } finally {
            setLoading(false);
        }
    }

    // Drag handlers
    const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', index.toString());
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (draggedIndex !== null && index !== draggedIndex) {
            setDragOverIndex(index);
        }
    }, [draggedIndex]);

    const handleDragLeave = useCallback(() => {
        setDragOverIndex(null);
    }, []);

    const handleDrop = useCallback(async (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();
        setDragOverIndex(null);

        if (draggedIndex === null || draggedIndex === dropIndex) {
            setDraggedIndex(null);
            return;
        }

        // Reorder files locally
        const newFiles = [...files];
        const [movedFile] = newFiles.splice(draggedIndex, 1);
        newFiles.splice(dropIndex, 0, movedFile);
        setFiles(newFiles);
        setDraggedIndex(null);

        // Call API to persist reorder
        await reorderFiles(newFiles);
    }, [draggedIndex, files]);

    const handleDragEnd = useCallback(() => {
        setDraggedIndex(null);
        setDragOverIndex(null);
    }, []);

    async function reorderFiles(orderedFiles: UploadedFile[]) {
        if (!selectedTeam || !session?.access_token) return;

        try {
            setIsReordering(true);
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/teams/${selectedTeam.team.id}/files/reorder`,
                {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`,
                        'x-team-id': selectedTeam.team.id,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        files: orderedFiles.map(f => f.fileHash)
                    }),
                }
            );

            if (!response.ok) {
                console.error('Failed to reorder files');
                // Refresh to get server state
                await fetchFiles();
            }
        } catch (error) {
            console.error('Failed to reorder files:', error);
            await fetchFiles();
        } finally {
            setIsReordering(false);
        }
    }

    const getStatusBadge = (status: UploadedFile['status']) => {
        switch (status) {
            case 'completed':
                return (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-aligned-light text-aligned text-meta font-medium rounded-full">
                        <CheckCircle className="w-3 h-3" />
                        Processed
                    </span>
                );
            case 'processing':
                return (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-primary-light text-primary text-meta font-medium rounded-full">
                        <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        Processing
                    </span>
                );
            case 'failed':
                return (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-conflict-light text-conflict text-meta font-medium rounded-full">
                        <AlertCircle className="w-3 h-3" />
                        Failed
                    </span>
                );
        }
    };

    const formatDate = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const filteredFiles = files.filter(file =>
        (file.fileName || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (teamsLoading || loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-text-secondary">Loading files...</span>
                </div>
            </div>
        );
    }

    if (!selectedTeam) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <FolderOpen className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
                    <p className="text-text-secondary">No team selected</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-h1 text-text-primary mb-2">Files</h1>
                    <p className="text-body text-text-secondary">
                        Manage uploaded documents and processing history. Drag to reorder files.
                    </p>
                </div>
                <a
                    href="/dashboard/auditor"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-small font-medium hover:bg-primary-hover transition-colors"
                >
                    <Upload className="w-4 h-4" />
                    Upload
                </a>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
                <input
                    type="text"
                    placeholder="Search files..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-surface border border-border rounded-xl text-body text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-glow transition-all"
                />
            </div>

            {/* Reordering Indicator */}
            {isReordering && (
                <div className="flex items-center gap-2 px-4 py-2 bg-primary-light text-primary text-small rounded-lg">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    Saving order...
                </div>
            )}

            {/* Files List */}
            <Card>
                {filteredFiles.length > 0 ? (
                    <div className="divide-y divide-border">
                        {filteredFiles.map((file, index) => (
                            <div
                                key={file.id}
                                draggable={!searchQuery}
                                onDragStart={(e) => handleDragStart(e, index)}
                                onDragOver={(e) => handleDragOver(e, index)}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, index)}
                                onDragEnd={handleDragEnd}
                                className={`p-5 transition-all group ${draggedIndex === index
                                    ? 'opacity-50 bg-primary-light/30'
                                    : dragOverIndex === index
                                        ? 'border-t-2 border-primary bg-primary-light/10'
                                        : 'hover:bg-neutral-light/50'
                                    } ${!searchQuery ? 'cursor-grab active:cursor-grabbing' : ''}`}
                            >
                                <div className="flex items-center gap-4">
                                    {/* Drag Handle */}
                                    {!searchQuery && (
                                        <div className="flex-shrink-0 opacity-30 group-hover:opacity-100 transition-opacity cursor-grab">
                                            <GripVertical className="w-5 h-5 text-text-tertiary" />
                                        </div>
                                    )}

                                    {/* File Icon */}
                                    <div className="w-12 h-12 bg-primary-light rounded-xl flex items-center justify-center flex-shrink-0">
                                        <FileText className="w-6 h-6 text-primary" />
                                    </div>

                                    {/* File Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="text-body font-medium text-text-primary truncate">
                                                {file.fileName}
                                            </h3>
                                            {getStatusBadge(file.status)}
                                        </div>
                                        <div className="flex items-center gap-4 text-small text-text-secondary">
                                            <span>{formatDate(file.uploadedAt)}</span>
                                            {(file.uploadedByName || file.uploadedBy) && (
                                                <>
                                                    <span className="text-text-tertiary">•</span>
                                                    <span>by {file.uploadedByName || file.uploadedBy}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Decision Count */}
                                    {file.status === 'completed' && (
                                        <div className="text-right flex-shrink-0">
                                            <p className="text-h3 text-text-primary">{file.decisionCount}</p>
                                            <p className="text-meta text-text-tertiary">decisions</p>
                                        </div>
                                    )}

                                    {/* Arrow */}
                                    <ChevronRight className="w-5 h-5 text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <div className="w-16 h-16 bg-neutral-light rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <FolderOpen className="w-8 h-8 text-text-tertiary" />
                        </div>
                        <h3 className="text-h3 text-text-primary mb-2">No Files Uploaded</h3>
                        <p className="text-text-secondary mb-4">
                            Upload documents to extract decisions and build your knowledge graph
                        </p>
                        <a
                            href="/dashboard/auditor"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-small font-medium hover:bg-primary-hover transition-colors"
                        >
                            <Upload className="w-4 h-4" />
                            Upload Your First Document
                        </a>
                    </div>
                )}
            </Card>

            {/* Stats Summary */}
            {files.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="p-5">
                        <p className="text-meta text-text-tertiary uppercase tracking-wider mb-1">Total Files</p>
                        <p className="text-h2 text-text-primary">{files.length}</p>
                    </Card>
                    <Card className="p-5">
                        <p className="text-meta text-text-tertiary uppercase tracking-wider mb-1">Processed</p>
                        <p className="text-h2 text-aligned">{files.filter(f => f.status === 'completed').length}</p>
                    </Card>
                    <Card className="p-5">
                        <p className="text-meta text-text-tertiary uppercase tracking-wider mb-1">Total Decisions</p>
                        <p className="text-h2 text-primary">{files.reduce((sum, f) => sum + (f.decisionCount || 0), 0)}</p>
                    </Card>
                </div>
            )}
        </div>
    );
}
