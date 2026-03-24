import React, { useState, useEffect } from 'react';
import styles from './ReviewPage.module.css';
import { contractService } from '../services/contractService';

const ComplianceReview = ({ user }) => {
    const [selectedContract, setSelectedContract] = useState(null);
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [comment, setComment] = useState('');
    const [editText, setEditText] = useState('');
    const [toast, setToast] = useState(null);
    const [reviewMode, setReviewMode] = useState('sequential'); // 'sequential' or 'parallel'

    const [escalateModal, setEscalateModal] = useState(null);
    const [escalateReason, setEscalateReason] = useState('');
    const [escalating, setEscalating] = useState(false);

    const defaultClauses = [
        { id: 1, title: 'Compliance Requirements', content: 'Both parties must adhere to GDPR and data protection laws.', status: 'Pending' }
    ];

    const [clauses, setClauses] = useState(defaultClauses);
    const [comments, setComments] = useState([]);
    const [activeClauseComments, setActiveClauseComments] = useState(null);
    const [newComment, setNewComment] = useState('');
    const [replyingTo, setReplyingTo] = useState(null);

    const [timeline, setTimeline] = useState([]);
    const [activeRightTab, setActiveRightTab] = useState('Review');

    const [statusFilter, setStatusFilter] = useState('All');
    const [riskFilter, setRiskFilter] = useState('All');
    const [minValue, setMinValue] = useState('');
    const [maxValue, setMaxValue] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [queueSearch, setQueueSearch] = useState('');

    const [aiLoading, setAiLoading] = useState(false);
    const [gateModal, setGateModal] = useState(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await contractService.getAllContracts();
            const filtered = data.filter(c => 
                (c.stage === 'Compliance Review') ||
                (c.stage === 'Under Review' && (c.review_mode === 'parallel' || reviewMode === 'parallel'))
            );
            setContracts(filtered || []);
        } catch (e) {
            console.error('Failed to load contracts', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const isPrevApproved = (contract) => {
        if (!contract) return false;
        if (contract.review_mode === 'parallel' || reviewMode === 'parallel') return true;
        return contract?.reviews?.Finance?.status === 'Approved';
    };

    const handleEscalate = async () => {
        if (!escalateReason.trim()) return;
        setEscalating(true);
        try {
            await contractService.escalateContract(
                escalateModal.id,
                user?.role || 'Compliance',
                escalateReason,
                user?.name || 'Compliance Officer'
            );
            setToast('Contract escalated to Manager');
            setTimeout(() => setToast(null), 3000);
            setEscalateModal(null);
            setEscalateReason('');
            await loadData();
        } catch(e) {
            alert('Escalation failed');
        } finally {
            setEscalating(false);
        }
    };

    const handleAction = async (id, action) => {
        const contract = contracts.find(c => c.id === id);
        if (!isPrevApproved(contract)) {
            setGateModal("Finance department has not yet approved this contract. You can add comments and review clauses, but cannot approve or reject until Finance completes their review.");
            return;
        }
        try {
            let status = '';
            switch (action) {
                case 'Approve': status = 'Approved'; break;
                case 'Reject': status = 'Rejected'; break;
                case 'RequestChanges': status = 'Changes Requested'; break;
                default: return;
            }

            const finalComment = `Compliance Review: ${comment}`;

            await contractService.submitReview(id, 'Compliance', status, finalComment);

            await fetch('/api/contracts/' + id + '/save-review-comment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    department: 'Compliance',
                    comment: finalComment,
                    reviewedBy: 'Compliance Team'
                })
            });

            if (status === 'Approved') {
                setToast('✅ Approved! Moved to Procurement Review');
                setTimeout(() => setToast(null), 3000);
            }

            await loadData();
            setSelectedContract(null);
            setComment('');
        } catch (e) {
            alert('Action failed');
        }
    };

    const openReview = (contract) => {
        if (!isPrevApproved(contract)) {
            setGateModal("Finance department has not yet approved this contract. You can add comments and review clauses, but cannot approve or reject until Finance completes their review.");
            return;
        }
        setSelectedContract(contract);
        setEditText(contract.extractedText || 'Contract text not available for editing in this mock.');
        
        // Load real clauses filtered by department
        const contractClauses = contract.clauses || [];
        const deptClauses = contractClauses.filter(c => c.department === 'Compliance');
        
        if (deptClauses.length > 0) {
            setClauses(deptClauses.map(c => ({ 
                id: c.id || Math.random().toString(), 
                title: c.type || 'Clause', 
                content: c.text, 
                status: 'Pending' 
            })));
        } else {
            setClauses([]);
        }

        setActiveClauseComments(null);
        setComments([]);
        loadComments(contract.id);
    };

    const loadComments = async (contractId) => {
        try {
            const data = await contractService.getComments(contractId);
            setComments(data || []);
        } catch (e) {
            console.error("Failed to load comments", e);
        }
    };

    const handleAddComment = async () => {
        if (!newComment.trim() || !selectedContract || !activeClauseComments) return;
        try {
            const added = await contractService.addComment(
                selectedContract.id,
                activeClauseComments,
                newComment,
                'Compliance',
                'Compliance Officer'
            );
            setComments(prev => [...prev, added]);
            setNewComment('');
            setReplyingTo(null);
        } catch (e) {
            alert("Failed to add comment");
        }
    };

    const handleDeleteComment = async (id) => {
        try {
            await contractService.deleteComment(id);
            setComments(prev => prev.filter(c => c.id !== id && c._id !== id));
        } catch (e) {
            alert("Failed to delete comment");
        }
    };

    const loadTimeline = async (contractId) => {
        try {
            const data = await contractService.getActivityTimeline(contractId);
            setTimeline(data || []);
        } catch (e) {
            console.error("Failed to load timeline", e);
        }
    };

    // Removed mock loadAIClauses since we use real db clauses now

    const toggleClauseStatus = (clauseId) => {
        setClauses(prev => prev.map(c => {
            if (c.id === clauseId) {
                return { ...c, status: c.status === 'Pending' ? 'Reviewed' : 'Pending' };
            }
            return c;
        }));
    };

    const getDeadlineInfo = (contract) => {
        const created = contract.createdAt ? new Date(contract.createdAt) : new Date();
        const daysPending = Math.floor((Date.now() - created.getTime()) / (1000 * 60 * 60 * 24));
        if (daysPending > 5) return { label: 'OVERDUE', class: styles.overdue, escalation: true };
        if (daysPending > 3) return { label: 'Approaching Deadline', class: styles.warning, escalation: false };
        return { label: 'Due in 3 days', class: styles.onTrack, escalation: false };
    };

    const filteredContracts = contracts.filter(c => {
        if (statusFilter !== 'All') {
            const created = c.createdAt ? new Date(c.createdAt) : new Date();
            const daysPending = Math.floor((Date.now() - created.getTime()) / (1000 * 60 * 60 * 24));
            if (statusFilter === 'Overdue' && daysPending <= 5) return false;
            if (statusFilter === 'Pending' && c.status === 'Reviewed') return false;
            if (statusFilter === 'Reviewed' && c.status !== 'Reviewed') return false;
        }
        if (riskFilter !== 'All' && (c.priority || 'Medium') !== riskFilter) return false;
        if (minValue && Number(c.value) < Number(minValue)) return false;
        if (maxValue && Number(c.value) > Number(maxValue)) return false;
        if (queueSearch) {
            const q = queueSearch.toLowerCase();
            const matches = (c.title?.toLowerCase().includes(q) || c.company?.toLowerCase().includes(q));
            if (!matches) return false;
        }
        return true;
    });

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
                     <h2>Compliance Review Queue</h2>
                     <p>Manage and verify Compliance terms for active contract requests.</p>
                 </div>
            </header>

            {loading ? (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>Loading queue...</div>
            ) : (
                <>
                    <div className={styles.filterSection}>
                        <div className={`${styles.filterGroup} ${styles.searchGroup}`}>
                            <label className={styles.filterLabel}>Search Contracts</label>
                            <div className={styles.searchInputWrapper}>
                                <span className={styles.searchIconLeft}>🔍</span>
                                <input
                                    type="text"
                                    className={`${styles.filterInput} ${styles.searchInput}`}
                                    placeholder="Search by name or company..."
                                    value={queueSearch}
                                    onChange={(e) => setQueueSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className={styles.filterGroup}>
                            <label className={styles.filterLabel}>Review Mode</label>
                            <select
                                className={styles.filterSelect}
                                value={reviewMode}
                                onChange={(e) => setReviewMode(e.target.value)}
                                style={{ fontWeight: '600', color: reviewMode === 'parallel' ? '#8b5cf6' : '#00C9B1' }}
                            >
                                <option value="sequential">Sequential Workflow</option>
                                <option value="parallel">Parallel Workflow</option>
                            </select>
                        </div>

                        <div className={styles.filterGroup}>
                            <label className={styles.filterLabel}>Status</label>
                            <select
                                className={styles.filterSelect}
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="All">All Status</option>
                                <option value="Pending">Pending</option>
                                <option value="Reviewed">Reviewed</option>
                                <option value="Overdue">Overdue</option>
                            </select>
                        </div>

                        <div className={styles.filterGroup}>
                            <label className={styles.filterLabel}>Risk Level</label>
                            <select
                                className={styles.filterSelect}
                                value={riskFilter}
                                onChange={(e) => setRiskFilter(e.target.value)}
                            >
                                <option value="All">All Risks</option>
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                            </select>
                        </div>

                        <div className={styles.filterGroup}>
                            <label className={styles.filterLabel}>Value Range ($)</label>
                            <div className={styles.rangeInputGroup}>
                                <input
                                    type="number"
                                    className={`${styles.filterInput} ${styles.rangeInput}`}
                                    placeholder="Min"
                                    value={minValue}
                                    onChange={(e) => setMinValue(e.target.value)}
                                />
                                <span style={{ color: 'var(--text-muted)' }}>-</span>
                                <input
                                    type="number"
                                    className={`${styles.filterInput} ${styles.rangeInput}`}
                                    placeholder="Max"
                                    value={maxValue}
                                    onChange={(e) => setMaxValue(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className={styles.filterGroup}>
                            <label className={styles.filterLabel}>Due Date</label>
                            <input
                                type="date"
                                className={styles.filterInput}
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className={styles.reviewGrid}>
                        {filteredContracts.map((c) => {
                            const deadline = getDeadlineInfo(c);
                            return (
                                <div key={c.id} className={styles.contractCard}>
                                    <div className={styles.cardHeader}>
                                        <div className={styles.titleGroup}>
                                            <h3>{c.title} {!isPrevApproved(c) && <span style={{marginLeft: '8px'}} title="Previous department approval pending">🔒</span>}</h3>
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
                                            <span className={styles.value}>#{String(c.id).slice(-8).toUpperCase()}</span>
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
                                                OVERDUE —
                                                {c.escalated
                                                    ? <span style={{color:'#f87171', marginLeft:'6px'}}>Already Escalated</span>
                                                    : <button
                                                        className={styles.btn}
                                                        style={{marginLeft:'8px', background:'#dc2626', color:'#fff', padding:'2px 10px', fontSize:'12px'}}
                                                        onClick={() => setEscalateModal(c)}
                                                      >Escalate</button>
                                                }
                                            </div>
                                        )}
                                        <div className={styles.actions}>
                                            <button className={`${styles.btn} ${!isPrevApproved(c) ? styles.btnGated : styles.viewBtn}`} onClick={() => openReview(c)}>
                                                <span>🔍</span> View & Review
                                            </button>
                                            <button className={`${styles.btn} ${!isPrevApproved(c) ? styles.btnGated : styles.approveBtn}`} onClick={() => handleAction(c.id, 'Approve')}>Approve</button>
                                            <button className={`${styles.btn} ${!isPrevApproved(c) ? styles.btnGated : styles.rejectBtn}`} onClick={() => handleAction(c.id, 'Reject')}>Reject</button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {filteredContracts.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                            No contracts match your current filters.
                        </div>
                    )}
                </>
            )}

            {contracts.length === 0 && !loading && (
                <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                    All reviews are cleared. Great job!
                </div>
            )}

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

            {/* Split Pane Review Modal */}
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
                                        <div className={styles.metadataGrid} style={{ borderLeft: '3px solid #00C9B1', paddingLeft: '12px' }}>
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
                                            <div className={styles.metaItem}>
                                                <span className={styles.metaLabel}>Submission Date</span>
                                                <span className={styles.metaValue}>{new Date(selectedContract.createdAt || Date.now()).toLocaleDateString()}</span>
                                            </div>
                                            <div className={styles.metaItem}>
                                                <span className={styles.metaLabel}>Due Date</span>
                                                <span className={styles.metaValue}>
                                                    {new Date((new Date(selectedContract.createdAt || Date.now()).getTime()) + (5 * 24 * 60 * 60 * 1000)).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <div className={styles.metaItem} style={{ gridColumn: 'span 2' }}>
                                                <span className={styles.metaLabel}>Current Status</span>
                                                <span className={styles.metaValue} style={{ color: 'var(--accent-teal)' }}>{selectedContract.status || selectedContract.stage}</span>
                                            </div>
                                        </div>
                                        
                                        <div style={{ fontSize: '12px', color: '#00C9B1', marginTop: '12px', marginBottom: '16px', fontWeight: 600 }}>
                                            {clauses.filter(c => c.status === 'Reviewed').length} of {clauses.length} clauses reviewed
                                        </div>

                                        <div className={styles.clauseSectionContainer}>
                                            <span className={styles.sectionLabel} style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '16px', display: 'block' }}>Clause-Based Review</span>
                                            {aiLoading && (
                                                <div style={{ padding: '12px', color: '#00C9B1', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div style={{ width: '14px', height: '14px', border: '2px solid #00C9B1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
                                                    AI analyzing contract clauses...
                                                </div>
                                            )}
                                            <div className={styles.clauseList}>
                                                {clauses.length === 0 ? (
                                                    <div style={{ textAlign: 'center', padding: '30px 20px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                                                        <div style={{ fontSize: '24px', marginBottom: '8px' }}>📄</div>
                                                        <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>No clauses found for this department.</div>
                                                    </div>
                                                ) : (
                                                    clauses.map(clause => (
                                                        <div key={clause.id} className={styles.clauseCard} style={{ marginBottom: '12px', padding: '16px' }}>
                                                            <div className={styles.clauseHeader}>
                                                                <h4 className={styles.clauseTitle}>{clause.title}</h4>
                                                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                                    <span className={`${styles.clauseStatus} ${clause.status === 'Reviewed' ? styles.clauseReviewed : styles.clausePending}`}>
                                                                        {clause.status === 'Reviewed' ? '✓ Reviewed' : 'Pending'}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            <div className={styles.clauseBody}>
                                                                {clause.content}
                                                            </div>

                                                            <div className={styles.clauseFooter}>
                                                                <button
                                                                    className={styles.actionLink}
                                                                    style={{ marginRight: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}
                                                                    onClick={() => setActiveClauseComments(clause.id)}
                                                                >
                                                                    <span>💬</span> Comments
                                                                    <span className={styles.commentCount}>
                                                                        {comments.filter(c => c.clauseId === clause.id).length}
                                                                    </span>
                                                                </button>

                                                                <button
                                                                    className={`${styles.clauseActionBtn} ${clause.status === 'Reviewed' ? styles.btnUndo : styles.btnMark}`}
                                                                    onClick={() => toggleClauseStatus(clause.id)}
                                                                >
                                                                    {clause.status === 'Reviewed' ? 'Undo Review' : 'Mark as Reviewed'}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>


                                        <div className={styles.paneSection} style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                                            <span className={styles.sectionLabel}>Internal Comments</span>
                                            <textarea
                                                className={styles.textarea}
                                                style={{ height: '80px' }}
                                                value={comment}
                                                onChange={(e) => setComment(e.target.value)}
                                                placeholder="Add comments for the audit trail..."
                                            />
                                        </div>

                                        <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                <button style={{ flex: 1 }} className={`${styles.btn} ${!isPrevApproved(selectedContract) ? styles.btnGated : styles.approveBtn}`} onClick={() => handleAction(selectedContract.id, 'Approve')}>Approve Contract</button>
                                                <button style={{ flex: 1 }} className={`${styles.btn} ${!isPrevApproved(selectedContract) ? styles.btnGated : styles.btnRequest}`} onClick={() => handleAction(selectedContract.id, 'RequestChanges')}>Request Changes</button>
                                            </div>
                                            <button style={{ width: '100%', marginTop: '8px' }} className={`${styles.btn} ${!isPrevApproved(selectedContract) ? styles.btnGated : styles.rejectBtn}`} onClick={() => handleAction(selectedContract.id, 'Reject')}>Reject / Change</button>
                                        </div>
                                    </>
                                ) : (
                                    <div className={styles.timelineContainer}>
                                        <h4 className={styles.sectionLabel}>Activity Timeline</h4>
                                        <div className={styles.timelineList}>
                                            {timeline.map((event, idx) => (
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
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Discussion / Comments Pane */}
                        {activeClauseComments && (
                            <div className={styles.commentsPane}>
                                <div className={styles.commentsHeader}>
                                    <h4>
                                        Discussion: {clauses.find(c => c.id === activeClauseComments)?.title}
                                    </h4>
                                    <button className={styles.closeModalBtn} onClick={() => setActiveClauseComments(null)}>×</button>
                                </div>

                                <div className={styles.commentsBody}>
                                    {comments.filter(c => c.clauseId === activeClauseComments && !c.parentId).length === 0 ? (
                                        <div className={styles.emptyComments}>
                                            <span className={styles.emptyIcon}>💬</span>
                                            <p>No comments yet for this clause.<br />Start the discussion below.</p>
                                        </div>
                                    ) : (
                                        comments
                                            .filter(c => c.clauseId === activeClauseComments && !c.parentId)
                                            .map(parent => (
                                                <div key={parent.id} className={styles.commentThread}>
                                                    <div className={styles.commentBubble}>
                                                        <div className={styles.commentMeta}>
                                                            <span className={styles.commentAuthor}>{parent.author}</span>
                                                            <span className={styles.commentTime}>{new Date(parent.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                        </div>
                                                        <div className={styles.commentText}>{parent.text}</div>
                                                        <div className={styles.commentActions}>
                                                            <button className={styles.actionLink} onClick={() => setReplyingTo(parent.id)}>Reply</button>
                                                            {parent.author.includes("(You)") && (
                                                                <button className={`${styles.actionLink} ${styles.deleteLink}`} onClick={() => handleDeleteComment(parent.id)}>Delete</button>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {comments.filter(r => r.parentId === parent.id).map(reply => (
                                                        <div key={reply.id} className={`${styles.commentBubble} ${styles.replyBubble}`}>
                                                            <div className={styles.commentMeta}>
                                                                <span className={styles.commentAuthor}>{reply.author}</span>
                                                                <span className={styles.commentTime}>{new Date(reply.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                            </div>
                                                            <div className={styles.commentText}>{reply.text}</div>
                                                            <div className={styles.commentActions}>
                                                                {reply.author.includes("(You)") && (
                                                                    <button className={`${styles.actionLink} ${styles.deleteLink}`} onClick={() => handleDeleteComment(reply.id)}>Delete</button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ))
                                    )}
                                </div>

                                <div className={styles.commentInput}>
                                    <div className={styles.inputGroup}>
                                        {replyingTo && (
                                            <div className={styles.replyingTo}>
                                                Replying to {comments.find(c => c.id === replyingTo)?.author}
                                                <button className={styles.actionLink} onClick={() => setReplyingTo(null)}>Cancel</button>
                                            </div>
                                        )}
                                        <textarea
                                            className={styles.miniTextarea}
                                            placeholder="Write a comment..."
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                        />
                                        <button
                                            className={styles.submitCommentBtn}
                                            disabled={!newComment.trim()}
                                            onClick={handleAddComment}
                                        >
                                            {replyingTo ? 'Post Reply' : 'Send'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {escalateModal && (
                <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',
                             display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}>
                    <div style={{background:'var(--bg-card)',borderRadius:'12px',
                                 padding:'28px',width:'420px',boxShadow:'0 20px 60px rgba(0,0,0,0.4)'}}>
                        <h3 style={{marginBottom:'8px',color:'var(--text-primary)'}}>
                            Escalate Contract
                        </h3>
                        <p style={{color:'var(--text-muted)',fontSize:'13px',marginBottom:'16px'}}>
                            "{escalateModal.title}" will be escalated to Manager & CEO
                        </p>
                        <textarea
                            value={escalateReason}
                            onChange={e => setEscalateReason(e.target.value)}
                            placeholder="Reason for escalation..."
                            rows={4}
                            style={{width:'100%',padding:'10px',borderRadius:'8px',
                                    border:'1px solid var(--border)',background:'var(--bg-input)',
                                    color:'var(--text-primary)',fontSize:'14px',resize:'vertical'}}
                        />
                        <div style={{display:'flex',gap:'10px',marginTop:'16px',justifyContent:'flex-end'}}>
                            <button
                                onClick={() => { setEscalateModal(null); setEscalateReason(''); }}
                                style={{padding:'8px 16px',borderRadius:'8px',border:'1px solid var(--border)',
                                        background:'transparent',color:'var(--text-muted)',cursor:'pointer'}}
                            >Cancel</button>
                            <button
                                onClick={handleEscalate}
                                disabled={escalating || !escalateReason.trim()}
                                style={{padding:'8px 16px',borderRadius:'8px',border:'none',
                                        background:'#dc2626',color:'#fff',cursor:'pointer',
                                        opacity: escalating ? 0.7 : 1}}
                            >
                                {escalating ? 'Escalating...' : 'Confirm Escalate'}
                            </button>
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

export default ComplianceReview;
