/**
 * Updated API Client with Team-Scoped Methods
 * 
 * Handles all authenticated API calls to the backend
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface ApiOptions {
    token: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: any;
}

async function apiRequest(endpoint: string, options: ApiOptions) {
    const { token, method = 'GET', body } = options;

    const headers: HeadersInit = {
        'Authorization': `Bearer ${token}`,
    };

    const config: RequestInit = {
        method,
        headers,
    };

    if (body) {
        if (body instanceof FormData) {
            config.body = body;
        } else {
            headers['Content-Type'] = 'application/json';
            config.body = JSON.stringify(body);
        }
    }

    const response = await fetch(`${API_URL}${endpoint}`, config);

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error.error || error.message || 'Request failed');
    }

    return response.json();
}

// Team APIs
export const teamsApi = {
    getUserTeams: async (token: string) => {
        return apiRequest('/api/users/me/teams', { token });
    },

    createOrganization: async (token: string, data: { name: string; plan?: string }) => {
        return apiRequest('/api/organizations', { token, method: 'POST', body: data });
    },

    createTeam: async (token: string, orgId: string, data: { name: string; slug: string }) => {
        return apiRequest(`/api/organizations/${orgId}/teams`, { token, method: 'POST', body: data });
    },
};

// Upload APIs
export const uploadApi = {
    uploadFile: async (token: string, teamId: string, file: File) => {
        const formData = new FormData();
        formData.append('file', file);

        return apiRequest(`/api/teams/${teamId}/upload`, {
            token,
            method: 'POST',
            body: formData,
        });
    },

    getJobStatus: async (token: string, teamId: string, jobId: string) => {
        return apiRequest(`/api/teams/${teamId}/upload/${jobId}/status`, { token });
    },
};

// Decision APIs
export const decisionsApi = {
    getDecisions: async (token: string, teamId: string) => {
        return apiRequest(`/api/teams/${teamId}/decisions`, { token });
    },

    getGraph: async (token: string, teamId: string) => {
        return apiRequest(`/api/teams/${teamId}/graph`, { token });
    },

    getFiles: async (token: string, teamId: string) => {
        return apiRequest(`/api/teams/${teamId}/files`, { token });
    },

    getFileDecisions: async (token: string, teamId: string, fileHash: string) => {
        return apiRequest(`/api/teams/${teamId}/files/${fileHash}/decisions`, { token });
    },
};

// Oracle API
export const oracleApi = {
    query: async (token: string, teamId: string, question: string) => {
        return apiRequest(`/api/teams/${teamId}/oracle/query`, {
            token,
            method: 'POST',
            body: { question },
        });
    },
};

// Metrics APIs
export const metricsApi = {
    getFlags: async (token: string, teamId: string) => {
        return apiRequest(`/api/teams/${teamId}/flags`, { token });
    },

    getMetrics: async (token: string, teamId: string) => {
        return apiRequest(`/api/teams/${teamId}/metrics`, { token });
    },
};
