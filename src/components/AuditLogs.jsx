import React, { useState, useEffect } from 'react';
import { getAuthHeaders } from '../services/authHelper';
import styles from './Dashboard.module.css';
import { ClipboardList, Filter, Search, Download, Trash2 } from 'lucide-react';

const AuditLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const handleDeleteLog = async (logId) => {
        if (!window.confirm("Are you sure you want to delete this log entry?")) return;
        try {
            const res = await fetch(`/api/admin/audit-logs/${logId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            if (res.ok) {
                setLogs(logs.filter(l => l.id !== logId));
            } else {
                alert("Failed to delete log");
            }
        } catch (err) {
            console.error("Delete failed", err);
        }
    };

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/admin/audit-logs', {
                headers: getAuthHeaders()
            });
            const data = await res.json();
            setLogs(data);
        } catch (err) {
            console.error("Failed to fetch logs", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const filteredLogs = logs.filter(log => 
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#F59E0B' }}>System Audit Logs</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Complete chronological record of all administrative and user actions.</p>
                </div>
            </div>

            <div style={{ 
                display: 'flex', gap: '16px', marginBottom: '24px', 
                background: 'var(--bg-card)', padding: '16px', borderRadius: '12px',
                border: '1px solid var(--border-color)'
            }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input 
                        type="text" 
                        placeholder="Search logs by action, user, or details..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{ 
                            width: '100%', padding: '10px 10px 10px 40px', borderRadius: '8px', 
                            background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', 
                            color: '#fff' 
                        }}
                    />
                </div>
                <button style={{ 
                    display: 'flex', alignItems: 'center', gap: '8px',
                    background: 'rgba(255,255,255,0.05)', color: '#fff',
                    padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--border-color)',
                    cursor: 'pointer'
                }}>
                    <Filter size={18} /> Filter
                </button>
            </div>

            <div className={styles.tableCard}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Timestamp</th>
                            <th>User Context</th>
                            <th>Action Taken</th>
                            <th>Details</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '48px' }}>Loading system logs...</td></tr>
                        ) : filteredLogs.length > 0 ? filteredLogs.map(log => (
                            <tr key={log.id}>
                                <td style={{ whiteSpace: 'nowrap', fontSize: '13px', color: 'var(--text-muted)' }}>
                                    {new Date(log.timestamp).toLocaleString()}
                                </td>
                                <td>
                                    <div style={{ fontWeight: '700' }}>{log.user}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{log.role}</div>
                                </td>
                                <td>
                                    <span className={styles.statusBadge} style={{ background: 'rgba(245,158,11,0.1)', color: '#F59E0B' }}>
                                        {log.action}
                                    </span>
                                </td>
                                <td style={{ fontSize: '13px' }}>{log.details}</td>
                                <td style={{ textAlign: 'right' }}>
                                    <button 
                                        onClick={() => handleDeleteLog(log.id)}
                                        style={{ 
                                            background: 'none', border: 'none', color: '#EF4444', 
                                            cursor: 'pointer', padding: '4px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            marginLeft: 'auto'
                                        }}
                                        title="Delete log"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>No audit logs matching your criteria.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AuditLogs;
