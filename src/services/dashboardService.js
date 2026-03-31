const API_BASE = '/api';

export const dashboardService = {
    getDashboardKPIs: async () => {
        const response = await fetch(`${API_BASE}/dashboard/stats`);
        if (!response.ok) throw new Error('Failed to fetch dashboard stats');
        const stats = await response.json();

        // Map backend response matching Dashboard.jsx expectations
        return {
            activeContracts: stats.totalContracts,
            underReview: stats.underReview,
            pendingApprovals: stats.pendingApproval,
            approvedContracts: stats.approved,
            approvedThisMonth: stats.approvedThisMonth
        };
    }
};
