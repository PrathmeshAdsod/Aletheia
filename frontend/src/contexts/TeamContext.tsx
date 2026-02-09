/**
 * Team Context Provider
 * 
 * Manages selected team state globally
 */

'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { teamsApi } from '@/lib/team-api';

interface Team {
    id: string;
    name: string;
    slug: string;
    organization: {
        id: string;
        name: string;
    };
}

interface TeamMembership {
    team: Team;
    role: 'admin' | 'member' | 'viewer';
}

interface TeamContextType {
    teams: TeamMembership[];
    selectedTeam: TeamMembership | null;
    selectTeam: (teamId: string) => void;
    loading: boolean;
    userRole: 'admin' | 'member' | 'viewer' | null;
}

const TeamContext = createContext<TeamContextType | undefined>(undefined);

export function TeamProvider({ children }: { children: React.ReactNode }) {
    const { user, session } = useAuth();
    const [teams, setTeams] = useState<TeamMembership[]>([]);
    const [selectedTeam, setSelectedTeam] = useState<TeamMembership | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user && session?.access_token) {
            fetchTeams();
        } else {
            setTeams([]);
            setSelectedTeam(null);
            setLoading(false);
        }
    }, [user, session]);

    const fetchTeams = async () => {
        try {
            setLoading(true);
            const response = await teamsApi.getUserTeams(session!.access_token);
            setTeams(response.teams || []);

            // Auto-select first team
            if (response.teams && response.teams.length > 0) {
                setSelectedTeam(response.teams[0]);
            }
        } catch (error) {
            console.error('Failed to fetch teams:', error);
        } finally {
            setLoading(false);
        }
    };

    const selectTeam = (teamId: string) => {
        const team = teams.find(t => t.team.id === teamId);
        if (team) {
            setSelectedTeam(team);
        }
    };

    // Compute current user's role in selected team
    const userRole = selectedTeam?.role || null;

    return (
        <TeamContext.Provider value={{ teams, selectedTeam, selectTeam, loading, userRole }}>
            {children}
        </TeamContext.Provider>
    );
}

export const useTeam = () => {
    const context = useContext(TeamContext);
    if (context === undefined) {
        throw new Error('useTeam must be used within a TeamProvider');
    }
    return context;
};
