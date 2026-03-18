import React, { useState } from 'react';
import styles from './CAS.module.css';

const casKpis = [
    { label: 'Total CAS Generated', value: '1,284', icon: '📄', color: '#3B82F6' },
    { label: 'Pending Approval', value: '42', icon: '⏳', color: '#F59E0B' },
    { label: 'Approved Today', value: '18', icon: '✅', color: '#00C9B1' },
    { label: 'Rejected', value: '3', icon: '❌', color: '#EF4444' },
];

const sampleCasEntries = [
    {
        id: 'CAS-2026-001',
        title: 'Cloud Service Level Agreement',
        unit: 'IT Services',
        value: '$120,000',
        type: 'SLA',
        initiator: 'John David',
        endorser: 'Sarah Smith',
        reviewer: 'Michael Brown',
        approver: 'Elena Gilbert',
        status: 'Approved',
        details: {
            costCenter: 'IT-001',
            department: 'Infrastructure',
            executionDate: 'Mar 20, 2026',
            keyIssues: 'Uptime guarantee fixed at 99.9%. Liability capped at 12 months fee.',
            comments: 'Standard terms applied. Legal team cleared the liability clause.',
            roles: [
                { role: 'Initiator', name: 'John David', dept: 'IT', date: 'Mar 10, 2026', status: 'Approved' },
                { role: 'Endorser', name: 'Sarah Smith', dept: 'Operations', date: 'Mar 11, 2026', status: 'Approved' },
                { role: 'Reviewer', name: 'Michael Brown', dept: 'Legal', date: 'Mar 12, 2026', status: 'Approved' },
                { role: 'Approver', name: 'Elena Gilbert', dept: 'Finance', date: 'Mar 13, 2026', status: 'Approved' }
            ]
        }
    },
    {
        id: 'CAS-2026-002',
        title: 'Marketing Agency Retainer',
        unit: 'Marketing',
        value: '$45,000',
        type: 'Service Agreement',
        initiator: 'Alice Wong',
        endorser: 'Robert Fox',
        reviewer: 'Jessica Low',
        approver: 'Elena Gilbert',
        status: 'Pending',
        details: {
            costCenter: 'MKT-22',
            department: 'Growth',
            executionDate: 'Apr 01, 2026',
            keyIssues: 'Termination for convenience requires 30 days notice.',
            comments: 'Awaiting endorser feedback on budget allocation.',
            roles: [
                { role: 'Initiator', name: 'Alice Wong', dept: 'Marketing', date: 'Mar 14, 2026', status: 'Approved' },
                { role: 'Endorser', name: 'Robert Fox', dept: 'Finance', date: '-', status: 'Pending' },
                { role: 'Reviewer', name: 'Jessica Low', dept: 'Legal', date: '-', status: 'Pending' },
                { role: 'Approver', name: 'Elena Gilbert', dept: 'Finance', date: '-', status: 'Pending' }
            ]
        }
    },
    {
        id: 'CAS-2026-003',
        title: 'Office Lease Renewal - HQ',
        unit: 'Real Estate',
        value: '$2,400,000',
        type: 'Lease',
        initiator: 'Tom Hiddleston',
        endorser: 'Wanda Maximoff',
        reviewer: 'Bruce Banner',
        approver: 'Nick Fury',
        status: 'In Review',
        details: {
            costCenter: 'RE-HQ-01',
            department: 'Facilities',
            executionDate: 'Jun 15, 2026',
            keyIssues: 'Rent escalation fixed at 3% per annum.',
            comments: 'Legal reviewing the maintenance clauses.',
            roles: [
                { role: 'Initiator', name: 'Tom Hiddleston', dept: 'Facilities', date: 'Mar 01, 2026', status: 'Approved' },
                { role: 'Endorser', name: 'Wanda Maximoff', dept: 'Finance', date: 'Mar 05, 2026', status: 'Approved' },
                { role: 'Reviewer', name: 'Bruce Banner', dept: 'Legal', date: '-', status: 'In Review' },
                { role: 'Approver', name: 'Nick Fury', dept: 'Executive', date: '-', status: 'Pending' }
            ]
        }
    }
];

const CAS = () => {
    const [selectedCas, setSelectedCas] = useState(sampleCasEntries[0]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'Approved': return '#00C9B1';
            case 'Pending': return '#F59E0B';
            case 'Rejected': return '#EF4444';
            case 'In Review': return '#3B82F6';
            default: return '#9CA3AF';
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.mainLayout}>
                <div className={styles.listSection}>
                    <div className={styles.pageHeader}>
                        <h2 className={styles.pageTitle}>Contract Approval Sheets (CAS)</h2>
                        <p className={styles.pageSubtitle}>Review and track approval workflows for contract generation.</p>
                    </div>

                    <div className={styles.statsRow}>
                        {casKpis.map((kpi, idx) => (
                            <div key={idx} className={styles.kpiCard}>
                                <div className={styles.kpiIcon} style={{ backgroundColor: `${kpi.color}15`, color: kpi.color }}>{kpi.icon}</div>
                                <div className={styles.kpiContent}>
                                    <div className={styles.kpiValue}>{kpi.value}</div>
                                    <div className={styles.kpiLabel}>{kpi.label}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className={styles.tableCard}>
                        <div className={styles.tableHeader}>
                            <h3>CAS Ledger</h3>
                            <div className={styles.tableActions}>
                                <input type="text" placeholder="Search CAS ID or Title..." className={styles.tableSearch} />
                            </div>
                        </div>
                        <div className={styles.tableWrapper}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>CAS ID</th>
                                        <th>Contract Title</th>
                                        <th>Init. (I)</th>
                                        <th>End. (E)</th>
                                        <th>Rev. (R)</th>
                                        <th>App. (A)</th>
                                        <th>Value</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sampleCasEntries.map((cas) => (
                                        <tr
                                            key={cas.id}
                                            className={selectedCas?.id === cas.id ? styles.selectedRow : ''}
                                            onClick={() => setSelectedCas(cas)}
                                        >
                                            <td className={styles.idCell}>{cas.id}</td>
                                            <td className={styles.titleCell}>
                                                <span className={styles.contractTitle}>{cas.title}</span>
                                                <span className={styles.unitTag}>{cas.unit}</span>
                                            </td>
                                            <td className={styles.roleInitials}>{cas.initiator.split(' ').map(n => n[0]).join('')}</td>
                                            <td className={styles.roleInitials}>{cas.endorser.split(' ').map(n => n[0]).join('')}</td>
                                            <td className={styles.roleInitials}>{cas.reviewer.split(' ').map(n => n[0]).join('')}</td>
                                            <td className={styles.roleInitials}>{cas.approver.split(' ').map(n => n[0]).join('')}</td>
                                            <td className={styles.valueCell}>{cas.value}</td>
                                            <td>
                                                <span className={styles.statusBadge} style={{ color: getStatusColor(cas.status), backgroundColor: `${getStatusColor(cas.status)}15` }}>
                                                    {cas.status}
                                                </span>
                                            </td>
                                            <td>
                                                <button className={styles.viewBtn}>View</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Detail Panel */}
                <aside className={styles.detailPanel}>
                    <div className={styles.panelHeader}>
                        <div className={styles.panelTitleGroup}>
                            <span className={styles.panelTag}>CAS DETAILS</span>
                            <h3>{selectedCas.id}</h3>
                        </div>
                        <button className={styles.downloadBtn}>Download PDF</button>
                    </div>

                    <div className={styles.panelContent}>
                        <section className={styles.overviewSection}>
                            <h4 className={styles.sectionHeader}>CAS OVERVIEW</h4>
                            <div className={styles.detailGrid}>
                                <div className={styles.detailItem}>
                                    <label>Business Unit</label>
                                    <span>{selectedCas.unit}</span>
                                </div>
                                <div className={styles.detailItem}>
                                    <label>Type of Agreement</label>
                                    <span>{selectedCas.type}</span>
                                </div>
                                <div className={styles.detailItem}>
                                    <label>Cost Center</label>
                                    <span>{selectedCas.details.costCenter}</span>
                                </div>
                                <div className={styles.detailItem}>
                                    <label>Execution Date</label>
                                    <span>{selectedCas.details.executionDate}</span>
                                </div>
                                <div className={styles.detailItemFull}>
                                    <label>Contract Value</label>
                                    <span className={styles.emphasize}>{selectedCas.value}</span>
                                </div>
                                <div className={styles.detailItemFull}>
                                    <label>Key Issues / Risks</label>
                                    <p>{selectedCas.details.keyIssues}</p>
                                </div>
                                <div className={styles.detailItemFull}>
                                    <label>Approver Comments</label>
                                    <p>{selectedCas.details.comments}</p>
                                </div>
                            </div>
                        </section>

                        <section className={styles.workflowSection}>
                            <h4 className={styles.sectionHeader}>APPROVAL ROLES</h4>
                            <div className={styles.workflowList}>
                                {selectedCas.details.roles.map((role, idx) => (
                                    <div key={idx} className={styles.workflowItem}>
                                        <div className={styles.wfIcon} style={{ borderColor: getStatusColor(role.status) }}>
                                            {role.status === 'Approved' ? '✓' : role.status === 'In Review' ? '↻' : '○'}
                                        </div>
                                        <div className={styles.wfContent}>
                                            <div className={styles.wfMain}>
                                                <span className={styles.wfName}>{role.name}</span>
                                                <span className={styles.wfStatus} style={{ color: getStatusColor(role.status) }}>{role.status}</span>
                                            </div>
                                            <div className={styles.wfSub}>
                                                <span>{role.role}</span> • <span>{role.dept}</span>
                                            </div>
                                            {role.date !== '-' && <span className={styles.wfDate}>{role.date}</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default CAS;
