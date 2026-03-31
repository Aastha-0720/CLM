import React, { useState, useEffect } from 'react';

const CLAUSE_DEPT_MAP = {
    Legal: ['liability', 'indemnity', 'termination', 'dispute', 'intellectual', 'governing law'],
    Finance: ['payment', 'invoice', 'penalty', 'price', 'cost', 'fee', 'financial'],
    Compliance: ['gdpr', 'regulatory', 'compliance', 'data protection', 'audit', 'privacy'],
    Procurement: ['vendor', 'supplier', 'delivery', 'sla', 'procurement', 'purchase']
};

import styles from './ReviewPage.module.css';
import { contractService } from '../services/contractService';

const LegalReview = ({ user }) => {
    const [selectedContract, setSelectedContract] = useState(null);
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [comment, setComment] = useState('');
    const [editText, setEditText] = useState('');
    const [toast, setToast] = useState(null);
    const [redlineModal, setRedlineModal] = useState(null);
    const [redlineLoading, setRedlineLoading] = useState(false);
    const [changeRequests, setChangeRequests] = useState([]);
    const [crForm, setCrForm] = useState({ description: '', clauseId: '' });
    const [crLoading, setCrLoading] = useState(false);

    const [reviewMode, setReviewMode] = useState('sequential'); // 'sequential' or 'parallel'
    
    const [escalateModal, setEscalateModal] = useState(null);
    const [escalateReason, setEscalateReason] = useState('');
    const [escalating, setEscalating] = useState(false);

    const defaultClauses = [
        { id: 1, title: 'Liability & Indemnity', content: 'Liability is capped at the total contract value.', status: 'Pending' },
        { id: 2, title: 'Commercial Terms', content: 'Standard commercial terms apply.', status: 'Pending' }
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
            
            // Console log for debugging queue visibility
            console.log("API Response (Review Queues Debug):", data.map(c => ({
                id: c.id,
                title: c.title,
                current_stage: c.stage,
                review_stages: c.review_stages
            })));
            
            const filtered = data.filter(c =>
                ['Under Review', 'Pending', 'Overdue'].includes(c.status) &&
                (
                    c.department === 'Legal' ||
                    (c.review_mode === 'parallel' && (c.review_stages || c.required_reviewers || []).includes('Legal'))
                ) &&
                c?.reviews?.Legal?.status !== 'Approved'
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
        if (contract.review_mode === 'parallel') return true;
        const stages = contract.review_stages || contract.required_reviewers || ['Legal', 'Finance', 'Compliance', 'Procurement'];
        const myIndex = stages.indexOf('Legal');
        if (myIndex <= 0) return true;
        const prevDept = stages[myIndex - 1];
        return contract?.reviews?.[prevDept]?.status === 'Approved';
    };

    const handleEscalate = async () => {
        if (!escalateReason.trim()) return;
        setEscalating(true);
        try {
            await contractService.escalateContract(
                escalateModal.id,
                user?.role || 'Legal',
                escalateReason,
                user?.name || 'Legal Counsel'
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
            setGateModal("");
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

            const finalComment = `Legal Review: ${comment}. Clauses reviewed: ${clauses.filter(c=>c.status==='Reviewed').length}/${clauses.length}`;

            await contractService.submitReview(id, 'Legal', status, finalComment);

            await fetch('/api/contracts/' + id + '/save-review-comment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    department: 'Legal',
                    comment: finalComment,
                    status,
                    reviewedBy: 'Legal Counsel'
                })
            });

            if (status === 'Approved') {
                setToast('✅ Approved and moved to the next stage');
                setTimeout(() => setToast(null), 3000);
            } else if (status === 'Rejected') {
                setToast('Contract rejected and moved to the rejected list');
                setTimeout(() => setToast(null), 3000);
            }

            setContracts(prev => prev.filter(c => c.id !== id));
            setSelectedContract(null);
            setComment('');
        } catch (e) {
            console.error('Legal review action failed', e);
            alert(e?.message || 'Action failed');
        }
    };

    
    const wordDiff = (original, revised) => {
        const origWords = (original || '').split(' ');
        const revWords = (revised || '').split(' ');
        const result = [];
        let i = 0, j = 0;
        while (i < origWords.length || j < revWords.length) {
            if (i < origWords.length && j < revWords.length && origWords[i] === revWords[j]) {
                result.push({ type: 'same', word: origWords[i] });
                i++; j++;
            } else if (j < revWords.length && (i >= origWords.length || !origWords.includes(revWords[j]))) {
                result.push({ type: 'added', word: revWords[j] });
                j++;
            } else {
                result.push({ type: 'removed', word: origWords[i] });
                i++;
            }
        }
        return result;
    };

    const handleRedline = async (clause) => {
        setRedlineLoading(true);
        try {
            const result = await contractService.redlineClause({
                clause: clause.content,
                section: clause.title,
                issue: 'Review for risk',
                company: 'Our Company',
                role: 'Buyer',
                risk_tolerance: selectedContract.risk_classification || 'Medium',
                industry: 'General'
            });
            setRedlineModal({ clause, result });
        } catch (e) {
            alert('Redline failed. Please try again.');
        } finally {
            setRedlineLoading(false);
        }
    };

    const handleAcceptRedline = () => {
        if (!redlineModal) return;
        setClauses(prev => prev.map(c =>
            c.id === redlineModal.clause.id
                ? { ...c, content: redlineModal.result.redlinedClause, status: 'Reviewed' }
                : c
        ));
        setRedlineModal(null);
    };

    const handleSaveRedlineToContract = async () => {
        handleAcceptRedline();
        const updatedClauses = clauses.map(c =>
            c.id === redlineModal?.clause.id
                ? { ...c, content: redlineModal.result.redlinedClause }
                : c
        );
        try {
            await contractService.updateContract(selectedContract.id, { clauses: updatedClauses });
            setToast('Redline saved to contract');
            setTimeout(() => setToast(null), 3000);
        } catch (e) {
            alert('Failed to save to contract');
        }
    };

    const handleCreateCR = async () => {
        if (!crForm.description.trim()) return;
        setCrLoading(true);
        try {
            const newCR = await contractService.createChangeRequest(selectedContract.id, {
                department: 'Legal',
                requestedBy: user?.name || 'Admin',
                clauseId: crForm.clauseId || null,
                description: crForm.description
            });
            setChangeRequests(prev => [...prev, newCR]);
            setCrForm({ description: '', clauseId: '' });
        } catch (e) {
            alert('Failed to create change request');
        } finally {
            setCrLoading(false);
        }
    };

    const handleUpdateCR = async (crId, status) => {
        const resolution = status === 'Resolved' ? 'Resolved by reviewer' : 'Rejected by reviewer';
        try {
            const updated = await contractService.updateChangeRequest(crId, { status, resolution });
            setChangeRequests(prev => prev.map(cr => cr._id === crId || cr.id === crId ? updated : cr));
        } catch (e) {
            alert('Failed to update change request');
        }
    };
const openReview = async (contract) => {
        setSelectedContract(contract);
        setEditText(contract.extractedText || 'Full contract text not available.');
        
        // Load real clauses filtered using dynamic map logic
        const contractClauses = contract.clauses || [];
        const deptClauses = contractClauses.filter(c => {
            const text = ((c.title || '') + ' ' + (c.content || '')).toLowerCase();
            return CLAUSE_DEPT_MAP['Legal'].some(kw => text.includes(kw));
        });
        
        if (deptClauses.length > 0) {
            const combinedContent = deptClauses.map(c => `[${c.type || 'Clause'}] ${c.text}`).join('\n\n');
            setClauses([{ 
                id: 'legal-combined', 
                title: 'Legal Provisions Summary', 
                content: combinedContent, 
                status: 'Pending' 
            }]);
        } else {
            setClauses([]);
        }

        setActiveClauseComments(null);
        setComments([]);
        loadComments(contract.id);
        const crs = await contractService.fetchChangeRequests(contract.id);
        setChangeRequests(crs || []);
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
                'Legal',
                'Legal Counsel'
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
        const reviewStages = contract?.review_stages || contract?.required_reviewers || ['Legal', 'Finance', 'Compliance', 'Procurement'];
        const steps = reviewStages.map(dept => ({
            name: dept,
            approved: contract?.reviews?.[dept]?.status === 'Approved'
        }));
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
                     <h2>Legal Review Queue</h2>
                     <p>Manage and verify Legal terms for active contract requests.</p>
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
                    All reviews completed. The queue is empty.
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
                                        <button
                                            className={`${styles.tabBtn} ${activeRightTab === 'ChangeRequests' ? styles.activeTab : ''}`}
                                            onClick={() => setActiveRightTab('ChangeRequests')}
                                        >
                                            Change Requests
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
<div style={{ marginBottom: '16px', marginTop: '16px', padding: '12px', background: 'var(--color-background-secondary)', borderRadius: '8px', border: '0.5px solid var(--color-border-tertiary)' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div style={{ fontSize: '12px', fontWeight: '500', color: 'var(--color-text-secondary)' }}>Review assignment</div>
        {selectedContract && (
            <span style={{
                padding: '3px 10px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '500',
                background: selectedContract.review_mode === 'parallel' ? '#EEEDFE' : '#E1F5EE',
                color: selectedContract.review_mode === 'parallel' ? '#534AB7' : '#0F6E56'
            }}>
                {selectedContract.review_mode === 'parallel' ? 'Parallel Review' : 'Sequential Review'}
            </span>
        )}
    </div>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
        {(selectedContract.review_stages || ['Legal','Finance','Compliance','Procurement']).map(dept => (
            <span key={dept} style={{
                padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '500',
                background: 'var(--color-background-info)', color: 'var(--color-text-info)'
            }}>{dept}</span>
        ))}
    </div>
    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
        {(selectedContract.clauses || [])
            .filter(cl => {
                const text = (cl.title + ' ' + cl.content).toLowerCase();
                return CLAUSE_DEPT_MAP['Legal'].some(kw => text.includes(kw));
            })
            .map(cl => (
                <div key={cl.id} style={{ marginTop: '4px' }}>
                    • <strong>{cl.title}</strong> triggered this review
                </div>
            ))
        }
        {(selectedContract.clauses || []).filter(cl => {
            const text = (cl.title + ' ' + cl.content).toLowerCase();
            return CLAUSE_DEPT_MAP['Legal'].some(kw => text.includes(kw));
        }).length === 0 && (
            <div style={{ color: 'var(--color-text-tertiary)' }}>All-department review (no specific clause match)</div>
        )}
    </div>
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
                                                <span className={styles.metaLabel}>Department</span>
                                                <span className={styles.metaValue}>{selectedContract.review_stages?.[0] || selectedContract.department}</span>
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

                                        {(selectedContract.internalNotes || selectedContract.routingNotes) && (
                                            <div style={{ marginTop: '12px', marginBottom: '16px', padding: '12px 14px', borderRadius: '10px', background: 'rgba(0, 201, 177, 0.08)', border: '1px solid rgba(0, 201, 177, 0.18)' }}>
                                                <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#00C9B1', marginBottom: '6px' }}>
                                                    Additional Notes
                                                </div>
                                                <div style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                                                    {selectedContract.internalNotes || selectedContract.routingNotes}
                                                </div>
                                            </div>
                                        )}
                                        
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

                                                            <div className={styles.clauseBody} style={{ whiteSpace: 'pre-wrap' }}>
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
                                ) : activeRightTab === 'Timeline' ? (
                                    <div className={styles.timelineContainer}>
                                        <h4 className={styles.sectionLabel}>Activity Timeline</h4>
                                        <div className={styles.timelineList}>
                                            {timeline.map((event, idx) => {
                                                let dotType = 'review';
                                                if (event.eventType === 'CREATED' || event.action?.includes('created') || event.action?.includes('saved')) dotType = 'create';
                                                if (event.eventType === 'UPDATED' || event.action?.includes('updated')) dotType = 'edit';
                                                
                                                return (
                                                    <div key={event.id || idx} className={styles.timelineItem}>
                                                        <div className={`${styles.timelineDot} ${styles['dot' + dotType]}`}></div>
                                                        {idx !== timeline.length - 1 && <div className={styles.timelineLine}></div>}
                                                        <div className={styles.timelineContent}>
                                                            <div className={styles.timelineEvent}>
                                                                <strong>{event.actor || event.userName || 'System'}</strong> {event.message || event.action}
                                                            </div>
                                                            {(event.details || event.notes || (event.metadata && Array.isArray(event.metadata.steps) && event.metadata.steps.length > 0)) && (
                                                                <div style={{ marginTop: '6px', color: 'var(--text-secondary)', fontSize: '12px', lineHeight: 1.5 }}>
                                                                    {event.details}
                                                                    {event.metadata && Array.isArray(event.metadata.steps) && event.metadata.steps.length > 0 && (
                                                                        <div style={{ marginTop: event.details ? '6px' : 0 }}>
                                                                            <strong>Steps:</strong> {event.metadata.steps.join(', ')}
                                                                        </div>
                                                                    )}
                                                                    {event.notes && (
                                                                        <div style={{ marginTop: event.details ? '6px' : 0 }}>
                                                                            <strong>Notes:</strong> {event.notes}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                            <div className={styles.timelineTime}>
                                                                {new Date(event.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <div style={{ marginBottom: '14px' }}>
                                            <textarea
                                                placeholder="Describe the change needed..."
                                                value={crForm.description}
                                                onChange={e => setCrForm(prev => ({ ...prev, description: e.target.value }))}
                                                rows={3}
                                                style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '0.5px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', fontSize: '13px', resize: 'vertical', boxSizing: 'border-box' }}
                                            />
                                            <select
                                                value={crForm.clauseId}
                                                onChange={e => setCrForm(prev => ({ ...prev, clauseId: e.target.value }))}
                                                style={{ width: '100%', marginTop: '6px', padding: '7px', borderRadius: '8px', border: '0.5px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', fontSize: '13px' }}>
                                                <option value="">No specific clause</option>
                                                {clauses.map(cl => <option key={cl.id} value={cl.id}>{cl.title}</option>)}
                                            </select>
                                            <button
                                                onClick={handleCreateCR}
                                                disabled={crLoading || !crForm.description.trim()}
                                                style={{ marginTop: '8px', width: '100%', padding: '8px', borderRadius: '8px', background: 'var(--accent-teal)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: '500', fontSize: '13px' }}>
                                                {crLoading ? 'Submitting...' : 'Raise change request'}
                                            </button>
                                        </div>

                                        {changeRequests.length === 0 ? (
                                            <div style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>No change requests yet</div>
                                        ) : (
                                            changeRequests.map(cr => (
                                                <div key={cr._id || cr.id} style={{ padding: '10px', marginBottom: '8px', borderRadius: '8px', border: '0.5px solid var(--border-color)', background: 'rgba(255,255,255,0.02)' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                        <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>{cr.department}</span>
                                                        <span style={{
                                                            fontSize: '11px', padding: '2px 8px', borderRadius: '12px', fontWeight: '500',
                                                            background: cr.status === 'Open' ? '#FAEEDA' : cr.status === 'Resolved' ? '#EAF3DE' : '#FCEBEB',
                                                            color: cr.status === 'Open' ? '#854F0B' : cr.status === 'Resolved' ? '#3B6D11' : '#A32D2D'
                                                        }}>{cr.status}</span>
                                                    </div>
                                                    <div style={{ fontSize: '13px', color: 'var(--text-primary)', marginBottom: '6px' }}>{cr.description}</div>
                                                    {cr.resolution && <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>Resolution: {cr.resolution}</div>}
                                                    {cr.status === 'Open' && cr.department === 'Legal' && (
                                                        <div style={{ display: 'flex', gap: '6px' }}>
                                                            <button onClick={() => handleUpdateCR(cr._id || cr.id, 'Resolved')} style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '6px', background: '#10b981', color: '#fff', border: 'none', cursor: 'pointer' }}>Resolve</button>
                                                            <button onClick={() => handleUpdateCR(cr._id || cr.id, 'Rejected')} style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '6px', background: '#dc2626', color: '#fff', border: 'none', cursor: 'pointer' }}>Reject</button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        )}
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

            {redlineModal && (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
        <div style={{ background: 'var(--bg-card)', borderRadius: '12px', padding: '24px', width: '560px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span style={{ fontWeight: '600', fontSize: '16px', color: 'var(--text-primary)' }}>Redline: {redlineModal.clause.title}</span>
                <button onClick={() => setRedlineModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: 'var(--text-muted)' }}>×</button>
            </div>

            <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '8px' }}>Comparison</div>
            <div style={{ fontSize: '14px', lineHeight: '1.6', padding: '12px', background: 'var(--bg-input)', borderRadius: '8px', marginBottom: '16px', color: 'var(--text-primary)' }}>
                {wordDiff(redlineModal.clause.content, redlineModal.result.redlinedClause || '').map((token, i) => (
                    <span key={i} style={{
                        background: token.type === 'added' ? 'rgba(16, 185, 129, 0.2)' : token.type === 'removed' ? 'rgba(220, 38, 38, 0.2)' : 'transparent',
                        textDecoration: token.type === 'removed' ? 'line-through' : 'none',
                        color: token.type === 'added' ? '#10b981' : token.type === 'removed' ? '#f87171' : 'inherit',
                        marginRight: '4px'
                    }}>{token.word}</span>
                ))}
            </div>

            {redlineModal.result.issues?.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '8px' }}>Issues found</div>
                    {redlineModal.result.issues.map((issue, i) => (
                        <div key={i} style={{ fontSize: '13px', padding: '4px 0', color: 'var(--text-primary)' }}>• {issue.problem || issue}</div>
                    ))}
                </div>
            )}

            {redlineModal.result.justification && (
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
                    <strong>Justification:</strong> {redlineModal.result.justification}
                </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={handleAcceptRedline} style={{ flex: 1, padding: '10px', borderRadius: '8px', background: '#f59e0b', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: '500', fontSize: '14px' }}>
                    Accept Redline
                </button>
                <button onClick={handleSaveRedlineToContract} style={{ flex: 1, padding: '10px', borderRadius: '8px', background: '#10b981', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: '500', fontSize: '14px' }}>
                    Save to Contract
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

export default LegalReview;
