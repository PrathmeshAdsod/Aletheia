'use client';

/**
 * Aletheia Landing Page
 * Premium enterprise-grade design inspired by Linear, Vercel, Stripe
 */

import { useState, useEffect } from 'react';
import { ArrowRight, Shield, Network, Zap, Check, LogIn, ChevronRight, Sparkles, BarChart3, GitBranch, Users, Clock, Target, Moon, Sun } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

export default function Landing() {
    const { user, signOut } = useAuth();
    const { resolvedTheme, toggleTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleSignOut = async () => {
        await signOut();
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-semibold text-text-primary">Aletheia</span>
                        </div>

                        {/* Nav Links */}
                        <div className="hidden md:flex items-center gap-8">
                            <a href="#features" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
                                Features
                            </a>
                            <a href="#how-it-works" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
                                How It Works
                            </a>
                            <a href="#enterprise" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
                                Enterprise
                            </a>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-4">
                            {mounted && (
                                <button
                                    onClick={toggleTheme}
                                    className="p-2 rounded-lg hover:bg-neutral-light transition-colors"
                                    aria-label="Toggle theme"
                                >
                                    {resolvedTheme === 'dark' ? (
                                        <Sun className="w-5 h-5 text-text-secondary" />
                                    ) : (
                                        <Moon className="w-5 h-5 text-text-secondary" />
                                    )}
                                </button>
                            )}

                            {user ? (
                                <div className="flex items-center gap-3">
                                    <Link
                                        href="/dashboard"
                                        className="btn-primary text-sm flex items-center gap-2"
                                    >
                                        Dashboard
                                        <ArrowRight className="w-4 h-4" />
                                    </Link>
                                    <button
                                        onClick={handleSignOut}
                                        className="btn-secondary text-sm"
                                    >
                                        Sign Out
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <Link
                                        href="/login"
                                        className="text-sm text-text-secondary hover:text-text-primary transition-colors"
                                    >
                                        Sign In
                                    </Link>
                                    <Link
                                        href="/signup"
                                        className="btn-primary text-sm flex items-center gap-2"
                                    >
                                        Get Started
                                        <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-24 overflow-hidden">
                {/* Background Gradient */}
                <div className="absolute inset-0 bg-gradient-hero" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl" />

                <div className="relative max-w-7xl mx-auto px-6">
                    <div className="max-w-4xl mx-auto text-center">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-light border border-primary/20 mb-8 animate-fade-in">
                            <Sparkles className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium text-primary">Strategic Decision Intelligence</span>
                        </div>

                        {/* Headline */}
                        <h1 className="text-display md:text-[56px] text-text-primary mb-6 animate-fade-in delay-100">
                            Institutional memory that
                            <span className="bg-gradient-primary bg-clip-text text-transparent"> prevents failures</span>
                        </h1>

                        {/* Subheadline */}
                        <p className="text-xl text-text-secondary mb-10 max-w-2xl mx-auto animate-fade-in delay-200">
                            Track decisions, detect conflicts, and ensure strategic alignment across your organization.
                            Built for teams who refuse to let critical knowledge slip through the cracks.
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in delay-300">
                            <Link
                                href="/signup"
                                className="btn-primary text-base px-8 py-3 flex items-center gap-2"
                            >
                                Start Free Trial
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                            <Link
                                href="#how-it-works"
                                className="btn-secondary text-base px-8 py-3 flex items-center gap-2"
                            >
                                See How It Works
                                <ChevronRight className="w-5 h-5" />
                            </Link>
                        </div>

                        {/* Trust Indicators */}
                        <div className="mt-12 flex items-center justify-center gap-8 animate-fade-in delay-400">
                            <div className="flex items-center gap-2 text-text-tertiary">
                                <Shield className="w-4 h-4" />
                                <span className="text-sm">SOC 2 Compliant</span>
                            </div>
                            <div className="flex items-center gap-2 text-text-tertiary">
                                <Users className="w-4 h-4" />
                                <span className="text-sm">Multi-tenant</span>
                            </div>
                            <div className="flex items-center gap-2 text-text-tertiary">
                                <Zap className="w-4 h-4" />
                                <span className="text-sm">AI-Powered</span>
                            </div>
                        </div>
                    </div>

                    {/* Hero Visual */}
                    <div className="mt-20 relative animate-fade-in delay-500">
                        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 pointer-events-none" />
                        <div className="card-elevated rounded-2xl overflow-hidden border border-border">
                            <div className="bg-surface-elevated border-b border-border px-4 py-3 flex items-center gap-2">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-conflict/60" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-400/60" />
                                    <div className="w-3 h-3 rounded-full bg-aligned/60" />
                                </div>
                                <span className="text-xs text-text-tertiary ml-2">Command Center</span>
                            </div>
                            <div className="p-8 bg-gradient-to-br from-surface to-surface-elevated min-h-[400px] flex items-center justify-center">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl">
                                    {/* Mock KPI Cards */}
                                    <div className="card p-6 animate-float">
                                        <div className="text-meta text-text-tertiary uppercase tracking-wider mb-2">Consistency</div>
                                        <div className="text-4xl font-semibold text-aligned">92%</div>
                                        <div className="text-sm text-text-secondary mt-1">↑ 5% this week</div>
                                    </div>
                                    <div className="card p-6 animate-float" style={{ animationDelay: '0.5s' }}>
                                        <div className="text-meta text-text-tertiary uppercase tracking-wider mb-2">Decisions</div>
                                        <div className="text-4xl font-semibold text-primary">847</div>
                                        <div className="text-sm text-text-secondary mt-1">Tracked</div>
                                    </div>
                                    <div className="card p-6 animate-float" style={{ animationDelay: '1s' }}>
                                        <div className="text-meta text-text-tertiary uppercase tracking-wider mb-2">Conflicts</div>
                                        <div className="text-4xl font-semibold text-conflict">3</div>
                                        <div className="text-sm text-text-secondary mt-1">Pending review</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-24 bg-surface">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-h1 text-text-primary mb-4">
                            Built for Strategic Excellence
                        </h2>
                        <p className="text-lg text-text-secondary max-w-2xl mx-auto">
                            Every feature designed to help fast-moving teams maintain alignment and prevent costly contradictions.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* Feature Cards */}
                        {[
                            {
                                icon: Network,
                                title: "Causal Graph",
                                description: "Visualize how decisions connect, influence, and sometimes conflict with each other in an interactive graph."
                            },
                            {
                                icon: Target,
                                title: "Conflict Detection",
                                description: "AI automatically detects contradicting decisions before they become expensive failures."
                            },
                            {
                                icon: BarChart3,
                                title: "Executive Analytics",
                                description: "Strategic alignment scores, resolution metrics, and decision velocity for leadership visibility."
                            },
                            {
                                icon: Clock,
                                title: "Temporal Intelligence",
                                description: "Track decision evolution over time. See what changed, when, and why conflicts emerged."
                            },
                            {
                                icon: GitBranch,
                                title: "Decision Lifecycle",
                                description: "Active conflicts to resolved states with full audit trail and resolution tracking."
                            },
                            {
                                icon: Sparkles,
                                title: "Oracle AI",
                                description: "Ask questions about your decisions. Get answers with citations, never hallucinations."
                            }
                        ].map((feature, index) => (
                            <div
                                key={feature.title}
                                className="card card-hover p-6 group"
                            >
                                <div className="w-12 h-12 rounded-xl bg-primary-light flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <feature.icon className="w-6 h-6 text-primary" />
                                </div>
                                <h3 className="text-h3 text-text-primary mb-2">{feature.title}</h3>
                                <p className="text-text-secondary">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section id="how-it-works" className="py-24 bg-background">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-h1 text-text-primary mb-4">
                            From Documents to Strategic Clarity
                        </h2>
                        <p className="text-lg text-text-secondary max-w-2xl mx-auto">
                            Three steps to transform scattered decisions into aligned strategy.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                step: "01",
                                title: "Upload",
                                description: "Drop in meeting notes, strategy docs, Slack exports, or any document containing decisions."
                            },
                            {
                                step: "02",
                                title: "Extract",
                                description: "AI identifies decisions, actors, reasoning, and automatically detects potential conflicts."
                            },
                            {
                                step: "03",
                                title: "Align",
                                description: "Review conflicts, resolve contradictions, and query your decision graph with the Oracle."
                            }
                        ].map((item, index) => (
                            <div key={item.step} className="relative">
                                <div className="text-[120px] font-bold text-border absolute -top-4 left-0 select-none">
                                    {item.step}
                                </div>
                                <div className="relative pt-16 pl-4">
                                    <h3 className="text-h2 text-text-primary mb-3">{item.title}</h3>
                                    <p className="text-text-secondary">{item.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Enterprise Section */}
            <section id="enterprise" className="py-24 bg-surface">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-aligned-light text-aligned text-sm font-medium mb-6">
                                <Shield className="w-4 h-4" />
                                Enterprise Ready
                            </div>
                            <h2 className="text-h1 text-text-primary mb-6">
                                Built for Teams That Cannot Afford Contradictions
                            </h2>
                            <div className="space-y-4">
                                {[
                                    "Multi-tenant architecture with role-based access",
                                    "Team-scoped data isolation and RLS policies",
                                    "Audit logging and compliance tracking",
                                    "SSO and enterprise authentication",
                                    "Priority support and SLAs"
                                ].map((item) => (
                                    <div key={item} className="flex items-center gap-3">
                                        <div className="w-5 h-5 rounded-full bg-aligned-light flex items-center justify-center flex-shrink-0">
                                            <Check className="w-3 h-3 text-aligned" />
                                        </div>
                                        <span className="text-text-secondary">{item}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-8">
                                <Link
                                    href="/signup"
                                    className="btn-primary inline-flex items-center gap-2"
                                >
                                    Start Enterprise Trial
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </div>
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent rounded-3xl" />
                            <div className="card-elevated rounded-2xl p-8">
                                <div className="space-y-4">
                                    {/* Mock Team Structure */}
                                    <div className="flex items-center gap-4 p-4 rounded-xl bg-neutral-light">
                                        <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                                            <Users className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <div className="font-medium text-text-primary">Engineering Team</div>
                                            <div className="text-sm text-text-tertiary">12 members • 234 decisions</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 p-4 rounded-xl bg-neutral-light">
                                        <div className="w-10 h-10 rounded-lg bg-gradient-end flex items-center justify-center">
                                            <Users className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <div className="font-medium text-text-primary">Product Team</div>
                                            <div className="text-sm text-text-tertiary">8 members • 156 decisions</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 p-4 rounded-xl bg-neutral-light">
                                        <div className="w-10 h-10 rounded-lg bg-aligned flex items-center justify-center">
                                            <Users className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <div className="font-medium text-text-primary">Leadership</div>
                                            <div className="text-sm text-text-tertiary">5 members • 89 decisions</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 bg-background">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h2 className="text-h1 text-text-primary mb-4">
                        Stop Letting Decisions Contradict Each Other
                    </h2>
                    <p className="text-lg text-text-secondary mb-8">
                        Join teams who have eliminated strategic misalignment with Aletheia.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            href="/signup"
                            className="btn-primary text-base px-8 py-3 flex items-center gap-2"
                        >
                            Get Started Free
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                        <Link
                            href="/login"
                            className="btn-secondary text-base px-8 py-3 flex items-center gap-2"
                        >
                            <LogIn className="w-5 h-5" />
                            Sign In
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-border py-12 bg-surface">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-lg font-semibold text-text-primary">Aletheia</span>
                        </div>
                        <div className="flex items-center gap-8 text-sm text-text-secondary">
                            <a href="#" className="hover:text-text-primary transition-colors">Privacy</a>
                            <a href="#" className="hover:text-text-primary transition-colors">Terms</a>
                            <a href="#" className="hover:text-text-primary transition-colors">Security</a>
                            <a href="#" className="hover:text-text-primary transition-colors">Contact</a>
                        </div>
                        <div className="text-sm text-text-tertiary">
                            © 2026 Aletheia. All rights reserved.
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
