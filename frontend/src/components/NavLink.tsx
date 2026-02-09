'use client';

/**
 * Navigation Link with active state
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

interface NavLinkProps {
    href: string;
    icon: ReactNode;
    label: string;
}

export function NavLink({ href, icon, label }: NavLinkProps) {
    const pathname = usePathname();
    const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));

    return (
        <Link
            href={href}
            className={`
        flex items-center gap-3 px-3 py-2 rounded-lg group relative
        ${isActive
                    ? 'bg-primary-light text-primary'
                    : 'text-text-secondary hover:bg-neutral-light hover:text-text-primary'
                }
      `}
        >
            {/* Active indicator - left border */}
            {isActive && (
                <span className="absolute left-0 w-0.5 h-6 bg-primary rounded-r" />
            )}
            <span className={`transition-colors ${isActive ? 'text-primary' : 'group-hover:text-primary'}`}>
                {icon}
            </span>
            <span className="font-medium text-small">{label}</span>
        </Link>
    );
}
