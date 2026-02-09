'use client';

/**
 * Sidebar Component - Premium Enterprise Design
 * Inspired by Linear's navigation
 * 
 * Features:
 * - 260px width (collapsible to icon-only)
 * - Active state with left indicator
 * - Dark mode support via CSS variables
 * - Timeline and Files sections
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Home,
    Upload,
    Network,
    Flag,
    MessageCircle,
    Settings,
    BookOpen,
    ChevronLeft,
    ChevronRight,
    Clock,
    FolderOpen,
    BarChart3,
    Moon,
    Sun
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

interface SidebarProps {
    collapsed: boolean;
    onCollapse: (collapsed: boolean) => void;
}

export function Sidebar({ collapsed, onCollapse }: SidebarProps) {
    const pathname = usePathname();
    const { resolvedTheme, toggleTheme } = useTheme();

    const primaryNav = [
        { href: '/dashboard', icon: Home, label: 'Dashboard' },
        { href: '/dashboard/auditor', icon: Upload, label: 'Upload' },
        { href: '/dashboard/nexus', icon: Network, label: 'Graph' },
        { href: '/dashboard/timeline', icon: Clock, label: 'Timeline' },
        { href: '/dashboard/flags', icon: Flag, label: 'Conflicts' },
        { href: '/dashboard/files', icon: FolderOpen, label: 'Files' },
        { href: '/dashboard/oracle', icon: MessageCircle, label: 'Oracle' },
    ];

    const secondaryNav = [
        { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
        { href: 'https://docs.aletheia.com', icon: BookOpen, label: 'Docs', external: true },
    ];

    const NavItem = ({ href, icon: Icon, label, isActive, external }: {
        href: string;
        icon: typeof Home;
        label: string;
        isActive: boolean;
        external?: boolean;
    }) => {
        const className = `
            relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group
            ${isActive
                ? 'bg-primary-light text-text-primary'
                : 'text-text-secondary hover:bg-neutral-light hover:text-text-primary'
            }
        `;

        const content = (
            <>
                {/* Active Indicator */}
                {isActive && (
                    <span className="absolute left-0 w-0.5 h-5 bg-primary rounded-r" />
                )}
                <Icon
                    size={20}
                    className={`flex-shrink-0 transition-colors ${isActive ? 'text-primary' : 'text-text-tertiary group-hover:text-primary'
                        }`}
                />
                {!collapsed && (
                    <span className="text-small font-medium truncate">{label}</span>
                )}
            </>
        );

        if (external) {
            return (
                <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={className}
                >
                    {content}
                </a>
            );
        }

        return (
            <Link href={href} className={className}>
                {content}
            </Link>
        );
    };

    return (
        <aside
            className={`
                fixed left-0 top-16 h-[calc(100vh-4rem)] 
                bg-surface border-r border-border 
                transition-all duration-200 z-40
                ${collapsed ? 'w-16' : 'w-65'}
            `}
        >
            <div className="h-full flex flex-col">
                {/* Primary Navigation */}
                <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                    {primaryNav.map((item) => (
                        <NavItem
                            key={item.href}
                            href={item.href}
                            icon={item.icon}
                            label={item.label}
                            isActive={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'))}
                        />
                    ))}
                </nav>

                {/* Secondary Navigation */}
                <div className="border-t border-border p-3 space-y-1">
                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-text-secondary hover:bg-neutral-light hover:text-text-primary transition-all group"
                    >
                        {resolvedTheme === 'dark' ? (
                            <Sun size={20} className="flex-shrink-0 text-text-tertiary group-hover:text-primary" />
                        ) : (
                            <Moon size={20} className="flex-shrink-0 text-text-tertiary group-hover:text-primary" />
                        )}
                        {!collapsed && (
                            <span className="text-small font-medium">
                                {resolvedTheme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                            </span>
                        )}
                    </button>

                    {secondaryNav.map((item) => (
                        <NavItem
                            key={item.href}
                            href={item.href}
                            icon={item.icon}
                            label={item.label}
                            isActive={pathname === item.href}
                            external={item.external}
                        />
                    ))}

                    {/* Collapse Toggle */}
                    <button
                        onClick={() => onCollapse(!collapsed)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-text-secondary hover:bg-neutral-light transition-all group"
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
