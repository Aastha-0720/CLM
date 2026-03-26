import { getAuthHeaders } from './authHelper';

const API_BASE = '/api';

export const dashboardService = {
    getDashboardKPIs: async () => {
        const response = await fetch(`${API_BASE}/dashboard/stats`, { headers: getAuthHeaders() });
        if (!response.ok) throw new Error('Failed to fetch dashboard stats');
        const stats = await response.json();

        // Map backend response matching Dashboard.jsx expectations
        return {
            activeContracts: stats.totalContracts,
            underReview: stats.underReview,
            pendingApprovals: stats.pendingApproval,
            approvedContracts: stats.approved
        };
    },

    getUserActivity: async () => {
        const response = await fetch(`${API_BASE}/activity`, { headers: getAuthHeaders() });
        if (!response.ok) throw new Error('Failed to fetch user activity');
        return await response.json();
    }
};
