import React, { useState, useEffect, useCallback } from 'react';
import styles from './AllowedDomains.module.css';

const AllowedDomains = () => {
    const [domains, setDomains] = useState([]);
    const [newDomain, setNewDomain] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isAdding, setIsAdding] = useState(false);

    const fetchDomains = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/admin/domains');
            if (!response.ok) throw new Error('Failed to fetch allowed domains');
            const data = await response.json();
            setDomains(data);
            setError(null);
        } catch (err) {
            console.error('Fetch domains error:', err);
            setError('Could not load domains. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDomains();
    }, [fetchDomains]);

    const handleAddDomain = async (e) => {
        e.preventDefault();
        if (!newDomain) return;
        setIsAdding(true);
        try {
            const response = await fetch('/api/admin/domains', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ domain: newDomain })
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || 'Failed to add domain');
            }
            setNewDomain('');
            fetchDomains();
        } catch (err) {
            alert(err.message);
        } finally {
            setIsAdding(false);
        }
    };

    const handleToggleStatus = async (id, currentStatus) => {
        try {
            const response = await fetch(`/api/admin/domains/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_active: !currentStatus })
            });
            if (!response.ok) throw new Error('Failed to update status');
            fetchDomains();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this domain?')) return;
        try {
            const response = await fetch(`/api/admin/domains/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to delete domain');
            fetchDomains();
        } catch (err) {
            alert(err.message);
        }
    };

    if (isLoading && domains.length === 0) return (
        <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
        </div>
    );

    return (
        <div className={styles.container}>
            <div className={styles.addSection}>
                <form onSubmit={handleAddDomain} className={styles.addForm}>
                    <input 
                        type="text" 
                        value={newDomain} 
                        onChange={(e) => setNewDomain(e.target.value)}
                        placeholder="e.g. example.com"
                        className={styles.input}
                        required
                    />
                    <button type="submit" className={styles.addBtn} disabled={isAdding}>
                        {isAdding ? 'Adding...' : 'Add Domain'}
                    </button>
                </form>
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Domain</th>
                            <th>Status</th>
                            <th>Created At</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {domains.map(domain => (
                            <tr key={domain._id}>
                                <td className={styles.domainName}>{domain.domain}</td>
                                <td>
                                    <button 
                                        className={`${styles.statusBadge} ${domain.is_active ? styles.active : styles.inactive}`}
                                        onClick={() => handleToggleStatus(domain._id, domain.is_active)}
                                    >
                                        {domain.is_active ? 'Active' : 'Inactive'}
                                    </button>
                                </td>
                                <td>{new Date(domain.created_at).toLocaleDateString()}</td>
                                <td>
                                    <button 
                                        className={styles.deleteBtn}
                                        onClick={() => handleDelete(domain._id)}
                                    >
                                        🗑
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AllowedDomains;
