export const getAuthHeaders = (isFormData = false) => {
    const saved = localStorage.getItem('clm-user');
    const headers = {};
    if (!isFormData) {
        headers['Content-Type'] = 'application/json';
    }
    if (saved) {
        try {
            const user = JSON.parse(saved);
            if (user.role) headers['X-User-Role'] = user.role;
            if (user.email) headers['X-User-Email'] = user.email;
        } catch (e) {
            console.error("Error parsing user from localStorage", e);
        }
    }
    return headers;
};
