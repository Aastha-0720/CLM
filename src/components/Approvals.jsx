import React, { useState, useEffect } from 'react';
import { ClipboardCheck, FileSearch, Hourglass, CheckCircle, XCircle } from 'lucide-react';
import styles from './Approvals.module.css';
import DOAApprovals from './DOAApprovals';
import { contractService } from '../services/contractService';

const Approvals = ({ user, onNavigate }) => {
    const [activeTab, setActiveTab] = useState('doa');
    const [casApprovals, setCasApprovals] = useState([]);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);
    const [diginkStatuses, setDiginkStatuses] = useState({});
    const [isSending, setIsSending] = useState({});

    const isStandardUser = user?.role === 'User';

    const loadCASApprovals = async () => {
        if (!isStandardUser) return;
        setLoading(true);
        try {
            const data = await contractService.getUserApprovals();
            setCasApprovals(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchDiginkStatus = async (contractId) => {
        try {
            const status = await contractService.getDiginkStatus(contractId);
            setDiginkStatuses(prev => ({ ...prev, [contractId]: status }));
        } catch (err) {
            console.error('Error fetching DigInk status:', err);
        }
    };

    useEffect(() => {
        if (activeTab === 'cas') {
            loadCASApprovals();
        }
    }, [activeTab]);

    useEffect(() => {
        if (casApprovals.length > 0) {
            casApprovals.forEach(req => {
                if (!diginkStatuses[req.id]) {
                    fetchDiginkStatus(req.id);
                }
            });
        }
    }, [casApprovals]);

    const handleSendForSignature = async (contractId) => {
        setIsSending(prev => ({ ...prev, [contractId]: true }));
        try {
            await contractService.sendForSignature(contractId);
            setToast({ message: "Document successfully sent for signature via DigInk!", type: 'success' });
            setTimeout(() => setToast(null), 3000);
            await fetchDiginkStatus(contractId);
            loadCASApprovals();
        } catch (err) {
            setToast({ message: "Failed to send document for signature.", type: 'error' });
            setTimeout(() => setToast(null), 3000);
        } finally {
            setIsSending(prev => ({ ...prev, [contractId]: false }));
        }
    };

    const handleAction = async (id, action) => {
        try {
            await contractService.approveCASContract(id, action);
            setToast({ message: `Contract ${action === 'approve' ? 'Approved' : 'Rejected'} successfully!`, type: action === 'approve' ? 'success' : 'error' });
            setTimeout(() => setToast(null), 3000);
            loadCASApprovals();
        } catch (err) {
            setToast({ message: "Action failed. Please try again.", type: 'error' });
            setTimeout(() => setToast(null), 3000);
        }
    };

    return (
        <div className={styles.container}>
            {toast && <div className={styles.toast} style={{ backgroundColor: toast.type === 'success' ? '#00C9B1' : '#EF4444' }}>{toast.message}</div>}
            
            <div className={styles.pageHeader}>
                <h2 className={styles.pageTitle}>Approvals</h2>
                <p className={styles.pageSubtitle}>Review and process pending DOA and CAS approval requests.</p>
            </div>

            <div className={styles.tabs}>
                <button 
                    className={`${styles.tab} ${activeTab === 'doa' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('doa')}
                >
                    DOA Approvals
                </button>
                {isStandardUser && (
                    <button 
                        className={`${styles.tab} ${activeTab === 'cas' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('cas')}
                    >
                        CAS Approvals
                        {casApprovals.length > 0 && <span className={styles.tabBadge}>{casApprovals.length}</span>}
                    </button>
                )}
            </div>

            <div className={styles.tabContent}>
                {activeTab === 'doa' ? (
                    <DOAApprovals user={user} onNavigate={onNavigate} />
                ) : (
                    <div className={styles.casSection}>
                        {loading ? (
                            <div className={styles.emptyState}>Loading approvals...</div>
                        ) : casApprovals.length > 0 ? (
                            <div className={styles.cardGrid}>
                                {casApprovals.map((req) => (
                                    <div key={req.id} className={styles.approvalCard}>
                                        <div className={styles.cardHeader}>
                                            <div>
                                                <h4 className={styles.contractTitle}>{req.title}</h4>
                                                <span style={{ fontSize: '13px', color: '#00C9B1' }}>{req.company}</span>
                                            </div>
                                            <span className={styles.statusBadge}>Pending</span>
                                        </div>
                                        
                                        <div className={styles.cardBody}>
                                            <div className={styles.infoItem}>
                                                <span className={styles.infoLabel}>Value</span>
                                                <span className={styles.valueHighlight}>${(req.value || 0).toLocaleString()}</span>
                                            </div>
                                            <div className={styles.infoItem}>
                                                <span className={styles.infoLabel}>Created Date</span>
                                                <span className={styles.infoValue}>{new Date(req.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <div className={styles.infoItem}>
                                                <span className={styles.infoLabel}>Submitted By</span>
                                                <span className={styles.infoValue}>{req.submittedBy}</span>
                                            </div>
                                            <div className={styles.infoItem}>
                                                <span className={styles.infoLabel}>Stage</span>
                                                <span className={styles.infoValue}>CAS Approval</span>
                                            </div>
                                        </div>

                                        <div className={styles.cardActions}>
                                            <button 
                                                className={styles.btnReject}
                                                onClick={() => handleAction(req.id, 'reject')}
                                            >
                                                Reject
                                            </button>
                                            {(!diginkStatuses[req.id] || diginkStatuses[req.id].status === 'Not Sent') ? (
                                                <button 
                                                    className={styles.btnApprove}
                                                    onClick={() => handleSendForSignature(req.id)}
                                                    disabled={isSending[req.id]}
                                                    style={{ background: '#6366f1' }}
                                                >
                                                    {isSending[req.id] ? 'Sending...' : 'Send for Signature'}
                                                </button>
                                            ) : (
                                                <div style={{ 
                                                    padding: '8px 16px', 
                                                    background: 'rgba(99, 102, 241, 0.1)', 
                                                    color: '#6366f1', 
                                                    borderRadius: '6px',
                                                    fontSize: '13px',
                                                    fontWeight: '700',
                                                    border: '1px solid rgba(99, 102, 241, 0.2)'
                                                }}>
                                                    DIGINK: {diginkStatuses[req.id].status.toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className={styles.emptyState}>
                                <div className={styles.emptyIcon}>
                                    <FileSearch size={48} strokeWidth={1} />
                                </div>
                                <p>No pending CAS approvals found.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Approvals;
