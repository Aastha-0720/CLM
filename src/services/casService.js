const API_BASE = '/api';

export const casService = {
    getAllCAS: async () => {
        const response = await fetch(`${API_BASE}/cas`);
        if (!response.ok) throw new Error('Failed to fetch CAS records');
        return await response.json();
    },

    generateCAS: async (contractId) => {
        // Now called via backend
        const response = await fetch(`${API_BASE}/contracts/${contractId}/generate-cas`, {
            method: 'POST'
        });
        if (!response.ok) throw new Error('Failed to generate CAS');
        return await response.json();
    },

    updateCASStatus: async (casId, status) => {
        // Status typically "Approve" or "Reject"
        const action = status === 'Approved' ? 'Approve' : 'Reject';
        const response = await fetch(`${API_BASE}/cas/${casId}/approve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(action)
        });
        if (!response.ok) throw new Error('Failed to update CAS status');
        return await response.json();
    }
};
