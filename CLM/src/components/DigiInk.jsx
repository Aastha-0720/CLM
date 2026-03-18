import React, { useState } from 'react';
import styles from './DigiInk.module.css';

const signatureKpis = [
    { label: 'Pending Signatures', value: '18', icon: '🖋️', color: '#F59E0B' },
    { label: 'Completed Today', value: '12', icon: '✅', color: '#00C9B1' },
    { label: 'Awaiting Vendor', value: '9', icon: '🏢', color: '#3B82F6' },
    { label: 'Overdue', value: '4', icon: '⚠️', color: '#EF4444' },
];

const signatureQueue = [
    {
        id: 'CN-2026-441',
        title: 'Software Licensing Agreement',
        counterparty: 'Microsoft Corp',
        value: '$240,000',
        sentDate: 'Mar 12, 2026',
        internalSigner: 'Satya Nadella (Proxy)',
        vendorSigner: 'John Thompson',
        order: 'Sequential',
        status: 'Awaiting Vendor',
        steps: [
            { name: 'John David', role: 'Initiator', date: 'Mar 12, 2026', status: 'Completed' },
            { name: 'Michael Brown', role: 'Legal Counsel', date: 'Mar 13, 2026', status: 'Completed' },
            { name: 'Elena Gilbert', role: 'Finance Director', date: 'Mar 14, 2026', status: 'Completed' },
            { name: 'Nick Fury', role: 'CEO', date: 'Mar 15, 2026', status: 'Completed' },
            { name: 'John Thompson', role: 'Vendor Primary', date: '-', status: 'Pending' }
        ]
    },
    {
        id: 'CN-2026-445',
        title: 'Global Logistics Retainer',
        counterparty: 'Maersk Line',
        value: '$1,200,000',
        sentDate: 'Mar 14, 2026',
        internalSigner: 'Sarah Smith',
        vendorSigner: 'Soren Skou',
        order: 'Parallel',
        status: 'Completed',
        steps: [
            { name: 'Sarah Smith', role: 'Ops Lead', date: 'Mar 14, 2026', status: 'Completed' },
            { name: 'Soren Skou', role: 'Vendor CEO', date: 'Mar 16, 2026', status: 'Completed' }
        ]
    },
    {
        id: 'CN-2026-448',
        title: 'Marketing Services MSA',
        counterparty: 'Publicis Groupe',
        value: '$85,000',
        sentDate: 'Mar 15, 2026',
        internalSigner: 'Alice Wong',
        vendorSigner: 'Arthur Sadoun',
        order: 'Sequential',
        status: 'Awaiting Internal',
        steps: [
            { name: 'Alice Wong', role: 'Mktg Head', date: 'Mar 15, 2026', status: 'Completed' },
            { name: 'Jessica Low', role: 'Legal', date: '-', status: 'Pending' },
            { name: 'Arthur Sadoun', role: 'Vendor Signatory', date: '-', status: 'Awaiting' }
        ]
    },
    {
        id: 'CN-2026-450',
        title: 'New Office Fit-out Contract',
        counterparty: 'WeWork Services',
        value: '$450,000',
        sentDate: 'Mar 05, 2026',
        internalSigner: 'Tom Hiddleston',
        vendorSigner: 'Sandeep Mathrani',
        order: 'Sequential',
        status: 'Overdue',
        steps: [
            { name: 'Tom Hiddleston', role: 'Facilities', date: 'Mar 05, 2026', status: 'Completed' },
            { name: 'Sandeep Mathrani', role: 'Vendor CEO', date: '-', status: 'Overdue' }
        ]
    },
    {
        id: 'CN-2026-452',
        title: 'Consultancy Master Agreement',
        counterparty: 'McKinsey & Co',
        value: '$310,000',
        sentDate: 'Mar 16, 2026',
        internalSigner: 'Robert Fox',
        vendorSigner: 'Bob Sternfels',
        order: 'Sequential',
        status: 'Awaiting Internal',
        steps: [
            { name: 'Robert Fox', role: 'Strategy', date: 'Mar 16, 2026', status: 'Completed' },
            { name: 'Elena Gilbert', role: 'Finance', date: '-', status: 'Pending' }
        ]
    },
    {
        id: 'CN-2026-455',
        title: 'Security Services Contract',
        counterparty: 'G4S PLC',
        value: '$150,000',
        sentDate: 'Mar 17, 2026',
        internalSigner: 'Leon Kennedy',
        vendorSigner: 'Ashley Graham',
        order: 'Parallel',
        status: 'Awaiting Vendor',
        steps: [
            { name: 'Leon Kennedy', role: 'Security Head', date: 'Mar 17, 2026', status: 'Completed' },
            { name: 'Ashley Graham', role: 'Vendor Legal', date: '-', status: 'Pending' }
        ]
    }
];

const DigiInk = () => {
    const [selectedRequest, setSelectedRequest] = useState(signatureQueue[0]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'Completed': return '#00C9B1';
            case 'Awaiting Internal': return '#3B82F6';
            case 'Awaiting Vendor': return '#F59E0B';
            case 'Overdue': return '#EF4444';
            default: return '#9CA3AF';
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.mainLayout}>
                <div className={styles.listSection}>
                    <div className={styles.pageHeader}>
                        <h2 className={styles.pageTitle}>DigiInk Signatures</h2>
                        <p className={styles.pageSubtitle}>Manage and track digital signature workflows with internal and external stakeholders.</p>
                    </div>

                    <div className={styles.statsRow}>
                        {signatureKpis.map((kpi, idx) => (
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
                            <h3>Signature Queue</h3>
                            <div className={styles.tableActions}>
                                <input type="text" placeholder="Search contract or counterparty..." className={styles.tableSearch} />
                            </div>
                        </div>
                        <div className={styles.tableWrapper}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Contract ID</th>
                                        <th>Contract Title</th>
                                        <th>Counterparty</th>
                                        <th>Value</th>
                                        <th>Sent Date</th>
                                        <th>Internal Signer</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {signatureQueue.map((req) => (
                                        <tr
                                            key={req.id}
                                            className={selectedRequest?.id === req.id ? styles.selectedRow : ''}
                                            onClick={() => setSelectedRequest(req)}
                                        >
                                            <td className={styles.idCell}>{req.id}</td>
                                            <td className={styles.titleCell}>
                                                <span className={styles.contractTitle}>{req.title}</span>
                                            </td>
                                            <td className={styles.vendorCell}>{req.counterparty}</td>
                                            <td className={styles.valueCell}>{req.value}</td>
                                            <td className={styles.dateCell}>{req.sentDate}</td>
                                            <td className={styles.signerCell}>{req.internalSigner}</td>
                                            <td>
                                                <span className={styles.statusBadge} style={{ color: getStatusColor(req.status), backgroundColor: `${getStatusColor(req.status)}15` }}>
                                                    {req.status}
                                                </span>
                                            </td>
                                            <td>
                                                <div className={styles.rowActions}>
                                                    <button className={styles.resendBtn}>Resend</button>
                                                </div>
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
                            <span className={styles.panelTag}>SIGNATURE WORKFLOW</span>
                            <h3>{selectedRequest.id}</h3>
                        </div>
                        <button className={styles.downloadBtn}>View Contract</button>
                    </div>

                    <div className={styles.panelContent}>
                        <section className={styles.overviewSection}>
                            <h4 className={styles.sectionHeader}>CONTRACT DETAILS</h4>
                            <div className={styles.detailGrid}>
                                <div className={styles.detailItemFull}>
                                    <label>Service / Title</label>
                                    <span>{selectedRequest.title}</span>
                                </div>
                                <div className={styles.detailItem}>
                                    <label>Counterparty</label>
                                    <span>{selectedRequest.counterparty}</span>
                                </div>
                                <div className={styles.detailItem}>
                                    <label>Contract Value</label>
                                    <span className={styles.emphasize}>{selectedRequest.value}</span>
                                </div>
                                <div className={styles.detailItem}>
                                    <label>Signing Order</label>
                                    <span>{selectedRequest.order}</span>
                                </div>
                                <div className={styles.detailItem}>
                                    <label>Initiated On</label>
                                    <span>{selectedRequest.sentDate}</span>
                                </div>
                            </div>
                        </section>

                        <section className={styles.workflowSection}>
                            <h4 className={styles.sectionHeader}>EXECUTION STATUS</h4>
                            <div className={styles.workflowList}>
                                {selectedRequest.steps.map((step, idx) => (
                                    <div key={idx} className={styles.workflowItem}>
                                        <div className={styles.wfIcon} style={{
                                            backgroundColor: step.status === 'Completed' ? '#00C9B1' : step.status === 'Overdue' ? '#EF4444' : 'transparent',
                                            borderColor: step.status === 'Completed' ? '#00C9B1' : step.status === 'Pending' ? '#3B82F6' : '#1F2937'
                                        }}>
                                            {step.status === 'Completed' ? '✓' : step.status === 'Overdue' ? '!' : idx + 1}
                                        </div>
                                        <div className={styles.wfContent}>
                                            <div className={styles.wfMain}>
                                                <span className={styles.wfName}>{step.name}</span>
                                                <span className={styles.wfStatus} style={{ color: getStatusColor(step.status === 'Completed' ? 'Completed' : step.status === 'Overdue' ? 'Overdue' : 'Awaiting Internal') }}>
                                                    {step.status}
                                                </span>
                                            </div>
                                            <div className={styles.wfSub}>
                                                <span>{step.role}</span>
                                            </div>
                                            {step.date !== '-' && <span className={styles.wfDate}>{step.date}</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <div className={styles.panelFooter}>
                            <button className={styles.reminderBtn}>Resend Reminder</button>
                            <button className={styles.signedCopyBtn} disabled={selectedRequest.status !== 'Completed'}>Download Signed Copy</button>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default DigiInk;
