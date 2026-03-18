import React, { useState } from 'react';
import styles from './DOAApprovals.module.css';

// Removed static doaKpis and pendingApprovals arrays

const doaMatrix = [
    { range: '$0 - $10k', bu: 'All', approver: 'Manager', level: 'L1', max: '$10,000', status: 'Active' },
    { range: '$10k - $50k', bu: 'All', approver: 'Director', level: 'L2', max: '$50,000', status: 'Active' },
    { range: '$50k+', bu: 'Global', approver: 'VP', level: 'L3', max: 'Unlimited', status: 'Active' },
];

const DOAApprovals = () => {
    const [approvals, setApprovals] = useState([]);
    const [selectedReq, setSelectedReq] = useState(null);
    const [comment, setComment] = useState('');

    const loadData = async () => {
        const { approvalService } = await import('../services/approvalService');
        // Fetch all pending across all roles for admin overview
        const data = await approvalService.getPendingApprovals('Admin');
        setApprovals(data);
        if (data.length > 0 && !selectedReq) {
            setSelectedReq(data[0]);
        } else if (data.length === 0) {
            setSelectedReq(null);
        }
    };

    React.useEffect(() => {
        loadData();
    }, []);

    const handleAction = async (id, decision) => {
        const { approvalService } = await import('../services/approvalService');
        await approvalService.submitApproval(id, decision);
        await loadData();
        setSelectedReq(null); // Clear selection after decision
    };

    const dynamicKpis = [
        { label: 'Pending Approvals', value: approvals.length.toString(), icon: '⏳', trend: '+0', color: '#F59E0B' },
        { label: 'Approved This Month', value: '--', icon: '✅', trend: '--', color: '#00C9B1' },
        { label: 'Escalated', value: '0', icon: '🚩', trend: '+0', color: '#A855F7' },
        { label: 'Avg Value Pending', value: approvals.length > 0 ? `$${(approvals.reduce((s, a) => s + Number(a.value), 0) / approvals.length / 1000).toFixed(1)}k` : '$0', icon: '💰', trend: '--', color: '#3B82F6' },
    ];

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Approved': return styles.statusApproved;
            case 'Pending': return styles.statusPending;
            case 'Rejected': return styles.statusRejected;
            case 'Escalated': return styles.statusEscalated;
            default: return '';
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.mainLayout}>
                <div className={styles.leftContent}>
                    <div className={styles.pageHeader}>
                        <h2 className={styles.pageTitle}>DOA Approvals</h2>
                        <p className={styles.pageSubtitle}>Manage delegation of authority and process pending approval requests.</p>
                    </div>

                    <div className={styles.statsRow}>
                        {dynamicKpis.map((kpi, idx) => (
                            <div key={idx} className={styles.kpiCard}>
                                <div className={styles.kpiIcon} style={{ color: kpi.color, backgroundColor: `${kpi.color}15` }}>{kpi.icon}</div>
                                <div className={styles.kpiData}>
                                    <div className={styles.kpiValue}>{kpi.value}</div>
                                    <div className={styles.kpiLabel}>{kpi.label}</div>
                                </div>
                                <div className={styles.kpiTrend} style={{ color: kpi.trend.startsWith('+') ? '#10B981' : '#EF4444' }}>
                                    {kpi.trend}
                                </div>
                            </div>
                        ))}
                    </div>

                    <section className={styles.matrixSection}>
                        <div className={styles.sectionHeader}>
                            <h3>DOA Authority Matrix</h3>
                        </div>
                        <div className={styles.tableWrapper}>
                            <table className={styles.matrixTable}>
                                <thead>
                                    <tr>
                                        <th>Value Range</th>
                                        <th>Business Unit</th>
                                        <th>Required Approver</th>
                                        <th>Level</th>
                                        <th>Max Value</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {doaMatrix.map((item, idx) => (
                                        <tr key={idx}>
                                            <td>{item.range}</td>
                                            <td>{item.bu}</td>
                                            <td>{item.approver}</td>
                                            <td><span className={styles.levelBadge}>{item.level}</span></td>
                                            <td>{item.max}</td>
                                            <td><span className={styles.activeDot}></span> {item.status}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <section className={styles.pendingSection}>
                        <div className={styles.sectionHeader}>
                            <h3>Pending Requests ({approvals.length})</h3>
                        </div>
                        <div className={styles.cardGrid}>
                            {approvals.length > 0 ? approvals.map((req) => (
                                <div
                                    key={req.id}
                                    className={`${styles.approvalCard} ${selectedReq?.id === req.id ? styles.activeCard : ''}`}
                                    onClick={() => setSelectedReq(req)}
                                >
                                    <div className={styles.cardHeader}>
                                        <span className={styles.reqId}>{req.id}</span>
                                    </div>
                                    <h4 className={styles.reqTitle}>{req.title}</h4>
                                    <div className={styles.reqMeta}>
                                        <div className={styles.metaItem}>
                                            <label>Value</label>
                                            <span>${(req.value || 0).toLocaleString()}</span>
                                        </div>
                                        <div className={styles.metaItem}>
                                            <label>Req. By</label>
                                            <span>{req.submittedBy}</span>
                                        </div>
                                        <div className={styles.metaItem}>
                                            <label>Dept</label>
                                            <span>{req.department}</span>
                                        </div>
                                    </div>
                                    <div className={styles.cardFooter}>
                                        <button onClick={(e) => { e.stopPropagation(); handleAction(req.id, 'Rejected'); }} className={styles.cardBtnReject}>Reject</button>
                                        <button onClick={(e) => { e.stopPropagation(); handleAction(req.id, 'Approved'); }} className={styles.cardBtnApprove}>Approve</button>
                                    </div>
                                </div>
                            )) : (
                                <p style={{ color: 'var(--text-muted)', padding: '24px' }}>No pending approval requests.</p>
                            )}
                        </div>
                    </section>
                </div>

                {/* Detail Panel */}
                {selectedReq && (
                    <aside className={styles.detailPanel}>
                        <div className={styles.panelHeader}>
                            <div className={styles.panelTitleGroup}>
                                <span className={styles.panelTag}>APPROVAL DETAIL</span>
                                <h3>{selectedReq.id}</h3>
                            </div>
                            <div className={styles.panelHeaderActions}>
                                <button className={styles.iconBtn}>📤</button>
                                <button className={styles.iconBtn}>🖨️</button>
                            </div>
                        </div>

                        <div className={styles.panelContent}>
                            <section className={styles.detailSummary}>
                                <div className={styles.summaryItem}>
                                    <label>Contract Title</label>
                                    <p>{selectedReq.title}</p>
                                </div>
                                <div className={styles.summaryGrid}>
                                    <div className={styles.summaryItem}>
                                        <label>Business Unit</label>
                                        <span>{selectedReq.department}</span>
                                    </div>
                                    <div className={styles.summaryItem}>
                                        <label>Value</label>
                                        <span className={styles.valueText}>${(selectedReq.value || 0).toLocaleString()}</span>
                                    </div>
                                </div>
                                <div className={styles.summaryItem}>
                                    <label>Company</label>
                                    <p className={styles.ruleApplied}>{selectedReq.company}</p>
                                </div>
                            </section>

                            <section className={styles.hierarchySection}>
                                <h4 className={styles.subHeader}>APPROVAL HIERARCHY</h4>
                                <div className={styles.hierarchyList}>
                                    <div className={styles.hItem}>
                                        <div className={styles.hStep}>
                                            <div className={`${styles.hIcon} ${styles[getStatusStyle('Pending')]}`}>○</div>
                                        </div>
                                        <div className={styles.hContent}>
                                            <div className={styles.hMain}>
                                                <span className={styles.hName}>Current Queue</span>
                                                <span className={`${styles.hStatus} ${styles[getStatusStyle('Pending')]}`}>Pending</span>
                                            </div>
                                            <div className={styles.hSub}>
                                                <span>Awaiting Final Sign-Off</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section className={styles.actionPanel}>
                                <h4 className={styles.subHeader}>YOUR ACTION</h4>
                                <textarea
                                    className={styles.commentBox}
                                    placeholder="Add your comments here..."
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                ></textarea>
                                <div className={styles.mainActions}>
                                    <div className={styles.primaryBtns} style={{ width: '100%' }}>
                                        <button onClick={() => handleAction(selectedReq.id, 'Rejected')} className={styles.btnReject} style={{ width: '50%' }}>Reject</button>
                                        <button onClick={() => handleAction(selectedReq.id, 'Approved')} className={styles.btnApprove} style={{ width: '50%' }}>Approve</button>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </aside>
                )}
            </div>
        </div>
    );
};

export default DOAApprovals;
