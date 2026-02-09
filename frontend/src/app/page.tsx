'use client';

import { ArrowRight, Shield, Network, Zap, Check, LogIn, Building, Users, Lock } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/Card';
import { useAuth } from '@/contexts/AuthContext';

export default function Landing() {
    const { user, signOut } = useAuth();

    const handleSignOut = async () => {
        await signOut();
        window.location.href = '/';
    };

    return (
        <div className="min-h-screen bg-white">
            {/* Navbar with shadow */}
            <nav className="sticky top-0 z-50 bg-white border-b border-border shadow-sm">
                <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center shadow-md">
                            <span className="text-white font-bold text-xl">A</span>
                        </div>
                        <span className="text-2xl font-bold text-text-primary">Aletheia</span>
                    </Link>

                    <div className="flex items-center gap-4">
                        {user ? (
                            <>
                                <Link href="/dashboard">
                                    <button className="px-5 py-2 text-text-secondary hover:text-text-primary transition-colors font-medium">
                                        Dashboard
                                    </button>
                                </Link>
                                <button
                                    onClick={handleSignOut}
                                    className="px-6 py-2.5 bg-neutral-light hover:bg-border text-text-primary rounded-lg font-semibold transition-colors"
                                >
                                    Sign Out
                                </button>
                            </>
                        ) : (
                            <>
                                <Link href="/login">
                                    <button className="px-5 py-2 text-text-secondary hover:text-text-primary transition-colors font-medium flex items-center gap-2">
                                        <LogIn size={18} />
                                        Login
                                    </button>
                                </Link>
                                <Link href="/signup">
                                    <button className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg">
                                        Get Started
                                    </button>
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="max-w-7xl mx-auto px-8 pt-24 pb-20">
                <div className="text-center max-w-4xl mx-auto space-y-8">
                    <div className="inline-block px-4 py-2 bg-primary-light text-primary rounded-full text-sm font-semibold">
                        ✨ Causal Memory Engine
                    </div>

                    <h1 className="text-6xl font-bold text-text-primary leading-tight">
                        Institutional memory that detects
                        <span className="text-primary"> contradictions </span>
                        before they become failures
                    </h1>

                    <p className="text-xl text-text-secondary max-w-2xl mx-auto">
                        Aletheia ingests your team's documents, extracts decisions, and builds a causal graph
                        to detect conflicts and preserve institutional knowledge.
                    </p>

                    <div className="flex gap-4 justify-center pt-4">
                        <Link href={user ? "/dashboard" : "/signup"}>
                            <button className="px-8 py-4 bg-primary hover:bg-primary-hover rounded-lg font-semibold text-white flex items-center gap-2 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                                <span>{user ? "Go to Dashboard" : "Start Free Trial"}</span>
                                <ArrowRight size={20} />
                            </button>
                        </Link>
                        <a href="#features">
                            <button className="px-8 py-4 bg-white border-2 border-border hover:border-primary rounded-lg font-semibold text-text-primary transition-all">
                                Learn More
                            </button>
                        </a>
                    </div>
                </div>
            </section>

            {/* Stats Bar */}
            <section className="bg-surface border-y border-border py-12">
                <div className="max-w-7xl mx-auto px-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                        <div>
                            <div className="text-4xl font-bold text-primary mb-2">10K+</div>
                            <div className="text-text-secondary">Decisions Tracked</div>
                        </div>
                        <div>
                            <div className="text-4xl font-bold text-primary mb-2">99.9%</div>
                            <div className="text-text-secondary">Accuracy Rate</div>
                        </div>
                        <div>
                            <div className="text-4xl font-bold text-primary mb-2">50+</div>
                            <div className="text-text-secondary">Enterprise Teams</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section id="features" className="max-w-7xl mx-auto px-8 py-20">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold text-text-primary mb-4">How It Works</h2>
                    <p className="text-xl text-text-secondary">Three simple steps to institutional clarity</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <Card className="p-8 text-center hover:shadow-lg transition-all">
                        <div className="w-16 h-16 bg-primary-light rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <Zap className="text-primary" size={32} />
                        </div>
                        <h3 className="text-2xl font-semibold text-text-primary mb-3">1. Upload</h3>
                        <p className="text-text-secondary">
                            Upload documents, videos, or connect Slack/GitHub. We extract decisions automatically using AI.
                        </p>
                    </Card>

                    <Card className="p-8 text-center hover:shadow-lg transition-all">
                        <div className="w-16 h-16 bg-aligned-light rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <Network className="text-aligned" size={32} />
                        </div>
                        <h3 className="text-2xl font-semibold text-text-primary mb-3">2. Extract</h3>
                        <p className="text-text-secondary">
                            AI extracts who decided what, when, and why - building a causal decision graph in real-time.
                        </p>
                    </Card>

                    <Card className="p-8 text-center hover:shadow-lg transition-all">
                        <div className="w-16 h-16 bg-conflict-light rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <Shield className="text-conflict" size={32} />
                        </div>
                        <h3 className="text-2xl font-semibold text-text-primary mb-3">3. Detect Conflicts</h3>
                        <p className="text-text-secondary">
                            Automatic conflict detection flags contradicting decisions before they cause problems.
                        </p>
                    </Card>
                </div>
            </section>

            {/* Features Grid */}
            <section className="bg-surface py-20">
                <div className="max-w-7xl mx-auto px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-text-primary mb-4">Enterprise-Grade Features</h2>
                        <p className="text-xl text-text-secondary">Everything you need to preserve institutional knowledge</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[
                            { icon: Network, title: 'Causal Graph Visualization', desc: 'Interactive decision graph with React Flow' },
                            { icon: Shield, title: 'Real-Time Conflict Detection', desc: 'Automatically detect contradicting decisions' },
                            { icon: Zap, title: 'Citation-Enforced Oracle', desc: 'AI answers with verified citations only' },
                            { icon: Building, title: 'Multi-Tenant Architecture', desc: 'Complete team and org isolation with RLS' },
                            { icon: Lock, title: 'Role-Based Access Control', desc: 'Admin, Member, and Viewer permissions' },
                            { icon: Users, title: 'Non-Blocking Job Queue', desc: 'Process large uploads in the background' },
                        ].map((feature, i) => (
                            <Card key={i} className="p-6 flex gap-4 hover:shadow-md transition-all">
                                <div className="w-12 h-12 bg-primary-light rounded-lg flex items-center justify-center flex-shrink-0">
                                    <feature.icon className="text-primary" size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-text-primary mb-1">{feature.title}</h3>
                                    <p className="text-text-secondary text-sm">{feature.desc}</p>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="max-w-4xl mx-auto px-8 py-20">
                <Card className="p-12 text-center bg-gradient-to-br from-primary-light to-white border-2 border-primary shadow-xl">
                    <h2 className="text-4xl font-bold text-text-primary mb-4">
                        Start Building Your Institutional Memory
                    </h2>
                    <p className="text-xl text-text-secondary mb-8">
                        Join teams using Aletheia to prevent strategic misalignment
                    </p>
                    <Link href={user ? "/dashboard" : "/signup"}>
                        <button className="px-8 py-4 bg-primary hover:bg-primary-hover text-white rounded-lg font-semibold text-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                            {user ? "Go to Dashboard" : "Get Started Free"}
                        </button>
                    </Link>
                </Card>
            </section>

            {/* Footer */}
            <footer className="border-t border-border bg-surface">
                <div className="max-w-7xl mx-auto px-8 py-12">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-2xl font-bold text-text-primary mb-2">
                                Aletheia
                            </h3>
                            <p className="text-sm text-text-tertiary">Causal Memory Engine</p>
                        </div>
                        <p className="text-sm text-text-tertiary">
                            © 2026 Aletheia Labs
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
