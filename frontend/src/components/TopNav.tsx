'use client';

/**
 * Top Navigation Bar - Premium Enterprise Design
 * Inspired by Linear, Stripe, Vercel
 * 
 * Features:
 * - 64px height with glassmorphism
 * - Logo + Breadcrumbs + Team Switcher
 * - Global search ⌘K
 * - User menu with org context
 * - Dark mode support
 */

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
    Search,
    Bell,
    ChevronRight,
    Settings,
    BookOpen,
    LogOut,
    Building,
    User as UserIcon,
    Sparkles,
    ChevronDown,
    Check,
    Plus
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTeam } from '@/contexts/TeamContext';

interface TopNavProps {
    breadcrumbs?: { label: string; href?: string }[];
}

export function TopNav({ breadcrumbs = [] }: TopNavProps) {
    const [searchOpen, setSearchOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [teamMenuOpen, setTeamMenuOpen] = useState(false);
    const { user, signOut } = useAuth();
    const { teams, selectedTeam, selectTeam, loading: teamsLoading } = useTeam();
    const userMenuRef = useRef<HTMLDivElement>(null);
    const teamMenuRef = useRef<HTMLDivElement>(null);

    // Close menus on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setUserMenuOpen(false);
            }
            if (teamMenuRef.current && !teamMenuRef.current.contains(event.target as Node)) {
                setTeamMenuOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Keyboard shortcut for search
    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
                event.preventDefault();
                setSearchOpen(true);
            }
            if (event.key === 'Escape') {
                setSearchOpen(false);
            }
        }
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleLogout = async () => {
        await signOut();
        window.location.href = '/login';
    };

    return (
        <>
            <nav className="h-16 bg-surface/80 backdrop-blur-xl border-b border-border sticky top-0 z-50">
                <div className="h-full px-6 flex items-center justify-between">
                    {/* Left: Logo + Team Switcher + Breadcrumbs */}
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
                            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center shadow-sm">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-body font-semibold text-text-primary hidden sm:block">Aletheia</span>
                        </Link>

                        {/* Team Switcher */}
                        {selectedTeam && (
                            <div className="relative" ref={teamMenuRef}>
                                <button
                                    onClick={() => setTeamMenuOpen(!teamMenuOpen)}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-neutral-light hover:bg-border rounded-lg transition-colors ml-2"
                                >
                                    <div className="w-5 h-5 bg-primary/10 rounded flex items-center justify-center">
                                        <Building className="w-3 h-3 text-primary" />
                                    </div>
                                    <span className="text-small font-medium text-text-primary max-w-[120px] truncate">
                                        {selectedTeam.team.name}
                                    </span>
                                    <ChevronDown className="w-4 h-4 text-text-tertiary" />
                                </button>

                                {teamMenuOpen && (
                                    <div className="absolute left-0 mt-2 w-72 bg-surface border border-border rounded-xl shadow-modal animate-scale-in origin-top-left">
                                        <div className="p-3 border-b border-border">
                                            <p className="text-meta text-text-tertiary uppercase tracking-wider">Teams</p>
                                        </div>
                                        <div className="p-2 max-h-64 overflow-y-auto">
                                            {teams.map((membership) => (
                                                <button
                                                    key={membership.team.id}
                                                    onClick={() => {
                                                        selectTeam(membership.team.id);
                                                        setTeamMenuOpen(false);
                                                    }}
                                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${selectedTeam?.team.id === membership.team.id
                                                        ? 'bg-primary-light'
                                                        : 'hover:bg-neutral-light'
                                                        }`}
                                                >
                                                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                                                        <Building className="w-4 h-4 text-primary" />
                                                    </div>
                                                    <div className="flex-1 text-left">
                                                        <p className="text-small font-medium text-text-primary">{membership.team.name}</p>
                                                        <p className="text-meta text-text-tertiary capitalize">{membership.role}</p>
                                                    </div>
                                                    {selectedTeam?.team.id === membership.team.id && (
                                                        <Check className="w-4 h-4 text-primary" />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Breadcrumbs */}
                        {breadcrumbs.length > 0 && (
                            <div className="hidden md:flex items-center gap-2 ml-2">
                                <ChevronRight size={16} className="text-text-tertiary" />
                                {breadcrumbs.map((crumb, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        {crumb.href ? (
                                            <Link href={crumb.href} className="text-small text-text-secondary hover:text-text-primary transition-colors">
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
                    <div className="flex items-center gap-2">
                        {/* Global Search */}
                        <button
                            onClick={() => setSearchOpen(true)}
                            className="flex items-center gap-2 px-3 py-2 bg-neutral-light hover:bg-border border border-transparent hover:border-border rounded-lg transition-all group"
                        >
                            <Search size={16} className="text-text-tertiary group-hover:text-text-secondary" />
                            <span className="text-small text-text-tertiary hidden sm:block">Search</span>
                            <kbd className="hidden sm:inline px-1.5 py-0.5 bg-surface border border-border rounded text-meta text-text-tertiary">⌘K</kbd>
                        </button>

                        {/* Notifications */}
                        <button className="relative p-2 hover:bg-neutral-light rounded-lg transition-colors">
                            <Bell size={20} className="text-text-secondary" />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-conflict rounded-full ring-2 ring-surface"></span>
                        </button>

                        {/* User Menu */}
                        <div className="relative" ref={userMenuRef}>
                            <button
                                onClick={() => setUserMenuOpen(!userMenuOpen)}
                                className="flex items-center gap-2 px-2 py-1.5 hover:bg-neutral-light rounded-lg transition-colors"
                            >
                                <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
                                    <span className="text-sm font-medium text-white">
                                        {user?.email?.charAt(0).toUpperCase() || 'U'}
                                    </span>
                                </div>
                                <ChevronDown className="w-4 h-4 text-text-tertiary hidden sm:block" />
                            </button>

                            {/* User Dropdown */}
                            {userMenuOpen && (
                                <div className="absolute right-0 mt-2 w-72 bg-surface border border-border rounded-xl shadow-modal animate-scale-in origin-top-right">
                                    <div className="p-4 border-b border-border">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
                                                <span className="text-sm font-medium text-white">
                                                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-small font-semibold text-text-primary truncate">
                                                    {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
                                                </p>
                                                <p className="text-meta text-text-tertiary truncate">{user?.email}</p>
                                            </div>
                                        </div>
                                        {selectedTeam && (
                                            <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-neutral-light rounded-lg">
                                                <Building size={14} className="text-text-tertiary" />
                                                <span className="text-meta text-text-secondary">{selectedTeam.team.name}</span>
                                                <span className="ml-auto px-2 py-0.5 bg-primary-light text-primary text-meta rounded-full capitalize">
                                                    {selectedTeam.role}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-2">
                                        <Link
                                            href="/dashboard/settings"
                                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-neutral-light rounded-lg text-left transition-colors"
                                            onClick={() => setUserMenuOpen(false)}
                                        >
                                            <UserIcon size={18} className="text-text-secondary" />
                                            <span className="text-small text-text-primary">Profile Settings</span>
                                        </Link>
                                        <Link
                                            href="/dashboard/settings"
                                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-neutral-light rounded-lg text-left transition-colors"
                                            onClick={() => setUserMenuOpen(false)}
                                        >
                                            <Settings size={18} className="text-text-secondary" />
                                            <span className="text-small text-text-primary">Team Settings</span>
                                        </Link>
                                        <a
                                            href="https://docs.aletheia.com"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-neutral-light rounded-lg text-left transition-colors"
                                        >
                                            <BookOpen size={18} className="text-text-secondary" />
                                            <span className="text-small text-text-primary">Documentation</span>
                                        </a>
                                    </div>

                                    <div className="p-2 border-t border-border">
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-conflict-light rounded-lg text-left transition-colors group"
                                        >
                                            <LogOut size={18} className="text-text-secondary group-hover:text-conflict" />
                                            <span className="text-small text-text-primary group-hover:text-conflict">Sign Out</span>
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
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-24"
                    onClick={() => setSearchOpen(false)}
                >
                    <div
                        className="w-full max-w-2xl bg-surface rounded-2xl shadow-modal overflow-hidden border border-border animate-scale-in"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-3 p-4 border-b border-border">
                            <Search size={20} className="text-text-tertiary" />
                            <input
                                type="text"
                                placeholder="Search decisions, conflicts, documents..."
                                className="flex-1 bg-transparent outline-none text-body text-text-primary placeholder:text-text-tertiary"
                                autoFocus
                            />
                            <kbd className="px-2 py-1 bg-neutral-light border border-border rounded text-meta text-text-tertiary">ESC</kbd>
                        </div>

                        <div className="p-6">
                            <div className="text-center py-8">
                                <div className="w-16 h-16 bg-neutral-light rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <Search size={32} className="text-text-tertiary" />
                                </div>
                                <p className="text-small text-text-secondary mb-6">Start typing to search across your team's decisions</p>

                                <div className="text-left max-w-sm mx-auto">
                                    <p className="text-meta text-text-tertiary uppercase tracking-wider mb-3">Quick Actions</p>
                                    <div className="space-y-1">
                                        <button className="w-full px-4 py-2.5 hover:bg-neutral-light rounded-lg text-left transition-colors flex items-center gap-3">
                                            <Search size={16} className="text-text-tertiary" />
                                            <span className="text-small text-text-primary">Search decisions</span>
                                            <span className="ml-auto text-meta text-text-tertiary">Type any query</span>
                                        </button>
                                        <button className="w-full px-4 py-2.5 hover:bg-neutral-light rounded-lg text-left transition-colors flex items-center gap-3">
                                            <Sparkles size={16} className="text-text-tertiary" />
                                            <span className="text-small text-text-primary">Ask Oracle</span>
                                            <span className="ml-auto text-meta text-text-tertiary">@ to ask AI</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
