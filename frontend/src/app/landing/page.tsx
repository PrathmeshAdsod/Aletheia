'use client';

import { ArrowRight, Shield, Network, Zap, Check } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/Card';

export default function Landing() {
    return (
        <div className="min-h-screen bg-background">
            {/* Hero Section */}
            <section className="max-w-7xl mx-auto px-8 pt-20 pb-16">
                <div className="text-center max-w-4xl mx-auto space-y-8">
                    <div className="inline-block px-4 py-2 bg-primary-light text-primary rounded-full text-meta font-semibold">
                        Causal Memory Engine
                    </div>

                    <h1 className="text-[56px] font-semibold text-text-primary leading-tight">
                        Institutional memory that detects contradictions before they become failures
                    </h1>

                    <p className="text-body text-text-secondary max-w-2xl mx-auto">
                        Aletheia ingests your team's documents, extracts decisions, and builds a causal graph
                        to detect conflicts and preserve institutional knowledge.
                    </p>

                    <div className="flex gap-4 justify-center">
                        <Link href="/dashboard">
                            <button className="px-8 py-4 bg-primary hover:bg-primary-hover rounded-lg font-semibold text-white flex items-center gap-2 transition-colors">
                                <span>Enter Dashboard</span>
                                <ArrowRight size={20} />
                            </button>
                        </Link>
                        <button className="px-8 py-4 bg-surface border border-border hover:border-primary rounded-lg font-semibold text-text-primary transition-colors">
                            Learn More
                        </button>
                    </div>
                </div>
            </section>

            {/* 3-Step Flow */}
            <section className="max-w-7xl mx-auto px-8 py-16">
                <h2 className="text-h2 text-text-primary text-center mb-12">How It Works</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <Card className="p-8 text-center">
                        <div className="w-16 h-16 bg-primary-light rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <Zap className="text-primary" size={32} />
                        </div>
                        <h3 className="text-h3 text-text-primary mb-3">1. Upload</h3>
                        <p className="text-small text-text-secondary">
                            Upload documents, videos, or connect Slack/GitHub. We extract decisions automatically.
                        </p>
                    </Card>

                    <Card className="p-8 text-center">
                        <div className="w-16 h-16 bg-aligned-light rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <Network className="text-aligned" size={32} />
                        </div>
                        <h3 className="text-h3 text-text-primary mb-3">2. Extract</h3>
                        <p className="text-small text-text-secondary">
                            AI extracts who decided what, when, and why - building a causal decision graph.
                        </p>
                    </Card>

                    <Card className="p-8 text-center">
                        <div className="w-16 h-16 bg-conflict-light rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <Shield className="text-conflict" size={32} />
                        </div>
                        <h3 className="text-h3 text-text-primary mb-3">3. Detect Conflicts</h3>
                        <p className="text-small text-text-secondary">
                            Automatic conflict detection flags contradicting decisions before they cause problems.
                        </p>
                    </Card>
                </div>
            </section>

            {/* Features */}
            <section className="max-w-7xl mx-auto px-8 py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div className="space-y-4">
                        <h2 className="text-h2 text-text-primary">Enterprise-Grade Knowledge Management</h2>
                        <p className="text-body text-text-secondary">
                            Built for teams who value institutional memory and strategic consistency.
                        </p>

                        <ul className="space-y-3">
                            {[
                                'Causal graph visualization with React Flow',
                                'Real-time conflict detection',
                                'Citation-enforced Oracle (no hallucination)',
                                'Schema versioning for safe evolution',
                                'Non-blocking job queue for large uploads'
                            ].map((feature, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <Check className="text-aligned mt-0.5" size={20} />
                                    <span className="text-small text-text-primary">{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <Card className="p-12">
                        <div className="aspect-video bg-neutral-light rounded-lg flex items-center justify-center">
                            <p className="text-text-tertiary">Dashboard Screenshot</p>
                        </div>
                    </Card>
                </div>
            </section>

            {/* CTA */}
            <section className="max-w-4xl mx-auto px-8 py-16">
                <Card className="p-12 text-center">
                    <h2 className="text-h2 text-text-primary mb-4">
                        Start Building Your Institutional Memory
                    </h2>
                    <p className="text-body text-text-secondary mb-8">
                        Join teams using Aletheia to prevent strategic misalignment
                    </p>
                    <Link href="/dashboard">
                        <button className="px-8 py-4 bg-primary hover:bg-primary-hover rounded-lg font-semibold text-white transition-colors">
                            Get Started
                        </button>
                    </Link>
                </Card>
            </section>

            {/* Footer */}
            <footer className="border-t border-border mt-16">
                <div className="max-w-7xl mx-auto px-8 py-12">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-h3 text-text-primary mb-2">Aletheia</h3>
                            <p className="text-meta text-text-tertiary">Causal Memory Engine</p>
                        </div>
                        <p className="text-meta text-text-tertiary">
                            © 2026 Aletheia Labs
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
