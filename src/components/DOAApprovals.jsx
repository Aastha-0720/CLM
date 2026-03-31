import React, { useState } from 'react';
import { Hourglass, CheckCircle, Flag, CircleDollarSign } from 'lucide-react';
import styles from './DOAApprovals.module.css';

// Removed static doaKpis and pendingApprovals arrays

const doaMatrix = [
    { range: '$0 - $10k', bu: 'All', approver: 'Manager', level: 'L1', max: '$10,000', status: 'Active' },
    { range: '$10k - $50k', bu: 'All', approver: 'Director', level: 'L2', max: '$50,000', status: 'Active' },
    { range: '$50k+', bu: 'Global', approver: 'VP', level: 'L3', max: 'Unlimited', status: 'Active' },
];

const DOAApprovals = ({ user, onNavigate }) => {
    const [approvals, setApprovals] = useState([]);
    const [selectedReq, setSelectedReq] = useState(null);
    const [comment, setComment] = useState('');
    const [toast, setToast] = useState(null);
    const [kpis, setKpis] = useState({
        pending: 0,
        approvedThisMonth: 0,
        escalated: 0,
        avgValue: 0
    });

    const loadData = async () => {
        try {
            const { contractService } = await import('../services/contractService');
            const allContracts = await contractService.getAllContracts();

            // Show contracts in CAS Generated stage — these need DOA approval
            const pending = allContracts.filter(c =>
                c.stage === 'CAS Generated' ||
                c.stage === 'DOA Approval' ||
                c.stage === 'Pending Approval' ||
                c.stage === 'DOA Approved' ||
                c.status === 'Approved' ||
                c.status === 'Completed'
            );

            // Role based filtering
            let filtered = pending;
            if (user?.role === 'Manager') {
                filtered = pending.filter(c => (c.value || 0) <= 10000);
            } else if (user?.role === 'Director') {
                filtered = pending.filter(c => c.value >= 10000 && c.value <= 50000);
            } else if (user?.role === 'CEO') {
                filtered = pending.filter(c => c.value > 50000);
            }
            // Admin sees all

            setApprovals(filtered);

            // Fix KPI cards
            const approved = allContracts.filter(c => c.status === 'Approved');
            const thisMonth = approved.filter(c => {
                const d = new Date(c.createdAt);
                const now = new Date();
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            });
            const avgValue = filtered.length > 0
                ? filtered.reduce((sum, c) => sum + (c.value || 0), 0) / filtered.length
                : 0;

            setKpis({
                pending: filtered.length,
                approvedThisMonth: thisMonth.length,
                escalated: filtered.filter(c => {
                    const days = (new Date() - new Date(c.createdAt)) / (1000*60*60*24);
                    return days > 7;
                }).length,
                avgValue: avgValue
            });

            if (filtered.length > 0 && !selectedReq) {
                setSelectedReq(filtered[0]);
            } else if (filtered.length === 0) {
                setSelectedReq(null);
            }
        } catch (err) {
            console.error(err);
        }
    };

    React.useEffect(() => {
        loadData();
    }, [user]);

    const canUserApproveContract = (contract) => {
        const role = user?.role;
        const val = contract?.value || 0;
        if (role === 'Admin') return true;
        if (role === 'Manager' && val <= 10000) return true;
        if (role === 'CEO' && val > 10000) return true;
        return false;
    };

    const handleApprove = async (id) => {
        const contract = approvals.find(c => c.id === id || c._id === id);
        const currentRole = contract?.doa_stage || 'Initiator';
        
        try {
            const resp = await fetch(`/api/doa/approve`, { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contract_id: id,
                    role: currentRole,
                    action: 'approve',
                    comments: comment,
                    approved_by: user?.name || 'Admin'
                })
            });
            
            if (!resp.ok) {
                const err = await resp.json();
                throw new Error(err.detail || 'Approval failed');
            }

            setToast({ message: "✅ DOA Step Approved!", type: 'success' });
            setComment('');
            setTimeout(() => setToast(null), 3000);
            await loadData();
        } catch (err) {
            setToast({ message: `❌ ${err.message}`, type: 'error' });
            setTimeout(() => setToast(null), 3000);
        }
    };

    const handleReject = async (id) => {
        const contract = approvals.find(c => c.id === id || c._id === id);
        const currentRole = contract?.doa_stage || 'Reviewer';

        try {
            const resp = await fetch(`/api/doa/approve`, { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contract_id: id,
                    role: currentRole,
                    action: 'reject',
                    comments: comment,
                    approved_by: user?.name || 'Admin'
                })
            });

            if (!resp.ok) {
                const err = await resp.json();
                throw new Error(err.detail || 'Rejection failed');
            }

            setToast({ message: "❌ DOA Step Rejected", type: 'error' });
            setComment('');
            setTimeout(() => setToast(null), 3000);
            await loadData();
        } catch (err) {
            setToast({ message: `❌ ${err.message}`, type: 'error' });
            setTimeout(() => setToast(null), 3000);
        }
    };



    const dynamicKpis = [
        { label: 'Pending Approvals', value: kpis.pending.toString(), icon: <Hourglass size={20} strokeWidth={1.5} />, color: '#F59E0B' },
        { label: 'Approved This Month', value: kpis.approvedThisMonth.toString(), icon: <CheckCircle size={20} strokeWidth={1.5} />, color: '#00C9B1' },
        { label: 'Escalated', value: kpis.escalated.toString(), icon: <Flag size={20} strokeWidth={1.5} />, color: '#EF4444' },
        { label: 'Avg Value Pending', value: `$${(kpis.avgValue / 1000).toFixed(1)}k`, icon: <CircleDollarSign size={20} strokeWidth={1.5} />, color: '#3B82F6' },
    ];

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Approved': return styles.statusApproved;
            case 'Pending': return styles.statusPending;
            case 'Rejected': return styles.statusRejected;
            case 'Escalated': return styles.statusEscalated;
            default: return '';
        }
    };

    const getDoaLevel = (val) => {
        if (val <= 10000) return { level: 'L1', role: 'Manager', threshold: 10000 };
        if (val <= 50000) return { level: 'L2', role: 'Director', threshold: 50000 };
        return { level: 'L3', role: 'VP', threshold: 100000 }; // Arbitrary L3 threshold for bar
    };

    const getDaysColor = (days) => {
        if (days >= 7) return '#EF4444';
        if (days >= 4) return '#F59E0B';
        return '#10B981';
    };

    return (
        <div className={styles.container}>
            {toast && (
                <div className={styles.toast} style={{ backgroundColor: toast.type === 'success' ? '#00C9B1' : '#EF4444' }}>
                    {toast.message}
                </div>
            )}
            <div className={styles.mainLayout}>
                <div className={styles.leftContent}>
                    <div className={styles.pageHeader}>
                        <h2 className={styles.pageTitle}>DOA Approvals</h2>
                        <p className={styles.pageSubtitle}>Manage delegation of authority and process pending approval requests.</p>
                    </div>

                    <div className={styles.statsRow}>
                        {dynamicKpis.map((kpi, idx) => (
                            <div key={idx} className={styles.kpiCard}>
                                <div className={styles.kpiIcon} style={{ color: kpi.color }}>{kpi.icon}</div>
                                <div className={styles.kpiData}>
                                    <div className={styles.kpiValue}>{kpi.value}</div>
                                    <div className={styles.kpiLabel}>{kpi.label}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <section className={styles.matrixSection}>
                        <div className={styles.sectionHeader}>
                            <h3>DOA Authority Matrix</h3>
                        </div>
                        <div className={styles.tableWrapper}>
                            <table className={styles.matrixTable}>
                                <thead>
                                    <tr>
                                        <th>Value Range</th>
                                        <th>Business Unit</th>
                                        <th>Required Approver</th>
                                        <th>Level</th>
                                        <th>Max Value</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {doaMatrix.map((item, idx) => (
                                        <tr key={idx}>
                                            <td>{item.range}</td>
                                            <td>{item.bu}</td>
                                            <td>{item.approver}</td>
                                            <td><span className={styles.levelBadge}>{item.level}</span></td>
                                            <td>{item.max}</td>
                                            <td><span className={styles.activeDot}></span> {item.status}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <section className={styles.pendingSection}>
                        <div className={styles.sectionHeader}>
                            <h3>Pending Requests ({approvals.length})</h3>
                        </div>
                        <div className={styles.cardGrid}>
                            {approvals.length > 0 ? approvals.map((req) => {
                                const daysPending = Math.floor((new Date() - new Date(req.createdAt)) / (1000*60*60*24));
                                return (
                                <div
                                    key={req.id}
                                    className={`${styles.approvalCard} ${selectedReq?.id === req.id ? styles.activeCard : ''}`}
                                    onClick={() => setSelectedReq(req)}
                                    style={{ background: 'var(--bg-card)', border: selectedReq?.id === req.id ? '1px solid #00C9B1' : '1px solid var(--border-color)' }}
                                >
                                    <h4 style={{ color: '#ffffff', fontWeight: '700', margin: '0 0 4px 0' }}>{req.title}</h4>
                                    <p style={{ color: '#00C9B1', fontSize: '13px', margin: '0 0 12px 0' }}>{req.company}</p>
                                    
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px' }}>
                                        <div>
                                            <div style={{ color: '#00C9B1', fontSize: '24px', fontWeight: '800' }}>
                                                ${(req.value || 0).toLocaleString()}
                                            </div>
                                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                                DOA Level: <strong style={{ color: '#3B82F6' }}>{req.doaLevel || getDoaLevel(req.value).level}</strong>
                                            </span>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '12px', color: 'var(--text-primary)' }}>{req.submittedBy}</div>
                                            <div style={{ fontSize: '11px', color: getDaysColor(daysPending), fontWeight: '600' }}>{daysPending} days pending</div>
                                        </div>
                                    </div>

                                    <div className={styles.cardFooter} style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: 'auto', gap: '8px', flexDirection: 'column' }}>
                                        <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                                            <button 
                                                disabled={req.status === 'Approved' || req.stage === 'DOA Approved'}
                                                onClick={(e) => { e.stopPropagation(); handleReject(req.id); }} 
                                                style={{ flex: 1, padding: '8px', borderRadius: '6px', background: '#EF444420', color: '#EF4444', border: '1px solid #EF4444', fontWeight: '600', cursor: (req.status === 'Approved' || req.stage === 'DOA Approved') ? 'not-allowed' : 'pointer', opacity: (req.status === 'Approved' || req.stage === 'DOA Approved') ? 0.5 : 1 }}
                                            >
                                                Reject
                                            </button>
                                            <button 
                                                disabled={req.status === 'Approved' || req.stage === 'DOA Approved'}
                                                onClick={(e) => { e.stopPropagation(); handleApprove(req.id); }} 
                                                style={{ flex: 1, padding: '8px', borderRadius: '6px', background: '#10B98120', color: '#10B981', border: '1px solid #10B981', fontWeight: '600', cursor: (req.status === 'Approved' || req.stage === 'DOA Approved') ? 'not-allowed' : 'pointer', opacity: (req.status === 'Approved' || req.stage === 'DOA Approved') ? 0.5 : 1 }}
                                            >
                                                Approve
                                            </button>
                                        </div>

                                        {req.status === 'Completed' && (
                                            <div style={{ width: '100%', marginTop: '4px' }}>
                                                <div style={{ textAlign: 'center', padding: '10px', background: '#00C9B120', color: '#00C9B1', borderRadius: '6px', fontSize: '12px', fontWeight: '800', border: '1px solid #00C9B1', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                                    Workflow Completed ✅
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                );
                            }) : (
                                <p style={{ color: 'var(--text-muted)', padding: '24px' }}>No pending approval requests.</p>
                            )}
                        </div>
                    </section>
                </div>

                {/* Detail Panel */}
                {selectedReq && (
                    <aside className={styles.detailPanel}>
                        <div className={styles.panelHeader}>
                            <div className={styles.panelTitleGroup}>
                                <span className={styles.panelTag}>APPROVAL DETAIL</span>
                                <h3>{"DOA-" + selectedReq.id.slice(-8).toUpperCase()}</h3>
                            </div>
                            <div className={styles.panelHeaderActions}>
                                <button className={styles.iconBtn}>📤</button>
                                <button className={styles.iconBtn}>🖨️</button>
                            </div>
                        </div>

                        <div className={styles.panelContent}>
                            <section className={styles.detailSummary}>
                                <div className={styles.summaryItem}>
                                    <label>Contract Title</label>
                                    <p>{selectedReq.title}</p>
                                </div>
                                    <div className={styles.summaryGrid}>
                                        <div className={styles.summaryItem}>
                                            <label>Business Unit</label>
                                            <span>{selectedReq.businessUnit || selectedReq.department || 'N/A'}</span>
                                        </div>
                                        <div className={styles.summaryItem}>
                                            <label>Value</label>
                                            <span className={styles.valueText}>${(selectedReq.value || 0).toLocaleString()}</span>
                                    </div>
                                </div>
                                <div className={styles.summaryItem}>
                                    <label>Company</label>
                                    <p className={styles.ruleApplied}>{selectedReq.company}</p>
                                    <button 
                                        className={styles.btnOutline}
                                        onClick={() => onNavigate && onNavigate('CAS')}
                                    >
                                        View Linked CAS →
                                    </button>
                                </div>
                            </section>

                            <section className={styles.hierarchySection}>
                                <h4 className={styles.subHeader}>APPROVAL WORKFLOW</h4>
                                <div className={styles.workflowSteps}>
                                    {(selectedReq.approvalChain && selectedReq.approvalChain.length > 0 ? selectedReq.approvalChain : [
                                        { role: 'Initiator' },
                                        { role: 'Evaluator' },
                                        { role: 'Reviewer' },
                                        { role: 'Approver' }
                                    ]).map((step, idx) => {
                                        const role = step.role;
                                        const isCurrent = selectedReq.doa_stage === role;
                                        const isDone = selectedReq.status === 'Approved' || selectedReq.status === 'Completed' || 
                                                       (selectedReq.approvalChain && selectedReq.approvalChain.some(s => s.role === role && (s.status === 'Approved' || s.status === 'Completed')));
                                        
                                        return (
                                            <div key={role} className={`${styles.stepItem} ${isCurrent ? styles.stepCurrent : ''} ${isDone ? styles.stepDone : ''}`}>
                                                <div className={styles.stepMarker}>
                                                    {isDone ? <CheckCircle size={14} /> : idx + 1}
                                                </div>
                                                <div className={styles.stepInfo}>
                                                    <span className={styles.stepRole}>{role}</span>
                                                    <span className={styles.stepStatus}>{isDone ? 'Completed' : (isCurrent ? 'Current' : 'Pending')}</span>
                                                </div>
                                                {idx < 3 && <div className={styles.stepConnector}></div>}
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>

                            <section className={styles.actionPanel}>
                                <h4 className={styles.subHeader}>YOUR ACTION</h4>
                                <textarea
                                    className={styles.commentBox}
                                    placeholder="Add your comments here..."
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                ></textarea>
                                <div className={styles.mainActions}>
                                    <div className={styles.primaryBtns} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                                            <button 
                                                disabled={selectedReq.status === 'Completed' || selectedReq.stage === 'Completed'}
                                                onClick={() => handleReject(selectedReq.id)} 
                                                className={styles.btnReject} 
                                                style={{ width: '50%', opacity: (selectedReq.status === 'Completed' || selectedReq.stage === 'Completed') ? 0.5 : 1, cursor: (selectedReq.status === 'Completed' || selectedReq.stage === 'Completed') ? 'not-allowed' : 'pointer' }}
                                            >
                                                Reject
                                            </button>
                                            <button 
                                                disabled={selectedReq.status === 'Completed' || selectedReq.stage === 'Completed'}
                                                onClick={() => handleApprove(selectedReq.id)} 
                                                className={styles.btnApprove} 
                                                style={{ width: '50%', opacity: (selectedReq.status === 'Completed' || selectedReq.stage === 'Completed') ? 0.5 : 1, cursor: (selectedReq.status === 'Completed' || selectedReq.stage === 'Completed') ? 'not-allowed' : 'pointer' }}
                                            >
                                                Approve
                                            </button>
                                        </div>
                                        {selectedReq.status === 'Completed' && (
                                            <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '12px', border: '1px solid #00C9B1', width: '100%', textAlign: 'center' }}>
                                                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', color: '#00C9B1', fontWeight: '800', fontSize: '16px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                                    <CheckCircle size={24} />
                                                    CONTRACT COMPLETED
                                                </div>
                                                <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '8px', marginBottom: 0 }}>This contract has received all required DOA approvals and is now finalized.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </section>
                        </div>
                    </aside>
                )}
            </div>
        </div>
    );
};

export default DOAApprovals;
