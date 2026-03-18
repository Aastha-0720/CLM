import React, { useState, useEffect } from 'react';
import styles from './SalesPipeline.module.css';

// Helper to highlight matching text
const HighlightText = ({ text, highlight }) => {
    if (!highlight.trim()) return <span>{text}</span>;
    
    const parts = text.toString().split(new RegExp(`(${highlight})`, 'gi'));
    return (
        <span>
            {parts.map((part, i) => (
                part.toLowerCase() === highlight.toLowerCase() ? 
                <mark key={i} className={styles.highlight}>{part}</mark> : 
                part
            ))}
        </span>
    );
};

const SalesPipeline = () => {
    const [opportunities, setOpportunities] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeStage, setActiveStage] = useState('Negotiation');
    const [showForm, setShowForm] = useState(false);

    // Filter and Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [filters, setFilters] = useState({
        stage: '',
        businessUnit: '',
        salesOwner: '',
        startDate: '',
        endDate: ''
    });

    // Debounce Logic
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const fetchOpportunities = async () => {
        try {
            setIsLoading(true);
            
            // Construct query parameters
            const params = new URLSearchParams();
            if (debouncedSearch) params.append('search', debouncedSearch);
            if (filters.stage) params.append('stage', filters.stage);
            if (filters.businessUnit) params.append('businessUnit', filters.businessUnit);
            if (filters.salesOwner) params.append('salesOwner', filters.salesOwner);
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);

            const queryString = params.toString() ? `?${params.toString()}` : '';
            const response = await fetch(`/api/opportunities${queryString}`);
            
            if (!response.ok) {
                throw new Error(`Error ${response.status}: Failed to fetch data`);
            }
            const data = await response.json();
            const fetchedData = Array.isArray(data) ? data : (data.opportunities || []);
            setOpportunities(fetchedData);
            setError(null);
        } catch (err) {
            console.error('Fetch error:', err);
            setError(err.message || 'Something went wrong while fetching data.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOpportunities();
    }, [filters, debouncedSearch]); // Re-fetch when filters or debounced search change

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const clearFilters = () => {
        setFilters({
            stage: '',
            businessUnit: '',
            salesOwner: '',
            startDate: '',
            endDate: ''
        });
        setSearchTerm('');
    };

    // Helper to calculate stages data from opportunities by grouping by current_stage
    const stageDefinitions = React.useMemo(() => [
        { id: 1, name: 'Opportunity Identified', key: 'opportunity_identified' },
        { id: 2, name: 'Proposal Submission', key: 'proposal_submission' },
        { id: 3, name: 'Negotiation', key: 'negotiation' },
        { id: 4, name: 'Internal Approval', key: 'internal_approval' },
        { id: 5, name: 'Contract Award', key: 'contract_award' },
        { id: 6, name: 'Contract Execution', key: 'contract_execution' },
        { id: 7, name: 'Contract Management', key: 'contract_management' },
    ], []);

    // Mock data for dropdowns (in a real app, these might come from an API)
    const businessUnits = React.useMemo(() => ['Sales', 'Enterprise', 'Marketing', 'Legal', 'Compliance'], []);
    const salesOwners = React.useMemo(() => Array.from(new Set(opportunities.map(op => op.owner || op.salesOwner).filter(Boolean))), [opportunities]);

    const calculatedStages = React.useMemo(() => stageDefinitions.map(stage => {
        const count = opportunities.filter(op => {
            const opStage = (op.current_stage || op.stage || '').toString().toLowerCase().trim();
            // Match against both the snake_case key and the Title Case name
            return opStage === stage.key || opStage === stage.name.toLowerCase();
        }).length;
        return { ...stage, count };
    }), [stageDefinitions, opportunities]);

    // Helper to calculate KPIs
    const totalOpportunitiesCount = opportunities.length;
    
    const totalPipelineValue = React.useMemo(() => opportunities.reduce((acc, op) => {
        const val = typeof op.deal_value === 'number' ? op.deal_value : 
                   (typeof op.value === 'number' ? op.value : 
                   parseFloat((op.deal_value || op.value || '0').toString().replace(/[^0-9.]/g, '')) || 0);
        return acc + val;
    }, 0), [opportunities]);

    const avgDealSize = React.useMemo(() => totalOpportunitiesCount > 0 ? totalPipelineValue / totalOpportunitiesCount : 0, [totalOpportunitiesCount, totalPipelineValue]);

    const contractManagementCount = React.useMemo(() => calculatedStages.find(s => s.key === 'contract_management')?.count || 0, [calculatedStages]);
    const winRate = React.useMemo(() => totalOpportunitiesCount > 0 ? (contractManagementCount / totalOpportunitiesCount) * 100 : 0, [contractManagementCount, totalOpportunitiesCount]);

    const formatCurrency = (val) => {
        if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
        if (val >= 1000) return `$${(val / 1000).toFixed(1)}K`;
        return `$${val.toLocaleString()}`;
    };

    const calculatedKpis = React.useMemo(() => [
        { label: 'Total Opportunities', value: totalOpportunitiesCount.toString(), trend: '+12%', icon: '🎯' },
        { label: 'Total Pipeline Value', value: formatCurrency(totalPipelineValue), trend: '+8.5%', icon: '💰' },
        { label: 'Avg Deal Size', value: formatCurrency(avgDealSize), trend: '-2.1%', icon: '📊' },
        { label: 'Win Rate %', value: `${winRate.toFixed(1)}%`, trend: '+4%', icon: '🏆' },
    ], [totalOpportunitiesCount, totalPipelineValue, avgDealSize, winRate]);

    return (
        <div className={styles.container}>
            <div className={styles.pageHeader}>
                <div className={styles.headerTitleGroup}>
                    <h2 className={styles.pageTitle}>Sales Pipeline</h2>
                    <p className={styles.pageSubtitle}>Monitor and manage your sales opportunities across different contract stages.</p>
                </div>
                <button className={styles.addBtn} onClick={() => setShowForm(true)}>
                    <span className={styles.plus}>+</span> New Opportunity
                </button>
            </div>

            {/* Filter Bar */}
            <div className={styles.filterBar}>
                <div className={styles.searchGroup}>
                    <label>Search Opportunities</label>
                    <div className={styles.searchInputWrapper}>
                        <span className={styles.searchIcon}>🔍</span>
                        <input 
                            type="text" 
                            placeholder="ID, Customer, or Title..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className={styles.filterGroup}>
                    <label>Stage</label>
                    <select name="stage" value={filters.stage} onChange={handleFilterChange}>
                        <option value="">All Stages</option>
                        {stageDefinitions.map(s => (
                            <option key={s.id} value={s.key}>{s.name}</option>
                        ))}
                    </select>
                </div>
                <div className={styles.filterGroup}>
                    <label>Business Unit</label>
                    <select name="businessUnit" value={filters.businessUnit} onChange={handleFilterChange}>
                        <option value="">All Units</option>
                        {businessUnits.map(bu => (
                            <option key={bu} value={bu}>{bu}</option>
                        ))}
                    </select>
                </div>
                <div className={styles.filterGroup}>
                    <label>Sales Owner</label>
                    <select name="salesOwner" value={filters.salesOwner} onChange={handleFilterChange}>
                        <option value="">All Owners</option>
                        {salesOwners.map(owner => (
                            <option key={owner} value={owner}>{owner}</option>
                        ))}
                    </select>
                </div>
                <div className={styles.filterGroup}>
                    <label>From Date</label>
                    <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} />
                </div>
                <div className={styles.filterGroup}>
                    <label>To Date</label>
                    <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} />
                </div>
                <button className={styles.clearFiltersBtn} onClick={clearFilters}>
                    Clear
                </button>
            </div>

            {/* Pipeline Stages */}
            <div className={styles.stagesBar}>
                {calculatedStages.map((stage) => (
                    <div
                        key={stage.id}
                        className={`${styles.stageCard} ${activeStage === stage.name ? styles.active : ''}`}
                        onClick={() => setActiveStage(stage.name)}
                    >
                        <span className={styles.stageCount}>{stage.count}</span>
                        <span className={styles.stageName}>{stage.name}</span>
                        {activeStage === stage.name && <div className={styles.activeLine}></div>}
                    </div>
                ))}
            </div>

            {/* Stats Row */}
            <div className={styles.statsRow}>
                {calculatedKpis.map((kpi, idx) => (
                    <div key={idx} className={styles.kpiCard}>
                        <div className={styles.kpiHeader}>
                            <span className={styles.kpiIcon}>{kpi.icon}</span>
                            <span className={`${styles.trend} ${kpi.trend.startsWith('+') ? styles.positive : styles.negative}`}>
                                {kpi.trend}
                            </span>
                        </div>
                        <div className={styles.kpiValue}>{kpi.value}</div>
                        <div className={styles.kpiLabel}>{kpi.label}</div>
                    </div>
                ))}
            </div>

            {/* Opportunities Table Section */}
            <div className={styles.tableSection}>
                <div className={styles.tableHeader}>
                    <h3>Active Opportunities {opportunities.length > 0 && `(${opportunities.length})`}</h3>
                    <div className={styles.tableActions}>
                        <button className={styles.tableFilter}>Filter</button>
                        <button className={styles.tableExport}>Export CSV</button>
                    </div>
                </div>

                <div className={styles.tableWrapper}>
                    {isLoading ? (
                        <div className={styles.loadingContainer}>
                            <div className={styles.spinner}></div>
                            <p>Fetching opportunities from server...</p>
                        </div>
                    ) : error ? (
                        <div className={styles.errorContainer}>
                            <span className={styles.emptyIcon}>⚠️</span>
                            <h3>Failed to load data</h3>
                            <p>{error}</p>
                            <button className={styles.retryBtn} onClick={fetchOpportunities}>
                                Try Again
                            </button>
                        </div>
                    ) : opportunities.length === 0 ? (
                        <div className={styles.emptyState}>
                            <span className={styles.emptyIcon}>📦</span>
                            <h3>No opportunities found</h3>
                            <p>There are no opportunities matching your search or filters.</p>
                            <button className={styles.addBtn} style={{ marginTop: '16px' }} onClick={clearFilters}>
                                Clear All Filters
                            </button>
                        </div>
                    ) : (
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Opportunity ID</th>
                                    <th>Customer Name</th>
                                    <th>Deal Value</th>
                                    <th>Sales Owner</th>
                                    <th>Business Unit</th>
                                    <th>Exp. Close Date</th>
                                    <th>Current Stage</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {opportunities.map((op) => (
                                    <tr key={op.id || op._id}>
                                        <td className={styles.idCell}>
                                            <HighlightText text={op.id || op.opportunityId || 'OP-NEW'} highlight={debouncedSearch} />
                                        </td>
                                        <td className={styles.customerCell}>
                                            <HighlightText text={op.customer || op.name || 'N/A'} highlight={debouncedSearch} />
                                        </td>
                                        <td className={styles.valueCell}>
                                            {formatCurrency(
                                                typeof op.deal_value === 'number' ? op.deal_value : 
                                                (typeof op.value === 'number' ? op.value : 
                                                parseFloat((op.deal_value || op.value || '0').toString().replace(/[^0-9.]/g, '')) || 0)
                                            )}
                                        </td>
                                        <td>{op.owner || op.salesOwner || 'Unassigned'}</td>
                                        <td>{op.unit || op.businessUnit || 'N/A'}</td>
                                        <td className={styles.dateCell}>{op.date || op.closeDate || 'TBD'}</td>
                                        <td>
                                            <span
                                                className={styles.stageBadge}
                                                style={{ 
                                                    backgroundColor: `${op.color || '#9CA3AF'}15`, 
                                                    color: op.color || '#9CA3AF', 
                                                    borderColor: `${op.color || '#9CA3AF'}30` 
                                                }}
                                            >
                                                {op.stage}
                                            </span>
                                        </td>
                                        <td>
                                            <div className={styles.rowActions}>
                                                <button className={styles.actionBtn}>Edit</button>
                                                <button className={styles.viewBtn}>View</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Slide-in Form Overlay */}
            {showForm && (
                <div className={styles.overlay} onClick={() => setShowForm(false)}>
                    <div className={styles.formSlide} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.formHeader}>
                            <h3>New Opportunity</h3>
                            <button className={styles.closeBtn} onClick={() => setShowForm(false)}>✕</button>
                        </div>
                        <form className={styles.form}>
                            <div className={styles.fieldGroup}>
                                <label>Customer Name</label>
                                <input type="text" placeholder="e.g. Acme Corp" />
                            </div>
                            <div className={styles.fieldRow}>
                                <div className={styles.fieldGroup}>
                                    <label>Deal Value (USD)</label>
                                    <input type="number" placeholder="0.00" />
                                </div>
                                <div className={styles.fieldGroup}>
                                    <label>Business Unit</label>
                                    <select>
                                        <option>Sales</option>
                                        <option>Enterprise</option>
                                        <option>Legal</option>
                                        <option>Marketing</option>
                                    </select>
                                </div>
                            </div>
                            <div className={styles.fieldRow}>
                                <div className={styles.fieldGroup}>
                                    <label>Sales Owner</label>
                                    <input type="text" placeholder="Owner Name" />
                                </div>
                                <div className={styles.fieldGroup}>
                                    <label>Expected Close</label>
                                    <input type="date" />
                                </div>
                            </div>
                            <div className={styles.fieldRow}>
                                <div className={styles.fieldGroup}>
                                    <label>Contract Category</label>
                                    <select>
                                        <option>Service</option>
                                        <option>Product</option>
                                        <option>License</option>
                                    </select>
                                </div>
                                <div className={styles.fieldGroup}>
                                    <label>Risk Level</label>
                                    <select>
                                        <option>Low</option>
                                        <option>Medium</option>
                                        <option>High</option>
                                    </select>
                                </div>
                            </div>
                            <div className={styles.fieldGroup}>
                                <label>Description</label>
                                <textarea rows="4" placeholder="Briefly describe the opportunity..."></textarea>
                            </div>
                            <div className={styles.formFooter}>
                                <button type="button" className={styles.formCancel} onClick={() => setShowForm(false)}>Cancel</button>
                                <button type="submit" className={styles.formSubmit}>Create Opportunity</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SalesPipeline;
