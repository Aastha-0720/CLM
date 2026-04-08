const API_BASE = '/api';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token') || 'mock-token-admin';
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
};

export const contractService = {
    getAllContracts: async () => {
        const response = await fetch(`${API_BASE}/contracts`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch contracts');
        return await response.json();
    },

    getDashboardStats: async () => {
        const response = await fetch(`${API_BASE}/dashboard/stats`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch dashboard stats');
        return await response.json();
    },

    getContractsByStage: async (stageFilter) => {
        const response = await fetch(`${API_BASE}/contracts?stage=${encodeURIComponent(stageFilter)}`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch contracts by stage');
        return await response.json();
    },

<<<<<<< Updated upstream
    getDepartmentContracts: async (department) => {
        const response = await fetch(`${API_BASE}/contracts?department=${encodeURIComponent(department)}`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch department contracts');
        return await response.json();
    },

    uploadContract: async (payload) => {
        if (payload instanceof FormData) {
            const h = getAuthHeaders();
            delete h['Content-Type']; // Let browser set boundary
            const response = await fetch(`${API_BASE}/upload`, {
                method: 'POST',
                headers: h,
                body: payload
            });
            if (!response.ok) throw new Error('Failed to upload file');
            return await response.json();
        }
        return { status: 'success', message: 'Use CSV upload for multi-creation' };
    },

    updateContract: async (id, data) => {
        const response = await fetch(`${API_BASE}/contracts/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Failed to update contract');
        return await response.json();
    },

=======
>>>>>>> Stashed changes
    updateContractStage: async (id, stage, status) => {
        const action = status === 'Approved' ? 'approve' : 'reject';
        const response = await fetch(`${API_BASE}/contracts/doa/${id}/${action}`, {
            method: 'POST',
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to update stage');
        return await response.json();
    },

    submitReview: async (id, department, status, comments) => {
        const response = await fetch(`${API_BASE}/contracts/${id}/review`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ department, status, comments, reviewer: "Admin" })
        });
        if (!response.ok) throw new Error('Failed to submit review');
        return await response.json();
    },

<<<<<<< Updated upstream
    parseEmailContent: async (emailData) => {
        const response = await fetch(`${API_BASE}/ai/extract-email`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                email_from: emailData.from || '',
                subject: emailData.subject || '',
                date: emailData.date || new Date().toISOString(),
                body: emailData.body || emailData.text || ''
            })
        });
        if (!response.ok) throw new Error('Email extraction failed');
        const data = await response.json();
        // Map to legacy format for backward compat
        return {
            counterpartyName: data.contractInfo?.counterpartyName || '',
            contractValue: data.contractInfo?.contractValue || '',
            dates: `${data.dates?.proposedStartDate || ''} - ${data.dates?.proposedEndDate || ''}`,
            subject: data.contractInfo?.subject || '',
            fullData: data  // keep full rich data available
        };
    },

    extractContractData: async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const h = getAuthHeaders();
        delete h['Content-Type'];
        const response = await fetch(`${API_BASE}/ai/extract-file`, {
            method: 'POST',
            headers: h,
            body: formData
        });
        if (!response.ok) throw new Error('File extraction failed');
        return await response.json();
    },

    generateContractDraft: async (formData) => {
        try {
            const response = await fetch('/api/ai/generate-draft', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(formData)
            });
            if (!response.ok) throw new Error('Failed');
            const data = await response.json();
            return data.draft;
        } catch (err) {
            return `# ${formData.title}\n\n## Standard Terms Applied.`;
        }
    },

    verifyContract: async (contractData) => {
        const response = await fetch(`${API_BASE}/ai/analyze-contract`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                document_text: JSON.stringify(contractData), // Pass structured data as text
                contract_type: contractData.category || 'General',
                jurisdiction: 'International',
                value: contractData.contractValue || '0',
                duration: contractData.duration || 'Unknown'
            })
        });
        if (!response.ok) throw new Error('Contract verification failed');
        const data = await response.json();
        
        return {
            complianceScore: data.riskScore != null ? 100 - data.riskScore : 0,
            risks: (data.criticalIssues || []).map(issue => ({ level: "High", message: issue })),
            missingFields: data.missingClauses || [],
            fullAnalysis: data // for rich display in panel
        };
    },

    checkCompliance: async (documentText, regulations = 'GDPR,SOX', industry = 'Technology', jurisdiction = 'International') => {
        const response = await fetch(`${API_BASE}/ai/check-compliance`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ document_text: documentText, regulations, industry, jurisdiction })
        });
        return await response.json();
    },

    routeReview: async (contractData) => {
        const response = await fetch(`${API_BASE}/ai/route-review`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                title: contractData.title,
                value: parseFloat((contractData.contractValue || '0').replace(/[^0-9.]/g, '')),
                contract_type: contractData.category,
                jurisdiction: 'International',
                risk: contractData.riskLevel || 'Medium'
            })
        });
        return await response.json();
    },

    searchContracts: async (query, searchType = 'Semantic') => {
        const response = await fetch(`${API_BASE}/ai/search-contracts`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ query, search_type: searchType })
        });
        return await response.json();
    },

    trackLifecycle: async (contractData) => {
        const response = await fetch(`${API_BASE}/ai/track-lifecycle`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                title: contractData.title,
                start_date: contractData.startDate,
                end_date: contractData.endDate,
                renewal_clause: contractData.renewalClause,
                notice_days: contractData.noticeRequired,
                value: contractData.value,
                status: contractData.status
            })
        });
        return await response.json();
    },

=======
>>>>>>> Stashed changes
    getComments: async (contractId, department = null) => {
        let url = `/api/contracts/${contractId}/comments`;
        if (department) {
            url += `?department=${encodeURIComponent(department)}`;
        }
        const response = await fetch(url, {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch comments');
        return await response.json();
    },

    getAuditLogs: async (contractId) => {
        const response = await fetch(`${API_BASE}/audit/${contractId}`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch audit logs');
        return await response.json();
    },

    getActivityTimeline: async (contractId) => {
        return await contractService.getAuditLogs(contractId);
    },

    addComment: async (contractId, clauseId, text, department, author) => {
        const response = await fetch(`/api/contracts/${contractId}/comments`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                department: department,
                clauseId: clauseId,
                comment: text,
                commentedBy: author,
                parentId: null
            })
        });
        if (!response.ok) throw new Error('Failed to add comment');
        return await response.json();
    },

    deleteComment: async (commentId) => {
        const response = await fetch(`/api/comments/${commentId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to delete comment');
        return await response.json();
    },

    escalateContract: async (contractId, department, reason, escalatedBy) => {
        const response = await fetch(`${API_BASE}/contracts/${contractId}/escalate`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ escalatedBy, department, reason })
        });
        if (!response.ok) throw new Error('Escalation failed');
        return await response.json();
    },

    getNotifications: async (role) => {
        const response = await fetch(`${API_BASE}/notifications?role=${encodeURIComponent(role)}`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch notifications');
        return await response.json();
    },

    markNotificationRead: async (notifId, role) => {
        const response = await fetch(`${API_BASE}/notifications/${notifId}/read?role=${encodeURIComponent(role)}`, {
            method: 'POST',
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to mark notification as read');
        return await response.json();
    },

    redlineClause: async (data) => {
        const response = await fetch(`/api/ai/redline-clause`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Redline failed');
        return response.json();
    },

    createChangeRequest: async (contractId, data) => {
        const response = await fetch(`${API_BASE}/contracts/${contractId}/change-requests`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Failed to create change request');
        return response.json();
    },

    fetchChangeRequests: async (contractId, department = null) => {
        let url = `${API_BASE}/contracts/${contractId}/change-requests`;
        if (department) url += `?department=${encodeURIComponent(department)}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch change requests');
        return response.json();
    },

    updateChangeRequest: async (crId, data) => {
        const response = await fetch(`${API_BASE}/change-requests/${crId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Failed to update change request');
        return response.json();
    },

    applyRedline: async (contractId, data) => {
        const response = await fetch(`${API_BASE}/contracts/${contractId}/redlines`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Failed to apply redline');
        return response.json();
    },

    getContractVersions: async (contractId) => {
        const response = await fetch(`${API_BASE}/contracts/${contractId}/versions`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch contract versions');
        return response.json();
    },

    resubmitForReview: async (contractId, data = {}) => {
        const response = await fetch(`${API_BASE}/contracts/${contractId}/resubmit-review`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Failed to resubmit contract for review');
        return response.json();
    },

<<<<<<< Updated upstream
=======
    getDiginkStatus: async (contractId) => {
        const response = await fetch(`${API_BASE}/contracts/${contractId}/digink-status`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch DigInk status');
        return await response.json();
    },
    
    getUserAuditLogs: async () => {
        const response = await fetch(`${API_BASE}/user/audit-logs`, { headers: getAuthHeaders() });
        if (!response.ok) throw new Error('Failed to fetch user audit logs');
        return await response.json();
    },

    // Clears all PDF annotations for a contract (used when re-sharing or resubmitting)
    clearContractAnnotations: async (contractId) => {
        const response = await fetch(`${API_BASE}/contracts/${contractId}/pdf-annotations/clear-all`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
        });
        if (!response.ok) throw new Error('Failed to clear annotations');
        return await response.json();
    },
>>>>>>> Stashed changes
};
