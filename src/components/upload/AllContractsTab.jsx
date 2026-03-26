import React, { useState, useEffect, useMemo } from 'react';
import { 
    Search, Filter, Plus, FileText, Download, 
    MoreVertical, ChevronRight, ArrowUpDown, ExternalLink
} from 'lucide-react';
import styles from './AllContractsTab.module.css';
import { contractService } from '../../services/contractService';
import ContractEditor from './ContractEditor';

const AllContractsTab = ({ user, onOpenContract }) => {
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [deptFilter, setDeptFilter] = useState('All');
    const [sortConfig, setSortConfig] = useState({ key: 'updatedAt', direction: 'desc' });
    const [editingContract, setEditingContract] = useState(null);

    const refreshContracts = async () => {
        try {
            setLoading(true);
            const data = await contractService.getAllContracts();
            setContracts(data || []);
        } catch (error) {
            console.error('Error fetching contracts:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshContracts();
    }, []);

    const handleViewDocument = (contractId) => {
        if (onOpenContract) {
            onOpenContract(contractId);
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

        // Search
        if (searchQuery) {
            const lowQ = searchQuery.toLowerCase();
            result = result.filter(c => 
                (c.title && c.title.toLowerCase().includes(lowQ)) ||
                (c.company && c.company.toLowerCase().includes(lowQ)) ||
                (c.id && c.id.toLowerCase().includes(lowQ))
            );
        }

        // Status Filter
        if (statusFilter !== 'All') {
            result = result.filter(c => (c.status || 'Draft') === statusFilter);
        }

        // Dept Filter
        if (deptFilter !== 'All') {
            result = result.filter(c => c.department === deptFilter);
        }

        // Sort
        result.sort((a, b) => {
            const aVal = a[sortConfig.key] || '';
            const bVal = b[sortConfig.key] || '';
            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [contracts, searchQuery, statusFilter, deptFilter, sortConfig]);

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Approved': return { background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.3)' };
            case 'Rejected': return { background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.3)' };
            case 'Pending': return { background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B', border: '1px solid rgba(245, 158, 11, 0.3)' };
            default: return { background: 'rgba(107, 114, 128, 0.15)', color: '#9CA3AF', border: '1px solid rgba(107, 114, 128, 0.3)' };
        }
    };

    const getRiskStyle = (risk) => {
        switch (risk) {
            case 'High': return { color: '#EF4444', fontWeight: '700' };
            case 'Medium': return { color: '#F59E0B', fontWeight: '600' };
            case 'Low': return { color: '#10B981', fontWeight: '600' };
            default: return { color: 'var(--text-muted)' };
        }
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.emptyState}>Loading contracts ledger...</div>
            </div>
        );
    }

    if (editingContract) {
        return (
            <div className={styles.container}>
                <ContractEditor 
                    contract={editingContract} 
                    onSave={() => {
                        // We could stay in editor or go back
                        // For now let's just refresh list in background
                        refreshContracts();
                    }}
                    onCancel={() => setEditingContract(null)}
                />
            </div>
        );
    }

    return (
        <div className={styles.container}>
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
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                        <option value="All">All Statuses</option>
                        <option value="Approved">Approved</option>
                        <option value="Pending">Pending</option>
                        <option value="Rejected">Rejected</option>
                        <option value="Draft">Draft</option>
                    </select>
                </div>
                <div className={styles.filterGroup}>
                    <label>Department</label>
                    <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
                        <option value="All">All Departments</option>
                        <option value="Legal">Legal</option>
                        <option value="Finance">Finance</option>
                        <option value="Compliance">Compliance</option>
                        <option value="Procurement">Procurement</option>
                        <option value="Sales">Sales</option>
                    </select>
                </div>
            </section>

            <div className={styles.tableCard}>
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th onClick={() => handleSort('id')} style={{ cursor: 'pointer' }}>
                                    Ref ID <ArrowUpDown size={12} style={{ marginLeft: '4px' }} />
                                </th>
                                <th onClick={() => handleSort('title')} style={{ cursor: 'pointer' }}>
                                    Contract Title <ArrowUpDown size={12} style={{ marginLeft: '4px' }} />
                                </th>
                                <th onClick={() => handleSort('company')} style={{ cursor: 'pointer' }}>
                                    Counterparty <ArrowUpDown size={12} style={{ marginLeft: '4px' }} />
                                </th>
                                <th>Value</th>
                                <th>Status</th>
                                <th>Stage</th>
                                <th>Risk</th>
                                <th>Days</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAndSortedContracts.length > 0 ? (
                                filteredAndSortedContracts.map((contract) => (
                                    <tr key={contract.id}>
                                        <td className={styles.idCell}>#{String(contract.id).slice(-8).toUpperCase()}</td>
                                        <td className={styles.titleCell}>
                                            <button 
                                                className={styles.titleLink}
                                                onClick={() => handleViewDocument(contract.id)}
                                                title="View Contract in App"
                                            >
                                                {contract.title}
                                                <Eye size={12} className={styles.linkIcon} />
                                            </button>
                                        </td>
                                        <td>{contract.company || '-'}</td>
                                        <td>${Number(contract.value || 0).toLocaleString()}</td>
                                        <td>
                                            <span 
                                                className={styles.statusBadge}
                                                style={getStatusStyle(contract.status || 'Draft')}
                                            >
                                                {contract.status || 'Draft'}
                                            </span>
                                        </td>
                                        <td>{contract.stage || 'Initial'}</td>
                                        <td style={getRiskStyle(contract.priority || 'Medium')}>
                                            {contract.priority || 'Medium'}
                                        </td>
                                        <td style={{ color: (contract.daysPending || 0) > 5 ? '#EF4444' : 'inherit' }}>
                                            {contract.daysPending || 0}d
                                         </td>
                                         <td>
                                             <div style={{ display: 'flex', gap: '8px' }}>
                                                <button 
                                                    className={styles.actionBtn}
                                                    onClick={() => handleViewDocument(contract.id)}
                                                    title="View in App"
                                                    style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex' }}
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                <button 
                                                    className={styles.actionBtn}
                                                    onClick={() => setEditingContract(contract)}
                                                    title="Edit Content"
                                                    style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex' }}
                                                >
                                                    <FileText size={16} />
                                                </button>
                                            </div>
                                         </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="8" className={styles.emptyState}>
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

export default AllContractsTab;
