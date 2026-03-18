import React, { useState, useEffect, useCallback } from 'react';
import styles from './AuditLogs.module.css';

const AuditLogs = () => {
    const [logs, setLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterAction, setFilterAction] = useState('All');

    const fetchLogs = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/audit-logs');
            if (!response.ok) throw new Error('Failed to fetch audit logs');
            const data = await response.json();
            setLogs(data);
        } catch (err) {
            console.error('Fetch logs error:', err);
            // Fallback demo data
            const now = new Date();
            setLogs([
                { id: 1, user: 'Aastha Sharma', action: 'LOGIN', entity: 'System', timestamp: new Date(now - 1000 * 60 * 5).toISOString() },
                { id: 2, user: 'John Doe', action: 'STAGE_CHANGE', entity: 'OPP-001 Stage -> Negotiation', timestamp: new Date(now - 1000 * 60 * 15).toISOString() },
                { id: 3, user: 'Jane Smith', action: 'CONTRACT_APPROVAL', entity: 'CON-2024-002', timestamp: new Date(now - 1000 * 60 * 45).toISOString() },
                { id: 4, user: 'Aastha Sharma', action: 'USER_CREATE', entity: 'New User: Mark Ross', timestamp: new Date(now - 1000 * 3600 * 2).toISOString() },
                { id: 5, user: 'Admin', action: 'SETTINGS_UPDATE', entity: 'SMTP Configuration', timestamp: new Date(now - 1000 * 3600 * 4).toISOString() },
                { id: 6, user: 'John Doe', action: 'STAGE_CHANGE', entity: 'OPP-004 Stage -> Contract Award', timestamp: new Date(now - 1000 * 3600 * 6).toISOString() },
            ]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const getActionClass = (action) => {
        const a = action.toLowerCase();
        if (a.includes('login')) return styles.action_login;
        if (a.includes('stage')) return styles.action_stage;
        if (a.includes('contract')) return styles.action_contract;
        if (a.includes('user')) return styles.action_user;
        return styles.action_other;
    };

    const formatTimestamp = (ts) => {
        const date = new Date(ts);
        return date.toLocaleString('en-US', { 
            month: 'short', day: 'numeric', 
            hour: '2-digit', minute: '2-digit', second: '2-digit' 
        });
    };

    const filteredLogs = logs.filter(log => {
        const matchesSearch = log.user.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             log.entity.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesAction = filterAction === 'All' || log.action === filterAction;
        return matchesSearch && matchesAction;
    });

    if (isLoading && logs.length === 0) return (
        <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
        </div>
    );

    const actionTypes = ['All', ...new Set(logs.map(l => l.action))];

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2>Audit & Activity Logs</h2>
            </div>

            <div className={styles.filterBar}>
                <div className={styles.searchWrapper}>
                    <span className={styles.searchIcon}>🔍</span>
                    <input 
                        className={styles.searchInput}
                        placeholder="Search by user or entity..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className={styles.filterGroup}>
                    <select 
                        className={styles.select}
                        value={filterAction}
                        onChange={(e) => setFilterAction(e.target.value)}
                    >
                        {actionTypes.map(type => (
                            <option key={type} value={type}>
                                {type === 'All' ? 'All Actions' : type.replace(/_/g, ' ')}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className={styles.tableCard}>
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Timestamp</th>
                                <th>User</th>
                                <th>Action</th>
                                <th>Details / Entity</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLogs.map(log => (
                                <tr key={log.id}>
                                    <td className={styles.timestamp}>
                                        {formatTimestamp(log.timestamp)}
                                    </td>
                                    <td>
                                        <div className={styles.userInfo}>
                                            <div className={styles.userAvatar}>
                                                {log.user.split(' ').map(n => n[0]).join('')}
                                            </div>
                                            <span className={styles.userName}>{log.user}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`${styles.actionBadge} ${getActionClass(log.action)}`}>
                                            {log.action.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td className={styles.entity}>
                                        {log.entity}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AuditLogs;
