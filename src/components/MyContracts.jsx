import React, { useState, useEffect, useMemo } from 'react';
import { 
    Search, Filter, Calendar, ExternalLink, Edit2, Eye, AlertTriangle, MessageSquare
} from 'lucide-react';
import styles from './upload/AllContractsTab.module.css';
import { contractService } from '../services/contractService';
import ContractEditor from './upload/ContractEditor';
import { getAuthHeaders } from '../services/authHelper';
import PdfAnnotationViewer from './PdfAnnotationViewer';

const MyContracts = ({ user, onOpenContract }) => {
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [deptFilter, setDeptFilter] = useState('All');
    const [dateFilter, setDateFilter] = useState('All');
    const [sortConfig, setSortConfig] = useState({ key: 'updatedAt', direction: 'desc' });
    const [editingContract, setEditingContract] = useState(null);
    const [selectedReturnedContract, setSelectedReturnedContract] = useState(null);
    const [isResubmitting, setIsResubmitting] = useState(false);
    const [resubmitSuccess, setResubmitSuccess] = useState(null);

    const refreshContracts = async ({ silent = false } = {}) => {
        try {
            if (!silent) setLoading(true);
            const data = await contractService.getUserContracts();
            setContracts(data || []);
        } catch (error) {
            console.error('Error fetching user contracts:', error);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        refreshContracts();
        const interval = setInterval(() => refreshContracts({ silent: true }), 5000);
        const handleFocus = () => refreshContracts({ silent: true });
        const handleVisibility = () => {
            if (!document.hidden) refreshContracts({ silent: true });
        };

        window.addEventListener('focus', handleFocus);
        document.addEventListener('visibilitychange', handleVisibility);
        return () => {
            clearInterval(interval);
            window.removeEventListener('focus', handleFocus);
            document.removeEventListener('visibilitychange', handleVisibility);
        };
    }, []);

    const handleViewDocument = async (contractId) => {
        if (onOpenContract) {
            onOpenContract(contractId);
        } else {
            try {
                const docs = await contractService.getContractDocuments(contractId);
                if (docs && docs.length > 0) {
                    const latestDoc = docs[0]; 
                    window.open(`/api/documents/${latestDoc.id}/download`, '_blank');
                } else {
                    alert('No documents found for this contract.');
                }
            } catch (error) {
                console.error('Error viewing document:', error);
                alert('Failed to retrieve documents.');
            }
        }
    };

    const handleResubmit = async (contractId) => {
        setIsResubmitting(true);
        try {
            const res = await fetch(`/api/contracts/${contractId}/resubmit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify({})
            });
            if (res.ok) {
                setResubmitSuccess('Contract resubmitted successfully! Legal team has been notified.');
                setSelectedReturnedContract(null);
                refreshContracts();
                setTimeout(() => setResubmitSuccess(null), 4000);
            } else {
                alert('Failed to resubmit contract.');
            }
        } catch (e) {
            console.error(e);
            alert('Error during resubmit.');
        } finally {
            setIsResubmitting(false);
        }
    };

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const filteredAndSortedContracts = useMemo(() => {
        let result = [...contracts];
        if (searchQuery) {
            const lowQ = searchQuery.toLowerCase();
            result = result.filter(c => 
                (c.title && c.title.toLowerCase().includes(lowQ)) ||
                (c.company && c.company.toLowerCase().includes(lowQ)) ||
                (c.id && c.id.toLowerCase().includes(lowQ))
            );
        }
        if (statusFilter !== 'All') {
            result = result.filter(c => (c.status || 'Draft') === statusFilter);
        }
        if (deptFilter !== 'All') {
            result = result.filter(c => c.department === deptFilter);
        }
        if (dateFilter !== 'All') {
            const now = new Date();
            result = result.filter(c => {
                const updatedObj = c.updatedAt || c.createdAt;
                if (!updatedObj) return true;
                const d = new Date(updatedObj);
                if (dateFilter === 'Last 30 Days') return ((now - d) / (1000 * 60 * 60 * 24)) <= 30;
                if (dateFilter === 'YTD') return d.getFullYear() === now.getFullYear();
                return true;
            });
        }
        return result.sort((a, b) => {
            const key = sortConfig.key;
            const dir = sortConfig.direction === 'asc' ? 1 : -1;
            const aVal = a[key] ?? '';
            const bVal = b[key] ?? '';
            if (typeof aVal === 'number') return (aVal - bVal) * dir;
            return String(aVal).localeCompare(String(bVal)) * dir;
        });
    }, [contracts, searchQuery, statusFilter, deptFilter, dateFilter, sortConfig]);

    const returnedContracts = contracts.filter(c => c.status === 'Changes Requested');

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Approved': 
            case 'Executed':
            case 'Signed': return { background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.3)' };
            case 'Rejected': return { background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.3)' };
            case 'Changes Requested': return { background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B', border: '1px solid rgba(245, 158, 11, 0.5)', fontWeight: 'bold' };
            case 'Pending Approval':
            case 'Pending':
            case 'Sent for Signature': return { background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B', border: '1px solid rgba(245, 158, 11, 0.3)' };
            case 'Under Review': return { background: 'rgba(59, 130, 246, 0.15)', color: '#3B82F6', border: '1px solid rgba(59, 130, 246, 0.3)' };
            default: return { background: 'rgba(107, 114, 128, 0.15)', color: '#9CA3AF', border: '1px solid rgba(107, 114, 128, 0.3)' };
        }
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.emptyState}>Loading your contracts...</div>
            </div>
        );
    }

    if (editingContract) {
        return (
            <div className={styles.container}>
                <ContractEditor 
                    contract={editingContract} 
                    onSave={() => {
                        refreshContracts();
                        setEditingContract(null);
                    }}
                    onCancel={() => setEditingContract(null)}
                />
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* PDF Review Overlay for returned contracts */}
            {selectedReturnedContract && (
                <PdfAnnotationViewer 
                    contractId={selectedReturnedContract.id} 
                    user={user} 
                    readOnly={false}
                    onClose={() => setSelectedReturnedContract(null)}
                    actionLabel={isResubmitting ? 'Resubmitting...' : '↩ Resubmit to Legal'}
                    onAction={() => handleResubmit(selectedReturnedContract.id)}
                />
            )}

            {/* Success toast */}
            {resubmitSuccess && (
                <div style={{
                    position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
                    background: '#10b981', color: 'white', padding: '14px 20px',
                    borderRadius: '10px', boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                    fontWeight: '600', maxWidth: '360px', fontSize: '14px'
                }}>
                    ✓ {resubmitSuccess}
                </div>
            )}

            <div className={styles.headerSection} style={{ marginBottom: '24px' }}>
                <h2 className={styles.pageTitle} style={{ fontSize: '24px', fontWeight: 'bold', color: 'white' }}>My Requests</h2>
                <p className={styles.pageSub} style={{ color: 'var(--text-muted)' }}>Manage contracts you have created or are assigned to.</p>
            </div>

            {/* ⚠️ Changes Requested Banner */}
            {returnedContracts.length > 0 && (
                <div style={{
                    background: 'rgba(245, 158, 11, 0.08)',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    borderRadius: '12px',
                    padding: '16px 20px',
                    marginBottom: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <AlertTriangle size={20} color="#F59E0B" />
                        <span style={{ color: '#F59E0B', fontWeight: 'bold', fontSize: '15px' }}>
                            Action Required: {returnedContracts.length} contract{returnedContracts.length > 1 ? 's' : ''} returned with feedback
                        </span>
                    </div>
                    {returnedContracts.map(c => {
                        const legalComment = c.reviews?.Legal?.comments;
                        const legalBy = c.reviews?.Legal?.reviewedBy;
                        const cloComment = c.reviews?.CLO?.comments;
                        const cloBy = c.reviews?.CLO?.reviewedBy;
                        const comment = legalComment || cloComment;
                        const reviewerName = legalBy || cloBy;
                        return (
                            <div key={c.id} style={{
                                background: 'rgba(0,0,0,0.2)',
                                borderRadius: '8px',
                                padding: '12px 16px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                gap: '12px'
                            }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ color: 'white', fontWeight: '600', marginBottom: '4px' }}>{c.title}</div>
                                    {reviewerName && (
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                                            Reviewed by: <strong style={{ color: '#fde68a' }}>{reviewerName}</strong>
                                        </div>
                                    )}
                                    {comment && (
                                        <div style={{ 
                                            color: '#fcd34d', fontSize: '13px',
                                            display: 'flex', alignItems: 'flex-start', gap: '6px'
                                        }}>
                                            <MessageSquare size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
                                            <span><strong>Reviewer Comment:</strong> {comment}</span>
                                        </div>
                                    )}
                                    <div style={{ fontSize: '11px', color: 'rgba(253,211,77,0.6)', marginTop: '6px' }}>
                                        ℹ️ Your annotations will be cleared upon resubmit so Legal receives a clean document.
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedReturnedContract(c)}
                                    style={{
                                        padding: '8px 16px', background: '#F59E0B', color: '#000',
                                        border: 'none', borderRadius: '8px', fontWeight: 'bold',
                                        cursor: 'pointer', whiteSpace: 'nowrap', fontSize: '13px', flexShrink: 0
                                    }}
                                >
                                    📄 Review & Resubmit
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            <section className={styles.filterSection}>
                <div className={styles.searchWrap}>
                    <label>Search Repository</label>
                    <input 
                        type="text" 
                        placeholder="Search by title, company, or ID..." 
                        className={styles.searchInput}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className={styles.filterGroup}>
                    <label>Status</label>
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={styles.filterSelect}>
                        <option value="All">All Statuses</option>
                        <option value="Draft">Draft</option>
                        <option value="Under Review">Under Review</option>
                        <option value="Changes Requested">Changes Requested</option>
                        <option value="Pending Approval">Pending Approval</option>
                        <option value="Sent for Signature">Sent for Signature</option>
                        <option value="Executed">Executed</option>
                        <option value="Rejected">Rejected</option>
                    </select>
                </div>
                <div className={styles.filterGroup}>
                    <label>Department</label>
                    <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className={styles.filterSelect}>
                        <option value="All">All Departments</option>
                        <option value="Sales">Sales</option>
                        <option value="Legal">Legal</option>
                        <option value="Finance">Finance</option>
                        <option value="Procurement">Procurement</option>
                        <option value="HR">HR</option>
                    </select>
                </div>
                <div className={styles.filterGroup}>
                    <label>Date Range</label>
                    <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className={styles.filterSelect}>
                        <option value="All">All Time</option>
                        <option value="Last 30 Days">Last 30 Days</option>
                        <option value="YTD">Year-to-Date</option>
                    </select>
                </div>
            </section>

            <div className={styles.tableCard}>
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th onClick={() => handleSort('id')} style={{cursor: 'pointer'}}>REF ID</th>
                                <th onClick={() => handleSort('title')} style={{cursor: 'pointer'}}>CONTRACT TITLE</th>
                                <th onClick={() => handleSort('company')} style={{cursor: 'pointer'}}>COUNTERPARTY</th>
                                <th onClick={() => handleSort('value')} style={{cursor: 'pointer'}}>VALUE</th>
                                <th>STATUS</th>
                                <th>STAGE</th>
                                <th>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAndSortedContracts.length > 0 ? (
                                filteredAndSortedContracts.map(contract => (
                                    <tr key={contract.id} style={contract.status === 'Changes Requested' ? { background: 'rgba(245, 158, 11, 0.04)' } : {}}>
                                        <td className={styles.idCell}>
                                            #{contract.id ? contract.id.slice(-6).toUpperCase() : 'NEW'}
                                        </td>
                                        <td className={styles.titleCell}>
                                            <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{contract.title || 'Untitled Contract'}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{contract.department} • {new Date(contract.createdAt || Date.now()).toLocaleDateString()}</div>
                                        </td>
                                        <td>{contract.company || 'Unknown Company'}</td>
                                        <td>${Number(contract.value || 0).toLocaleString()}</td>
                                        <td>
                                            <span className={styles.statusBadge} style={getStatusStyle(contract.status || 'Draft')}>
                                                {contract.status === 'Changes Requested' && '⚠️ '}
                                                {contract.status || 'Draft'}
                                            </span>
                                        </td>
                                        <td>{contract.stage || 'Initialization'}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button 
                                                    className={styles.actionBtn} 
                                                    title="View Contract Document"
                                                    onClick={() => handleViewDocument(contract.id)}
                                                    style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex' }}
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                {(contract.status === 'Draft' || !contract.status) && (
                                                    <button 
                                                        className={styles.actionBtn} 
                                                        title="Edit Draft"
                                                        onClick={() => setEditingContract(contract)}
                                                        style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex' }}
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                )}
                                                {contract.status === 'Changes Requested' && (
                                                    <button 
                                                        className={styles.actionBtn} 
                                                        title="View Comments & Resubmit"
                                                        onClick={() => setSelectedReturnedContract(contract)}
                                                        style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B', border: '1px solid rgba(245, 158, 11, 0.4)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', fontSize: '12px' }}
                                                    >
                                                        📋 Review & Resubmit
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className={styles.emptyState}>
                                        No contracts found matching your criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default MyContracts;
