import React, { useState, useEffect } from 'react';
import styles from './ReviewPage.module.css';
import { contractService } from '../services/contractService';

const UserReviews = ({ user }) => {
    const [selectedContract, setSelectedContract] = useState(null);
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [comment, setComment] = useState('');
    const [toast, setToast] = useState(null);
    const [timeline, setTimeline] = useState([]);
    const [activeRightTab, setActiveRightTab] = useState('Review');

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await contractService.getUserReviews();
            setContracts(data || []);
        } catch (e) {
            console.error('Failed to load user reviews', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleAction = async (id, action) => {
        try {
            let status = '';
            switch (action) {
                case 'Approve': status = 'Approved'; break;
                case 'Reject': status = 'Rejected'; break;
                case 'SuggestChanges': status = 'Suggest Changes'; break;
                case 'Comment': status = 'Comment'; break;
                default: return;
            }

            const message = comment.trim() ? comment : `Action taking place: ${status}`;

            // We don't have clauses to count here, just a general contract comment
            await contractService.submitReview(id, user?.role || 'User', status, message);

            if (status === 'Approved') setToast('✅ Contract Approved');
            else if (status === 'Rejected') setToast('❌ Contract Rejected');
            else setToast(`✅ ${status} submitted`);
            
            setTimeout(() => setToast(null), 3000);

            if (status === 'Approved' || status === 'Rejected') {
                setSelectedContract(null);
            }
            setComment('');
            await loadData();
        } catch (e) {
            alert('Action failed');
        }
    };

    const openReview = (contract) => {
        setSelectedContract(contract);
    };

    const loadTimeline = async (contractId) => {
        try {
            const data = await contractService.getActivityTimeline(contractId);
            setTimeline(data || []);
        } catch (e) {
            console.error("Failed to load timeline", e);
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.pageHeader}>
                 <div className={styles.titleArea}>
                     <h2>My Assigned Reviews</h2>
                     <p>Review and approve contracts assigned directly to you.</p>
                 </div>
            </header>

            {loading ? (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>Loading your reviews...</div>
            ) : (
                <>
                    <div className={styles.reviewGrid}>
                        {contracts.map((c) => (
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

                                <div className={styles.details}>
                                    <div className={styles.detailRow}>
                                        <span className={styles.label}>Contract ID:</span>
                                        <span className={styles.value}>#{String(c.id).slice(-8).toUpperCase()}</span>
                                    </div>
                                    <div className={styles.detailRow}>
                                        <span className={styles.label}>Value:</span>
                                        <span className={styles.value}>${Number(c.value).toLocaleString()}</span>
                                    </div>
                                </div>

                                <div className={styles.footer}>
                                    <div className={styles.actions} style={{ width: '100%', justifyContent: 'flex-end' }}>
                                        <button className={`${styles.btn} ${styles.viewBtn}`} onClick={() => openReview(c)}>
                                            <span>🔍</span> View & Review
                                        </button>
                                        <button className={`${styles.btn} ${styles.approveBtn}`} onClick={() => handleAction(c.id, 'Approve')}>Approve</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {contracts.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                            You have no assigned contracts for review.
                        </div>
                    )}
                </>
            )}

            {selectedContract && (
                <div className={styles.splitModalOverlay}>
                    <div className={styles.splitModalContainer} style={{ display: 'flex' }}>
                        
                        <div className={styles.reviewPane} style={{ flex: 1, borderLeft: 'none', maxWidth: '100%', maxHeight: '85vh', overflowY: 'auto', padding: '28px' }}>
                            <div className={styles.reviewPaneHeader}>
                                <div>
                                    <div className={styles.tabGroup}>
                                        <button
                                            className={`${styles.tabBtn} ${activeRightTab === 'Review' ? styles.activeTab : ''}`}
                                            onClick={() => setActiveRightTab('Review')}
                                        >
                                            Review
                                        </button>
                                        <button
                                            className={`${styles.tabBtn} ${activeRightTab === 'Timeline' ? styles.activeTab : ''}`}
                                            onClick={() => {
                                                setActiveRightTab('Timeline');
                                                loadTimeline(selectedContract.id);
                                            }}
                                        >
                                            History
                                        </button>
                                    </div>
                                </div>
                                <button className={styles.closeModalBtn} onClick={() => setSelectedContract(null)}>×</button>
                            </div>

                            <div className={styles.reviewPaneContent}>
                                {activeRightTab === 'Review' ? (
                                    <>
                                        <div className={styles.metadataGrid} style={{ borderLeft: '3px solid #00C9B1', paddingLeft: '12px', marginBottom: '24px' }}>
                                            <div className={styles.metaItem}>
                                                <span className={styles.metaLabel}>Contract Title</span>
                                                <span className={styles.metaValue}>{selectedContract.title}</span>
                                            </div>
                                            <div className={styles.metaItem}>
                                                <span className={styles.metaLabel}>Counterparty</span>
                                                <span className={styles.metaValue}>{selectedContract.company}</span>
                                            </div>
                                            <div className={styles.metaItem}>
                                                <span className={styles.metaLabel}>Value</span>
                                                <span className={styles.metaValue}>${Number(selectedContract.value).toLocaleString()}</span>
                                            </div>
                                            <div className={styles.metaItem}>
                                                <span className={styles.metaLabel}>Risk Level</span>
                                                <span className={`${styles.priorityBadge} ${styles[selectedContract.priority?.toLowerCase() || 'medium']}`} style={{ width: 'fit-content' }}>
                                                    {selectedContract.priority || 'Medium'}
                                                </span>
                                            </div>
                                            <div className={styles.metaItem} style={{ gridColumn: 'span 2' }}>
                                                <span className={styles.metaLabel}>Current Status</span>
                                                <span className={styles.metaValue} style={{ color: 'var(--accent-teal)' }}>{selectedContract.status || selectedContract.stage}</span>
                                            </div>
                                        </div>

                                        <div className={styles.paneSection} style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                                            <span className={styles.sectionLabel}>Your Review Comments / Feedback</span>
                                            <textarea
                                                className={styles.textarea}
                                                style={{ height: '120px' }}
                                                value={comment}
                                                onChange={(e) => setComment(e.target.value)}
                                                placeholder="Enter any comments or suggested changes before taking an action..."
                                            />
                                        </div>

                                        <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                <button style={{ flex: 1 }} className={`${styles.btn} ${styles.approveBtn}`} onClick={() => handleAction(selectedContract.id, 'Approve')}>Approve</button>
                                                <button style={{ flex: 1 }} className={`${styles.btn} ${styles.btnRequest}`} onClick={() => handleAction(selectedContract.id, 'SuggestChanges')}>Suggest Changes</button>
                                                <button style={{ flex: 1 }} className={`${styles.btn} ${styles.viewBtn}`} onClick={() => handleAction(selectedContract.id, 'Comment')}>Add Comment</button>
                                            </div>
                                            <button style={{ width: '100%', marginTop: '8px' }} className={`${styles.btn} ${styles.rejectBtn}`} onClick={() => handleAction(selectedContract.id, 'Reject')}>Reject Contract</button>
                                        </div>
                                    </>
                                ) : (
                                    <div className={styles.timelineContainer}>
                                        <h4 className={styles.sectionLabel}>Activity Timeline</h4>
                                        <div className={styles.timelineList}>
                                            {timeline.length > 0 ? timeline.map((event, idx) => (
                                                <div key={event.id} className={styles.timelineItem}>
                                                    <div className={`${styles.timelineDot} ${styles['dot' + event.type]}`}></div>
                                                    {idx !== timeline.length - 1 && <div className={styles.timelineLine}></div>}
                                                    <div className={styles.timelineContent}>
                                                        <div className={styles.timelineEvent}>
                                                            <strong>{event.user}</strong> {event.action}
                                                        </div>
                                                        <div className={styles.timelineTime}>
                                                            {new Date(event.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </div>
                                                </div>
                                            )) : (
                                                <div style={{ color: 'var(--text-muted)' }}>No historical activity recorded.</div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {toast && (
                <div style={{
                    position: 'fixed', bottom: '24px', right: '24px', 
                    background: '#10b981', color: 'white', padding: '12px 24px', 
                    borderRadius: '8px', zIndex: 9999, boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    display: 'flex', alignItems: 'center', gap: '8px',
                    fontWeight: 500
                }}>
                    {toast}
                </div>
            )}
        </div>
    );
};

export default UserReviews;
