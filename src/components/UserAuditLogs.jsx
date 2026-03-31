import React, { useState, useEffect } from 'react';
import { getAuthHeaders } from '../services/authHelper';
import styles from './Dashboard.module.css';
import { ClipboardList, Filter, Search, Download, Clock, CheckCircle, Hourglass, AlertCircle } from 'lucide-react';
import { contractService } from '../services/contractService';

const UserAuditLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterAction, setFilterAction] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const data = await contractService.getUserAuditLogs();
            setLogs(data);
        } catch (err) {
            console.error("Failed to fetch user logs", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const filteredLogs = logs.filter(log => {
        const matchesSearch = 
            log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.details?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.contract_id?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesAction = filterAction === 'all' || log.action?.toLowerCase().includes(filterAction.toLowerCase());
        
        let status = 'completed';
        if (log.details?.toLowerCase().includes('pending')) status = 'pending';
        if (log.details?.toLowerCase().includes('rejected')) status = 'rejected';
        const matchesStatus = filterStatus === 'all' || status === filterStatus;

        const logDate = new Date(log.timestamp);
        const matchesDate = (!dateRange.start || logDate >= new Date(dateRange.start)) &&
                           (!dateRange.end || logDate <= new Date(dateRange.end));

        return matchesSearch && matchesAction && matchesStatus && matchesDate;
    });

    const stats = {
        total: logs.length,
        pending: logs.filter(l => l.details?.toLowerCase().includes('pending')).length,
        completed: logs.length - logs.filter(l => l.details?.toLowerCase().includes('pending') || l.details?.toLowerCase().includes('rejected')).length
    };

    const getStatusColor = (details) => {
        const text = details?.toLowerCase() || '';
        if (text.includes('rejected')) return '#EF4444';
        if (text.includes('pending')) return '#F59E0B';
        return '#10B981';
    };

    return (
        <div style={{ padding: '24px' }}>
            <div style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--accent-teal)' }}>My Activity Logs</h2>
                <p style={{ color: 'var(--text-muted)' }}>A complete record of your actions and contract interactions.</p>
            </div>

            {/* Summary KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                <div className={styles.kpiCard} style={{ borderTop: '4px solid var(--accent-teal)' }}>
                    <div className={styles.kpiIcon} style={{ color: 'var(--accent-teal)' }}><Clock size={20} /></div>
                    <div className={styles.kpiInfo}>
                        <div className={styles.kpiValue}>{stats.total}</div>
                        <div className={styles.kpiLabel}>Total Actions</div>
                    </div>
                </div>
                <div className={styles.kpiCard} style={{ borderTop: '4px solid #F59E0B' }}>
                    <div className={styles.kpiIcon} style={{ color: '#F59E0B' }}><Hourglass size={20} /></div>
                    <div className={styles.kpiInfo}>
                        <div className={styles.kpiValue}>{stats.pending}</div>
                        <div className={styles.kpiLabel}>Pending Actions</div>
                    </div>
                </div>
                <div className={styles.kpiCard} style={{ borderTop: '4px solid #10B981' }}>
                    <div className={styles.kpiIcon} style={{ color: '#10B981' }}><CheckCircle size={20} /></div>
                    <div className={styles.kpiInfo}>
                        <div className={styles.kpiValue}>{stats.completed}</div>
                        <div className={styles.kpiLabel}>Completed Actions</div>
                    </div>
                </div>
            </div>

            <div className={styles.tableCard}>
                <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
                        <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={18} />
                        <input 
                            className={styles.inputField}
                            placeholder="Search by action, ID, or details..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ paddingLeft: '40px', width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}
                        />
                    </div>
                    
                    <select 
                        className={styles.inputField}
                        value={filterAction}
                        onChange={(e) => setFilterAction(e.target.value)}
                        style={{ width: '150px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}
                    >
                        <option value="all">All Actions</option>
                        <option value="create">Created</option>
                        <option value="edit">Edited</option>
                        <option value="review">Reviewed</option>
                        <option value="approve">Approved</option>
                    </select>

                    <select 
                        className={styles.inputField}
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        style={{ width: '150px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}
                    >
                        <option value="all">All Status</option>
                        <option value="completed">Completed</option>
                        <option value="pending">Pending</option>
                        <option value="rejected">Rejected</option>
                    </select>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input 
                            type="date"
                            className={styles.inputField}
                            value={dateRange.start}
                            onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                            style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}
                        />
                        <span style={{ color: 'var(--text-muted)' }}>to</span>
                        <input 
                            type="date"
                            className={styles.inputField}
                            value={dateRange.end}
                            onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                            style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}
                        />
                    </div>

                    <button 
                        onClick={fetchLogs}
                        style={{ padding: '8px 16px', borderRadius: '8px', background: 'var(--accent-teal)', color: 'var(--bg-main)', border: 'none', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <Clock size={16} /> Refresh
                    </button>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Date & Time</th>
                                <th>Action</th>
                                <th>Contract ID</th>
                                <th>Status</th>
                                <th>Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '48px' }}>Loading logs...</td></tr>
                            ) : filteredLogs.length > 0 ? filteredLogs.map(log => {
                                const isPending = log.details?.toLowerCase().includes('pending');
                                const isRejected = log.details?.toLowerCase().includes('rejected');
                                const statusLabel = isRejected ? 'Rejected' : isPending ? 'Pending' : 'Completed';
                                
                                return (
                                    <tr key={log.id} style={{ cursor: log.contract_id ? 'pointer' : 'default' }}>
                                        <td style={{ whiteSpace: 'nowrap' }}>
                                            {new Date(log.timestamp).toLocaleString(undefined, {
                                                year: 'numeric', month: 'short', day: 'numeric',
                                                hour: '2-digit', minute: '2-digit'
                                            })}
                                        </td>
                                        <td>
                                            <span style={{ fontWeight: '700', color: 'var(--accent-teal)' }}>{log.action}</span>
                                        </td>
                                        <td style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                                            {log.contract_id ? log.contract_id.slice(-12) : 'N/A'}
                                        </td>
                                        <td>
                                            <span className={styles.statusBadge} style={{ 
                                                backgroundColor: `${getStatusColor(log.details)}15`,
                                                color: getStatusColor(log.details)
                                            }}>
                                                {statusLabel}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '400px' }}>
                                            {log.details}
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>No activity logs found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default UserAuditLogs;
