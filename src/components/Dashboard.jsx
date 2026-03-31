import React, { useMemo, useState } from 'react';
import styles from './Dashboard.module.css';
import { 
    FileText, Search, Hourglass, PenTool, AlertTriangle, 
    CircleDollarSign, CheckCircle, Minus, XCircle, FileEdit, ClipboardList, 
    Calendar, AlertCircle, Scale, Clock, Shield, ShoppingCart, 
    ArrowUpCircle, Gem, TrendingUp, LayoutGrid, List, Upload
} from 'lucide-react';
import AuditTrail from './upload/AuditTrail';
import UploadContract from './UploadContract';

const kpiData = [
    { id: 'active', label: 'Total Active Contracts', value: '1,284', icon: <FileText size={20} strokeWidth={1.5} />, color: '#00C9B1', trend: '+12%' },
    { id: 'pending', label: 'Pending Approvals', value: '24', icon: <Hourglass size={20} strokeWidth={1.5} />, color: '#F59E0B', trend: '+5' },
    { id: 'review', label: 'Contracts Under Review', value: '42', icon: <Search size={20} strokeWidth={1.5} />, color: '#3B82F6', trend: '-3' },

    { id: 'expiring', label: 'Expiring This Month', value: '14', icon: <AlertTriangle size={20} strokeWidth={1.5} />, color: '#EF4444', trend: 'Critical' },
    { id: 'pipeline', label: 'Pipeline Deal Value', value: '$4.2M', icon: <CircleDollarSign size={20} strokeWidth={1.5} />, color: '#10B981', trend: '+18%' },
];

const SORT_OPTIONS = [
    { value: 'default', label: 'Latest Added' },
    { value: 'name-asc', label: 'Name (A → Z)' },
    { value: 'name-desc', label: 'Name (Z → A)' },
    { value: 'value-desc', label: 'Value (High → Low)' },
    { value: 'value-asc', label: 'Value (Low → High)' }
];

const AdminDashboard = ({ activeKpi, setActiveKpi, refreshTrigger }) => {
    const [stats, setStats] = React.useState(null);
    const [contracts, setContracts] = React.useState([]);
    const [selectedRecentContract, setSelectedRecentContract] = React.useState(null);
    const [isRecentExpanded, setIsRecentExpanded] = React.useState(true);
    const [toast, setToast] = React.useState('');
    const [deleteConfirm, setDeleteConfirm] = React.useState(null); // stores contract id to delete
    const [viewMode, setViewMode] = React.useState('card'); // 'card' | 'list'
    const [filterStatus, setFilterStatus] = React.useState('All'); // 'All' | 'Draft' | 'Under Review' | 'Approved'
    const [selectedSort, setSelectedSort] = React.useState('default');

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(''), 3000);
    };

    const handleDeleteClick = (id) => {
        setDeleteConfirm(id);
    };

    const handleDeleteConfirm = async () => {
        try {
            const response = await fetch(`/api/contracts/${deleteConfirm}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || 'mock-token'}` }
            });
            if (response.ok) {
                setContracts(prev => prev.filter(c => c.id !== deleteConfirm));
                setSelectedRecentContract(null);
                showToast("Contract deleted successfully");
                setDeleteConfirm(null);
            } else {
                console.error('Delete failed:', response.status);
            }
        } catch (err) {
            console.error('Delete error:', err);
        }
    };

    const loadData = async () => {
        const { dashboardService } = await import('../services/dashboardService');
        const { contractService } = await import('../services/contractService');

        const data = await dashboardService.getDashboardKPIs();
        const allContracts = await contractService.getAllContracts();

        setStats(data);
        setContracts(allContracts);
    };

    React.useEffect(() => {
        loadData();
    }, [refreshTrigger]);

    const handleStatusChange = async (id, status, stage) => {
        const { contractService } = await import('../services/contractService');
        await contractService.updateContractStage(id, status, stage);
        await loadData();
    };

    // Enhance KPIs using real data
    const completedCount = contracts.filter(c => c.status === 'Completed').length;
    const expiringSoonCount = contracts.filter(c => c.stage === 'DOA Approval').length;
    const underReviewCount = contracts.filter(c => ['Under Review', 'Pending', 'Overdue'].includes(c.status)).length;
    const pendingApprovalCount = contracts.filter(c => c.status === 'Pending').length;

    const enhancedKpis = [
        { id: 'total', label: 'Total Contracts', value: contracts.length, icon: <FileText size={20} strokeWidth={1.5} />, color: '#00C9B1' },
        { id: 'review', label: 'Under Review', value: underReviewCount, icon: <Search size={20} strokeWidth={1.5} />, color: '#3B82F6' },
        { id: 'pending', label: 'Pending Approvals', value: pendingApprovalCount, icon: <Hourglass size={20} strokeWidth={1.5} />, color: '#F59E0B' },
        { id: 'completed', label: 'Completed', value: completedCount, icon: <CheckCircle size={20} strokeWidth={1.5} />, color: '#10B981' },
        { id: 'expiring', label: 'Expiring Soon', value: expiringSoonCount, icon: <AlertTriangle size={20} strokeWidth={1.5} />, color: '#EF4444' }
    ];

    // Donut Chart Real Data
    const activeCount = contracts.filter(c => c.status === 'Approved').length;
    const draftCount = contracts.filter(c => c.status === 'Draft').length;
    const expiredCount = contracts.filter(c => c.status === 'Rejected').length;

    const statusData = [
        { label: 'Completed', value: completedCount, color: '#10B981' },
        { label: 'Active', value: activeCount, color: '#00C9B1' },
        { label: 'Review', value: underReviewCount, color: '#3B82F6' },
        { label: 'Draft', value: draftCount, color: '#8B5CF6' }
    ];

    const totalDonut = Math.max(activeCount + underReviewCount + draftCount + expiredCount, 1);
    let cum = 0;
    const pieGradient = statusData.map(d => {
        const start = cum;
        const pct = (d.value / totalDonut) * 100;
        cum += pct;
        return `${d.color} ${start}% ${cum}%`;
    }).join(', ');

    // Mock Bar Chart Data
    const barData = [
        { label: 'Lead', sales: 80, contract: 20 },
        { label: 'Proposal', sales: 60, contract: 40 },
        { label: 'Negotiation', sales: 45, contract: 65 },
        { label: 'Doc Prep', sales: 30, contract: 85 },
        { label: 'Signature', sales: 15, contract: 100 }
    ];

    const visibleContracts = useMemo(() => {
        const filteredContracts = filterStatus === 'All'
            ? contracts
            : contracts.filter((contract) => contract.status === filterStatus);

        if (selectedSort === 'default') {
            return filteredContracts;
        }

        const sortedContracts = [...filteredContracts];

        sortedContracts.sort((a, b) => {
            const titleA = a.title || '';
            const titleB = b.title || '';
            const valueA = Number(a.value) || 0;
            const valueB = Number(b.value) || 0;

            switch (selectedSort) {
                case 'name-asc':
                    return titleA.localeCompare(titleB, undefined, { sensitivity: 'base' });
                case 'name-desc':
                    return titleB.localeCompare(titleA, undefined, { sensitivity: 'base' });
                case 'value-desc':
                    return valueB - valueA;
                case 'value-asc':
                    return valueA - valueB;
                default:
                    return 0;
            }
        });

        return sortedContracts;
    }, [contracts, filterStatus, selectedSort]);

    return (
        <div className={styles.adminContainer}>
            {toast && (
                <div style={{
                    position: 'fixed', bottom: '20px', right: '20px',
                    backgroundColor: '#10B981', color: 'white',
                    padding: '12px 24px', borderRadius: '8px', zIndex: 9999,
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)', fontWeight: '500'
                }}>
                    {toast}
                </div>
            )}
            <div className={styles.kpiGrid}>
                {enhancedKpis.map((kpi) => (
                    <div
                        key={kpi.id}
                        className={`${styles.kpiCard} ${activeKpi?.id === kpi.id ? styles.activeKpi : ''}`}
                        onClick={() => setActiveKpi(kpi)}
                        style={{ borderTop: `4px solid ${kpi.color}` }}
                    >
                        <div className={styles.kpiIcon} style={{ color: kpi.color }}>{kpi.icon}</div>
                        <div className={styles.kpiInfo}>
                            <div className={styles.kpiValue}>{kpi.value}</div>
                            <div className={styles.kpiLabel}>{kpi.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Contract Details Modal */}
            {selectedRecentContract && (
                <div className={styles.modalOverlay} onClick={() => setSelectedRecentContract(null)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div style={{ position: 'absolute', top: '24px', right: '24px', display: 'flex', gap: '12px', alignItems: 'center', zIndex: 10 }}>
                            <button 
                                onClick={() => handleDeleteClick(selectedRecentContract.id)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', display: 'flex', alignItems: 'center', padding: '4px' }}
                                title="Delete Contract"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="3 6 5 6 21 6"/>
                                  <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                                  <path d="M10 11v6"/>
                                  <path d="M14 11v6"/>
                                  <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                                </svg>
                            </button>
                            <button className={styles.closeModalBtn} style={{ position: 'static' }} onClick={() => setSelectedRecentContract(null)}>×</button>
                        </div>

                        <h3 className={styles.modalTitle}>{selectedRecentContract.title}</h3>
                        <p className={styles.modalCompany}>{selectedRecentContract.company}</p>

                        <div className={styles.modalSection}>
                            <h5>Contract Information</h5>
                            <div className={styles.modalGrid}>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>Contract ID</span>
                                    <span className={styles.infoValue} style={{ fontFamily: 'monospace', color: 'var(--accent-teal)' }}>{selectedRecentContract.id}</span>
                                </div>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>Value</span>
                                    <span className={styles.infoValue}>${(selectedRecentContract.value || 0).toLocaleString()}</span>
                                </div>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>Department</span>
                                    <span className={styles.infoValue}>{selectedRecentContract.review_stages?.[0] || selectedRecentContract.department}</span>
                                </div>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>Current Stage</span>
                                    <span className={styles.infoValue}>{selectedRecentContract.stage}</span>
                                </div>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>Submitted By</span>
                                    <span className={styles.infoValue}>{selectedRecentContract.submittedBy}</span>
                                </div>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>Status</span>
                                    <span className={styles.infoValue}>
                                        <span className={`${styles.statusBadge} ${
                                            selectedRecentContract.status === 'Approved' ? styles.good : 
                                            selectedRecentContract.status === 'Rejected' ? styles.critical : 
                                            selectedRecentContract.status === 'Draft' ? styles.statusDraft : 
                                            styles.warning
                                        }`}>
                                            {selectedRecentContract.status}
                                        </span>
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className={styles.modalSection}>
                            <h5>Department Review Status</h5>
                            <div className={styles.reviewStatusList}>
                                {(selectedRecentContract.review_stages || selectedRecentContract.required_reviewers || ['Legal', 'Finance', 'Compliance', 'Procurement']).map((dept) => {
                                    const legacyStatusField = `${dept.toLowerCase()}_status`;
                                    const status = selectedRecentContract?.reviews?.[dept]?.status || selectedRecentContract[legacyStatusField] || 'Not Started';

                                    let icon = <Minus size={20} strokeWidth={1.5} />;
                                    let badgeClass = '';
                                    let label = status;

                                    if (status === 'Approved') {
                                        icon = <CheckCircle size={20} strokeWidth={1.5} />;
                                        badgeClass = styles.good;
                                    } else if (status === 'Pending') {
                                        icon = <Hourglass size={20} strokeWidth={1.5} />;
                                        badgeClass = styles.warning;
                                    } else if (status === 'Rejected') {
                                        icon = <XCircle size={20} strokeWidth={1.5} />;
                                        badgeClass = styles.critical;
                                    }

                                    return (
                                        <div key={dept} className={styles.reviewStatusItem}>
                                            <span>{dept} Review</span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span className={`${styles.statusBadge} ${badgeClass}`}>{label}</span>
                                                <span className={styles.statusIcon}>{icon}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <AuditTrail contractId={selectedRecentContract.id} />
                    </div>
                </div>
            )}

            {/* KPI Detail Panel */}
            {activeKpi && (
                <div className={styles.kpiDetailTable}>
                    <div className={styles.detailHeader}>
                        <h4>Viewing: {activeKpi.label}</h4>
                        <button onClick={() => setActiveKpi(null)}>Close (X)</button>
                    </div>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Title</th>
                                <th>Company</th>
                                <th>Value</th>
                                <th>Status</th>
                                <th>Stage</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(() => {
                                let filtered = [];
                                switch (activeKpi.id) {
                                    case 'total': filtered = contracts; break;
                                    case 'review': filtered = contracts.filter(c => ['Under Review', 'Pending', 'Overdue'].includes(c.status)); break;
                                    case 'pending': filtered = contracts.filter(c => c.status === 'Pending'); break;
                                    case 'completed': filtered = contracts.filter(c => c.status === 'Completed'); break;
                                    case 'expiring': filtered = contracts.filter(c => c.stage === 'DOA Approval'); break;
                                    default: filtered = contracts;
                                }
                                return filtered.length > 0 ? (
                                    filtered.map(c => (
                                        <tr key={c.id}>
                                            <td className={styles.idCell}>{String(c.id).slice(-8)}</td>
                                            <td className={styles.titleCell}>{c.title}</td>
                                            <td>{c.company}</td>
                                            <td>${(c.value || 0).toLocaleString()}</td>
                                            <td>
                                                <span className={`${styles.statusBadge} ${
                                                    c.status === 'Approved' ? styles.good : 
                                                    c.status === 'Rejected' ? styles.critical : 
                                                    c.status === 'Draft' ? styles.statusDraft : 
                                                    styles.warning
                                                }`}>
                                                    {c.status}
                                                </span>
                                            </td>
                                            <td>{c.stage}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                                            No contracts found for {activeKpi.label}.
                                        </td>
                                    </tr>
                                );
                            })()}
                        </tbody>
                    </table>
                </div>
            )}

            <div className={styles.chartsRow}>
                <div className={styles.chartCard}>
                    <h3>Contract Status Distribution</h3>
                    <div className={styles.pieContainer}>
                        <div className={styles.donut} style={{ background: `conic-gradient(${pieGradient})` }}>
                            <div className={styles.donutHole}>
                                <span className={styles.donutTotal}>{contracts.length}</span>
                                <span className={styles.donutSub}>Contracts</span>
                            </div>
                        </div>
                        <div className={styles.legend}>
                            {statusData.map((d, i) => (
                                <div key={i} className={styles.legendItem}>
                                    <span style={{ backgroundColor: d.color }}></span>
                                    {d.label} ({d.value}%)
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className={styles.chartCard}>
                    <h3>Sales vs Contract Lifecycle</h3>
                    <div className={styles.barChartContainer}>
                        {barData.map((d, i) => (
                            <div key={i} className={styles.barGroup}>
                                <div className={styles.barStack}>
                                    <div className={styles.barPart} style={{ height: `${d.sales}%`, backgroundColor: '#3B82F6' }}>
                                        <span className={styles.barVal}>{d.sales}</span>
                                    </div>
                                    <div className={styles.barPart} style={{ height: `${d.contract}%`, backgroundColor: '#00C9B1' }}>
                                        <span className={styles.barVal}>{d.contract}</span>
                                    </div>
                                </div>
                                <span className={styles.barLabel}>{d.label}</span>
                            </div>
                        ))}
                        <div className={styles.barLegend}>
                            <div className={styles.legendItem}><span style={{ backgroundColor: '#3B82F6' }}></span> Sales Stage</div>
                            <div className={styles.legendItem}><span style={{ backgroundColor: '#00C9B1' }}></span> Contract Stage</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.bottomGrid} style={{ gridTemplateColumns: '1fr' }}>
                <div className={styles.collapsibleCard}>
                    <div className={styles.collapsibleHeader} onClick={() => setIsRecentExpanded(!isRecentExpanded)}>
                        <div className={styles.headerLeft}>
                            <span className={styles.headerIcon}><ClipboardList size={20} strokeWidth={1.5} /></span>
                            <span>Recent High-Priority Contracts</span>
                        </div>
                        <div className={styles.headerRight}>
                            <span className={styles.countBadge}>{contracts.length} contracts</span>
                            <div
                                className={styles.sortControl}
                                onClick={(event) => event.stopPropagation()}
                            >
                                <label htmlFor="recent-contract-sort" className={styles.sortLabel}>
                                    Sort
                                </label>
                                <select
                                    id="recent-contract-sort"
                                    className={styles.sortSelect}
                                    value={selectedSort}
                                    onChange={(event) => setSelectedSort(event.target.value)}
                                >
                                    {SORT_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div style={{display:'flex', gap:'4px', background:'rgba(255,255,255,0.05)',
                                         borderRadius:'8px', padding:'3px'}}>
                                <button
                                    type="button"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        setViewMode('card');
                                    }}
                                    style={{
                                        display:'flex', alignItems:'center', justifyContent:'center',
                                        padding:'4px 8px', borderRadius:'6px', border:'none', cursor:'pointer',
                                        background: viewMode === 'card' ? 'var(--bg-card)' : 'transparent',
                                        color: viewMode === 'card' ? 'var(--primary,#1a56db)' : 'var(--text-muted,#6b7280)',
                                        boxShadow: viewMode === 'card' ? '0 1px 3px rgba(0,0,0,0.2)' : 'none',
                                        transition: 'all 0.15s'
                                    }}
                                >
                                    <LayoutGrid size={16} strokeWidth={1.5} />
                                </button>
                                <button
                                    type="button"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        setViewMode('list');
                                    }}
                                    style={{
                                        display:'flex', alignItems:'center', justifyContent:'center',
                                        padding:'4px 8px', borderRadius:'6px', border:'none', cursor:'pointer',
                                        background: viewMode === 'list' ? 'var(--bg-card)' : 'transparent',
                                        color: viewMode === 'list' ? 'var(--primary,#1a56db)' : 'var(--text-muted,#6b7280)',
                                        boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.2)' : 'none',
                                        transition: 'all 0.15s'
                                    }}
                                >
                                    <List size={16} strokeWidth={1.5} />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className={`${styles.collapsibleContent} ${isRecentExpanded ? styles.expanded : ''}`}>
                        <div className={styles.filterTabs}>
                            {['All', 'Draft', 'Under Review', 'Approved'].map(status => (
                                <button 
                                    key={status} 
                                    className={`${styles.filterTab} ${filterStatus === status ? styles.filterTabActive : ''}`}
                                    onClick={() => setFilterStatus(status)}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                        <div className={styles.collapsibleBody}>
                            {visibleContracts.length > 0 ? (
                                viewMode === 'card' ? (
                                    <div className={styles.recentCardsGrid} style={{ marginTop: 0 }}>
                                        {visibleContracts.map((item) => (
                                            <div key={item.id} className={styles.recentCard}>
                                                <div>
                                                    <div className={styles.recentCardTitle}>{item.title}</div>
                                                    <div className={styles.recentCardCompany}>{item.company}</div>
                                                </div>
                                                <div className={styles.recentCardMeta}>
                                                    <span>Value<span className={styles.recentCardValue}>${(item.value || 0).toLocaleString()}</span></span>
                                                    <span>Dept<strong style={{ color: 'var(--text-primary)' }}>{item.review_stages?.[0] || item.department}</strong></span>
                                                </div>
                                                <div className={styles.statusBadgeWrap}>
                                                    <span className={`${styles.statusBadge} ${
                                                        item.status === 'Approved' ? styles.good : 
                                                        item.status === 'Rejected' ? styles.critical : 
                                                        item.status === 'Draft' ? styles.statusDraft : 
                                                        styles.warning
                                                    }`}>
                                                        {item.status}
                                                    </span>
                                                </div>
                                                <button className={styles.viewDetailsBtn} onClick={() => setSelectedRecentContract(item)}>
                                                    View Details
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <table className={styles.recentContractsTable}>
                                        <thead>
                                            <tr>
                                                {['Title','Company','Value','Dept','Status','Action'].map(h => (
                                                    <th key={h}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {visibleContracts.map((item, idx) => (
                                                <tr key={item.id} className={idx % 2 === 1 ? styles.recentContractsTableAltRow : ''}>
                                                    <td className={styles.recentContractsPrimaryCell}>{item.title}</td>
                                                    <td>{item.company}</td>
                                                    <td className={styles.recentContractsValueCell}>${(item.value || 0).toLocaleString()}</td>
                                                    <td>{item.review_stages?.[0] || item.department}</td>
                                                    <td>
                                                        <span className={`${styles.statusBadge} ${
                                                            item.status === 'Approved' ? styles.good : 
                                                            item.status === 'Rejected' ? styles.critical : 
                                                            item.status === 'Draft' ? styles.statusDraft : 
                                                            styles.warning
                                                        }`}>
                                                            {item.status}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <button className={styles.viewDetailsBtn} onClick={() => setSelectedRecentContract(item)}>
                                                            View Details
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )
                            ) : (
                                <div style={{ textAlign:'center', padding:'40px', color:'var(--text-muted)' }}>
                                    No {filterStatus !== 'All' ? filterStatus.toLowerCase() : ''} contracts found.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {deleteConfirm && (
                <div style={{
                    position: 'fixed', inset: 0,
                    background: 'rgba(0,0,0,0.7)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '12px',
                        padding: '28px 32px',
                        width: '400px',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '36px', marginBottom: '12px' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                                <path d="M10 11v6"/><path d="M14 11v6"/>
                                <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                            </svg>
                        </div>
                        <h3 style={{ color: 'var(--text-primary)', fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>
                            Delete Contract
                        </h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '24px', lineHeight: '1.6' }}>
                            Are you sure you want to delete this contract?<br/>
                            This action cannot be undone.
                        </p>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                style={{ padding: '9px 24px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteConfirm}
                                style={{ padding: '9px 24px', borderRadius: '8px', border: 'none', background: '#EF4444', color: '#fff', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const SalesDashboard = ({ onNavigate }) => {
    return (
        <div className={styles.salesHero}>
            <div className={styles.salesHeroContent}>
                <div className={styles.salesBadge}>Sales Workspace</div>
                <h1 className={styles.salesTitle}>Contract Management made simple.</h1>
                <p className={styles.salesSubtitle}>Effortlessly upload new agreements or manage existing ones through your streamlined portal.</p>
                
                <div className={styles.salesActionRow}>
                    <button 
                        className={styles.salesPrimaryBtn}
                        onClick={() => onNavigate('Upload Contracts')}
                    >
                        <div className={styles.btnIcon}><Upload size={22} /></div>
                        <div className={styles.btnText}>
                            <span className={styles.btnLabel}>Upload Contract</span>
                            <span className={styles.btnDesc}>Start AI extraction & routing</span>
                        </div>
                    </button>

                    <button 
                        className={styles.salesSecondaryBtn}
                        onClick={() => onNavigate('All Contracts')}
                    >
                        <div className={styles.btnIcon}><ClipboardList size={22} /></div>
                        <div className={styles.btnText}>
                            <span className={styles.btnLabel}>All Contracts</span>
                            <span className={styles.btnDesc}>View & filter repository</span>
                        </div>
                    </button>
                </div>
            </div>
            <div className={styles.heroVisual}>
                {/* Decorative element or illustration placeholder */}
                <div className={styles.visualCircle}></div>
                <div className={styles.visualGlass}>
                    <div className={styles.glassLine}></div>
                    <div className={styles.glassLine} style={{ width: '60%' }}></div>
                    <div className={styles.glassLine} style={{ width: '80%' }}></div>
                </div>
            </div>
        </div>
    );
};

const LegalDashboard = () => {
    const [contracts, setContracts] = React.useState([]);

    React.useEffect(() => {
        const fetchContracts = async () => {
            const { contractService } = await import('../services/contractService');
            const data = await contractService.getAllContracts();
            setContracts(data);
        };
        fetchContracts();
    }, []);

    const myContracts = contracts.filter(c => c.department === 'Legal' && ['Under Review', 'Pending', 'Overdue'].includes(c.status));
    const pendingCount = myContracts.length;
    const completedToday = contracts.filter(c => c.reviews?.Legal?.status === 'Approved').length || 0;
    const overdue = myContracts.filter(c => (c.daysPending || 0) > 5).length || 0;
    const dueToday = myContracts.filter(c => (c.daysPending || 0) === 0).length;
    const highRisk = contracts.filter(c => c.priority === 'High').length;
    const assignedToMe = myContracts.length;

    // Average review time
    const avgTime = myContracts.length > 0
        ? (myContracts.reduce((s, c) => s + (c.daysPending || 0), 0) / myContracts.length).toFixed(1)
        : '0';

    // Mock "Reviews completed over time" data (last 7 days)
    const reviewBarData = [
        { label: 'Mon', value: 3 },
        { label: 'Tue', value: 5 },
        { label: 'Wed', value: 2 },
        { label: 'Thu', value: 7 },
        { label: 'Fri', value: 4 },
        { label: 'Sat', value: 1 },
        { label: 'Sun', value: 0 },
    ];
    const maxBar = Math.max(...reviewBarData.map(d => d.value), 1);

    // Risk donut
    const riskCounts = { Low: 0, Medium: 0, High: 0 };
    contracts.forEach(c => { const p = c.priority || 'Medium'; if (riskCounts[p] !== undefined) riskCounts[p]++; });
    const riskTotal = riskCounts.Low + riskCounts.Medium + riskCounts.High || 1;
    const riskColors = { Low: '#10b981', Medium: '#f59e0b', High: '#ef4444' };
    let riskAngle = 0;
    const riskGradient = ['Low', 'Medium', 'High'].map(level => {
        const pct = (riskCounts[level] / riskTotal) * 360;
        const seg = `${riskColors[level]} ${riskAngle}deg ${riskAngle + pct}deg`;
        riskAngle += pct;
        return seg;
    }).join(', ');

    // Recent contracts assigned to Legal (last 3)
    const recentLegal = myContracts.slice(0, 3);

    const handleNavigation = () => {
        const elements = document.querySelectorAll('span');
        for (let el of elements) {
            if (el.textContent === 'Reviews' || el.textContent === 'Legal Review') {
                if (el.parentElement) el.parentElement.click();
                break;
            }
        }
    };

    return (
        <>
            {/* ── Primary KPIs ── */}
            <div className={styles.kpiGrid}>
                {[
                    { label: 'Assigned to Me', value: assignedToMe.toString(), icon: <ClipboardList size={20} strokeWidth={1.5} />, color: '#00C9B1' },
                    { label: 'Due Today', value: dueToday.toString(), icon: <Calendar size={20} strokeWidth={1.5} />, color: '#3B82F6' },
                    { label: 'Overdue', value: overdue.toString(), icon: <AlertTriangle size={20} strokeWidth={1.5} />, color: '#EF4444' },
                    { label: 'High Risk', value: highRisk.toString(), icon: <AlertCircle size={20} strokeWidth={1.5} />, color: '#DC2626' },
                    { label: 'Pending Reviews', value: pendingCount.toString(), icon: <Scale size={20} strokeWidth={1.5} />, color: '#F59E0B' },
                    { label: 'Completed Today', value: completedToday.toString(), icon: <CheckCircle size={20} strokeWidth={1.5} />, color: '#10B981' },
                    { label: 'Avg Review Time', value: `${avgTime}d`, icon: <Clock size={20} strokeWidth={1.5} />, color: '#8B5CF6' },
                    { label: 'Total Contracts', value: contracts.length.toString(), icon: <FileText size={20} strokeWidth={1.5} />, color: '#6366F1' },
                ].map((kpi, idx) => (
                    <div key={idx} className={styles.kpiCard} style={{ borderTop: `4px solid ${kpi.color}` }}>
                        <div className={styles.kpiIcon} style={{ color: kpi.color }}>{kpi.icon}</div>
                        <div className={styles.kpiInfo}>
                            <span className={styles.kpiValue}>{kpi.value}</span>
                            <span className={styles.kpiLabel}>{kpi.label}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Charts Row ── */}
            <div className={styles.chartsRow}>
                {/* Reviews Completed Over Time */}
                <div className={styles.chartCard}>
                    <h3>Reviews Completed (Last 7 Days)</h3>
                    <div className={styles.barChartContainer}>
                        {reviewBarData.map((d, i) => (
                            <div key={i} className={styles.barGroup}>
                                <div className={styles.barStack} style={{ height: '100%', justifyContent: 'flex-end' }}>
                                    <div
                                        className={styles.barPart}
                                        style={{ height: `${(d.value / maxBar) * 100}%`, backgroundColor: '#00C9B1', borderRadius: '6px 6px 0 0', minHeight: d.value > 0 ? '8px' : '0' }}
                                    >
                                        <span className={styles.barVal}>{d.value}</span>
                                    </div>
                                </div>
                                <span className={styles.barLabel}>{d.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Risk Distribution */}
                <div className={styles.chartCard}>
                    <h3>Risk Distribution</h3>
                    <div className={styles.pieContainer}>
                        <div className={styles.donut} style={{ background: `conic-gradient(${riskGradient})` }}>
                            <div className={styles.donutHole}>
                                <span className={styles.donutTotal}>{riskTotal}</span>
                                <span className={styles.donutSub}>Total</span>
                            </div>
                        </div>
                        <div className={styles.legend}>
                            {['Low', 'Medium', 'High'].map(level => (
                                <div key={level} className={styles.legendItem}>
                                    <span style={{ backgroundColor: riskColors[level] }}></span>
                                    {level} Risk ({riskCounts[level]})
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Bottom: Quick Links + Recent Contracts ── */}
            <div className={styles.bottomGrid}>
                <div className={styles.tableCard}>
                    <div className={styles.cardHeader}>
                        <h3>Quick Links</h3>
                    </div>
                    <div>
                        <button
                            onClick={handleNavigation}
                            style={{
                                backgroundColor: '#00C9B1', color: '#0A0F1E', padding: '12px 24px',
                                borderRadius: '8px', fontWeight: '700', border: 'none', cursor: 'pointer', fontSize: '14px'
                            }}
                        >
                            Go to Legal Review
                        </button>
                    </div>
                </div>

                <div className={styles.tableCard}>
                    <div className={styles.cardHeader}>
                        <h3>Recent Contracts</h3>
                    </div>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Company</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentLegal.length > 0 ? recentLegal.map((c) => (
                                <tr key={c.id}>
                                    <td className={styles.titleCell}>{c.title}</td>
                                    <td>{c.company}</td>
                                                                     <td>
                                        <span className={`${styles.statusBadge} ${
                                            c.status === 'Approved' ? styles.good : 
                                            c.status === 'Rejected' ? styles.critical : 
                                            c.status === 'Draft' ? styles.statusDraft :
                                            styles.warning
                                        }`}>
                                            {c.status}
                                        </span>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan="3" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>No recent contracts</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
};

const FinanceDashboard = () => {
    const [contracts, setContracts] = React.useState([]);

    React.useEffect(() => {
        const fetchContracts = async () => {
            const { contractService } = await import('../services/contractService');
            const data = await contractService.getAllContracts();
            setContracts(data);
        };
        fetchContracts();
    }, []);

    const myContracts = contracts.filter(c => c.department === 'Finance' && ['Under Review', 'Pending', 'Overdue'].includes(c.status));
    const pendingCount = myContracts.length;
    const completedToday = contracts.filter(c => c.reviews?.Finance?.status === 'Approved').length || 0;
    const overdue = myContracts.filter(c => (c.daysPending || 4) > 3).length || 0;

    return (
        <>
            <div className={styles.kpiGrid}>
                {[
                    { label: 'Pending Finance Reviews', value: pendingCount.toString(), icon: <CircleDollarSign size={20} strokeWidth={1.5} />, color: '#F59E0B' },
                    { label: 'Completed Today', value: completedToday.toString(), icon: <CheckCircle size={20} strokeWidth={1.5} />, color: '#00C9B1' },
                    { label: 'Overdue', value: overdue.toString(), icon: <AlertTriangle size={20} strokeWidth={1.5} />, color: '#EF4444' },
                    { label: 'Avg Review Time', value: '0.8 days', icon: <Clock size={20} strokeWidth={1.5} />, color: '#3B82F6' },
                ].map((kpi, idx) => (
                    <div key={idx} className={styles.kpiCard} style={{ borderTop: `4px solid ${kpi.color}` }}>
                        <div className={styles.kpiIcon} style={{ color: kpi.color }}>{kpi.icon}</div>
                        <div className={styles.kpiInfo}>
                            <span className={styles.kpiValue}>{kpi.value}</span>
                            <span className={styles.kpiLabel}>{kpi.label}</span>
                        </div>
                    </div>
                ))}
            </div>
            <div className={styles.bottomGrid}>
                <div className={styles.tableCard} style={{ gridColumn: '1 / -1' }}>
                    <h3 style={{ marginBottom: '16px' }}>Finance Department Activity</h3>
                    <p style={{ color: 'var(--text-muted)' }}>Review specific KPIs and activities relating to the finance module.</p>
                </div>
            </div>
        </>
    );
};

const ComplianceDashboard = () => {
    const [contracts, setContracts] = React.useState([]);

    React.useEffect(() => {
        const fetchContracts = async () => {
            const { contractService } = await import('../services/contractService');
            const data = await contractService.getAllContracts();
            setContracts(data);
        };
        fetchContracts();
    }, []);

    const myContracts = contracts.filter(c => c.department === 'Compliance' && ['Under Review', 'Pending', 'Overdue'].includes(c.status));
    const pendingCount = myContracts.length;
    const completedToday = contracts.filter(c => c.reviews?.Compliance?.status === 'Approved').length || 0;
    const overdue = myContracts.filter(c => (c.daysPending || 4) > 3).length || 0;

    return (
        <>
            <div className={styles.kpiGrid}>
                {[
                    { label: 'Pending Compliance', value: pendingCount.toString(), icon: <Shield size={20} strokeWidth={1.5} />, color: '#F59E0B' },
                    { label: 'Completed Today', value: completedToday.toString(), icon: <CheckCircle size={20} strokeWidth={1.5} />, color: '#00C9B1' },
                    { label: 'Overdue', value: overdue.toString(), icon: <AlertTriangle size={20} strokeWidth={1.5} />, color: '#EF4444' },
                    { label: 'Avg Review Time', value: '1.5 days', icon: <Clock size={20} strokeWidth={1.5} />, color: '#3B82F6' },
                ].map((kpi, idx) => (
                    <div key={idx} className={styles.kpiCard} style={{ borderTop: `4px solid ${kpi.color}` }}>
                        <div className={styles.kpiIcon} style={{ color: kpi.color }}>{kpi.icon}</div>
                        <div className={styles.kpiInfo}>
                            <span className={styles.kpiValue}>{kpi.value}</span>
                            <span className={styles.kpiLabel}>{kpi.label}</span>
                        </div>
                    </div>
                ))}
            </div>
            <div className={styles.bottomGrid}>
                <div className={styles.tableCard} style={{ gridColumn: '1 / -1' }}>
                    <h3 style={{ marginBottom: '16px' }}>Compliance Department Activity</h3>
                    <p style={{ color: 'var(--text-muted)' }}>Review specific KPIs and activities relating to the compliance module.</p>
                </div>
            </div>
        </>
    );
};

const ProcurementDashboard = () => {
    const [contracts, setContracts] = React.useState([]);

    React.useEffect(() => {
        const fetchContracts = async () => {
            const { contractService } = await import('../services/contractService');
            const data = await contractService.getAllContracts();
            setContracts(data);
        };
        fetchContracts();
    }, []);

    const myContracts = contracts.filter(c => c.department === 'Procurement' && ['Under Review', 'Pending', 'Overdue'].includes(c.status));
    const pendingCount = myContracts.length;
    const completedToday = contracts.filter(c => c.reviews?.Procurement?.status === 'Approved').length || 0;
    const overdue = myContracts.filter(c => (c.daysPending || 4) > 3).length || 0;

    return (
        <>
            <div className={styles.kpiGrid}>
                {[
                    { label: 'Pending Procurement', value: pendingCount.toString(), icon: <ShoppingCart size={20} strokeWidth={1.5} />, color: '#F59E0B' },
                    { label: 'Completed Today', value: completedToday.toString(), icon: <CheckCircle size={20} strokeWidth={1.5} />, color: '#00C9B1' },
                    { label: 'Overdue', value: overdue.toString(), icon: <AlertTriangle size={20} strokeWidth={1.5} />, color: '#EF4444' },
                    { label: 'Avg Review Time', value: '2.1 days', icon: <Clock size={20} strokeWidth={1.5} />, color: '#3B82F6' },
                ].map((kpi, idx) => (
                    <div key={idx} className={styles.kpiCard} style={{ borderTop: `4px solid ${kpi.color}` }}>
                        <div className={styles.kpiIcon} style={{ color: kpi.color }}>{kpi.icon}</div>
                        <div className={styles.kpiInfo}>
                            <span className={styles.kpiValue}>{kpi.value}</span>
                            <span className={styles.kpiLabel}>{kpi.label}</span>
                        </div>
                    </div>
                ))}
            </div>
            <div className={styles.bottomGrid}>
                <div className={styles.tableCard} style={{ gridColumn: '1 / -1' }}>
                    <h3 style={{ marginBottom: '16px' }}>Procurement Department Activity</h3>
                    <p style={{ color: 'var(--text-muted)' }}>Review specific KPIs and activities relating to the procurement module.</p>
                </div>
            </div>
        </>
    );
};

const ManagerDashboard = () => {
    const [stats, setStats] = React.useState(null);
    const [contracts, setContracts] = React.useState([]);

    const loadData = async () => {
        const { approvalService } = await import('../services/approvalService');
        const { dashboardService } = await import('../services/dashboardService');
        
        const [approvalData, statsData] = await Promise.all([
            approvalService.getPendingApprovals('Manager'),
            dashboardService.getDashboardKPIs()
        ]);
        
        setContracts(approvalData);
        setStats(statsData);
    };

    React.useEffect(() => {
        loadData();
    }, []);

    const handleApproval = async (id, decision) => {
        const { approvalService } = await import('../services/approvalService');
        await approvalService.submitApproval(id, decision);
        await loadData();
    };

    return (
        <>
            <div className={styles.kpiGrid}>
                {[
                    { label: 'Pending Approvals', value: contracts.length.toString(), icon: <Hourglass size={20} strokeWidth={1.5} />, color: '#F59E0B' },
                    { label: 'Approved This Month', value: stats?.approvedThisMonth?.toString() ?? '0', icon: <CheckCircle size={20} strokeWidth={1.5} />, color: '#00C9B1' },
                    { label: 'Escalated to VP', value: '0', icon: <ArrowUpCircle size={20} strokeWidth={1.5} />, color: '#8B5CF6' },
                    { label: 'Avg Approval Time', value: '--', icon: <Clock size={20} strokeWidth={1.5} />, color: '#3B82F6' },
                ].map((kpi, idx) => (
                    <div key={idx} className={styles.kpiCard} style={{ borderTop: `4px solid ${kpi.color}` }}>
                        <div className={styles.kpiIcon} style={{ color: kpi.color }}>{kpi.icon}</div>
                        <div className={styles.kpiInfo}>
                            <span className={styles.kpiValue}>{kpi.value}</span>
                            <span className={styles.kpiLabel}>{kpi.label}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className={styles.tableCard} style={{ gridColumn: '1 / -1' }}>
                <div className={styles.cardHeader}>
                    <h3>Pending Approvals (L1 Manager)</h3>
                </div>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Contract Title</th>
                            <th>Value</th>
                            <th>DOA Level</th>
                            <th>Requested By</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {contracts.length > 0 ? contracts.map((item) => (
                            <tr key={item.id}>
                                <td className={styles.idCell}>{item.id}</td>
                                <td className={styles.titleCell}>{item.title}</td>
                                <td>${(item.value || 0).toLocaleString()}</td>
                                <td>Manager</td>
                                <td>{item.submittedBy}</td>
                                <td style={{ display: 'flex', gap: '8px' }}>
                                    <button onClick={() => handleApproval(item.id, 'Approved')} className={styles.actionBtn} style={{ backgroundColor: '#10B981' }}>Approve</button>
                                    <button onClick={() => handleApproval(item.id, 'Rejected')} className={styles.actionBtn} style={{ backgroundColor: '#EF4444' }}>Reject</button>
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '24px' }}>No records available</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </>
    );
};

const CEODashboard = () => {
    const [contracts, setContracts] = React.useState([]);

    const loadData = async () => {
        const { approvalService } = await import('../services/approvalService');
        const data = await approvalService.getPendingApprovals('VP'); // CEO views VP's queue essentially or broader
        setContracts(data);
    };

    React.useEffect(() => {
        loadData();
    }, []);

    const handleApproval = async (id, decision) => {
        const { approvalService } = await import('../services/approvalService');
        await approvalService.submitApproval(id, decision);
        await loadData();
    };

    return (
        <>
            <div className={styles.kpiGrid}>
                {[
                    { label: 'VP Pending Approvals', value: contracts.length.toString(), icon: <Hourglass size={20} strokeWidth={1.5} />, color: '#F59E0B' },
                    { label: 'High Value Contracts', value: contracts.length.toString(), icon: <Gem size={20} strokeWidth={1.5} />, color: '#8B5CF6' },
                    { label: 'Total Pipeline Value', value: '--', icon: <CircleDollarSign size={20} strokeWidth={1.5} />, color: '#00C9B1' },
                    { label: 'Company Win Rate', value: '--', icon: <TrendingUp size={20} strokeWidth={1.5} />, color: '#3B82F6' },
                ].map((kpi, idx) => (
                    <div key={idx} className={styles.kpiCard} style={{ borderTop: `4px solid ${kpi.color}` }}>
                        <div className={styles.kpiIcon} style={{ color: kpi.color }}>{kpi.icon}</div>
                        <div className={styles.kpiInfo}>
                            <span className={styles.kpiValue}>{kpi.value}</span>
                            <span className={styles.kpiLabel}>{kpi.label}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className={styles.tableCard} style={{ gridColumn: '1 / -1' }}>
                <div className={styles.cardHeader}>
                    <h3>High Value Contracts (&gt; $50,000)</h3>
                </div>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Contract Title</th>
                            <th>Value</th>
                            <th>Current Stage</th>
                            <th>Requested By</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {contracts.length > 0 ? contracts.map((item) => (
                            <tr key={item.id}>
                                <td className={styles.idCell}>{item.id}</td>
                                <td className={styles.titleCell}>{item.title}</td>
                                <td>${(item.value || 0).toLocaleString()}</td>
                                <td>{item.stage}</td>
                                <td>{item.submittedBy}</td>
                                <td style={{ display: 'flex', gap: '8px' }}>
                                    <button onClick={() => handleApproval(item.id, 'Approved')} className={styles.actionBtn} style={{ backgroundColor: '#10B981' }}>Approve</button>
                                    <button onClick={() => handleApproval(item.id, 'Rejected')} className={styles.actionBtn} style={{ backgroundColor: '#EF4444' }}>Reject</button>
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '24px' }}>No records available</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </>
    );
};

const Dashboard = ({ user, refreshTrigger, onNavigate }) => {
    const [activeKpi, setActiveKpi] = useState(null);

    const getDashboardHeader = () => {
        switch (user?.role) {
            case 'Admin': return 'Admin Dashboard';
            case 'Sales': return 'Sales Workspace';
            case 'Legal': return 'Legal Counsel Dashboard';
            case 'Finance': return 'Finance Approval Dashboard';
            case 'Compliance': return 'Compliance Dashboard';
            case 'Procurement': return 'Procurement Dashboard';
            case 'Manager': return 'Manager Approval Dashboard';
            case 'CEO': return 'CEO Approval Dashboard';
            default: return 'User Dashboard';
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.dashboardHeader}>
                <h2>{getDashboardHeader()}</h2>
            </header>

            {user?.role === 'Admin' && <AdminDashboard activeKpi={activeKpi} setActiveKpi={setActiveKpi} />}
            {user?.role === 'Sales' && <SalesDashboard onNavigate={onNavigate} />}
            {user?.role === 'Legal' && <LegalDashboard />}
            {user?.role === 'Finance' && <FinanceDashboard />}
            {user?.role === 'Compliance' && <ComplianceDashboard />}
            {user?.role === 'Procurement' && <ProcurementDashboard />}
            {user?.role === 'Manager' && <ManagerDashboard />}
            {user?.role === 'CEO' && <CEODashboard />}
        </div>
    );
};

export default Dashboard;
