'use client';

/**
 * Settings Page - Team and User Preferences
 * Allows users to manage team settings and personal preferences
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Settings,
    User,
    Building2,
    Bell,
    Palette,
    Shield,
    Save,
    Check,
} from 'lucide-react';
import { Card } from '@/components/Card';
import { useAuth } from '@/contexts/AuthContext';
import { useTeam } from '@/contexts/TeamContext';

interface TeamSettings {
    team: {
        id: string;
        name: string;
        slug: string;
        description: string;
    };
    organization: {
        id: string;
        name: string;
        plan: string;
    };
    preferences: {
        notifications_enabled: boolean;
        email_digests: boolean;
        conflict_severity_threshold: number;
        auto_rebuild_graph: boolean;
    };
}

export default function SettingsPage() {
    const { user, session } = useAuth();
    const { selectedTeam, loading: teamsLoading, userRole } = useTeam();
    const router = useRouter();
    const [settings, setSettings] = useState<TeamSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [activeTab, setActiveTab] = useState<'team' | 'profile' | 'notifications'>('team');

    // Form state
    const [teamName, setTeamName] = useState('');
    const [teamDescription, setTeamDescription] = useState('');

    useEffect(() => {
        if (!user && !teamsLoading) {
            router.push('/login');
        }
    }, [user, teamsLoading, router]);

    useEffect(() => {
        if (selectedTeam && session?.access_token) {
            fetchSettings();
        }
    }, [selectedTeam, session]);

    async function fetchSettings() {
        if (!selectedTeam || !session?.access_token) return;

        try {
            setLoading(true);
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/teams/${selectedTeam.team.id}/settings`,
                {
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`,
                        'x-team-id': selectedTeam.team.id,
                    },
                }
            );

            if (response.ok) {
                const data = await response.json();
                setSettings(data.settings);
                setTeamName(data.settings.team.name);
                setTeamDescription(data.settings.team.description || '');
            }
        } catch (error) {
            console.error('Failed to fetch settings:', error);
        } finally {
            setLoading(false);
        }
    }

    async function saveSettings() {
        if (!selectedTeam || !session?.access_token) return;

        try {
            setSaving(true);
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/teams/${selectedTeam.team.id}/settings`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`,
                        'x-team-id': selectedTeam.team.id,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        name: teamName,
                        description: teamDescription,
                    }),
                }
            );

            if (response.ok) {
                setSaved(true);
                setTimeout(() => setSaved(false), 2000);
            }
        } catch (error) {
            console.error('Failed to save settings:', error);
        } finally {
            setSaving(false);
        }
    }

    const isAdmin = userRole === 'admin';

    if (teamsLoading || loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-text-secondary">Loading settings...</span>
                </div>
            </div>
        );
    }

    if (!selectedTeam) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <Settings className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
                    <p className="text-text-secondary">No team selected</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-h1 text-text-primary mb-2">Settings</h1>
                <p className="text-body text-text-secondary">
                    Manage team preferences and account settings
                </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-neutral-light rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab('team')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-small font-medium transition-colors ${activeTab === 'team'
                            ? 'bg-surface text-text-primary shadow-sm'
                            : 'text-text-secondary hover:text-text-primary'
                        }`}
                >
                    <Building2 className="w-4 h-4" />
                    Team
                </button>
                <button
                    onClick={() => setActiveTab('profile')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-small font-medium transition-colors ${activeTab === 'profile'
                            ? 'bg-surface text-text-primary shadow-sm'
                            : 'text-text-secondary hover:text-text-primary'
                        }`}
                >
                    <User className="w-4 h-4" />
                    Profile
                </button>
                <button
                    onClick={() => setActiveTab('notifications')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-small font-medium transition-colors ${activeTab === 'notifications'
                            ? 'bg-surface text-text-primary shadow-sm'
                            : 'text-text-secondary hover:text-text-primary'
                        }`}
                >
                    <Bell className="w-4 h-4" />
                    Notifications
                </button>
            </div>

            {/* Team Settings Tab */}
            {activeTab === 'team' && (
                <div className="space-y-6">
                    <Card className="p-6">
                        <h2 className="text-h3 text-text-primary mb-4 flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-primary" />
                            Team Information
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-small font-medium text-text-secondary mb-2">
                                    Team Name
                                </label>
                                <input
                                    type="text"
                                    value={teamName}
                                    onChange={(e) => setTeamName(e.target.value)}
                                    disabled={!isAdmin}
                                    className="w-full px-4 py-2.5 bg-surface border border-border rounded-lg text-body text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                            </div>

                            <div>
                                <label className="block text-small font-medium text-text-secondary mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={teamDescription}
                                    onChange={(e) => setTeamDescription(e.target.value)}
                                    disabled={!isAdmin}
                                    rows={3}
                                    className="w-full px-4 py-2.5 bg-surface border border-border rounded-lg text-body text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed resize-none"
                                />
                            </div>

                            {isAdmin && (
                                <button
                                    onClick={saveSettings}
                                    disabled={saving}
                                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-small font-medium hover:bg-primary-hover transition-colors disabled:opacity-50"
                                >
                                    {saved ? (
                                        <>
                                            <Check className="w-4 h-4" />
                                            Saved
                                        </>
                                    ) : saving ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            Save Changes
                                        </>
                                    )}
                                </button>
                            )}

                            {!isAdmin && (
                                <p className="text-small text-text-tertiary flex items-center gap-2">
                                    <Shield className="w-4 h-4" />
                                    Only admins can modify team settings
                                </p>
                            )}
                        </div>
                    </Card>

                    <Card className="p-6">
                        <h2 className="text-h3 text-text-primary mb-4 flex items-center gap-2">
                            <Shield className="w-5 h-5 text-primary" />
                            Organization
                        </h2>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-small text-text-tertiary mb-1">Organization Name</p>
                                <p className="text-body font-medium text-text-primary">
                                    {settings?.organization.name || 'N/A'}
                                </p>
                            </div>
                            <div>
                                <p className="text-small text-text-tertiary mb-1">Plan</p>
                                <span className="inline-flex px-2.5 py-1 bg-primary-light text-primary text-meta font-medium rounded-full capitalize">
                                    {settings?.organization.plan || 'free'}
                                </span>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
                <Card className="p-6">
                    <h2 className="text-h3 text-text-primary mb-4 flex items-center gap-2">
                        <User className="w-5 h-5 text-primary" />
                        Your Profile
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <p className="text-small text-text-tertiary mb-1">Email</p>
                            <p className="text-body font-medium text-text-primary">{user?.email}</p>
                        </div>
                        <div>
                            <p className="text-small text-text-tertiary mb-1">Role in {selectedTeam.team.name}</p>
                            <span className="inline-flex px-2.5 py-1 bg-aligned-light text-aligned text-meta font-medium rounded-full capitalize">
                                {userRole}
                            </span>
                        </div>
                    </div>
                </Card>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
                <Card className="p-6">
                    <h2 className="text-h3 text-text-primary mb-4 flex items-center gap-2">
                        <Bell className="w-5 h-5 text-primary" />
                        Notification Preferences
                    </h2>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-neutral-light rounded-lg">
                            <div>
                                <p className="text-body font-medium text-text-primary">Conflict Alerts</p>
                                <p className="text-small text-text-secondary">
                                    Get notified when new conflicts are detected
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" defaultChecked className="sr-only peer" />
                                <div className="w-11 h-6 bg-border rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-neutral-light rounded-lg">
                            <div>
                                <p className="text-body font-medium text-text-primary">Email Digests</p>
                                <p className="text-small text-text-secondary">
                                    Receive weekly summary of team activity
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" defaultChecked className="sr-only peer" />
                                <div className="w-11 h-6 bg-border rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-neutral-light rounded-lg">
                            <div>
                                <p className="text-body font-medium text-text-primary">Document Processing</p>
                                <p className="text-small text-text-secondary">
                                    Notify when document processing completes
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" defaultChecked className="sr-only peer" />
                                <div className="w-11 h-6 bg-border rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                            </label>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
}
