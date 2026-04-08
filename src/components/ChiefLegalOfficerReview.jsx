import React, { useState, useEffect } from 'react';
import styles from './ChiefLegalOfficerReview.module.css';
import reviewStyles from './ReviewPage.module.css'; // Reuse core layout
import { contractService } from '../services/contractService';
import { getAuthHeaders } from '../services/authHelper';
import PdfAnnotationViewer from './PdfAnnotationViewer';

const ChiefLegalOfficerReview = ({ user }) => {
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const [actionModal, setActionModal] = useState(null); // { type: 'approve'|'revise'|'reject', contract }
    const [selectedPdfContract, setSelectedPdfContract] = useState(null);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const loadData = async ({ silent = false } = {}) => {
        if (!silent) setLoading(true);
        try {
            const data = await contractService.getAllContracts();
            const filtered = data.filter(c => c.stage === 'CLO Review');
            setContracts(filtered || []);
        } catch (e) {
            console.error('Failed to load CLO contracts', e);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        const interval = setInterval(() => loadData({ silent: true }), 5000);
        const handleFocus = () => loadData({ silent: true });
        const handleVisibility = () => {
            if (!document.hidden) loadData({ silent: true });
        };

        window.addEventListener('focus', handleFocus);
        document.addEventListener('visibilitychange', handleVisibility);
        return () => {
            clearInterval(interval);
            window.removeEventListener('focus', handleFocus);
            document.removeEventListener('visibilitychange', handleVisibility);
        };
    }, []);

    const confirmAction = async () => {
        if (!actionModal) return;
        if (actionModal.type !== 'approve' && !comment.trim()) {
            alert('A comment is required for this action.');
            return;
        }

        setSubmitting(true);
        try {
            if (actionModal.type === 'revise') {
                await fetch('/api/contracts/' + actionModal.contract.id + '/return-to-legal', {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({
                        review_comment: comment,
                    })
                });
            } else {
                await fetch('/api/contracts/' + actionModal.contract.id + '/clo-decision', {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({
                        decision: actionModal.type === 'approve' ? 'send-to-cas' : actionModal.type,
                        comment: comment,
                        clo_name: user?.name || 'Chief Legal Officer'
                    })
                });
            }

            const messages = {
                'approve': 'Contract Approved & Sent to CAS',
                'revise': 'Contract Returned to Legal Counsel for Revision',
                'reject': 'Contract Rejected & Closed'
            };

            setToast(messages[actionModal.type]);
            setTimeout(() => setToast(null), 3500);
            setActionModal(null);
            setComment('');
            await loadData();
        } catch (e) {
            alert('Action failed');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className={reviewStyles.container}>
            <header className={reviewStyles.pageHeader}>
                <div className={reviewStyles.titleArea}>
                    <h2 style={{ color: '#ca8a04' }}>Chief Legal Officer Portal</h2>
                    <p>Final Executive Review for Escalated & Self-Service Contracts.</p>
                </div>
            </header>

            {selectedPdfContract && (
                <PdfAnnotationViewer 
                    contractId={selectedPdfContract.id} 
                    user={user} 
                    readOnly={false}
                    onClose={() => setSelectedPdfContract(null)}
                />
            )}

            {toast && (
                <div className={reviewStyles.toast}>
                    {toast}
                </div>
            )}

            {loading ? (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>Loading queue...</div>
            ) : (
                <div className={reviewStyles.reviewGrid}>
                    {contracts.map((c) => (
                        <div key={c.id} className={`${reviewStyles.contractCard} ${styles.cloCard}`}>
                            <div className={reviewStyles.cardHeader}>
                                <div className={reviewStyles.titleGroup}>
                                    <h3>{c.title}</h3>
                                    <span className={reviewStyles.counterparty}>{c.company}</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                                    <span className={`${reviewStyles.priorityBadge} ${reviewStyles[c.priority?.toLowerCase() || 'high']}`}>
                                        {c.priority || 'High'} Priority
                                    </span>
                                    {c.source === 'self-service' && (
                                        <div style={{ fontSize: '11px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', color: '#10b981', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
                                            ✓ AI Pre-Verified
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className={reviewStyles.details}>
                                <div className={reviewStyles.detailRow}>
                                    <span className={reviewStyles.label}>Contract ID:</span>
                                    <span className={reviewStyles.value}>#{String(c.id).slice(-8).toUpperCase()}</span>
                                </div>
                                <div className={reviewStyles.detailRow}>
                                    <span className={reviewStyles.label}>Value:</span>
                                    <span className={reviewStyles.value}>${Number(c.value).toLocaleString()}</span>
                                </div>
                                <div className={reviewStyles.detailRow}>
                                    <span className={reviewStyles.label}>Escalated By:</span>
                                    <span className={reviewStyles.value}>{c.reviews?.Legal?.reviewedBy || 'Legal Counsel'}</span>
                                </div>
                            </div>

                            <div className={reviewStyles.footer} style={{ borderTop: '1px solid rgba(202, 138, 4, 0.2)', paddingTop: '16px', marginTop: '16px' }}>
                                <div className={reviewStyles.actions} style={{ width: '100%', display: 'flex', gap: '8px' }}>
                                    <button 
                                        className={reviewStyles.btn} 
                                        style={{ flex: '1', background: '#3b82f6', color: 'white' }}
                                        onClick={() => setSelectedPdfContract(c)}
                                    >
                                        📄 Review Document
                                    </button>
                                    <button 
                                        className={reviewStyles.btn} 
                                        style={{ flex: '1', background: '#10b981', color: 'white' }}
                                        onClick={() => setActionModal({ type: 'approve', contract: c })}
                                    >
                                        ✓ Send to CAS
                                    </button>
                                    <button 
                                        className={reviewStyles.btn} 
                                        style={{ flex: '1', background: '#ca8a04', color: 'white' }}
                                        onClick={() => setActionModal({ type: 'revise', contract: c })}
                                    >
                                        Return to Legal
                                    </button>
                                    <button 
                                        className={reviewStyles.btn} 
                                        style={{ flex: '1', background: '#dc2626', color: 'white' }}
                                        onClick={() => setActionModal({ type: 'reject', contract: c })}
                                    >
                                        Reject
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {contracts.length === 0 && !loading && (
                <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                    Your queue is clear. No contracts require CLO approval right now.
                </div>
            )}

            {actionModal && (
                <div className={reviewStyles.splitModalOverlay} onClick={() => !submitting && setActionModal(null)}>
                    <div className={reviewStyles.gateModal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
                        <h3 className={reviewStyles.gateTitle} style={{ color: actionModal.type === 'approve' ? '#10b981' : (actionModal.type === 'revise' ? '#ca8a04' : '#dc2626') }}>
                            {actionModal.type === 'approve' ? 'Approve Contract' : (actionModal.type === 'revise' ? 'Request Revisions' : 'Reject Contract')}
                        </h3>
                        <p className={reviewStyles.gateBody} style={{ textAlign: 'left', marginBottom: '16px' }}>
                            {actionModal.type === 'approve' 
                                ? 'Are you sure you want to approve this contract? It will go directly to CAS generation.'
                                : 'Please provide details on what needs to be changed or why it is rejected.'}
                        </p>
                        
                        <textarea
                            style={{ width: '100%', minHeight: '100px', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: '#fff', fontSize: '14px', marginBottom: '20px' }}
                            placeholder={actionModal.type === 'approve' ? "Optional approval notes..." : "Required review comment..."}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            disabled={submitting}
                        />
                        
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button className={reviewStyles.btn} style={{ background: 'transparent', border: '1px solid var(--border-color)' }} onClick={() => setActionModal(null)} disabled={submitting}>Cancel</button>
                            <button 
                                className={reviewStyles.btn} 
                                style={{ 
                                    background: actionModal.type === 'approve' ? '#10b981' : (actionModal.type === 'revise' ? '#ca8a04' : '#dc2626'),
                                    color: 'white',
                                    opacity: (!comment.trim() && actionModal.type !== 'approve') ? 0.5 : 1
                                }} 
                                onClick={confirmAction}
                                disabled={submitting || (!comment.trim() && actionModal.type !== 'approve')}
                            >
                                {submitting ? 'Processing...' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChiefLegalOfficerReview;
