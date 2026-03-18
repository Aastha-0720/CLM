import React, { useState } from 'react';
import styles from './ReviewPage.module.css';
import { contractService } from '../services/contractService';

const LegalReview = () => {
    const [selectedContract, setSelectedContract] = useState(null);
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [comment, setComment] = useState('');
    const [editText, setEditText] = useState('');

    const defaultClauses = [
        { id: 1, title: 'Commercial Terms', content: 'The commercial terms outline the pricing, delivery schedule, and volume commitments. Pricing is fixed for 12 months subject to a 5% inflation cap.', status: 'Pending' },
        { id: 2, title: 'Payment Terms', content: 'Net 30 days upon receipt of a valid invoice. Late payments will incur a 1.5% monthly interest penalty.', status: 'Pending' },
        { id: 3, title: 'Liability & Indemnity', content: 'Liability is capped at the total contract value. Each party indemnifies the other against third-party IP infringement claims.', status: 'Pending' },
        { id: 4, title: 'Compliance Requirements', content: 'Both parties must adhere to GDPR and regional data protection laws. Annual audits may be conducted upon 30 days notice.', status: 'Pending' },
        { id: 5, title: 'Vendor Terms', content: 'Vendor must maintain insurance of at least $2M per incident. Subcontracting requires prior written approval.', status: 'Pending' }
    ];

    const [clauses, setClauses] = useState(defaultClauses);
    const [comments, setComments] = useState([]);
    const [activeClauseComments, setActiveClauseComments] = useState(null); // The clause ID currently being discussed
    const [newComment, setNewComment] = useState('');
    const [replyingTo, setReplyingTo] = useState(null); // The comment ID being replied to

    const [suggestions, setSuggestions] = useState({}); // { clauseId: 'suggested text' }
    const [isEditingClauseId, setIsEditingClauseId] = useState(null);
    const [tempSuggestText, setTempSuggestText] = useState('');

    const [timeline, setTimeline] = useState([]);
    const [activeRightTab, setActiveRightTab] = useState('Review'); // 'Review' or 'Timeline'

    const [contractRisk, setContractRisk] = useState('Medium');
    const [riskNotes, setRiskNotes] = useState('');

    const [statusFilter, setStatusFilter] = useState('All');
    const [riskFilter, setRiskFilter] = useState('All');
    const [minValue, setMinValue] = useState('');
    const [maxValue, setMaxValue] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [queueSearch, setQueueSearch] = useState('');

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await contractService.getContractsByStage('Under Review');
            setContracts(data || []);
        } catch (e) {
            console.error('Failed to load contracts', e);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        loadData();
    }, []);

    const handleAction = async (id, action) => {
        try {
            const status = action === 'Approve' ? 'Approved' : 'Rejected';
            await contractService.submitReview(id, 'Legal', status, comment || 'Action performed by Legal');
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

        // Reset clauses to pending when opening a new contract
        setClauses(defaultClauses.map(c => ({ ...c, status: 'Pending' })));
        setActiveClauseComments(null);
        setComments([]);
        setSuggestions({});
        setIsEditingClauseId(null);
        setContractRisk(contract.priority || 'Medium');
        setRiskNotes('');
        loadComments(contract.id);
    };

    const handleEnhancedAction = async (id, action) => {
        try {
            let status = '';
            let commentPrefix = '';

            switch (action) {
                case 'Approve':
                    status = 'Approved';
                    commentPrefix = 'Approved by Legal';
                    break;
                case 'Reject':
                    status = 'Rejected';
                    commentPrefix = 'Rejected by Legal';
                    break;
                case 'RequestChanges':
                    status = 'Changes Requested';
                    commentPrefix = 'Changes requested by Legal';
                    break;
                case 'Escalate':
                    await contractService.escalateContract(id, 'Legal', comment || 'High risk escalation');
                    alert('Contract escalated to senior management.');
                    setSelectedContract(null);
                    return;
                default:
                    return;
            }

            const finalComment = `[Risk: ${contractRisk}] ${commentPrefix}: ${comment || 'No additional comments.'} Notes: ${riskNotes}`;
            await contractService.submitReview(id, 'Legal', status, finalComment);

            if (action === 'RequestChanges') {
                console.log("Mock notification to Admin: Changes requested for contract", id);
            }

            await loadData();
            setSelectedContract(null);
            setComment('');
        } catch (e) {
            alert('Action failed');
        }
    };

    const setClauseRisk = (clauseId, risk) => {
        setClauses(prev => prev.map(c => {
            if (c.id === clauseId) return { ...c, risk };
            return c;
        }));
    };

    const startSuggesting = (clause) => {
        setIsEditingClauseId(clause.id);
        setTempSuggestText(suggestions[clause.id] || clause.content);
    };

    const handleSuggestChange = (clauseId) => {
        if (!tempSuggestText.trim()) return;
        setSuggestions(prev => ({ ...prev, [clauseId]: tempSuggestText }));
        setIsEditingClauseId(null);
    };

    const handleAcceptSuggestion = (clauseId) => {
        const suggestion = suggestions[clauseId];
        if (!suggestion) return;

        setClauses(prev => prev.map(c => {
            if (c.id === clauseId) {
                return { ...c, content: suggestion, status: 'Reviewed' };
            }
            return c;
        }));

        const newSuggestions = { ...suggestions };
        delete newSuggestions[clauseId];
        setSuggestions(newSuggestions);
    };

    const handleRejectSuggestion = (clauseId) => {
        const newSuggestions = { ...suggestions };
        delete newSuggestions[clauseId];
        setSuggestions(newSuggestions);
        setIsEditingClauseId(null);
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
                replyingTo
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
            setComments(prev => prev.filter(c => c.id !== id && c.parentId !== id));
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

    const toggleClauseStatus = (clauseId) => {
        setClauses(prev => prev.map(c => {
            if (c.id === clauseId) {
                return { ...c, status: c.status === 'Pending' ? 'Reviewed' : 'Pending' };
            }
            return c;
        }));
    };

    const getDeadlineInfo = (contract) => {
        // Mocking deadline logic
        const daysPending = contract.daysPending || 2;
        if (daysPending > 5) return { label: 'OVERDUE', class: styles.overdue, escalation: true };
        if (daysPending > 3) return { label: 'Approaching Deadline', class: styles.warning, escalation: false };
        return { label: 'Due in 3 days', class: styles.onTrack, escalation: false };
    };

    const filteredContracts = contracts.filter(c => {
        // Status Filter
        if (statusFilter !== 'All') {
            const daysPending = c.daysPending || 2;
            if (statusFilter === 'Overdue' && daysPending <= 5) return false;
            if (statusFilter === 'Pending' && c.status === 'Reviewed') return false;
            if (statusFilter === 'Reviewed' && c.status !== 'Reviewed') return false;
        }

        // Risk Filter
        if (riskFilter !== 'All' && (c.priority || 'Medium') !== riskFilter) return false;

        // Value Range
        if (minValue && Number(c.value) < Number(minValue)) return false;
        if (maxValue && Number(c.value) > Number(maxValue)) return false;

        // Search
        if (queueSearch) {
            const q = queueSearch.toLowerCase();
            const matches = (c.title?.toLowerCase().includes(q) || c.company?.toLowerCase().includes(q));
            if (!matches) return false;
        }

        return true;
    });

    return (
        <div className={styles.container}>
            <header className={styles.pageHeader}>
                <div className={styles.titleArea}>
                    <h2>Legal Review Queue</h2>
                    <p>Manage and verify legal compliance for active contract requests.</p>
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
                                            <button className={`${styles.btn} ${styles.approveBtn}`} onClick={() => handleAction(c.id, 'Approve')}>Approve</button>
                                            <button className={`${styles.btn} ${styles.rejectBtn}`} onClick={() => handleAction(c.id, 'Reject')}>Reject</button>
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
                    All legal reviews are cleared. Great job!
                </div>
            )}

            {/* Split Pane Review Modal */}
            {selectedContract && (
                <div className={styles.splitModalOverlay}>
                    <div className={styles.splitModalContainer}>
                        {/* Left Side: Document Viewer */}
                        <div className={styles.documentPane}>
                            <div className={styles.documentHeader}>
                                <span className={styles.documentTitle}>{selectedContract.title} - Document View</span>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button className={styles.btn} style={{ padding: '6px 12px', fontSize: '11px', background: 'var(--bg-secondary)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}>Zoom In</button>
                                    <button className={styles.btn} style={{ padding: '6px 12px', fontSize: '11px', background: 'var(--bg-secondary)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}>Zoom Out</button>
                                </div>
                            </div>
                            <div className={styles.documentViewerPlaceholder}>
                                <div className={styles.placeholderIcon}>📄</div>
                                <h4>No PDF Attached</h4>
                                <p style={{ maxWidth: '300px', textAlign: 'center', marginTop: '12px', lineHeight: '1.5' }}>
                                    PDF rendering is simulated for this demo. The contract document would normally be displayed here for comprehensive review.
                                </p>
                            </div>
                        </div>

                        {/* Right Side: Review Panel */}
                        <div className={styles.reviewPane}>
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
                                        <div className={styles.metadataGrid}>
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
                                                    {/* Simulate Due Date: Created At + 5 Days */}
                                                    {new Date((new Date(selectedContract.createdAt || Date.now()).getTime()) + (5 * 24 * 60 * 60 * 1000)).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <div className={styles.metaItem} style={{ gridColumn: 'span 2' }}>
                                                <span className={styles.metaLabel}>Current Status</span>
                                                <span className={styles.metaValue} style={{ color: 'var(--accent-teal)' }}>{selectedContract.status || selectedContract.stage}</span>
                                            </div>
                                        </div>

                                        <div className={styles.riskTaggingArea}>
                                            <span className={styles.sectionLabel}>Risk Assessment</span>
                                            <div className={styles.riskSelector}>
                                                {['Low', 'Medium', 'High'].map(r => (
                                                    <div
                                                        key={r}
                                                        className={`${styles.riskOption} ${contractRisk === r ? styles.active : ''}`}
                                                        style={{ color: r === 'Low' ? '#10b981' : r === 'Medium' ? '#f59e0b' : '#ef4444' }}
                                                        onClick={() => setContractRisk(r)}
                                                    >
                                                        {r} Risk
                                                    </div>
                                                ))}
                                            </div>
                                            <textarea
                                                className={styles.riskNotesArea}
                                                placeholder="Add risk-specific notes (e.g. why High Risk or mitigation strategy)..."
                                                value={riskNotes}
                                                onChange={(e) => setRiskNotes(e.target.value)}
                                            />
                                        </div>

                                        <div className={styles.clauseSectionContainer}>
                                            <span className={styles.sectionLabel} style={{ marginBottom: '8px', display: 'block' }}>Clause-Based Review</span>
                                            <div className={styles.clauseList}>
                                                {clauses.map(clause => (
                                                    <div
                                                        key={clause.id}
                                                        className={`
                                                    ${styles.clauseCard} 
                                                    ${suggestions[clause.id] ? styles.suggestionActive : ''}
                                                    ${clause.risk === 'High' ? styles.clauseRiskHigh : ''}
                                                    ${clause.risk === 'Medium' ? styles.clauseRiskMedium : ''}
                                                `}
                                                    >
                                                        <div className={styles.clauseHeader}>
                                                            <h4 className={styles.clauseTitle}>{clause.title}</h4>
                                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                                {clause.risk && (
                                                                    <span className={`${styles.riskBadge} ${clause.risk === 'High' ? styles.riskHigh : clause.risk === 'Medium' ? styles.riskMedium : styles.riskLow}`}>
                                                                        {clause.risk} Risk
                                                                    </span>
                                                                )}
                                                                {suggestions[clause.id] && (
                                                                    <span className={styles.clauseStatus} style={{ background: 'rgba(52, 211, 153, 0.1)', color: '#34d399' }}>
                                                                        Prop. Change
                                                                    </span>
                                                                )}
                                                                <span className={`${styles.clauseStatus} ${clause.status === 'Reviewed' ? styles.clauseReviewed : styles.clausePending}`}>
                                                                    {clause.status === 'Reviewed' ? '✓ Reviewed' : 'Pending'}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className={styles.clauseBody}>
                                                            {isEditingClauseId === clause.id ? (
                                                                <div className={styles.paneSection}>
                                                                    <textarea
                                                                        className={styles.suggestInputArea}
                                                                        value={tempSuggestText}
                                                                        onChange={(e) => setTempSuggestText(e.target.value)}
                                                                        autoFocus
                                                                    />
                                                                    <div className={styles.suggestionActions}>
                                                                        <button className={`${styles.btn} ${styles.btnAccept}`} style={{ padding: '4px 12px' }} onClick={() => handleSuggestChange(clause.id)}>Propose</button>
                                                                        <button className={`${styles.btn} ${styles.btnReject}`} style={{ padding: '4px 12px' }} onClick={() => setIsEditingClauseId(null)}>Cancel</button>
                                                                    </div>
                                                                </div>
                                                            ) : suggestions[clause.id] ? (
                                                                <div className={styles.diffContainer}>
                                                                    <div className={styles.diffSection}>
                                                                        <span className={styles.diffLabel}>Original</span>
                                                                        <span className={styles.textOriginal}>{clause.content}</span>
                                                                    </div>
                                                                    <div className={styles.diffSection}>
                                                                        <span className={styles.diffLabel}>Suggested</span>
                                                                        <span className={styles.textSuggested}>{suggestions[clause.id]}</span>
                                                                    </div>
                                                                    <div className={styles.suggestionActions}>
                                                                        <button className={`${styles.btn} ${styles.btnAccept}`} onClick={() => handleAcceptSuggestion(clause.id)}>Accept</button>
                                                                        <button className={`${styles.btn} ${styles.btnReject}`} onClick={() => handleRejectSuggestion(clause.id)}>Reject</button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                clause.content
                                                            )}
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

                                                            {!suggestions[clause.id] && isEditingClauseId !== clause.id && (
                                                                <button
                                                                    className={`${styles.actionLink} ${styles.btnSuggest}`}
                                                                    style={{ marginRight: '12px' }}
                                                                    onClick={() => startSuggesting(clause)}
                                                                >
                                                                    ✎ Suggest Change
                                                                </button>
                                                            )}

                                                            <button
                                                                className={`${styles.clauseActionBtn} ${clause.status === 'Reviewed' ? styles.btnUndo : styles.btnMark}`}
                                                                onClick={() => toggleClauseStatus(clause.id)}
                                                            >
                                                                {clause.status === 'Reviewed' ? 'Undo Review' : 'Mark as Reviewed'}
                                                            </button>
                                                        </div>

                                                        <div className={styles.riskSelector} style={{ marginTop: '12px', justifyContent: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '8px' }}>
                                                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginRight: 'auto', alignSelf: 'center' }}>Tag Clause Risk:</span>
                                                            {['Low', 'Medium', 'High'].map(r => (
                                                                <button
                                                                    key={r}
                                                                    className={`${styles.actionLink} ${clause.risk === r ? styles.active : ''}`}
                                                                    style={{ fontSize: '10px', color: clause.risk === r ? (r === 'Low' ? '#10b981' : r === 'Medium' ? '#f59e0b' : '#ef4444') : 'var(--text-muted)' }}
                                                                    onClick={() => setClauseRisk(clause.id, r)}
                                                                >
                                                                    {r}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className={styles.paneSection}>
                                            <span className={styles.sectionLabel}>Internal Comments</span>
                                            <textarea
                                                className={styles.textarea}
                                                style={{ height: '80px' }}
                                                value={comment}
                                                onChange={(e) => setComment(e.target.value)}
                                                placeholder="Add comments for the audit trail..."
                                            />
                                        </div>

                                        <div className={styles.actions} style={{ marginTop: 'auto', paddingTop: '16px', flexWrap: 'wrap', gap: '10px' }}>
                                            <button className={`${styles.btn} ${styles.approveBtn}`} onClick={() => handleEnhancedAction(selectedContract.id, 'Approve')}>Approve</button>
                                            <button className={`${styles.btn} ${styles.btnRequest}`} onClick={() => handleEnhancedAction(selectedContract.id, 'RequestChanges')}>Request Changes</button>
                                            <button className={`${styles.btn} ${styles.btnEscalate}`} onClick={() => handleEnhancedAction(selectedContract.id, 'Escalate')}>Escalate</button>
                                            <button className={`${styles.btn} ${styles.rejectBtn}`} onClick={() => handleEnhancedAction(selectedContract.id, 'Reject')}>Reject</button>
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

                                                    {/* Replies */}
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
        </div>
    );
};

export default LegalReview;
