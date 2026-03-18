import React, { useState, useEffect, useCallback } from 'react';
import styles from './AdminContracts.module.css';
import { Plus, X, Calendar, Filter } from 'lucide-react';

const AdminContracts = () => {
    const [statusFilter, setStatusFilter] = useState('All');
    const [casStatusFilter, setCasStatusFilter] = useState('All');
    const [digiInkFilter, setDigiInkFilter] = useState('All');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [contracts, setContracts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [newContract, setNewContract] = useState({
        name: '',
        customer: '',
        value: '',
        status: 'Draft',
        expiryDate: '',
        digiInkStatus: 'Pending'
    });

    const [pagination, setPagination] = useState({ page: 1, limit: 10, hasMore: true });

    // Mock API function
    const getContracts = useCallback(async (filters = {}) => {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const mockContracts = [
            { 
                id: 'CON-2024-001', 
                name: 'Enterprise License Agreement', 
                customer: 'TechCorp Solutions', 
                value: '₹ 25,00,000', 
                status: 'Pending', 
                expiryDate: '2024-12-15', 
                digiInkStatus: 'Pending',
                casStatus: 'In Review',
                opportunity: 'OPP-001'
            },
            { 
                id: 'CON-2024-002', 
                name: 'Cloud Services Contract', 
                customer: 'SecureBank Int', 
                value: '₹ 18,50,000', 
                status: 'Active', 
                expiryDate: '2025-03-20', 
                digiInkStatus: 'Signed',
                casStatus: 'Approved',
                opportunity: 'OPP-002'
            },
            { 
                id: 'CON-2024-003', 
                name: 'Support & Maintenance', 
                customer: 'Global Retail Inc', 
                value: '₹ 8,20,000', 
                status: 'Draft', 
                expiryDate: '', 
                digiInkStatus: 'Pending',
                casStatus: 'Draft',
                opportunity: 'OPP-003'
            },
            { 
                id: 'CON-2024-004', 
                name: 'Professional Services', 
                customer: 'HealthCare Plus', 
                value: '₹ 12,75,000', 
                status: 'Expired', 
                expiryDate: '2023-11-30', 
                digiInkStatus: 'Signed',
                casStatus: 'Expired',
                opportunity: 'OPP-004'
            },
            { 
                id: 'CON-2024-005', 
                name: 'Software License Renewal', 
                customer: 'EduTech Innovations', 
                value: '₹ 6,90,000', 
                status: 'Active', 
                expiryDate: '2024-08-10', 
                digiInkStatus: 'Signed',
                casStatus: 'Active',
                opportunity: 'OPP-005'
            }
        ];

        // Apply filters
        let filtered = mockContracts;
        
        if (filters.status && filters.status !== 'All') {
            filtered = filtered.filter(c => c.status === filters.status);
        }
        
        if (filters.casStatus && filters.casStatus !== 'All') {
            filtered = filtered.filter(c => c.casStatus === filters.casStatus);
        }
        
        if (filters.digiInkStatus && filters.digiInkStatus !== 'All') {
            filtered = filtered.filter(c => c.digiInkStatus === filters.digiInkStatus);
        }
        
        if (filters.startDate && filters.endDate) {
            filtered = filtered.filter(c => {
                if (!c.expiryDate) return false;
                const expiry = new Date(c.expiryDate);
                const start = new Date(filters.startDate);
                const end = new Date(filters.endDate);
                return expiry >= start && expiry <= end;
            });
        }
        
        return filtered;
    }, []);

    const fetchContracts = useCallback(async (reset = false) => {
        try {
            setIsLoading(true);
            
            const filters = {
                status: statusFilter !== 'All' ? statusFilter : undefined,
                casStatus: casStatusFilter !== 'All' ? casStatusFilter : undefined,
                digiInkStatus: digiInkFilter !== 'All' ? digiInkFilter : undefined,
                startDate: dateRange.start,
                endDate: dateRange.end
            };
            
            const data = await getContracts(filters);
            
            setContracts(prev => reset ? data : [...prev, ...data]);
            setPagination(prev => ({ ...prev, hasMore: data.length === prev.limit }));
            setError(null);
        } catch (err) {
            console.error('Fetch contracts error:', err);
            if (reset) {
                setError('Using simulated contract data.');
                // Fallback demo data
                setContracts([
                    { id: 'CON-2024-001', name: 'Enterprise License', customer: 'TechCorp', value: '₹ 25L', status: 'Pending', expiryDate: '2024-12-15', digiInkStatus: 'Pending' },
                    { id: 'CON-2024-002', name: 'Cloud Services', customer: 'SecureBank', value: '₹ 18.5L', status: 'Active', expiryDate: '2025-03-20', digiInkStatus: 'Signed' },
                ]);
            }
        } finally {
            setIsLoading(false);
        }
    }, [pagination.page, pagination.limit, statusFilter, casStatusFilter, digiInkFilter, dateRange, getContracts]);

    useEffect(() => {
        fetchContracts(true);
    }, [statusFilter, casStatusFilter, digiInkFilter, dateRange]);

    const handleCreateContract = async () => {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const newContractData = {
            id: `CON-${new Date().getFullYear()}-${String(contracts.length + 1).padStart(3, '0')}`,
            ...newContract,
            casStatus: newContract.status,
            opportunity: `OPP-${String(contracts.length + 1).padStart(3, '0')}`
        };
        
        setContracts(prev => [newContractData, ...prev]);
        setShowModal(false);
        setNewContract({
            name: '',
            customer: '',
            value: '',
            status: 'Draft',
            expiryDate: '',
            digiInkStatus: 'Pending'
        });
    };

    const handleFilterChange = () => {
        fetchContracts(true);
    };


    const handleAction = async (id, action) => {
        const newStatus = action === 'approve' ? 'Approved' : 'Rejected';
        try {
            const response = await fetch(`/api/contracts/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            if (!response.ok) throw new Error('Failed to update contract');
            fetchContracts();
        } catch (err) {
            // Mock update
            setContracts(contracts.map(c => c.id === id ? { ...c, status: newStatus, cas_status: newStatus } : c));
        }
    };

    const getStatusClass = (status) => {
        const s = status.toLowerCase();
        if (s.includes('approve') || s.includes('active')) return styles.status_active;
        if (s.includes('pend') || s.includes('review')) return styles.status_pending;
        if (s.includes('reject') || s.includes('expire')) return styles.status_expired;
        return styles.status_draft;
    };

    const filteredContracts = statusFilter === 'All' 
        ? contracts 
        : contracts.filter(c => c.status === statusFilter);

    if (isLoading && contracts.length === 0) return (
        <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
        </div>
    );

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2>Contracts Management</h2>
                <button 
                    className={styles.newContractBtn}
                    onClick={() => setShowModal(true)}
                >
                    <Plus size={16} />
                    New Contract
                </button>
            </div>

            {/* Filters Section */}
            <div className={styles.filtersSection}>
                <div className={styles.filterGroup}>
                    <label>Lifecycle Status</label>
                    <select 
                        value={statusFilter} 
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="All">All Status</option>
                        <option value="Draft">Draft</option>
                        <option value="Pending">Pending</option>
                        <option value="Active">Active</option>
                        <option value="Expired">Expired</option>
                    </select>
                </div>

                <div className={styles.filterGroup}>
                    <label>CAS Status</label>
                    <select 
                        value={casStatusFilter} 
                        onChange={(e) => setCasStatusFilter(e.target.value)}
                    >
                        <option value="All">All CAS</option>
                        <option value="Draft">Draft</option>
                        <option value="In Review">In Review</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                        <option value="Expired">Expired</option>
                    </select>
                </div>

                <div className={styles.filterGroup}>
                    <label>DigiInk Status</label>
                    <select 
                        value={digiInkFilter} 
                        onChange={(e) => setDigiInkFilter(e.target.value)}
                    >
                        <option value="All">All Signatures</option>
                        <option value="Pending">Pending</option>
                        <option value="Signed">Signed</option>
                        <option value="Partial">Partial</option>
                    </select>
                </div>

                <div className={styles.filterGroup}>
                    <label>Expiry Date Range</label>
                    <div className={styles.dateRange}>
                        <input 
                            type="date" 
                            placeholder="Start" 
                            value={dateRange.start}
                            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                        />
                        <span>to</span>
                        <input 
                            type="date" 
                            placeholder="End" 
                            value={dateRange.end}
                            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                        />
                    </div>
                </div>

                <button className={styles.applyFiltersBtn} onClick={handleFilterChange}>
                    <Filter size={16} />
                    Apply Filters
                </button>
            </div>

            <div className={styles.tableCard}>
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Contract Name</th>
                                <th>Customer</th>
                                <th>Value</th>
                                <th>Status</th>
                                <th>Expiry Date</th>
                                <th>DigiInk Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {contracts.map(contract => (
                                <tr key={contract.id}>
                                    <td>
                                        <div className={styles.contractInfo}>
                                            <span className={styles.contractName}>{contract.name}</span>
                                            <span className={styles.contractId}>ID: {contract.id}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={styles.customerName}>{contract.customer}</span>
                                    </td>
                                    <td>
                                        <span className={styles.contractValue}>{contract.value}</span>
                                    </td>
                                    <td>
                                        <span className={`${styles.statusBadge} ${getStatusClass(contract.status)}`}>
                                            {contract.status}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={styles.expiryDate}>
                                            {contract.expiryDate || 'N/A'}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`${styles.digiInkBadge} ${contract.digiInkStatus === 'Signed' ? styles.signed : styles.pending}`}>
                                            {contract.digiInkStatus}
                                        </span>
                                    </td>
                                    <td>
                                        <div className={styles.actions}>
                                            {contract.status === 'Pending' && (
                                                <>
                                                    <button className={styles.approveBtn} onClick={() => handleAction(contract.id, 'approve')}>✓ Approve</button>
                                                    <button className={styles.rejectBtn} onClick={() => handleAction(contract.id, 'reject')}>✕ Reject</button>
                                                </>
                                            )}
                                            <button className={styles.viewBtn}>👁 View</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* New Contract Modal */}
            {showModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <h3>Create New Contract</h3>
                            <button 
                                className={styles.closeBtn}
                                onClick={() => setShowModal(false)}
                            >
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className={styles.modalContent}>
                            <div className={styles.formGroup}>
                                <label>Contract Name</label>
                                <input 
                                    type="text" 
                                    value={newContract.name}
                                    onChange={(e) => setNewContract(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="Enter contract name"
                                />
                            </div>
                            
                            <div className={styles.formGroup}>
                                <label>Customer</label>
                                <input 
                                    type="text" 
                                    value={newContract.customer}
                                    onChange={(e) => setNewContract(prev => ({ ...prev, customer: e.target.value }))}
                                    placeholder="Enter customer name"
                                />
                            </div>
                            
                            <div className={styles.formGroup}>
                                <label>Value (₹)</label>
                                <input 
                                    type="text" 
                                    value={newContract.value}
                                    onChange={(e) => setNewContract(prev => ({ ...prev, value: e.target.value }))}
                                    placeholder="Enter contract value"
                                />
                            </div>
                            
                            <div className={styles.formGroup}>
                                <label>Status</label>
                                <select 
                                    value={newContract.status}
                                    onChange={(e) => setNewContract(prev => ({ ...prev, status: e.target.value }))}
                                >
                                    <option value="Draft">Draft</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Active">Active</option>
                                </select>
                            </div>
                            
                            <div className={styles.formGroup}>
                                <label>Expiry Date</label>
                                <input 
                                    type="date" 
                                    value={newContract.expiryDate}
                                    onChange={(e) => setNewContract(prev => ({ ...prev, expiryDate: e.target.value }))}
                                />
                            </div>
                            
                            <div className={styles.formGroup}>
                                <label>DigiInk Status</label>
                                <select 
                                    value={newContract.digiInkStatus}
                                    onChange={(e) => setNewContract(prev => ({ ...prev, digiInkStatus: e.target.value }))}
                                >
                                    <option value="Pending">Pending</option>
                                    <option value="Signed">Signed</option>
                                </select>
                            </div>
                        </div>
                        
                        <div className={styles.modalFooter}>
                            <button 
                                className={styles.cancelBtn}
                                onClick={() => setShowModal(false)}
                            >
                                Cancel
                            </button>
                            <button 
                                className={styles.createBtn}
                                onClick={handleCreateContract}
                                disabled={!newContract.name || !newContract.customer}
                            >
                                Create Contract
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminContracts;
