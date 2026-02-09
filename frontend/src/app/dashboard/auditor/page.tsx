'use client';

/**
 * Auditor Page - Team-Scoped Upload
 */

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileText, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { Card } from '@/components/Card';
import { useAuth } from '@/contexts/AuthContext';
import { useTeam } from '@/contexts/TeamContext';
import { uploadApi } from '@/lib/team-api';

type UploadState = 'idle' | 'uploading' | 'analyzing' | 'complete' | 'error';

export default function Auditor() {
    const { user, session } = useAuth();
    const { selectedTeam } = useTeam();
    const router = useRouter();

    const [uploadState, setUploadState] = useState<UploadState>('idle');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [jobId, setJobId] = useState<string | null>(null);
    const [decisionsExtracted, setDecisionExtracted] = useState(0);
    const [errorMessage, setErrorMessage] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Redirect if not authenticated
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

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setUploadState('idle');
        }
    };

    const handleUpload = async () => {
        if (!selectedFile || !session?.access_token) return;

        setUploadState('uploading');
        setErrorMessage('');

        try {
            const response = await uploadApi.uploadFile(
                session.access_token,
                selectedTeam.team.id,
                selectedFile
            );

            setJobId(response.job_id);
            setUploadState('analyzing');

            // Poll for job status
            pollJobStatus(response.job_id);
        } catch (error) {
            setUploadState('error');
            setErrorMessage(error instanceof Error ? error.message : 'Upload failed');
            console.error('Upload error:', error);
        }
    };

    const pollJobStatus = async (jobId: string) => {
        if (!session?.access_token) return;

        try {
            const status = await uploadApi.getJobStatus(
                session.access_token,
                selectedTeam!.team.id,
                jobId
            );

            if (status.status === 'completed') {
                setDecisionExtracted(status.decisions_count || 0);
                setUploadState('complete');
            } else if (status.status === 'failed') {
                setUploadState('error');
                setErrorMessage(status.error || 'Processing failed');
            } else {
                // Still processing, poll again
                setTimeout(() => pollJobStatus(jobId), 2000);
            }
        } catch (error) {
            // Check if it's an auth error (403)
            if (error instanceof Error && error.message.includes('Access denied')) {
                setUploadState('error');
                setErrorMessage('Session expired. Please log out and log back in.');
                return; // Stop polling
            }

            console.error('Status poll error:', error);
            // For other errors, retry once more then give up
            setTimeout(() => pollJobStatus(jobId), 5000);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Page Header */}
            <div>
                <h1 className="text-h1 text-text-primary mb-2">Upload & Analyze</h1>
                <p className="text-body text-text-secondary">
                    Extract decisions from documents for {selectedTeam.team.name}
                </p>
            </div>

            {/* Upload Card - Centered, single-column focus */}
            <Card className="p-8">
                <div
                    className={`
            border-2 border-dashed rounded-lg p-12 text-center transition-all cursor-pointer
            ${selectedFile
                            ? 'border-primary bg-primary-light'
                            : 'border-border hover:border-primary hover:bg-neutral-light'
                        }
          `}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept=".pdf,.txt,.md,.doc,.docx"
                        onChange={handleFileSelect}
                    />

                    {selectedFile ? (
                        <div className="flex items-center justify-center gap-3">
                            <FileText size={24} className="text-primary" />
                            <div className="text-left">
                                <p className="text-body font-medium text-text-primary">{selectedFile.name}</p>
                                <p className="text-small text-text-secondary">
                                    {(selectedFile.size / 1024).toFixed(2)} KB
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <Upload size={48} className="text-text-tertiary mx-auto mb-4" />
                            <p className="text-body font-medium text-text-primary mb-2">
                                Upload a document
                            </p>
                            <p className="text-small text-text-secondary">
                                We'll extract decisions, not text
                            </p>
                            <p className="text-meta text-text-tertiary mt-3">
                                PDF, TXT, MD, DOC, DOCX supported
                            </p>
                        </div>
                    )}
                </div>

                {selectedFile && uploadState === 'idle' && (
                    <button
                        onClick={handleUpload}
                        className="w-full mt-6 px-6 py-3 bg-primary hover:bg-primary-hover text-white rounded-lg font-semibold transition-colors"
                    >
                        Upload & Process
                    </button>
                )}
            </Card>

            {/* Status Timeline */}
            {uploadState !== 'idle' && (
                <Card className="p-8">
                    <h3 className="text-h3 text-text-primary mb-6">Processing Status</h3>

                    <div className="space-y-6">
                        {/* Uploading */}
                        <div className="flex items-start gap-4">
                            <div className={`
                w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                ${uploadState === 'uploading'
                                    ? 'bg-primary text-white'
                                    : uploadState === 'analyzing' || uploadState === 'complete'
                                        ? 'bg-aligned text-white'
                                        : 'bg-neutral-light text-text-tertiary'
                                }
              `}>
                                {uploadState === 'uploading' ? (
                                    <Loader2 size={20} className="animate-spin" />
                                ) : uploadState === 'analyzing' || uploadState === 'complete' ? (
                                    <CheckCircle size={20} />
                                ) : (
                                    <span className="text-small font-semibold">1</span>
                                )}
                            </div>
                            <div className="flex-1 pt-1">
                                <p className="text-body font-medium text-text-primary">Uploading</p>
                                <p className="text-small text-text-secondary mt-0.5">
                                    {uploadState === 'uploading' ? 'Uploading file...' : 'File uploaded successfully'}
                                </p>
                            </div>
                        </div>

                        {/* Analyzing */}
                        <div className="flex items-start gap-4">
                            <div className={`
                w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                ${uploadState === 'analyzing'
                                    ? 'bg-primary text-white'
                                    : uploadState === 'complete'
                                        ? 'bg-aligned text-white'
                                        : 'bg-neutral-light text-text-tertiary'
                                }
              `}>
                                {uploadState === 'analyzing' ? (
                                    <Loader2 size={20} className="animate-spin" />
                                ) : uploadState === 'complete' ? (
                                    <CheckCircle size={20} />
                                ) : (
                                    <span className="text-small font-semibold">2</span>
                                )}
                            </div>
                            <div className="flex-1 pt-1">
                                <p className="text-body font-medium text-text-primary">Analyzing with AI</p>
                                <p className="text-small text-text-secondary mt-0.5">
                                    {uploadState === 'analyzing'
                                        ? 'Extracting decisions with Gemini...'
                                        : uploadState === 'complete'
                                            ? `Extracted ${decisionsExtracted} decisions`
                                            : 'Waiting for upload to complete'
                                    }
                                </p>
                            </div>
                        </div>

                        {/* Complete */}
                        <div className="flex items-start gap-4">
                            <div className={`
                w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                ${uploadState === 'complete'
                                    ? 'bg-aligned text-white'
                                    : 'bg-neutral-light text-text-tertiary'
                                }
              `}>
                                {uploadState === 'complete' ? (
                                    <CheckCircle size={20} />
                                ) : (
                                    <span className="text-small font-semibold">3</span>
                                )}
                            </div>
                            <div className="flex-1 pt-1">
                                <p className="text-body font-medium text-text-primary">Decisions Extracted</p>
                                <p className="text-small text-text-secondary mt-0.5">
                                    {uploadState === 'complete'
                                        ? 'All decisions added to knowledge graph'
                                        : 'Processing...'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {uploadState === 'complete' && (
                        <div className="mt-8 flex gap-3">
                            <a
                                href="/dashboard/nexus"
                                className="flex-1 px-6 py-3 bg-primary hover:bg-primary-hover text-white rounded-lg font-semibold text-center transition-colors"
                            >
                                View in Graph →
                            </a>
                            <button
                                onClick={() => {
                                    setUploadState('idle');
                                    setSelectedFile(null);
                                    setJobId(null);
                                }}
                                className="px-6 py-3 bg-surface border border-border hover:border-primary text-text-primary rounded-lg font-semibold transition-colors"
                            >
                                Upload Another
                            </button>
                        </div>
                    )}

                    {uploadState === 'error' && (
                        <div className="mt-6 p-4 bg-conflict-light border border-conflict rounded-lg flex items-start gap-3">
                            <AlertCircle size={20} className="text-conflict flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-small font-medium text-conflict">{errorMessage}</p>
                            </div>
                        </div>
                    )}
                </Card>
            )}
        </div>
    );
}
