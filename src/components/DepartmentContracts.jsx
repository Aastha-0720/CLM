import React, { useEffect, useMemo, useState } from 'react';
import styles from './Dashboard.module.css';
import AuditTrail from './upload/AuditTrail';
import { contractService } from '../services/contractService';

const STATUS_OPTIONS = ['All', 'Pending', 'Approved', 'Rejected', 'Overdue'];

const DepartmentContracts = ({ user }) => {
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('All');
    const [selectedContract, setSelectedContract] = useState(null);
    const department = user?.role || '';

    const formatValue = (value) => value ? `$${Number(value).toLocaleString()}` : 'Not Available';
    const formatDueDate = (value) => value ? new Date(value).toLocaleDateString() : 'Not Available';

    useEffect(() => {
        const loadContracts = async () => {
            if (!department) return;
            setLoading(true);
            try {
                const data = await contractService.getDepartmentContracts(department);
                setContracts(data || []);
            } catch (error) {
                console.error('Failed to load department contracts', error);
            } finally {
                setLoading(false);
            }
        };

        loadContracts();
    }, [department]);

    const filteredContracts = useMemo(() => {
        if (statusFilter === 'All') return contracts;
        if (statusFilter === 'Pending') return contracts.filter(c => ['Pending', 'Under Review'].includes(c.status));
        return contracts.filter(c => c.status === statusFilter);
    }, [contracts, statusFilter]);

    const cards = [
        { id: 'total', label: 'Total Contracts', count: contracts.length, color: '#3B82F6' },
        { id: 'pending', label: 'Pending', count: contracts.filter(c => ['Pending', 'Under Review'].includes(c.status)).length, color: '#F59E0B' },
        { id: 'approved', label: 'Approved', count: contracts.filter(c => c.status === 'Approved').length, color: '#10B981' },
        { id: 'rejected', label: 'Rejected', count: contracts.filter(c => c.status === 'Rejected').length, color: '#EF4444' },
        { id: 'overdue', label: 'Overdue', count: contracts.filter(c => c.status === 'Overdue').length, color: '#F97316' },
        { id: 'completed', label: 'Completed', count: contracts.filter(c => c.status === 'Completed').length, color: '#06B6D4' }
    ];

    return (
        <div className={styles.contractsPage}>
            <div className={styles.pageHeader}>
                <h2>{department} Contracts</h2>
                <p>Dedicated contract workspace for the {department} department.</p>
            </div>

            <div className={styles.cardFilterGrid}>
                {cards.map((card) => (
                    <div key={card.id} className={styles.filterCard} style={{ '--card-color': card.color }}>
                        <div className={styles.cardData}>
                            <span className={styles.cardCount}>{card.count}</span>
                            <span className={styles.cardLabel}>{card.label}</span>
                        </div>
                        <div className={styles.cardIndicator} style={{ backgroundColor: card.color }}></div>
                    </div>
                ))}
            </div>

            <div className={styles.tableCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ margin: 0 }}>{department} All Contracts</h3>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{
                            background: 'var(--bg-card)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            padding: '10px 12px'
                        }}
                    >
                        {STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                    </select>
                </div>

                {loading ? (
                    <div className={styles.emptyState}>Loading department contracts...</div>
                ) : filteredContracts.length > 0 ? (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Contract Name</th>
                                <th>Status</th>
                                <th>Value</th>
                                <th>Submitted By</th>
                                <th>Due Date</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredContracts.map((contract) => (
                                <tr key={contract.id}>
                                    <td className={styles.titleCell}>{contract.contract_name || contract.title}</td>
                                    <td>{contract.status}</td>
                                    <td>{formatValue(contract.value)}</td>
                                    <td>{contract.submittedBy || 'Not Available'}</td>
                                    <td>{formatDueDate(contract.dueAt)}</td>
                                    <td>
                                        <button className={styles.actionBtn} onClick={() => setSelectedContract(contract)}>View</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>📂</div>
                        <h3>No contracts found</h3>
                        <p>No {department} contracts match the selected filter.</p>
                    </div>
                )}
            </div>

            {selectedContract && (
                <div className={styles.modalOverlay} onClick={() => setSelectedContract(null)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <button className={styles.closeModalBtn} onClick={() => setSelectedContract(null)}>×</button>
                        <h3 className={styles.modalTitle}>{selectedContract.contract_name || selectedContract.title}</h3>
                        <p className={styles.modalCompany}>{selectedContract.company}</p>
                        <div className={styles.modalSection}>
                            <h5>Contract Information</h5>
                            <div className={styles.modalGrid}>
                                <div className={styles.infoItem}><span className={styles.infoLabel}>Status</span><span className={styles.infoValue}>{selectedContract.status}</span></div>
                                <div className={styles.infoItem}><span className={styles.infoLabel}>Value</span><span className={styles.infoValue}>{formatValue(selectedContract.value)}</span></div>
                                <div className={styles.infoItem}><span className={styles.infoLabel}>Submitted By</span><span className={styles.infoValue}>{selectedContract.submittedBy || 'Not Available'}</span></div>
                                <div className={styles.infoItem}><span className={styles.infoLabel}>Due Date</span><span className={styles.infoValue}>{formatDueDate(selectedContract.dueAt)}</span></div>
                            </div>
                        </div>
                        <AuditTrail contractId={selectedContract.id} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default DepartmentContracts;
