import React, { useState } from 'react';
import styles from './ReviewPage.module.css';
import { contractService } from '../services/contractService';

const ProcurementReview = () => {
    const [selectedContract, setSelectedContract] = useState(null);
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [comment, setComment] = useState('');
    const [editText, setEditText] = useState('');
    const [gateModal, setGateModal] = useState(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await contractService.getAllContracts();
            const filtered = data.filter(c => c.department === 'Procurement');
            setContracts(filtered || []);
        } catch (e) {
            console.error('Failed to load contracts', e);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        loadData();
    }, []);

    const isComplianceApproved = (contract) => contract?.reviews?.Compliance?.status === 'Approved';

    const handleAction = async (id, action) => {
        const contract = contracts.find(c => c.id === id);
        if (!isComplianceApproved(contract)) {
            setGateModal('Compliance department has not yet approved this contract. You can add comments and review clauses, but cannot approve or reject until Compliance completes their review.');
            return;
        }
        try {
            const status = action === 'Approve' ? 'Approved' : 'Rejected';
            await contractService.submitReview(id, 'Procurement', status, comment || 'Action performed by Procurement');
            await loadData();
            setSelectedContract(null);
            setComment('');
        } catch (e) {
            alert('Action failed');
        }
    };

    const openReview = (contract) => {
        setSelectedContract(contract);
        setEditText(contract.extractedText || 'Contract text not available for editing in this mock.');
    };

    const getDeadlineInfo = (contract) => {
        const daysPending = contract.daysPending || 2;
        if (daysPending > 5) return { label: 'OVERDUE', class: styles.overdue, escalation: true };
        if (daysPending > 3) return { label: 'Approaching Deadline', class: styles.warning, escalation: false };
        return { label: 'Due in 3 days', class: styles.onTrack, escalation: false };
    };

    const WorkflowProgress = ({ contract }) => {
        const steps = [
            { name: 'Legal', approved: contract?.reviews?.Legal?.status === 'Approved' },
            { name: 'Finance', approved: contract?.reviews?.Finance?.status === 'Approved' },
            { name: 'Compliance', approved: contract?.reviews?.Compliance?.status === 'Approved' },
            { name: 'Procurement', approved: contract?.reviews?.Procurement?.status === 'Approved' },
        ];
        const currentIdx = steps.findIndex(s => !s.approved);
        return (
            <div className={styles.workflowBar}>
                {steps.map((s, i) => (
                    <React.Fragment key={s.name}>
                        {i > 0 && <div className={`${styles.workflowLine} ${steps[i - 1].approved ? styles.wlDone : ''}`} />}
                        <div className={styles.workflowStep}>
                            <div className={`${styles.workflowDot} ${s.approved ? styles.wdApproved : i === currentIdx ? styles.wdCurrent : styles.wdLocked}`} />
                            <span className={styles.workflowLabel}>{s.name}</span>
                        </div>
                    </React.Fragment>
                ))}
            </div>
        );
    };

    return (
        <div className={styles.container}>
            <header className={styles.pageHeader}>
                <div className={styles.titleArea}>
                    <h2>Procurement Review Queue</h2>
                    <p>Manage and verify procurement terms for active contract requests.</p>
                </div>
            </header>

            {loading ? (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>Loading queue...</div>
            ) : (
                <div className={styles.reviewGrid}>
                    {contracts.map((c) => {
                        const deadline = getDeadlineInfo(c);
                        const gated = !isComplianceApproved(c);
                        return (
                            <div key={c.id} className={styles.contractCard}>
                                <div className={styles.cardHeader}>
                                    <div className={styles.titleGroup}>
                                        <h3>{c.title}</h3>
                                        <span className={styles.counterparty}>{c.company}</span>
                                    </div>
                                    <span className={`${styles.priorityBadge} ${styles[c.priority?.toLowerCase() || 'medium']}`}>
                                        {c.priority || 'Medium'}
                                    </span>
                                </div>

                                <WorkflowProgress contract={c} />

                                <div className={styles.details}>
                                    <div className={styles.detailRow}>
                                        <span className={styles.label}>Contract ID:</span>
                                        <span className={styles.value}>{c.id}</span>
                                    </div>
                                    <div className={styles.detailRow}>
                                        <span className={styles.label}>Value:</span>
                                        <span className={styles.value}>${Number(c.value).toLocaleString()}</span>
                                    </div>
                                    <div className={styles.detailRow}>
                                        <span className={styles.label}>Submitted By:</span>
                                        <span className={styles.value}>{c.submittedBy}</span>
                                    </div>
                                </div>

                                <div className={styles.footer}>
                                    <div className={`${styles.deadlineIndicator} ${deadline.class}`}>
                                        <span>📅</span> {deadline.label}
                                    </div>
                                    {deadline.escalation && (
                                        <div className={styles.escalationWarning}>
                                            ⚠️ ESCALATION: OVERDUE BY {c.daysPending - 5} DAYS
                                        </div>
                                    )}
                                    <div className={styles.actions}>
                                        <button className={`${styles.btn} ${styles.viewBtn}`} onClick={() => openReview(c)}>
                                            <span>🔍</span> View & Review
                                        </button>
                                        <button
                                            className={`${styles.btn} ${gated ? styles.btnGated : styles.approveBtn}`}
                                            onClick={() => handleAction(c.id, 'Approve')}
                                        >Approve</button>
                                        <button
                                            className={`${styles.btn} ${gated ? styles.btnGated : styles.rejectBtn}`}
                                            onClick={() => handleAction(c.id, 'Reject')}
                                        >Reject</button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {contracts.length === 0 && !loading && (
                <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                    All procurement reviews are cleared.
                </div>
            )}

            {/* Gate Modal */}
            {gateModal && (
                <div className={styles.gateOverlay}>
                    <div className={styles.gateModal}>
                        <div className={styles.gateIcon}>⛔</div>
                        <h3 className={styles.gateTitle}>Action Not Allowed</h3>
                        <p className={styles.gateBody}>{gateModal}</p>
                        <button className={styles.gateOk} onClick={() => setGateModal(null)}>OK</button>
                    </div>
                </div>
            )}

            {/* Review Modal */}
            {selectedContract && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(10px)'
                }}>
                    <div className={styles.reviewModal}>
                        <h3 style={{ marginBottom: '8px' }}>Review: {selectedContract.title}</h3>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '24px' }}>{selectedContract.id} | {selectedContract.company}</p>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent-teal)' }}>Contract Text (Basic Edit)</label>
                            <textarea
                                className={styles.textarea}
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                placeholder="Contract body content..."
                            />
                        </div>

                        <div style={{ marginBottom: '32px' }}>
                            <label style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent-teal)' }}>Internal Comments</label>
                            <textarea
                                className={styles.textarea}
                                style={{ height: '80px' }}
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Add comments for the audit trail..."
                            />
                        </div>

                        <div className={styles.actions}>
                            <button className={`${styles.btn} ${isComplianceApproved(selectedContract) ? styles.approveBtn : styles.btnGated}`} onClick={() => handleAction(selectedContract.id, 'Approve')}>Approve Contract</button>
                            <button className={`${styles.btn} ${isComplianceApproved(selectedContract) ? styles.rejectBtn : styles.btnGated}`} onClick={() => handleAction(selectedContract.id, 'Reject')}>Reject / Change</button>
                            <button
                                className={styles.btn}
                                style={{ gridColumn: 'span 2', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'white', marginTop: '8px' }}
                                onClick={() => setSelectedContract(null)}
                            >
                                Close Without Action
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProcurementReview;
