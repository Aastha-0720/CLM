import React, { useState, useEffect, useMemo } from 'react';
import { FileText, Clock, CheckCircle, Calendar } from 'lucide-react';
import styles from './CAS.module.css';
import { casService } from '../services/casService';

const CAS = ({ user }) => {
    const [casRecords, setCasRecords] = useState([]);
    const [selectedCas, setSelectedCas] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [toast, setToast] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState(null); // stores cas id to delete

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(''), 3000);
    };

    const displayValue = (value) => {
        if (value === null || value === undefined) return 'N/A';
        const normalized = String(value).trim();
        return normalized ? normalized : 'N/A';
    };

    const formatDate = (value) => {
        if (!value) return 'N/A';
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? displayValue(value) : parsed.toLocaleDateString();
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await casService.getAllCAS();
            setCasRecords(data || []);
            if (data?.length > 0) {
                // If we have a selectedCas, try to refresh it from data
                if (selectedCas) {
                    const refreshed = data.find(c => c.id === selectedCas.id);
                    if (refreshed) {
                        setSelectedCas(refreshed.approvalChain ? refreshed : initializeApprovalChain(refreshed));
                    }
                } else {
                    setSelectedCas(data[0].approvalChain ? data[0] : initializeApprovalChain(data[0]));
                }
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
            businessUnit: cas.businessUnit || cas.business_unit || cas.department || cas.agreementType || 'N/A',
            department: cas.department || cas.businessUnit || 'N/A',
            agreementType: cas.agreementType || 'N/A',
            cost_center: cas.cost_center || cas.businessUnit || cas.department || 'N/A',
            project_name: cas.project_name || cas.contractTitle || 'N/A',
            effective_date: cas.effective_date || cas.createdAt || '',
            execution_date: cas.execution_date || cas.createdAt || '',
            keyNotes: cas.keyNotes || 'N/A',
            approvalChain: cas.approvalChain && cas.approvalChain.length > 0 ? cas.approvalChain : [
                { role: 'Initiator', name: cas.initiator || 'Admin', status: 'Approved', timestamp: cas.createdAt, approvedBy: cas.initiator || 'Admin' },
                { role: 'Evaluator', name: cas.businessUnit || cas.department || 'Business Evaluator', status: 'Pending', timestamp: null, approvedBy: null },
                { role: 'Reviewer', name: cas.department || 'Cross-Functional Reviewer', status: 'Pending', timestamp: null, approvedBy: null },
                { role: 'Approver', name: cas.doaApprover || 'Approver', status: 'Pending', timestamp: null, approvedBy: null }
            ]
        };
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleApproveStep = async (stepIndex, role) => {
        if (!selectedCas) return;
        try {
            const response = await fetch(`/api/cas/${selectedCas.id}/approve-step`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    stepIndex,
                    approvedBy: user?.name || 'Admin',
                    role: role
                })
            });
            if (response.ok) {
                showToast("Step approved successfully");
                await loadData();
            } else {
                showToast("Failed to approve step");
            }
        } catch (err) {
            console.error("Error approving step:", err);
            showToast("Error connecting to server");
        }
    };

    const handleDeleteClick = (id) => {
        setDeleteConfirm(id);
    };

    const handleDeleteConfirm = async () => {
        if (!deleteConfirm) return;
        try {
            const res = await fetch(`/api/cas/${deleteConfirm}`, { method: 'DELETE' });
            if (res.ok) {
                setCasRecords(prev => prev.filter(c => c.id !== deleteConfirm));
                if (selectedCas?.id === deleteConfirm) setSelectedCas(null);
                showToast("CAS record deleted successfully");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setDeleteConfirm(null);
        }
    };

    const filteredRecords = useMemo(() => {
        return casRecords.filter(r =>
            r.contractTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.id?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [casRecords, searchQuery]);

    // KPI Calculations
    const stats = useMemo(() => {
        const now = new Date();
        const thisMonthCount = casRecords.filter(r => {
            const created = new Date(r.createdAt);
            return created.getMonth() === now.getMonth() &&
                   created.getFullYear() === now.getFullYear() &&
                   r.status === 'Approved';
        }).length;

        return {
            total: casRecords.length,
            pending: casRecords.filter(r => r.status !== 'Approved').length,
            approved: casRecords.filter(r => r.status === 'Approved').length,
            thisMonth: thisMonthCount
        };
    }, [casRecords]);

    const canUserApprove = (step, idx) => {
        if (step.status === 'Approved') return false;
        // Step 0 is initiator, already approved
        if (idx === 0) return false;
        
        // Sequential check: previous must be approved
        const prevStep = selectedCas.approvalChain[idx - 1];
        if (prevStep.status !== 'Approved') return false;

        // Role mapping
        const userRole = user?.role || 'Admin';
        const isAdmin = userRole === 'Admin';
        
        if (idx === 1) return isAdmin || userRole === 'Manager';
        if (idx === 2) return isAdmin || userRole === 'Legal';
        if (idx === 3) return isAdmin || userRole === 'CEO';
        
        return false;
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Approved': return { bg: '#E6FFFB', color: '#00C9A7', border: '#B7EB8F' };
            case 'Rejected': return { bg: '#FFF1F0', color: '#F5222D', border: '#FFA39E' };
            default: return { bg: '#FFFBE6', color: '#FAAD14', border: '#FFE58F' };
        }
    };

    const handleExportPDF = async () => {
        if (!selectedCas) return;
        try {
            const blob = await casService.exportCAS(selectedCas.id);
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `cas-${selectedCas.id.slice(-8).toUpperCase()}.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to export CAS PDF:', error);
            showToast('Failed to export PDF');
        }
    };

    const getDoaApproverDisplay = (value) => {
        if (value > 50000) return "VP (L3)";
        if (value >= 10001) return "Director (L2)";
        return "Manager (L1)";
    };

    return (
        <div className={styles.container}>
            {toast && (
                <div style={{
                    position: 'fixed', bottom: '20px', right: '20px',
                    backgroundColor: '#10B981', color: 'white',
                    padding: '12px 24px', borderRadius: '8px', zIndex: 9999,
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)', fontWeight: '500'
                }}>
                    {toast}
                </div>
            )}

            <div className={styles.pageHeader}>
                <h2 className={styles.pageTitle}>Contract Approval Sheet (CAS)</h2>
                <p className={styles.pageSubtitle}>Official sign-off workflow for finalized contract drafts</p>
            </div>

            <div className={styles.statsRow}>
                <div className={styles.kpiCard}>
                    <div className={styles.kpiIcon}>
                        <FileText size={20} strokeWidth={1.5} />
                    </div>
                    <div className={styles.kpiContent}>
                        <span className={styles.kpiValue}>{stats.total}</span>
                        <span className={styles.kpiLabel}>Total CAS</span>
                    </div>
                </div>
                <div className={styles.kpiCard}>
                    <div className={styles.kpiIcon} style={{ color: '#FAAD14' }}>
                        <Clock size={20} strokeWidth={1.5} />
                    </div>
                    <div className={styles.kpiContent}>
                        <span className={styles.kpiValue}>{stats.pending}</span>
                        <span className={styles.kpiLabel}>Pending</span>
                    </div>
                </div>
                <div className={styles.kpiCard}>
                    <div className={styles.kpiIcon} style={{ color: '#00C9A7' }}>
                        <CheckCircle size={20} strokeWidth={1.5} />
                    </div>
                    <div className={styles.kpiContent}>
                        <span className={styles.kpiValue}>{stats.approved}</span>
                        <span className={styles.kpiLabel}>Approved</span>
                    </div>
                </div>
                <div className={styles.kpiCard}>
                    <div className={styles.kpiIcon} style={{ color: '#6366f1' }}>
                        <Calendar size={20} strokeWidth={1.5} />
                    </div>
                    <div className={styles.kpiContent}>
                        <span className={styles.kpiValue}>{stats.thisMonth}</span>
                        <span className={styles.kpiLabel}>This Month</span>
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
                                        <th>Contract Title</th>
                                        <th>Department</th>
                                        <th>Status</th>
                                        <th>Value</th>
                                        <th style={{ textAlign: 'right' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>Loading ledger...</td></tr>
                                    ) : filteredRecords.map(cas => {
                                        const statusStyle = getStatusColor(cas.status);
                                        return (
                                            <tr
                                                key={cas.id}
                                                className={selectedCas?.id === cas.id ? styles.selectedRow : ''}
                                                onClick={() => setSelectedCas(cas.approvalChain ? cas : initializeApprovalChain(cas))}
                                            >
                                                <td className={styles.idCell}>#{cas.id.slice(-8).toUpperCase()}</td>
                                                <td>
                                                    <div className={styles.titleCell}>
                                                        <span className={styles.contractTitle}>{cas.contractTitle}</span>
                                                        <span className={styles.unitTag}>Initiated by {cas.initiator}</span>
                                                    </div>
                                                </td>
                                                <td>{displayValue(cas.department || cas.doaApprover)}</td>
                                                <td>
                                                    <span
                                                        className={styles.statusBadge}
                                                        style={{
                                                            backgroundColor: statusStyle.bg,
                                                            color: statusStyle.color,
                                                            border: `1px solid ${statusStyle.border}`
                                                        }}
                                                    >
                                                        {cas.status}
                                                    </span>
                                                </td>
                                                <td className={styles.idCell}>${(cas.value || 0).toLocaleString()}</td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <button 
                                                        className={styles.actionBtn}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteClick(cas.id);
                                                        }}
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                          <polyline points="3 6 5 6 21 6"/>
                                                          <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                                                          <path d="M10 11v6"/>
                                                          <path d="M14 11v6"/>
                                                          <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                                                        </svg>
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
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
                                <h3>CAS-DOC-{selectedCas.id.slice(-8).toUpperCase()}</h3>
                            </div>
                            <div className={styles.panelActions}>
                                <button className={styles.pdfBtn} onClick={handleExportPDF}>
                                    Export PDF
                                </button>
                            </div>
                        </div>

                        <div className={styles.panelContent}>
                            <div className={styles.casSheet}>
                                <header className={styles.sheetHeader}>
                                    <h4>CONTRACT APPROVAL SHEET</h4>
                                    <p>INFINIA CLM SYSTEM — CONFIDENTIAL</p>
                                </header>

                                <div className={styles.sheetSection}>
                                    <span className={styles.sectionTitle}>SECTION A — CONTRACT DETAILS</span>
                                    <div className={styles.dataGrid}>
                                        <div className={styles.dataItem}>
                                            <label>Contract Title</label>
                                            <span>{selectedCas.contractTitle}</span>
                                        </div>
                                        <div className={styles.dataItem}>
                                            <label>Contract RefID</label>
                                            <span>{selectedCas.id.slice(-8).toUpperCase()}</span>
                                        </div>
                                        <div className={styles.dataItem}>
                                            <label>Agreement Type</label>
                                            <span>{displayValue(selectedCas.agreementType)}</span>
                                        </div>
                                        <div className={styles.dataItem}>
                                            <label>Business Unit</label>
                                            <span>{displayValue(selectedCas.businessUnit)}</span>
                                        </div>
                                        <div className={styles.dataItem}>
                                            <label>Department</label>
                                            <span>{displayValue(selectedCas.department)}</span>
                                        </div>
                                        <div className={styles.dataItem}>
                                            <label>Contract Value</label>
                                            <span className={styles.valueLarge}>${(selectedCas.value || 0).toLocaleString()}</span>
                                        </div>
                                        <div className={styles.dataItem}>
                                            <label>Cost Center</label>
                                            <span>{displayValue(selectedCas.cost_center)}</span>
                                        </div>
                                        <div className={styles.dataItem}>
                                            <label>Project Name</label>
                                            <span>{displayValue(selectedCas.project_name)}</span>
                                        </div>
                                        <div className={styles.dataItem}>
                                            <label>Effective Date</label>
                                            <span>{formatDate(selectedCas.effective_date)}</span>
                                        </div>
                                        <div className={styles.dataItem}>
                                            <label>Execution Date</label>
                                            <span>{formatDate(selectedCas.execution_date)}</span>
                                        </div>
                                        <div className={styles.dataItem}>
                                            <label>DOA Approver</label>
                                            <span>{displayValue(selectedCas.doaApprover || getDoaApproverDisplay(selectedCas.value))}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.sheetSection}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <span className={styles.sectionTitle}>SECTION B — KEY NOTES</span>
                                        <button
                                            onClick={async () => {
                                                if (!selectedCas) return;
                                                try {
                                                    const response = await fetch('/api/ai/generate-cas-notes', {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({ contract_id: selectedCas.contractId })
                                                    });
                                                    if (!response.ok) throw new Error('Failed');
                                                    const data = await response.json();
                                                    showToast('✨ AI notes generated!');
                                                    await loadData();
                                                } catch (err) {
                                                    showToast('Failed to generate notes');
                                                }
                                            }}
                                            style={{
                                                background: 'transparent',
                                                border: '1px solid #00C9B1',
                                                color: '#00C9B1',
                                                borderRadius: '6px',
                                                padding: '4px 12px',
                                                fontSize: '12px',
                                                fontWeight: '600',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Generate with AI ✨
                                        </button>
                                    </div>
                                    <div className={styles.keyNotesBox}>
                                        {displayValue(selectedCas.keyNotes)}
                                    </div>
                                </div>

                                <div className={styles.sheetSection}>
                                    <span className={styles.sectionTitle}>SECTION C — APPROVAL WORKFLOW</span>
                                    <div className={styles.approvalChain}>
                                        {(selectedCas.approvalChain || []).map((step, idx) => {
                                            const isApproved = step.status === 'Approved';
                                            const canApprove = canUserApprove(step, idx);
                                            const prevStep = idx > 0 ? selectedCas.approvalChain[idx - 1] : null;
                                            const isPending = !isApproved && prevStep?.status === 'Approved' && !canApprove;

                                            return (
                                                <div key={idx} className={styles.approvalStep}>
                                                    <div className={`${styles.stepIcon} ${isApproved ? styles.completed : canApprove ? styles.active : ''}`}>
                                                        {isApproved ? '✓' : ['①', '②', '③', '④'][idx] || idx + 1}
                                                    </div>
                                                    <div className={styles.stepContent}>
                                                        <div className={styles.stepHeader}>
                                                            <div>
                                                                <span className={styles.roleName}>{step.role}</span>
                                                                <span className={styles.assignedTo}>{step.name}</span>
                                                            </div>
                                                            <span className={styles.stepStatus} style={{ color: isApproved ? '#00C9A7' : canApprove ? '#FAAD14' : '#94a3b8' }}>
                                                                {isApproved ? '✅ APPROVED' : canApprove ? '⏳ ACTION REQUIRED' : isPending ? '⏳ PENDING' : '🔒 LOCKED'}
                                                            </span>
                                                        </div>
                                                        {isApproved && step.timestamp && (
                                                            <span className={styles.timestamp}>
                                                                Approved on {new Date(step.timestamp).toLocaleString()} by {step.approvedBy || 'Admin'}
                                                            </span>
                                                        )}
                                                        {canApprove && (
                                                            <button 
                                                                className={styles.approvalBtn}
                                                                onClick={() => handleApproveStep(idx, step.role)}
                                                            >
                                                                Acknowledge & Sign
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {deleteConfirm && (
                <div style={{
                    position: 'fixed', inset: 0,
                    background: 'rgba(0,0,0,0.7)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '12px',
                        padding: '28px 32px',
                        width: '400px',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '36px', marginBottom: '12px' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                                <path d="M10 11v6"/><path d="M14 11v6"/>
                                <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                            </svg>
                        </div>
                        <h3 style={{ color: 'var(--text-primary)', fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>
                            Delete CAS Record
                        </h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '24px', lineHeight: '1.6' }}>
                            Are you sure you want to delete this CAS record?<br/>
                            This action cannot be undone.
                        </p>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                style={{ padding: '9px 24px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteConfirm}
                                style={{ padding: '9px 24px', borderRadius: '8px', border: 'none', background: '#EF4444', color: '#fff', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CAS;
