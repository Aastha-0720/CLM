import React, { useState, useEffect } from 'react';
import styles from './Dashboard.module.css';
import AuditTrail from './upload/AuditTrail';
import { ClipboardList, Hourglass, CheckCircle, FileEdit, Search, ArrowUpCircle } from 'lucide-react';

const AllContracts = ({ user }) => {
    const [contracts, setContracts] = useState([]);
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [selectedContract, setSelectedContract] = useState(null);
    const departmentScopedRoles = ['Legal', 'Finance', 'Compliance', 'Procurement'];
    const formatValue = (value) => value ? `$${Number(value).toLocaleString()}` : 'Not Available';

    const loadContracts = async () => {
        setLoading(true);
        try {
            const { contractService } = await import('../services/contractService');
            const data = await contractService.getAllContracts();
            const scopedData = departmentScopedRoles.includes(user?.role)
                ? data.filter(c => c.current_department === user.role || (c.reviews?.[user.role]?.status && c.reviews?.[user.role]?.status !== 'Not Started'))
                : data;
            setContracts(scopedData);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadContracts();
    }, []);

    const counts = {
        all: contracts.length,
        pending: contracts.filter(c => c.status === 'Under Review' || c.status === 'Pending').length,
        approved: contracts.filter(c => c.status === 'Approved').length,
        rejected: contracts.filter(c => c.status === 'Rejected').length,
        overdue: contracts.filter(c => c.status === 'Overdue').length,
        completed: contracts.filter(c => c.status === 'Completed').length,
    };

    const filteredContracts = contracts.filter(c => {
        if (filter === 'all') return true;
        if (filter === 'pending') return c.status === 'Under Review' || c.status === 'Pending';
        if (filter === 'approved') return c.status === 'Approved';
        if (filter === 'rejected') return c.status === 'Rejected';
        if (filter === 'overdue') return c.status === 'Overdue';
        if (filter === 'completed') return c.status === 'Completed';
        return true;
    });

    return (
        <div className={styles.contractsPage}>
            <div className={styles.pageHeader}>
                <h2>All Contracts</h2>
                <p>Interactive repository of all organizational contracts.</p>
            </div>

            <div className={styles.cardFilterGrid}>
                {[
                    { id: 'all', label: 'All Contracts', count: counts.all, color: '#3B82F6' },
                    { id: 'pending', label: 'Pending Review', count: counts.pending, color: '#F59E0B' },
                    { id: 'approved', label: 'Approved', count: counts.approved, color: '#10B981' },
                    { id: 'rejected', label: 'Rejected', count: counts.rejected, color: '#EF4444' },
                    { id: 'overdue', label: 'Overdue', count: counts.overdue, color: '#F97316' },
                    { id: 'completed', label: 'Completed', count: counts.completed, color: '#06B6D4' }
                ].map((card) => (
                    <div 
                        key={card.id}
                        className={`${styles.filterCard} ${filter === card.id ? styles.filterCardActive : ''}`}
                        onClick={() => setFilter(card.id)}
                        style={{ '--card-color': card.color }}
                    >
                        <div className={styles.cardData}>
                            <span className={styles.cardCount}>{card.count}</span>
                            <span className={styles.cardLabel}>{card.label}</span>
                        </div>
                        <div className={styles.cardIndicator} style={{ backgroundColor: card.color }}></div>
                    </div>
                ))}
            </div>

            <div className={styles.tableCard}>
                {loading ? (
                    <div className={styles.emptyState}>Loading contracts...</div>
                ) : filteredContracts.length > 0 ? (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Contract ID</th>
                                <th>Contract Name</th>
                                <th>Current Department</th>
                                <th>Value</th>
                                <th>Status</th>
                                <th>Submitted By</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredContracts.map(c => (
                                <tr key={c.id}>
                                    <td className={styles.idCell}>{String(c.id).slice(-8).toUpperCase()}</td>
                                    <td className={styles.titleCell}>{c.contract_name || c.title}</td>
                                    <td>{c.department || 'Unassigned'}</td>
                                    <td>{formatValue(c.value)}</td>
                                    <td>
                                        <span className={`${styles.statusBadge} ${
                                            c.status === 'Approved' || c.status === 'Completed' ? styles.good : 
                                            c.status === 'Rejected' ? styles.critical : 
                                            c.status === 'Overdue' ? styles.critical :
                                            c.status === 'Draft' ? styles.statusDraft : 
                                            styles.warning
                                        }`}>
                                            {c.status}
                                        </span>
                                    </td>
                                    <td>{c.submittedBy}</td>
                                    <td>
                                        <button className={styles.actionBtn} onClick={() => setSelectedContract(c)}>View</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>📂</div>
                        <h3>No contracts found</h3>
                        <p>There are no contracts matching the current filter.</p>
                    </div>
                )}
            </div>

            {selectedContract && (
                <div className={styles.modalOverlay} onClick={() => setSelectedContract(null)}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <button className={styles.closeModalBtn} onClick={() => setSelectedContract(null)}>×</button>
                        <h3 className={styles.modalTitle}>{selectedContract.title}</h3>
                        <p className={styles.modalCompany}>{selectedContract.company}</p>
                        <div className={styles.modalSection}>
                            <h5>Contract Information</h5>
                            <div className={styles.modalGrid}>
                                <div className={styles.infoItem}><span className={styles.infoLabel}>Current Department</span><span className={styles.infoValue}>{selectedContract.department || 'Unassigned'}</span></div>
                                <div className={styles.infoItem}><span className={styles.infoLabel}>Value</span><span className={styles.infoValue}>{formatValue(selectedContract.value)}</span></div>
                                <div className={styles.infoItem}><span className={styles.infoLabel}>Stage</span><span className={styles.infoValue}>{selectedContract.stage}</span></div>
                                <div className={styles.infoItem}><span className={styles.infoLabel}>Status</span><span className={styles.infoValue}>{selectedContract.status}</span></div>
                                <div className={styles.infoItem}><span className={styles.infoLabel}>Owner</span><span className={styles.infoValue}>{selectedContract.submittedBy}</span></div>
                                <div className={styles.infoItem}><span className={styles.infoLabel}>Workflow</span><span className={styles.infoValue}>{(selectedContract.workflow || []).join(' → ') || 'Not set'}</span></div>
                                <div className={styles.infoItem}><span className={styles.infoLabel}>Rejection Reason</span><span className={styles.infoValue}>{selectedContract.rejection_reason || 'N/A'}</span></div>
                            </div>
                        </div>
                        <AuditTrail contractId={selectedContract.id} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default AllContracts;
