import React, { useState, useEffect, useCallback } from 'react';
import styles from './AdminOpportunities.module.css';

const AdminOpportunities = () => {
    const [opportunities, setOpportunities] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        stage: 'All',
        owner: 'All',
        bu: 'All',
        risk: 'All'
    });

    const [pagination, setPagination] = useState({ page: 1, limit: 10, hasMore: true });

    const fetchOpportunities = useCallback(async (reset = false) => {
        try {
            setIsLoading(true);
            const currentPage = reset ? 1 : pagination.page;
            const skip = (currentPage - 1) * pagination.limit;
            
            const url = `/api/opportunities?limit=${pagination.limit}&skip=${skip}`;
            const response = await fetch(url);
            
            if (!response.ok) throw new Error('Failed to fetch opportunities');
            const data = await response.json();
            
            setOpportunities(prev => reset ? data : [...prev, ...data]);
            setPagination(prev => ({ ...prev, hasMore: data.length === prev.limit }));
            setError(null);
        } catch (err) {
            console.error('Fetch opportunities error:', err);
            if (reset) {
                setError('Using simulated opportunity data.');
                // Fallback demo data
                setOpportunities([
                    { id: 'OPP-001', title: 'Enterprise Cloud Migration', customer_name: 'TechCorp Solutions', business_unit: 'Sales', current_stage: 'negotiation', sales_owner: 'Aastha Sharma', deal_value: 1200000, risk_level: 'High', last_updated: new Date().toISOString() },
                    { id: 'OPP-002', title: 'Global Security Audit', customer_name: 'SecureBank Int', business_unit: 'IT', current_stage: 'proposal_submission', sales_owner: 'John Doe', deal_value: 450000, risk_level: 'Low', last_updated: new Date().toISOString() },
                    { id: 'OPP-003', title: 'Digital Marketing Campaign', customer_name: 'Retail Ventures', business_unit: 'Marketing', current_stage: 'qualification', sales_owner: 'Sarah Chen', deal_value: 275000, risk_level: 'Medium', last_updated: new Date().toISOString() },
                    { id: 'OPP-004', title: 'CRM Implementation', customer_name: 'FinanceCorp Ltd', business_unit: 'Sales', current_stage: 'contract_sent', sales_owner: 'Mike Rodriguez', deal_value: 890000, risk_level: 'Medium', last_updated: new Date().toISOString() },
                    { id: 'OPP-005', title: 'E-commerce Platform', customer_name: 'Fashion Hub', business_unit: 'IT', current_stage: 'discovery', sales_owner: 'Emily Watson', deal_value: 650000, risk_level: 'Low', last_updated: new Date().toISOString() },
                    { id: 'OPP-006', title: 'Brand Awareness Campaign', customer_name: 'StartupXYZ', business_unit: 'Marketing', current_stage: 'negotiation', sales_owner: 'David Kim', deal_value: 320000, risk_level: 'High', last_updated: new Date().toISOString() }
                ]);
            }
        } finally {
            setIsLoading(false);
        }
    }, [pagination.page, pagination.limit]);

    useEffect(() => {
        fetchOpportunities();
    }, [pagination.page]); // Only refetch when page changes

    const handleLoadMore = () => {
        if (pagination.hasMore) {
            setPagination(prev => ({ ...prev, page: prev.page + 1 }));
        }
    };


    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const isStuck = (lastUpdated) => {
        const lastDate = new Date(lastUpdated);
        const now = new Date();
        const diffTime = Math.abs(now - lastDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 15;
    };

    const formatINR = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const filteredOpportunities = opportunities.filter(opp => {
        const matchStage = filters.stage === 'All' || opp.current_stage === filters.stage;
        const matchOwner = filters.owner === 'All' || opp.sales_owner === filters.owner;
        const matchBU = filters.bu === 'All' || opp.business_unit === filters.bu;
        const matchRisk = filters.risk === 'All' || opp.risk_level === filters.risk;
        return matchStage && matchOwner && matchBU && matchRisk;
    });

    const handleExportCSV = () => {
        const headers = ['ID', 'Title', 'Customer Name', 'Deal Value (₹)', 'Business Unit', 'Stage', 'Risk Level', 'Sales Owner', 'Last Updated'];
        const csvRows = [headers.join(',')];

        filteredOpportunities.forEach(opp => {
            const row = [
                opp.id,
                `"${opp.title}"`,
                `"${opp.customer_name}"`,
                formatINR(opp.deal_value).replace('₹', '₹ '),
                opp.business_unit,
                opp.current_stage.replace(/_/g, ' '),
                opp.risk_level,
                opp.sales_owner,
                opp.last_updated
            ];
            csvRows.push(row.join(','));
        });

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', `opportunities_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    if (isLoading) return (
        <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
        </div>
    );

    const stages = [...new Set(opportunities.map(o => o.current_stage))];
    const owners = [...new Set(opportunities.map(o => o.sales_owner))];
    const bus = [...new Set(opportunities.map(o => o.business_unit))];

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2>Opportunities Monitoring</h2>
                <div className={styles.headerActions}>
                    <button className={styles.exportBtn} onClick={handleExportCSV}>
                        <span>📥</span> Export CSV
                    </button>
                </div>
            </div>

            <div className={styles.filterBar}>
                <div className={styles.filterGroup}>
                    <label>Stage</label>
                    <select name="stage" className={styles.select} value={filters.stage} onChange={handleFilterChange}>
                        <option value="All">All Stages</option>
                        {stages.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                    </select>
                </div>
                <div className={styles.filterGroup}>
                    <label>Sales Owner</label>
                    <select name="owner" className={styles.select} value={filters.owner} onChange={handleFilterChange}>
                        <option value="All">All Owners</option>
                        {owners.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                </div>
                <div className={styles.filterGroup}>
                    <label>Business Unit</label>
                    <select name="bu" className={styles.select} value={filters.bu} onChange={handleFilterChange}>
                        <option value="All">All Units</option>
                        <option value="Sales">Sales</option>
                        <option value="IT">IT</option>
                        <option value="Marketing">Marketing</option>
                    </select>
                </div>
                <div className={styles.filterGroup}>
                    <label>Risk Level</label>
                    <select name="risk" className={styles.select} value={filters.risk} onChange={handleFilterChange}>
                        <option value="All">All Risks</option>
                        <option value="High">High Risk</option>
                        <option value="Medium">Medium Risk</option>
                        <option value="Low">Low Risk</option>
                    </select>
                </div>
            </div>

            <div className={styles.tableCard}>
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Opportunity Details</th>
                                <th>Customer Name</th>
                                <th>Deal Value</th>
                                <th>Business Unit</th>
                                <th>Stage</th>
                                <th>Risk Level</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOpportunities.map(opp => {
                                const stuck = isStuck(opp.last_updated);
                                const highRisk = opp.risk_level === 'High';

                                return (
                                    <tr key={opp.id} className={`${highRisk ? styles.rowHighRisk : ''} ${stuck ? styles.rowStuck : ''}`}>
                                        <td>
                                            <div className={styles.dealInfo}>
                                                <span className={styles.dealName}>{opp.title}</span>
                                                <span className={styles.dealId}>{opp.id}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={styles.customerName}>{opp.customer_name}</span>
                                        </td>
                                        <td className={styles.dealValue}>{formatINR(opp.deal_value)}</td>
                                        <td>{opp.business_unit}</td>
                                        <td>
                                            <span style={{ textTransform: 'capitalize' }}>
                                                {opp.current_stage.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`${styles.indicator} ${styles[`risk${opp.risk_level}`]}`}>
                                                {opp.risk_level} Risk
                                            </span>
                                            {stuck && (
                                                <span className={`${styles.indicator} ${styles.stuckBadge}`}>
                                                    ⚠️ Stuck (15+ days)
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminOpportunities;
