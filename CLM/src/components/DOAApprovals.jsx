import React, { useState } from 'react';
import styles from './DOAApprovals.module.css';

const doaKpis = [
    { label: 'Pending Approvals', value: '24', icon: '⏳', trend: '+5', color: '#F59E0B' },
    { label: 'Approved This Month', value: '142', icon: '✅', trend: '+12%', color: '#00C9B1' },
    { label: 'Escalated', value: '7', icon: '🚩', trend: '-2', color: '#A855F7' },
    { label: 'Avg Approval Time', value: '1.4d', icon: '⏱️', trend: '-0.3d', color: '#3B82F6' },
];

const doaMatrix = [
    { range: '$0 - $50k', bu: 'All', approver: 'Dept. Head', level: 'L1', max: '$50,000', status: 'Active' },
    { range: '$50k - $250k', bu: 'All', approver: 'Senior Manager', level: 'L2', max: '$250,000', status: 'Active' },
    { range: '$250k - $1M', bu: 'Sales/Operations', approver: 'VP / Director', level: 'L3', max: '$1,000,000', status: 'Active' },
    { range: '$1M+', bu: 'Global', approver: 'CEO / CFO', level: 'Board', max: 'Unlimited', status: 'Active' },
];

const pendingApprovals = [
    {
        id: 'REQ-2026-102',
        title: 'Enterprise Software License renewal',
        value: '$85,000',
        requestedBy: 'Michael Scott',
        currentApprover: 'Jan Levinson',
        level: 'L2',
        daysPending: 2,
        escalated: false,
        overdue: false,
        bu: 'IT Operations',
        doaRule: 'Standard Procurement > $50k',
        hierarchy: [
            { level: 'L1', role: 'Dept. Head', name: 'Angela Martin', status: 'Approved', date: 'Mar 14, 2026', comments: 'Budget cleared for FY26.' },
            { level: 'L2', role: 'Senior Manager', name: 'Jan Levinson', status: 'Pending', date: '-', comments: '' },
            { level: 'L3', role: 'VP Operations', name: 'David Wallace', status: 'Pending', date: '-', comments: '' }
        ]
    },
    {
        id: 'REQ-2026-105',
        title: 'Global Marketing Campaign - Q3',
        value: '$420,000',
        requestedBy: 'Darryl Philbin',
        currentApprover: 'Kelly Kapoor',
        level: 'L3',
        daysPending: 5,
        escalated: true,
        overdue: true,
        bu: 'Marketing',
        doaRule: 'Major CAPEX > $250k',
        hierarchy: [
            { level: 'L1', role: 'Dept. Head', name: 'Jim Halpert', status: 'Approved', date: 'Mar 10, 2026', comments: 'Marketing plan looks solid.' },
            { level: 'L2', role: 'Senior Manager', name: 'Pam Beesly', status: 'Approved', date: 'Mar 11, 2026', comments: 'Aligned with brand guidelines.' },
            { level: 'L3', role: 'Director', name: 'Kelly Kapoor', status: 'Pending', date: '-', comments: 'Awaiting final vendor cost breakdown.' }
        ]
    },
    {
        id: 'REQ-2026-108',
        title: 'Consultancy Services - Legal Audit',
        value: '$12,500',
        requestedBy: 'Toby Flenderson',
        currentApprover: 'Phyllis Vance',
        level: 'L1',
        daysPending: 1,
        escalated: false,
        overdue: false,
        bu: 'HR / Legal',
        doaRule: 'Professional Services < $50k',
        hierarchy: [
            { level: 'L1', role: 'Dept. Head', name: 'Phyllis Vance', status: 'Pending', date: '-', comments: '' }
        ]
    },
    {
        id: 'REQ-2026-110',
        title: 'Logistics Fleet Expansion',
        value: '$1,500,000',
        requestedBy: 'Dwight Schrute',
        currentApprover: 'Robert California',
        level: 'L3',
        daysPending: 3,
        escalated: false,
        overdue: false,
        bu: 'Logistics',
        doaRule: 'Strategic Asset Purchase > $1M',
        hierarchy: [
            { level: 'L1', role: 'Dept. Head', name: 'Oscar Martinez', status: 'Approved', date: 'Mar 12, 2026', comments: 'Efficiency gains justified.' },
            { level: 'L2', role: 'Senior Manager', name: 'Andy Bernard', status: 'Approved', date: 'Mar 13, 2026', comments: 'Financing approved by treasury.' },
            { level: 'L3', role: 'CEO', name: 'Robert California', status: 'Pending', date: '-', comments: '' }
        ]
    },
    {
        id: 'REQ-2026-112',
        title: 'Cloud Infrastructure Upgrade',
        value: '$65,000',
        requestedBy: 'Ryan Howard',
        currentApprover: 'Gabe Lewis',
        level: 'L2',
        daysPending: 4,
        escalated: true,
        overdue: false,
        bu: 'IT Operations',
        doaRule: 'Standard Procurement > $50k',
        hierarchy: [
            { level: 'L1', role: 'Dept. Head', name: 'Angela Martin', status: 'Approved', date: 'Mar 14, 2026', comments: 'Necessary for scalability.' },
            { level: 'L2', role: 'Senior Manager', name: 'Gabe Lewis', status: 'Pending', date: '-', comments: '' }
        ]
    },
    {
        id: 'REQ-2026-115',
        title: 'Staff Training Program 2026',
        value: '$28,000',
        requestedBy: 'Kevin Malone',
        currentApprover: 'Phyllis Vance',
        level: 'L1',
        daysPending: 6,
        escalated: false,
        overdue: true,
        bu: 'Human Resources',
        doaRule: 'Training & Development < $50k',
        hierarchy: [
            { level: 'L1', role: 'Dept. Head', name: 'Phyllis Vance', status: 'Pending', date: '-', comments: '' }
        ]
    }
];

const DOAApprovals = () => {
    const [selectedReq, setSelectedReq] = useState(pendingApprovals[0]);
    const [comment, setComment] = useState('');

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
                        {doaKpis.map((kpi, idx) => (
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
                            <h3>Pending Requests ({pendingApprovals.length})</h3>
                        </div>
                        <div className={styles.cardGrid}>
                            {pendingApprovals.map((req) => (
                                <div
                                    key={req.id}
                                    className={`${styles.approvalCard} ${selectedReq.id === req.id ? styles.activeCard : ''}`}
                                    onClick={() => setSelectedReq(req)}
                                >
                                    <div className={styles.cardHeader}>
                                        <span className={styles.reqId}>{req.id}</span>
                                        {req.overdue && <span className={styles.overdueBadge}>OVERDUE</span>}
                                        {req.escalated && <span className={styles.escalatedBadge}>ESCALATED</span>}
                                    </div>
                                    <h4 className={styles.reqTitle}>{req.title}</h4>
                                    <div className={styles.reqMeta}>
                                        <div className={styles.metaItem}>
                                            <label>Value</label>
                                            <span>{req.value}</span>
                                        </div>
                                        <div className={styles.metaItem}>
                                            <label>Req. By</label>
                                            <span>{req.requestedBy}</span>
                                        </div>
                                        <div className={styles.metaItem}>
                                            <label>Days</label>
                                            <span style={{ color: req.overdue ? '#EF4444' : 'inherit' }}>{req.daysPending}d</span>
                                        </div>
                                    </div>
                                    <div className={styles.cardFooter}>
                                        <button className={styles.cardBtnReject}>Reject</button>
                                        <button className={styles.cardBtnApprove}>Approve</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Detail Panel */}
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
                                    <span>{selectedReq.bu}</span>
                                </div>
                                <div className={styles.summaryItem}>
                                    <label>Value</label>
                                    <span className={styles.valueText}>{selectedReq.value}</span>
                                </div>
                            </div>
                            <div className={styles.summaryItem}>
                                <label>DOA Rule Applied</label>
                                <p className={styles.ruleApplied}>{selectedReq.doaRule}</p>
                            </div>
                        </section>

                        <section className={styles.hierarchySection}>
                            <h4 className={styles.subHeader}>APPROVAL HIERARCHY</h4>
                            <div className={styles.hierarchyList}>
                                {selectedReq.hierarchy.map((step, idx) => (
                                    <div key={idx} className={styles.hItem}>
                                        <div className={styles.hStep}>
                                            <div className={`${styles.hIcon} ${styles[getStatusStyle(step.status)]}`}>
                                                {step.status === 'Approved' ? '✓' : '○'}
                                            </div>
                                            <div className={styles.hLine}></div>
                                        </div>
                                        <div className={styles.hContent}>
                                            <div className={styles.hMain}>
                                                <span className={styles.hName}>{step.name}</span>
                                                <span className={`${styles.hStatus} ${styles[getStatusStyle(step.status)]}`}>{step.status}</span>
                                            </div>
                                            <div className={styles.hSub}>
                                                <span>{step.level}</span> • <span>{step.role}</span>
                                            </div>
                                            {step.comments && <p className={styles.hComment}>"{step.comments}"</p>}
                                            {step.date !== '-' && <span className={styles.hDate}>{step.date}</span>}
                                        </div>
                                    </div>
                                ))}
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
                                <button className={styles.btnEscalate}>Escalate</button>
                                <div className={styles.primaryBtns}>
                                    <button className={styles.btnReject}>Reject</button>
                                    <button className={styles.btnApprove}>Approve</button>
                                </div>
                            </div>
                        </section>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default DOAApprovals;
