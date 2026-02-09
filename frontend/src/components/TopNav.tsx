'use client';

/**
 * Top Navigation Bar
 * Inspired by Linear, Stripe, Vercel
 * 
 * - 64px height
 * - Logo + Breadcrumbs + Actions
 * - Global search ⌘K
 * - User menu with org context
 */

import { useState } from 'react';
import Link from 'next/link';
import { Search, Bell, ChevronRight, Settings, BookOpen, LogOut, Building, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface TopNavProps {
    breadcrumbs?: { label: string; href?: string }[];
}

export function TopNav({ breadcrumbs = [] }: TopNavProps) {
    const [searchOpen, setSearchOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const { user, signOut } = useAuth();

    const handleLogout = async () => {
        await signOut();
        window.location.href = '/login';
    };

    return (
        <>
            <nav className="h-16 bg-white border-b border-border sticky top-0 z-40">
                <div className="h-full px-6 flex items-center justify-between">
                    {/* Left: Logo + Breadcrumbs */}
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-lg">A</span>
                            </div>
                            <span className="text-body font-semibold text-text-primary">Aletheia</span>
                        </Link>

                        {/* Breadcrumbs */}
                        {breadcrumbs.length > 0 && (
                            <div className="flex items-center gap-2 ml-4">
                                <ChevronRight size={16} className="text-text-tertiary" />
                                {breadcrumbs.map((crumb, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        {crumb.href ? (
                                            <Link href={crumb.href} className="text-small text-text-secondary hover:text-text-primary">
                                                {crumb.label}
                                            </Link>
                                        ) : (
                                            <span className="text-small text-text-primary font-medium">{crumb.label}</span>
                                        )}
                                        {i < breadcrumbs.length - 1 && (
                                            <ChevronRight size={14} className="text-text-tertiary" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right: Search + Notifications + User */}
                    <div className="flex items-center gap-3">
                        {/* Global Search */}
                        <button
                            onClick={() => setSearchOpen(true)}
                            className="flex items-center gap-2 px-3 py-2 bg-background hover:bg-neutral-light border border-border rounded-lg transition-colors group"
                        >
                            <Search size={16} className="text-text-tertiary group-hover:text-text-secondary" />
                            <span className="text-small text-text-tertiary">Search</span>
                            <kbd className="px-2 py-0.5 bg-white border border-border rounded text-meta text-text-tertiary">⌘K</kbd>
                        </button>

                        {/* Notifications */}
                        <button className="relative p-2 hover:bg-neutral-light rounded-lg transition-colors">
                            <Bell size={20} className="text-text-secondary" />
                            <span className="absolute top-1 right-1 w-2 h-2 bg-conflict rounded-full"></span>
                        </button>

                        {/* User Menu */}
                        <div className="relative">
                            <button
                                onClick={() => setUserMenuOpen(!userMenuOpen)}
                                className="flex items-center gap-3 px-3 py-2 hover:bg-neutral-light rounded-lg transition-colors"
                            >
                                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                    <UserIcon size={16} className="text-primary" />
                                </div>
                            </button>

                            {/* User Dropdown */}
                            {userMenuOpen && (
                                <div className="absolute right-0 mt-2 w-64 bg-white border border-border rounded-lg shadow-modal">
                                    <div className="p-3 border-b border-border">
                                        <p className="text-small font-semibold text-text-primary">Prathmesh Adsod</p>
                                        <p className="text-meta text-text-tertiary mt-0.5">prathmesh@aletheia.com</p>
                                        <div className="mt-2 flex items-center gap-2">
                                            <Building size={12} className="text-text-tertiary" />
                                            <span className="text-meta text-text-secondary">Aletheia Labs</span>
                                            <span className="ml-auto px-2 py-0.5 bg-primary-light text-primary text-meta rounded-full">Demo</span>
                                        </div>
                                    </div>

                                    <div className="p-1">
                                        <button className="w-full flex items-center gap-3 px-3 py-2 hover:bg-neutral-light rounded text-left transition-colors">
                                            <UserIcon size={16} className="text-text-secondary" />
                                            <span className="text-small text-text-primary">Profile</span>
                                        </button>
                                        <button className="w-full flex items-center gap-3 px-3 py-2 hover:bg-neutral-light rounded text-left transition-colors">
                                            <Building size={16} className="text-text-secondary" />
                                            <span className="text-small text-text-primary">Switch Organization</span>
                                        </button>
                                        <button className="w-full flex items-center gap-3 px-3 py-2 hover:bg-neutral-light rounded text-left transition-colors">
                                            <Settings size={16} className="text-text-secondary" />
                                            <span className="text-small text-text-primary">Settings</span>
                                        </button>
                                    </div>

                                    <div className="p-1 border-t border-border">
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-conflict-light hover:text-conflict rounded text-left transition-colors"
                                        >
                                            <LogOut size={16} />
                                            <span className="text-small">Logout</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Global Search Modal */}
            {searchOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-32"
                    onClick={() => setSearchOpen(false)}
                >
                    <div
                        className="w-full max-w-2xl bg-white rounded-lg shadow-modal overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-3 p-4 border-b border-border">
                            <Search size={20} className="text-text-tertiary" />
                            <input
                                type="text"
                                placeholder="Search decisions, conflicts, documents..."
                                className="flex-1 outline-none text-body text-text-primary placeholder:text-text-tertiary"
                                autoFocus
                            />
                            <kbd className="px-2 py-1 bg-neutral-light border border-border rounded text-meta text-text-tertiary">ESC</kbd>
                        </div>

                        <div className="p-4">
                            <div className="text-center py-12">
                                <Search size={48} className="text-text-tertiary mx-auto mb-4 opacity-50" />
                                <p className="text-small text-text-secondary">Start typing to search...</p>
                                <div className="mt-8 text-left max-w-md mx-auto">
                                    <p className="text-meta text-text-tertiary uppercase tracking-wider mb-2">Quick Actions</p>
                                    <div className="space-y-1">
                                        <div className="px-3 py-2 hover:bg-neutral-light rounded cursor-pointer">
                                            <span className="text-small text-text-primary">Search decisions</span>
                                        </div>
                                        <div className="px-3 py-2 hover:bg-neutral-light rounded cursor-pointer">
                                            <span className="text-small text-text-primary">View conflicts</span>
                                        </div>
                                        <div className="px-3 py-2 hover:bg-neutral-light rounded cursor-pointer">
                                            <span className="text-small text-text-primary">Ask Oracle</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Click outside to close user menu */}
            {userMenuOpen && (
                <div
                    className="fixed inset-0 z-30"
                    onClick={() => setUserMenuOpen(false)}
                />
            )}
        </>
    );
}
