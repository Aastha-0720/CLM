import { getAuthHeaders } from './authHelper';

const API_BASE = '/api';

export const approvalService = {
    // DOA configuration rules based on requirement
    getDOARole: (value) => {
        if (value < 10000) return 'Manager';
        if (value <= 50000) return 'Director';
        return 'VP';
    },

    // Fetch contracts matching both stage AND appropriate role
    getPendingApprovals: async (userRole) => {
        const response = await fetch(`${API_BASE}/contracts?stage=DOA Approval`, { headers: getAuthHeaders() });
        if (!response.ok) throw new Error('Failed to fetch pending approvals');
        const allPending = await response.json();

        // Filter by role mapped against DOA thresholds on frontend
        // Alternatively, backend could handle filtering.
        const filtered = allPending.filter(contract => {
            const requiredRole = approvalService.getDOARole(contract.value);
            if (userRole === 'Admin') return true; // Admins see everything
            return requiredRole === userRole;
        });

        return filtered;
    },

    submitApproval: async (contractId, decision) => {
        const action = decision === 'Approved' ? 'approve' : 'reject';
        const response = await fetch(`${API_BASE}/contracts/doa/${contractId}/${action}`, {
            method: 'POST',
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to submit approval');
        return await response.json();
    }
};
