'use client';

/**
 * Sidebar Component
 * Inspired by Linear's navigation
 * 
 * - 260px width (collapsible to icon-only)
 * - Active state: 3px left border + background
 * - Primary + Secondary sections
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Upload, Network, Flag, MessageCircle, Settings, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';

interface SidebarProps {
    collapsed: boolean;
    onCollapse: (collapsed: boolean) => void;
}

export function Sidebar({ collapsed, onCollapse }: SidebarProps) {
    const pathname = usePathname();

    const primaryNav = [
        { href: '/dashboard', icon: Home, label: 'Command Center' },
        { href: '/dashboard/auditor', icon: Upload, label: 'Auditor' },
        { href: '/dashboard/nexus', icon: Network, label: 'Causal Nexus' },
        { href: '/dashboard/flags', icon: Flag, label: 'Flags' },
        { href: '/dashboard/oracle', icon: MessageCircle, label: 'Oracle' },
    ];

    const secondaryNav = [
        { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
        { href: 'https://docs.aletheia.com', icon: BookOpen, label: 'Documentation', external: true },
    ];

    return (
        <aside
            className={`fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white border-r border-border transition-all duration-200 ${collapsed ? 'w-16' : 'w-65'
                }`}
        >
            <div className="h-full flex flex-col">
                {/* Primary Navigation */}
                <nav className="flex-1 p-3 space-y-1">
                    {primaryNav.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`
                  relative flex items-center gap-3 px-3 py-2 rounded-lg transition-all group
                  ${isActive
                                        ? 'bg-primary-light text-text-primary'
                                        : 'text-text-secondary hover:bg-neutral-light hover:text-text-primary'
                                    }
                `}
                            >
                                {/* Active Indicator - Linear style */}
                                {isActive && (
                                    <span className="absolute left-0 w-0.5 h-6 bg-primary rounded-r" />
                                )}

                                <Icon
                                    size={20}
                                    className={`flex-shrink-0 ${isActive ? 'text-primary' : 'text-text-tertiary group-hover:text-primary'}`}
                                />

                                {!collapsed && (
                                    <span className="text-small font-medium">{item.label}</span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Secondary Navigation */}
                <div className="border-t border-border p-3 space-y-1">
                    {secondaryNav.map((item) => {
                        const Icon = item.icon;

                        return item.external ? (
                            <a
                                key={item.href}
                                href={item.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 px-3 py-2 rounded-lg text-text-secondary hover:bg-neutral-light hover:text-text-primary transition-all"
                            >
                                <Icon size={20} className="flex-shrink-0 text-text-tertiary" />
                                {!collapsed && <span className="text-small font-medium">{item.label}</span>}
                            </a>
                        ) : (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="flex items-center gap-3 px-3 py-2 rounded-lg text-text-secondary hover:bg-neutral-light hover:text-text-primary transition-all"
                            >
                                <Icon size={20} className="flex-shrink-0 text-text-tertiary" />
                                {!collapsed && <span className="text-small font-medium">{item.label}</span>}
                            </Link>
                        );
                    })}

                    {/* Collapse Toggle */}
                    <button
                        onClick={() => onCollapse(!collapsed)}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-text-secondary hover:bg-neutral-light transition-all"
                    >
                        {collapsed ? (
                            <ChevronRight size={20} className="flex-shrink-0 text-text-tertiary" />
                        ) : (
                            <>
                                <ChevronLeft size={20} className="flex-shrink-0 text-text-tertiary" />
                                <span className="text-small font-medium">Collapse</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </aside>
    );
}
