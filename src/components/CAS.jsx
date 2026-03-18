import React, { useState, useEffect } from 'react';
import styles from './CAS.module.css';
import { casService } from '../services/casService';

const CAS = ({ user }) => {
    const [casRecords, setCasRecords] = useState([]);
    const [selectedCas, setSelectedCas] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await casService.getAllCAS();
            setCasRecords(data || []);
            if (data?.length > 0 && !selectedCas) {
                // Initialize with roles if they don't exist in mock data
                const enhancedCas = data[0].approvalChain ? data[0] : initializeApprovalChain(data[0]);
                setSelectedCas(enhancedCas);
            }
        } catch (error) {
            console.error('Error fetching CAS records:', error);
        } finally {
            setLoading(false);
        }
    };

    const initializeApprovalChain = (cas) => {
        return {
            ...cas,
            approvalChain: [
                { role: 'Initiator', name: cas.initiator || 'System User', status: 'Approved', timestamp: cas.createdAt },
                { role: 'Endorser', name: 'Dept Head', status: 'Pending', timestamp: null },
                { role: 'Reviewer', name: 'Legal Counsel', status: 'Pending', timestamp: null },
                { role: 'Approver', name: 'Executive Director', status: 'Pending', timestamp: null }
            ],
            agreementType: cas.agreementType || 'Master Service Agreement',
            department: cas.department || 'Legal Operations',
            keyNotes: cas.keyNotes || 'Standard terms applied with 5% inflation cap on annual renewals. No high-risk deviations noted during initial review.'
        };
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleApproveStep = (roleIndex) => {
        if (!selectedCas) return;

        const newChain = [...selectedCas.approvalChain];
        newChain[roleIndex] = {
            ...newChain[roleIndex],
            status: 'Approved',
            timestamp: new Date().toISOString()
        };

        const updatedCas = { ...selectedCas, approvalChain: newChain };

        // If last step is approved, update overall status
        if (roleIndex === newChain.length - 1) {
            updatedCas.status = 'Approved';
        }

        setSelectedCas(updatedCas);
        setCasRecords(prev => prev.map(c => c.id === updatedCas.id ? updatedCas : c));
    };

    const filteredRecords = casRecords.filter(r =>
        r.contractTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.id?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Approved': return { color: '#059669', bg: '#ecfdf5' };
            case 'Rejected': return { color: '#dc2626', bg: '#fef2f2' };
            default: return { color: '#d97706', bg: '#fffbeb' };
        }
    };

    const isStepDisabled = (index) => {
        if (user?.role === 'Legal') return true; // Read-only for Legal
        if (index === 0) return true; // Initiator always approved
        return selectedCas.approvalChain[index - 1].status !== 'Approved' || selectedCas.approvalChain[index].status === 'Approved';
    };

    return (
        <div className={styles.container}>
            <div className={styles.pageHeader}>
                <h2 className={styles.pageTitle}>Contract Approval System</h2>
                <p className={styles.pageSubtitle}>Official sign-off workflow for finalized contract drafts.</p>
            </div>

            <div className={styles.statsRow}>
                <div className={styles.kpiCard}>
                    <div className={styles.kpiIcon} style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>📑</div>
                    <div className={styles.kpiContent}>
                        <span className={styles.kpiValue}>{casRecords.length}</span>
                        <span className={styles.kpiLabel}>Total CAS</span>
                    </div>
                </div>
                <div className={styles.kpiCard}>
                    <div className={styles.kpiIcon} style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>⏳</div>
                    <div className={styles.kpiContent}>
                        <span className={styles.kpiValue}>{casRecords.filter(r => r.status !== 'Approved').length}</span>
                        <span className={styles.kpiLabel}>Pending</span>
                    </div>
                </div>
                <div className={styles.kpiCard}>
                    <div className={styles.kpiIcon} style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>✅</div>
                    <div className={styles.kpiContent}>
                        <span className={styles.kpiValue}>{casRecords.filter(r => r.status === 'Approved').length}</span>
                        <span className={styles.kpiLabel}>Finalized</span>
                    </div>
                </div>
                <div className={styles.kpiCard}>
                    <div className={styles.kpiIcon} style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>📊</div>
                    <div className={styles.kpiContent}>
                        <span className={styles.kpiValue}>94%</span>
                        <span className={styles.kpiLabel}>Avg Velocity</span>
                    </div>
                </div>
            </div>

            <div className={styles.mainLayout}>
                <div className={styles.listSection}>
                    <div className={styles.tableCard}>
                        <div className={styles.tableHeader}>
                            <h3>Master CAS Ledger</h3>
                            <input
                                type="text"
                                className={styles.tableSearch}
                                placeholder="Search by Title or ID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className={styles.tableWrapper}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Ref ID</th>
                                        <th>Contract Asset</th>
                                        <th>Unit</th>
                                        <th>Status</th>
                                        <th>Value</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>Loading ledger...</td></tr>
                                    ) : filteredRecords.map(cas => (
                                        <tr
                                            key={cas.id}
                                            className={selectedCas?.id === cas.id ? styles.selectedRow : ''}
                                            onClick={() => setSelectedCas(cas.approvalChain ? cas : initializeApprovalChain(cas))}
                                        >
                                            <td className={styles.idCell}>#{cas.id.split('-')[0].toUpperCase()}</td>
                                            <td>
                                                <div className={styles.titleCell}>
                                                    <span className={styles.contractTitle}>{cas.contractTitle}</span>
                                                    <span className={styles.unitTag}>{cas.initiator}</span>
                                                </div>
                                            </td>
                                            <td>{cas.businessUnit}</td>
                                            <td>
                                                <span
                                                    className={styles.statusBadge}
                                                    style={{
                                                        color: getStatusStyle(cas.status).color,
                                                        backgroundColor: getStatusStyle(cas.status).bg
                                                    }}
                                                >
                                                    {cas.status}
                                                </span>
                                            </td>
                                            <td className={styles.idCell}>${(cas.value || 0).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {selectedCas && (
                    <div className={styles.detailPanel}>
                        <div className={styles.panelHeader}>
                            <div className={styles.panelTitleGroup}>
                                <span className={styles.panelTag}>CAS DOCUMENT VIEW</span>
                                <h3>CAS-REF-{selectedCas.id.split('-')[0].toUpperCase()}</h3>
                            </div>
                            <div className={styles.panelActions}>
                                <button className={`${styles.actionBtn} ${styles.pdfBtn}`}>Export PDF</button>
                            </div>
                        </div>

                        <div className={styles.panelContent}>
                            <div className={styles.casSheet}>
                                <header className={styles.sheetHeader}>
                                    <h4>Contract Approval Sheet</h4>
                                    <p>CONFIDENTIAL BUSINESS DOCUMENT</p>
                                </header>

                                <div className={styles.sheetSection}>
                                    <span className={styles.sectionTitle}>Asset Information</span>
                                    <div className={styles.dataGrid}>
                                        <div className={styles.dataItem}>
                                            <label>Contract Title</label>
                                            <span>{selectedCas.contractTitle}</span>
                                        </div>
                                        <div className={styles.dataItem}>
                                            <label>Originating Unit</label>
                                            <span>{selectedCas.businessUnit}</span>
                                        </div>
                                        <div className={styles.dataItem}>
                                            <label>Contract RefID</label>
                                            <span>{selectedCas.contractId}</span>
                                        </div>
                                        <div className={styles.dataItem}>
                                            <label>Agreement Type</label>
                                            <span>{selectedCas.agreementType}</span>
                                        </div>
                                        <div className={styles.dataItem}>
                                            <label>Department</label>
                                            <span>{selectedCas.department}</span>
                                        </div>
                                        <div className={styles.dataItem}>
                                            <label>Fiscal Impact</label>
                                            <span className={styles.valueLarge}>${(selectedCas.value || 0).toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <div className={styles.dataItem} style={{ marginTop: '16px' }}>
                                        <label>Key Notes</label>
                                        <p style={{ fontSize: '12px', color: '#555', margin: '4px 0 0 0', lineHeight: '1.4' }}>{selectedCas.keyNotes}</p>
                                    </div>
                                </div>

                                <div className={styles.sheetSection}>
                                    <span className={styles.sectionTitle}>Approval Workflow</span>
                                    <div className={styles.approvalChain}>
                                        {selectedCas.approvalChain.map((step, idx) => (
                                            <div key={idx} className={styles.approvalStep}>
                                                <div className={`${styles.stepIcon} ${step.status === 'Approved' ? styles.completed : idx === 0 || selectedCas.approvalChain[idx - 1].status === 'Approved' ? styles.active : ''}`}>
                                                    {step.status === 'Approved' ? '✓' : idx + 1}
                                                </div>
                                                <div className={styles.stepContent}>
                                                    <div className={styles.stepHeader}>
                                                        <div>
                                                            <span className={styles.roleName}>{step.role}</span>
                                                            <span className={styles.assignedTo}>{step.name}</span>
                                                        </div>
                                                        <span
                                                            className={styles.stepStatus}
                                                            style={{ color: step.status === 'Approved' ? '#059669' : '#d97706' }}
                                                        >
                                                            {step.status}
                                                        </span>
                                                    </div>
                                                    {step.timestamp && (
                                                        <span className={styles.timestamp}>
                                                            Approved on {new Date(step.timestamp).toLocaleString()}
                                                        </span>
                                                    )}
                                                    {!isStepDisabled(idx) && (
                                                        <button
                                                            className={styles.approvalBtn}
                                                            onClick={() => handleApproveStep(idx)}
                                                        >
                                                            Acknowledge & Sign
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CAS;
