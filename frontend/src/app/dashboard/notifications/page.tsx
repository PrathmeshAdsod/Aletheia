'use client';

/**
 * Notifications Page - Team Notification Center
 * Shows all notifications with filtering and read/unread management
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Bell,
    AlertTriangle,
    FileText,
    Users,
    Info,
    CheckCheck,
    Check,
    Clock,
} from 'lucide-react';
import { Card } from '@/components/Card';
import { useAuth } from '@/contexts/AuthContext';
import { useTeam } from '@/contexts/TeamContext';

interface Notification {
    id: string;
    team_id: string;
    title: string;
    message: string;
    type: 'conflict' | 'upload' | 'member' | 'system';
    is_read: boolean;
    created_at: string;
    metadata?: Record<string, unknown>;
}

export default function NotificationsPage() {
    const { user, session } = useAuth();
    const { selectedTeam, loading: teamsLoading } = useTeam();
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');

    useEffect(() => {
        if (!user && !teamsLoading) {
            router.push('/login');
        }
    }, [user, teamsLoading, router]);

    useEffect(() => {
        if (selectedTeam && session?.access_token) {
            fetchNotifications();
        }
    }, [selectedTeam, session, filter]);

    async function fetchNotifications() {
        if (!selectedTeam || !session?.access_token) return;

        try {
            setLoading(true);
            const params = filter === 'unread' ? '?unread=true' : '';
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/teams/${selectedTeam.team.id}/notifications${params}`,
                {
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`,
                        'x-team-id': selectedTeam.team.id,
                    },
                }
            );

            if (response.ok) {
                const data = await response.json();
                setNotifications(data.notifications || []);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    }

    async function markAsRead(id: string) {
        if (!selectedTeam || !session?.access_token) return;

        try {
            await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/teams/${selectedTeam.team.id}/notifications/${id}/read`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`,
                        'x-team-id': selectedTeam.team.id,
                    },
                }
            );

            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, is_read: true } : n)
            );
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    }

    async function markAllAsRead() {
        if (!selectedTeam || !session?.access_token) return;

        try {
            await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/teams/${selectedTeam.team.id}/notifications/read-all`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`,
                        'x-team-id': selectedTeam.team.id,
                    },
                }
            );

            setNotifications(prev =>
                prev.map(n => ({ ...n, is_read: true }))
            );
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    }

    const getTypeIcon = (type: Notification['type']) => {
        switch (type) {
            case 'conflict':
                return <AlertTriangle className="w-5 h-5 text-conflict" />;
            case 'upload':
                return <FileText className="w-5 h-5 text-primary" />;
            case 'member':
                return <Users className="w-5 h-5 text-aligned" />;
            case 'system':
                return <Info className="w-5 h-5 text-text-secondary" />;
        }
    };

    const getTypeBadge = (type: Notification['type']) => {
        const colors = {
            conflict: 'bg-conflict-light text-conflict',
            upload: 'bg-primary-light text-primary',
            member: 'bg-aligned-light text-aligned',
            system: 'bg-neutral-light text-text-secondary',
        };
        return (
            <span className={`px-2 py-0.5 rounded-full text-meta font-medium capitalize ${colors[type]}`}>
                {type}
            </span>
        );
    };

    const formatTimeAgo = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${diffDays}d ago`;
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    if (teamsLoading || loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-text-secondary">Loading notifications...</span>
                </div>
            </div>
        );
    }

    if (!selectedTeam) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <Bell className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
                    <p className="text-text-secondary">No team selected</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-h1 text-text-primary mb-2 flex items-center gap-3">
                        Notifications
                        {unreadCount > 0 && (
                            <span className="px-2.5 py-1 bg-conflict text-white text-small font-medium rounded-full">
                                {unreadCount}
                            </span>
                        )}
                    </h1>
                    <p className="text-body text-text-secondary">
                        Stay updated on conflicts, uploads, and team activity
                    </p>
                </div>
                {unreadCount > 0 && (
                    <button
                        onClick={markAllAsRead}
                        className="flex items-center gap-2 px-4 py-2 text-primary hover:bg-primary-light rounded-lg text-small font-medium transition-colors"
                    >
                        <CheckCheck className="w-4 h-4" />
                        Mark all as read
                    </button>
                )}
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-1 p-1 bg-neutral-light rounded-xl w-fit">
                <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded-lg text-small font-medium transition-colors ${filter === 'all'
                            ? 'bg-surface text-text-primary shadow-sm'
                            : 'text-text-secondary hover:text-text-primary'
                        }`}
                >
                    All
                </button>
                <button
                    onClick={() => setFilter('unread')}
                    className={`px-4 py-2 rounded-lg text-small font-medium transition-colors ${filter === 'unread'
                            ? 'bg-surface text-text-primary shadow-sm'
                            : 'text-text-secondary hover:text-text-primary'
                        }`}
                >
                    Unread ({unreadCount})
                </button>
            </div>

            {/* Notifications List */}
            <Card>
                {notifications.length > 0 ? (
                    <div className="divide-y divide-border">
                        {notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={`p-5 transition-colors hover:bg-neutral-light/50 ${!notification.is_read ? 'bg-primary-light/5' : ''
                                    }`}
                            >
                                <div className="flex items-start gap-4">
                                    {/* Icon */}
                                    <div className="w-10 h-10 rounded-xl bg-neutral-light flex items-center justify-center flex-shrink-0">
                                        {getTypeIcon(notification.type)}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className={`text-body font-medium ${notification.is_read ? 'text-text-secondary' : 'text-text-primary'
                                                }`}>
                                                {notification.title}
                                            </h3>
                                            {!notification.is_read && (
                                                <div className="w-2 h-2 bg-primary rounded-full" />
                                            )}
                                        </div>
                                        <p className="text-small text-text-secondary mb-2">
                                            {notification.message}
                                        </p>
                                        <div className="flex items-center gap-3">
                                            {getTypeBadge(notification.type)}
                                            <span className="flex items-center gap-1 text-meta text-text-tertiary">
                                                <Clock className="w-3 h-3" />
                                                {formatTimeAgo(notification.created_at)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    {!notification.is_read && (
                                        <button
                                            onClick={() => markAsRead(notification.id)}
                                            className="p-2 text-text-tertiary hover:text-primary hover:bg-primary-light rounded-lg transition-colors"
                                            title="Mark as read"
                                        >
                                            <Check className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <div className="w-16 h-16 bg-neutral-light rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Bell className="w-8 h-8 text-text-tertiary" />
                        </div>
                        <h3 className="text-h3 text-text-primary mb-2">
                            {filter === 'unread' ? 'All caught up!' : 'No notifications yet'}
                        </h3>
                        <p className="text-text-secondary">
                            {filter === 'unread'
                                ? 'You have no unread notifications'
                                : 'Notifications about conflicts, uploads, and team activity will appear here'
                            }
                        </p>
                    </div>
                )}
            </Card>
        </div>
    );
}
