import React, { useState, useEffect, useMemo } from 'react';
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
            businessUnit: cas.businessUnit || 'Apeiro Global',
            department: cas.department || 'Operations',
            agreementType: cas.agreementType || 'Master Service Agreement',
            keyNotes: cas.keyNotes || 'Standard terms applied. No high-risk deviations noted.',
            approvalChain: cas.approvalChain && cas.approvalChain.length > 0 ? cas.approvalChain : [
                { role: 'Initiator', name: cas.initiator || 'Admin', status: 'Approved', timestamp: cas.createdAt, approvedBy: cas.initiator || 'Admin' },
                { role: 'Endorser', name: 'Dept Head', status: 'Pending', timestamp: null, approvedBy: null },
                { role: 'Reviewer', name: 'Legal Counsel', status: 'Pending', timestamp: null, approvedBy: null },
                { role: 'Approver', name: 'Executive Director', status: 'Pending', timestamp: null, approvedBy: null }
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

    const handleExportPDF = () => {
        const printWindow = window.open('', '_blank', 'width=1000,height=1200');
        const id = selectedCas.id.slice(-8).toUpperCase();
        
        const html = `
            <html>
                <head>
                    <title>CAS-DOC-${id}</title>
                    <style>
                        @page { margin: 20mm; size: A4; }
                        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color: #1a1a2e; padding: 0; margin: 0; }
                        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #00C9B1; padding-bottom: 20px; margin-bottom: 30px; }
                        .company-name { font-size: 24px; font-weight: 800; letter-spacing: 1px; }
                        .doc-type { font-size: 14px; font-weight: 600; color: #666; text-transform: uppercase; }
                        .section { margin-bottom: 30px; }
                        .section-title { font-size: 12px; font-weight: 700; color: #00C9B1; text-transform: uppercase; letter-spacing: 2px; border-bottom: 1px solid #eee; padding-bottom: 8px; margin-bottom: 15px; }
                        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
                        .item { margin-bottom: 15px; }
                        .label { font-size: 10px; color: #999; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; margin-bottom: 4px; }
                        .value { font-size: 14px; font-weight: 600; color: #1a1a2e; }
                        .value-large { font-size: 20px; font-weight: 800; color: #00C9B1; }
                        .notes-box { background: #f8f9fa; border-left: 4px solid #00C9B1; padding: 15px; font-size: 13px; line-height: 1.6; }
                        .step { display: flex; gap: 15px; margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #eee; align-items: center; }
                        .step:last-child { border-bottom: none; }
                        .step-icon { width: 30px; height: 30px; border-radius: 50%; border: 1px solid #ddd; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 12px; background: #f8f9fa; }
                        .step-icon.approved { border-color: #00C9B1; color: #00C9B1; background: #e6fffb; }
                        .step-info { flex: 1; }
                        .step-role { font-size: 13px; font-weight: 700; }
                        .step-name { font-size: 12px; color: #666; }
                        .step-status { font-size: 11px; font-weight: 700; margin-left: auto; }
                        .footer { position: fixed; bottom: 30px; left: 20mm; right: 20mm; font-size: 11px; color: #999; text-align: center; border-top: 1px solid #eee; padding-top: 15px; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div class="company-name">INFINIA CLM SYSTEM</div>
                        <div class="doc-type">Contract Approval Sheet</div>
                    </div>

                    <div class="section">
                        <div class="section-title">Section A — Contract Details</div>
                        <div class="grid">
                            <div class="item"><div class="label">Contract Title</div><div class="value">${selectedCas.contractTitle}</div></div>
                            <div class="item"><div class="label">Contract RefID</div><div class="value">CAS-DOC-${id}</div></div>
                            <div class="item"><div class="label">Agreement Type</div><div class="value">${selectedCas.agreementType || 'Master Service Agreement'}</div></div>
                            <div class="item"><div class="label">Business Unit</div><div class="value">${selectedCas.businessUnit || 'Apeiro Global'}</div></div>
                            <div class="item"><div class="label">Department</div><div class="value">${selectedCas.department || 'Operations'}</div></div>
                            <div class="item"><div class="label">Contract Value</div><div class="value-large">$${(selectedCas.value || 0).toLocaleString()}</div></div>
                            <div class="item"><div class="label">Execution Date</div><div class="value">${new Date(selectedCas.createdAt).toLocaleDateString()}</div></div>
                            <div class="item"><div class="label">DOA Approver</div><div class="value">${getDoaApproverDisplay(selectedCas.value)}</div></div>
                        </div>
                    </div>

                    <div class="section">
                        <div class="section-title">Section B — Key Notes</div>
                        <div class="notes-box">${selectedCas.keyNotes || 'Standard terms applied. No high-risk deviations noted.'}</div>
                    </div>

                    <div class="section">
                        <div class="section-title">Section C — Approval Workflow</div>
                        ${selectedCas.approvalChain.map((step, i) => `
                            <div class="step">
                                <div class="step-icon ${step.status === 'Approved' ? 'approved' : ''}">${step.status === 'Approved' ? '✓' : i + 1}</div>
                                <div class="step-info">
                                    <div class="step-role">${step.role}</div>
                                    <div class="step-name">${step.name}</div>
                                </div>
                                <div class="step-status" style="color: ${step.status === 'Approved' ? '#00C9B1' : '#FAAD14'}">${step.status === 'Approved' ? 'APPROVED' : 'PENDING'}</div>
                            </div>
                        `).join('')}
                    </div>

                    <div class="footer">
                        Ref: CAS-DOC-${id} | Generated on ${new Date().toLocaleString()} | INFINIA CLM CONFIDENTIAL
                    </div>

                    <script>
                        window.onload = function() {
                            // window.close(); // Optional: close after printing
                        }
                    <\/script>
                </body>
            </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
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
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                    </div>
                    <div className={styles.kpiContent}>
                        <span className={styles.kpiValue}>{stats.total}</span>
                        <span className={styles.kpiLabel}>Total CAS</span>
                    </div>
                </div>
                <div className={styles.kpiCard}>
                    <div className={styles.kpiIcon} style={{ background: 'rgba(250, 173, 20, 0.1)', color: '#FAAD14' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    </div>
                    <div className={styles.kpiContent}>
                        <span className={styles.kpiValue}>{stats.pending}</span>
                        <span className={styles.kpiLabel}>Pending</span>
                    </div>
                </div>
                <div className={styles.kpiCard}>
                    <div className={styles.kpiIcon} style={{ background: 'rgba(0, 201, 167, 0.1)', color: '#00C9A7' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                    <div className={styles.kpiContent}>
                        <span className={styles.kpiValue}>{stats.approved}</span>
                        <span className={styles.kpiLabel}>Approved</span>
                    </div>
                </div>
                <div className={styles.kpiCard}>
                    <div className={styles.kpiIcon} style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
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
                                                <td>{cas.department || cas.doaApprover || 'Operations'}</td>
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
                                            <span>{selectedCas.agreementType || 'Master Service Agreement'}</span>
                                        </div>
                                        <div className={styles.dataItem}>
                                            <label>Business Unit</label>
                                            <span>{selectedCas.businessUnit || 'Apeiro Global'}</span>
                                        </div>
                                        <div className={styles.dataItem}>
                                            <label>Department</label>
                                            <span>{selectedCas.department || 'Operations'}</span>
                                        </div>
                                        <div className={styles.dataItem}>
                                            <label>Contract Value</label>
                                            <span className={styles.valueLarge}>${(selectedCas.value || 0).toLocaleString()}</span>
                                        </div>
                                        <div className={styles.dataItem}>
                                            <label>Execution Date</label>
                                            <span>{new Date(selectedCas.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <div className={styles.dataItem}>
                                            <label>DOA Approver</label>
                                            <span>{getDoaApproverDisplay(selectedCas.value)}</span>
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
                                        {selectedCas.keyNotes || 'Standard terms applied. No high-risk deviations noted in the initial compliance verification. Fiscal impact falls within the current quarterly budget allocation.'}
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
