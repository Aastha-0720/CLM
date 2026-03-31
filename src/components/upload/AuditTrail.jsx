import React, { useState, useEffect } from 'react';
import { contractService } from '../../services/contractService';
import { Clock, User, Activity } from 'lucide-react';
import styles from './AuditTrail.module.css';

const AuditTrail = ({ contractId }) => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const data = await contractService.getAuditLogs(contractId);
                setLogs(data);
            } catch (err) {
                console.error('Failed to fetch audit logs:', err);
            } finally {
                setLoading(false);
            }
        };
        if (contractId) fetchLogs();
    }, [contractId]);

    if (loading) return <div className={styles.loading}>Loading audit trail...</div>;

    return (
        <div className={styles.trailContainer}>
            <h5 className={styles.sectionTitle}>Audit Trail</h5>
            {logs.length === 0 ? (
                <p className={styles.noLogs}>No audit logs found for this contract.</p>
            ) : (
                <div className={styles.timeline}>
                    {logs.map((log, index) => (
                        <div key={log.id || index} className={styles.timelineItem}>
                            <div className={styles.timelineIcon}>
                                <Activity size={14} />
                            </div>
                            <div className={styles.timelineContent}>
                                <div className={styles.logHeader}>
                                    <span className={styles.action}>{log.message || log.action}</span>
                                    <span className={styles.time}>{new Date(log.timestamp).toLocaleString()}</span>
                                </div>
                                <div className={styles.user}>
                                    <User size={12} className={styles.userIcon} />
                                    <span>{log.actor || log.userName}</span>
                                    {log.role && log.role !== 'System' && (
                                        <span style={{ fontSize: '0.8rem', color: '#6B7280', marginLeft: '4px' }}>
                                            ({log.role})
                                        </span>
                                    )}
                                    {log.phase && (
                                        <span style={{ fontSize: '0.75rem', color: '#00C9B1', marginLeft: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            {log.phase}
                                        </span>
                                    )}
                                </div>
                                {(log.details || log.notes || (log.metadata && Array.isArray(log.metadata.steps) && log.metadata.steps.length > 0)) && (
                                    <div style={{ marginTop: '6px', color: '#94A3B8', fontSize: '0.85rem' }}>
                                        {log.details}
                                        {log.metadata && Array.isArray(log.metadata.steps) && log.metadata.steps.length > 0 && (
                                            <div style={{ marginTop: log.details ? '6px' : 0 }}>
                                                <strong>Steps:</strong> {log.metadata.steps.join(', ')}
                                            </div>
                                        )}
                                    </div>
                                )}
                                {log.notes && (
                                    <div style={{ marginTop: '6px', color: '#E2E8F0', fontSize: '0.85rem', lineHeight: 1.5 }}>
                                        <strong>Notes:</strong> {log.notes}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AuditTrail;
