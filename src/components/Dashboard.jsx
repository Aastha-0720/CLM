import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Dashboard.module.css';
import { 
    FileText, Search, Hourglass, PenTool, AlertTriangle, 
    CircleDollarSign, CheckCircle, Minus, FileEdit, ClipboardList, 
    Calendar, AlertCircle, Scale, Clock, Shield, ShoppingCart, 
    ArrowUpCircle, Gem, TrendingUp, LayoutGrid, List, Users, Activity,
    Settings as SettingsIcon, Server, Mail, CheckSquare,
    Cpu, HardDrive, Network, Zap, Database, Bell
} from 'lucide-react';
import { 
    PieChart, Pie, LineChart, Line, BarChart, Bar, 
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
    ResponsiveContainer, Cell, AreaChart, Area
} from 'recharts';

const kpiData = [
    { id: 'active', label: 'Total Active Contracts', value: '1,284', icon: <FileText size={20} strokeWidth={1.5} />, color: '#00C9B1', trend: '+12%' },
    { id: 'pending', label: 'Pending Approvals', value: '24', icon: <Hourglass size={20} strokeWidth={1.5} />, color: '#F59E0B', trend: '+5' },
    { id: 'review', label: 'Contracts Under Review', value: '42', icon: <Search size={20} strokeWidth={1.5} />, color: '#3B82F6', trend: '-3' },
    { id: 'signatures', label: 'Pending Signatures', value: '18', icon: <PenTool size={20} strokeWidth={1.5} />, color: '#8B5CF6', trend: '+2' },
    { id: 'expiring', label: 'Expiring This Month', value: '14', icon: <AlertTriangle size={20} strokeWidth={1.5} />, color: '#EF4444', trend: 'Critical' },
    { id: 'pipeline', label: 'Pipeline Deal Value', value: '$4.2M', icon: <CircleDollarSign size={20} strokeWidth={1.5} />, color: '#10B981', trend: '+18%' },
];

const AdminDashboard = ({ activeKpi, setActiveKpi }) => {
    const [stats, setStats] = React.useState(null);
    const [contracts, setContracts] = React.useState([]);
    const [selectedRecentContract, setSelectedRecentContract] = React.useState(null);
    const [isRecentExpanded, setIsRecentExpanded] = React.useState(true);
    const [toast, setToast] = React.useState('');
    const [deleteConfirm, setDeleteConfirm] = React.useState(null); // stores contract id to delete
    const [viewMode, setViewMode] = React.useState('card'); // 'card' | 'list'

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
                method: 'DELETE'
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
    }, []);

    const handleStatusChange = async (id, status, stage) => {
        const { contractService } = await import('../services/contractService');
        await contractService.updateContractStage(id, status, stage);
        await loadData();
    };

    // Enhance KPIs using real data
    const awaitingSignatureCount = contracts.filter(c => c.stage === 'CAS Generated').length;
    const expiringSoonCount = contracts.filter(c => c.stage === 'DOA Approval').length;
    const underReviewCount = contracts.filter(c => c.stage === 'Under Review').length;
    const pendingApprovalCount = contracts.filter(c => c.status === 'Pending').length;

    const enhancedKpis = [
        { id: 'total', label: 'Total Contracts', value: contracts.length, icon: <FileText size={20} strokeWidth={1.5} />, color: '#00C9B1' },
        { id: 'review', label: 'Under Review', value: underReviewCount, icon: <Search size={20} strokeWidth={1.5} />, color: '#3B82F6' },
        { id: 'pending', label: 'Pending Approvals', value: pendingApprovalCount, icon: <Hourglass size={20} strokeWidth={1.5} />, color: '#F59E0B' },
        { id: 'signatures', label: 'Awaiting Signature', value: awaitingSignatureCount, icon: <PenTool size={20} strokeWidth={1.5} />, color: '#8B5CF6' },
        { id: 'expiring', label: 'Expiring Soon', value: expiringSoonCount, icon: <AlertTriangle size={20} strokeWidth={1.5} />, color: '#EF4444' }
    ];

    // Donut Chart Real Data
    const activeCount = contracts.filter(c => c.status === 'Approved').length;
    const draftCount = contracts.filter(c => c.status === 'Draft').length;
    const expiredCount = contracts.filter(c => c.stage === 'Rejected').length; // Prompt specified 'stage === Rejected'

    const statusData = [
        { label: 'Active', value: activeCount, color: '#00C9B1' },
        { label: 'Review', value: underReviewCount, color: '#3B82F6' },
        { label: 'Draft', value: draftCount, color: '#8B5CF6' },
        { label: 'Expired', value: expiredCount, color: '#EF4444' }
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
        { label: 'Signature', sales: 15, contract: 95 }
    ];

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
                                    <span className={styles.infoValue}>{selectedRecentContract.department}</span>
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
                                        <span className={`${styles.statusBadge} ${selectedRecentContract.status === 'Approved' ? styles.good : selectedRecentContract.status === 'Rejected' ? styles.critical : styles.warning}`}>
                                            {selectedRecentContract.status}
                                        </span>
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className={styles.modalSection}>
                            <h5>Department Review Status</h5>
                            <div className={styles.reviewStatusList}>
                                {['Legal', 'Finance', 'Compliance', 'Procurement'].map((dept) => {
                                    // Mocked logic for UI purposes based on current stage
                                    const isApproved = selectedRecentContract.status === 'Approved' ||
                                        (selectedRecentContract.stage !== 'Under Review' &&
                                            selectedRecentContract.stage !== `${dept} Review` &&
                                            selectedRecentContract.stage !== 'Draft');

                                    const isPending = selectedRecentContract.stage === `${dept} Review` ||
                                        (selectedRecentContract.stage === 'Under Review' && !isApproved);

                                    let icon = <Hourglass size={20} strokeWidth={1.5} />;
                                    let badgeClass = styles.warning;
                                    let label = 'Pending';

                                    if (isApproved) {
                                        icon = <CheckCircle size={20} strokeWidth={1.5} />;
                                        badgeClass = styles.good;
                                        label = 'Approved';
                                    } else if (!isPending && selectedRecentContract.stage === 'Draft') {
                                        icon = <Minus size={20} strokeWidth={1.5} />;
                                        badgeClass = '';
                                        label = 'Not Started';
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
                                    case 'review': filtered = contracts.filter(c => c.stage === 'Under Review'); break;
                                    case 'pending': filtered = contracts.filter(c => c.status === 'Pending'); break;
                                    case 'signatures': filtered = contracts.filter(c => c.stage === 'CAS Generated'); break;
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
                                                <span className={`${styles.statusBadge} ${c.status === 'Approved' ? styles.good : c.status === 'Rejected' ? styles.critical : styles.warning}`}>
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
                            <div style={{display:'flex', gap:'4px', background:'rgba(255,255,255,0.05)',
                                         borderRadius:'8px', padding:'3px'}}>
                                <button
                                    onClick={() => setViewMode('card')}
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
                                    onClick={() => setViewMode('list')}
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
                        <div className={styles.collapsibleBody}>
                            {contracts.length > 0 ? (
                                viewMode === 'card' ? (
                                    <div className={styles.recentCardsGrid} style={{ marginTop: 0 }}>
                                        {contracts.map((item) => (
                                            <div key={item.id} className={styles.recentCard}>
                                                <div>
                                                    <div className={styles.recentCardTitle}>{item.title}</div>
                                                    <div className={styles.recentCardCompany}>{item.company}</div>
                                                </div>
                                                <div className={styles.recentCardMeta}>
                                                    <span>Value<span className={styles.recentCardValue}>${(item.value || 0).toLocaleString()}</span></span>
                                                    <span>Dept<strong style={{ color: 'var(--text-primary)' }}>{item.department}</strong></span>
                                                </div>
                                                <div className={styles.statusBadgeWrap}>
                                                    <span className={`${styles.statusBadge} ${item.status === 'Approved' ? styles.good : item.status === 'Rejected' ? styles.critical : styles.warning}`}>
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
                                    <table style={{ width:'100%', borderCollapse:'collapse' }}>
                                        <thead>
                                            <tr style={{ borderBottom:'1px solid var(--border-color,#e5e7eb)' }}>
                                                {['Title','Company','Value','Dept','Status','Action'].map(h => (
                                                    <th key={h} style={{ textAlign:'left', padding:'8px 12px', fontSize:'12px',
                                                        fontWeight:600, color:'var(--text-muted,#6b7280)',
                                                        textTransform:'uppercase', letterSpacing:'0.05em' }}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {contracts.map((item, idx) => (
                                                <tr key={item.id} style={{ borderBottom:'1px solid var(--border-color,#e5e7eb)',
                                                    background: idx % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.02)' }}>
                                                    <td style={{ padding:'10px 12px', fontSize:'13px', fontWeight:500, color:'var(--text-primary)' }}>{item.title}</td>
                                                    <td style={{ padding:'10px 12px', fontSize:'13px', color:'var(--text-muted)' }}>{item.company}</td>
                                                    <td style={{ padding:'10px 12px', fontSize:'13px', color:'var(--text-primary)' }}>${(item.value || 0).toLocaleString()}</td>
                                                    <td style={{ padding:'10px 12px', fontSize:'13px', color:'var(--text-muted)' }}>{item.department}</td>
                                                    <td style={{ padding:'10px 12px' }}>
                                                        <span className={`${styles.statusBadge} ${item.status === 'Approved' ? styles.good : item.status === 'Rejected' ? styles.critical : styles.warning}`}>
                                                            {item.status}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding:'10px 12px' }}>
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
                                    No contracts found. Upload contracts to get started.
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

const SalesDashboard = () => {
    const [contracts, setContracts] = React.useState([]);

    React.useEffect(() => {
        const fetchContracts = async () => {
            const { contractService } = await import('../services/contractService');
            const data = await contractService.getAllContracts();
            // Filter only Sales department
            const salesContracts = data.filter(c => c.department === 'Sales');
            setContracts(salesContracts);
        };
        fetchContracts();
    }, []);

    const formatCurrency = (val) => `$${(val / 1000000).toFixed(1)}M`;
    const pipelineValue = contracts.reduce((sum, c) => sum + (Number(c.value) || 0), 0);
    const approved = contracts.filter(c => c.status === 'Approved').length;
    const underReview = contracts.filter(c => c.stage === 'Under Review' || c.stage === 'Legal Review').length;

    return (
        <>
            <div className={styles.kpiGrid}>
                {[
                    { label: 'My Submitted Contracts', value: contracts.length.toString(), icon: <FileEdit size={20} strokeWidth={1.5} />, color: '#00C9B1' },
                    { label: 'Under Review', value: underReview.toString(), icon: <Search size={20} strokeWidth={1.5} />, color: '#F59E0B' },
                    { label: 'Approved This Month', value: approved.toString(), icon: <CheckCircle size={20} strokeWidth={1.5} />, color: '#10B981' },
                    { label: 'My Pipeline Value', value: pipelineValue > 0 ? formatCurrency(pipelineValue) : '$0.0M', icon: <CircleDollarSign size={20} strokeWidth={1.5} />, color: '#3B82F6' },
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

            <div className={styles.tableCard}>
                <div className={styles.cardHeader}>
                    <h3>My Contracts</h3>
                </div>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Contract ID</th>
                            <th>Customer Name</th>
                            <th>Value</th>
                            <th>Stage</th>
                            <th>Status</th>
                            <th>Submitted By</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {contracts.length > 0 ? contracts.map((c) => (
                            <tr key={c.id}>
                                <td className={styles.idCell}>{c.id}</td>
                                <td className={styles.titleCell}>{c.company}</td>
                                <td>${(c.value || 0).toLocaleString()}</td>
                                <td>{c.stage}</td>
                                <td><span className={`${styles.statusBadge} ${c.status === 'Approved' ? styles.good :
                                    c.status === 'Rejected' ? styles.critical : styles.warning
                                    }`}>{c.status}</span></td>
                                <td>{c.submittedBy}</td>
                                <td><button className={styles.actionBtn}>View</button></td>
                            </tr>
                        )) : (
                            <tr><td colSpan="7" style={{ textAlign: 'center', padding: '24px' }}>No records available</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </>
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

    const myContracts = contracts.filter(c => c.stage === 'Under Review' || c.stage === 'Legal Review');
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
                                        <span className={`${styles.statusBadge} ${c.status === 'Approved' ? styles.good : c.status === 'Rejected' ? styles.critical : styles.warning}`}>
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

    const myContracts = contracts.filter(c => c.stage === 'Finance Review');
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

    const myContracts = contracts.filter(c => c.stage === 'Compliance Review');
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

    const myContracts = contracts.filter(c => c.stage === 'Procurement Review');
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
    const [contracts, setContracts] = React.useState([]);

    const loadData = async () => {
        const { approvalService } = await import('../services/approvalService');
        const data = await approvalService.getPendingApprovals('Manager');
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
                    { label: 'Pending Approvals', value: contracts.length.toString(), icon: <Hourglass size={20} strokeWidth={1.5} />, color: '#F59E0B' },
                    { label: 'Approved This Month', value: '15', icon: <CheckCircle size={20} strokeWidth={1.5} />, color: '#00C9B1' }, // Hard to calculate retrospectively without proper tracking, leaving mock for now or 0
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

const UserDashboard = ({ user }) => {
    const navigate = useNavigate();
    const [contracts, setContracts] = React.useState([]);
    const [activity, setActivity] = React.useState([]);
    const [tasks, setTasks] = React.useState([]);

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                const { contractService } = await import('../services/contractService');
                const { dashboardService } = await import('../services/dashboardService');
                
                // Fetch contracts (backend filters for current user)
                const data = await contractService.getAllContracts();
                setContracts(data);
                
                // Fetch user activity logs
                try {
                    const logs = await dashboardService.getUserActivity();
                    setActivity(logs);
                } catch (e) {
                    console.error("Failed to fetch activity", e);
                    setActivity([]);
                }
                
                // Fetch notifications (tasks)
                try {
                    const notifs = await contractService.getNotifications(user.role);
                    
                    // Also find contracts requiring action
                    const actionContracts = data.filter(c => c.status === 'Draft' || c.status === 'Rejected').map(c => ({
                        id: c.id,
                        message: `Contract "${c.title}" needs your attention (${c.status})`,
                        type: 'action',
                        createdAt: c.updatedAt || c.createdAt || Date.now()
                    }));
                    
                    setTasks([...notifs, ...actionContracts].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5));
                } catch (e) {
                    console.error("Failed to fetch tasks", e);
                }
            } catch (err) {
                console.error("User dashboard fetch failed", err);
            }
        };
        fetchData();
    }, [user.name, user.role]);

    // Calculate Metrics
    const now = new Date();
    const expiringCount = contracts.filter(c => {
        if (!c.expiry_date) return false;
        const days = (new Date(c.expiry_date) - now) / (1000 * 60 * 60 * 24);
        return days > 0 && days <= 30;
    }).length;

    const stats = {
        total: contracts.length,
        reviews: contracts.filter(c => c.stage?.includes('Review') || c.status === 'Under Review').length,
        approvals: contracts.filter(c => c.status === 'Pending Approval' || c.stage?.includes('Approval')).length,
        expiring: expiringCount
    };

    return (
        <div className={styles.userDashboard}>
            <div className={styles.welcomeSection}>
                <h1>Welcome, {user.name}!</h1>
                <p>Here is an overview of your contract activities.</p>
            </div>

            <div className={styles.kpiGrid}>
                {[
                    { label: 'My Contracts', value: stats.total, icon: <FileText size={20} />, color: '#00C9B1' },
                    { label: 'Pending Reviews', value: stats.reviews, icon: <Search size={20} />, color: '#8B5CF6' },
                    { label: 'Pending Approvals', value: stats.approvals, icon: <Hourglass size={20} />, color: '#F59E0B' },
                    { label: 'Expiring Soon', value: stats.expiring, icon: <AlertCircle size={20} />, color: '#EF4444' },
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

            <div className={styles.bottomGrid} style={{ gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                {/* My Tasks Section */}
                <div className={styles.tableCard} style={{ margin: 0 }}>
                    <div className={styles.cardHeader}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}><CheckSquare size={18} /> My Tasks</h3>
                    </div>
                    <div style={{ padding: '0 20px 20px 20px' }}>
                        {tasks.length > 0 ? tasks.map((t, idx) => (
                            <div key={idx} style={{ padding: '12px 0', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{t.message}</div>
                                <button className={styles.viewDetailsBtn} style={{ padding: '4px 10px', fontSize: '11px', margin: 0 }} onClick={() => navigate('/user/contracts')}>Assess</button>
                            </div>
                        )) : (
                            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>You have no pending tasks.</div>
                        )}
                    </div>
                </div>

                {/* Recent Activity Section */}
                <div className={styles.tableCard} style={{ margin: 0 }}>
                    <div className={styles.cardHeader}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}><Activity size={18} /> Recent Activity</h3>
                    </div>
                    <div style={{ padding: '0 20px 20px 20px' }}>
                        {activity.length > 0 ? activity.slice(0,5).map((log, idx) => (
                            <div key={idx} style={{ padding: '12px 0', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '12px' }}>
                                <div style={{ minWidth: '8px', height: '8px', borderRadius: '50%', background: '#3B82F6', marginTop: '6px' }}></div>
                                <div>
                                    <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: '600' }}>{log.action}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{log.details}</div>
                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{new Date(log.timestamp).toLocaleString()}</span>
                                </div>
                            </div>
                        )) : (
                            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>No recent activity found.</div>
                        )}
                    </div>
                </div>
            </div>

            <div className={styles.tableCard} style={{ gridColumn: '1 / -1' }}>
                <div className={styles.cardHeader}>
                    <h3>Recent Contracts</h3>
                </div>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Company</th>
                            <th>Value</th>
                            <th>Status</th>
                            <th>Stage</th>
                        </tr>
                    </thead>
                    <tbody>
                        {contracts.length > 0 ? contracts.slice(0, 5).map((c) => (
                            <tr key={c.id}>
                                <td className={styles.titleCell}>{c.title}</td>
                                <td>{c.company}</td>
                                <td>${(c.value || 0).toLocaleString()}</td>
                                <td>
                                    <span className={`${styles.statusBadge} ${c.status === 'Approved' ? styles.good : c.status === 'Rejected' ? styles.critical : styles.warning}`}>
                                        {c.status}
                                    </span>
                                </td>
                                <td>{c.stage}</td>
                            </tr>
                        )) : (
                            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '24px' }}>No contracts found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};



const SuperadminDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = React.useState({ 
        users: 0, admins: 0, contracts: 0, totalValue: 0,
        drafts: 0, underReview: 0, pending: 0, executed: 0,
        pendingDOA: 0, delayed: 0, sentSignature: 0, signed: 0, pendingSign: 0
    });
    const [recentLogs, setRecentLogs] = React.useState([]);
    const [chartData, setChartData] = React.useState({
        status: [], time: [], dept: [], pipeline: []
    });
    const [alerts, setAlerts] = React.useState([]);
    const [health, setHealth] = React.useState({ api: 'Pending', database: 'Pending', email: 'Pending', digiInk: 'Pending' });

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                const { contractService } = await import('../services/contractService');
                const contracts = await contractService.getAllContracts();
                const totalValue = contracts.reduce((sum, c) => sum + (Number(c.value) || 0), 0);
                
                const userRes = await fetch('/api/admin/users');
                const users = await userRes.json();
                
                const logRes = await fetch('/api/admin/audit-logs');
                const logs = await logRes.json();
                
                // Helper for delayed calculation
                const now = new Date();
                const checkDelayed = (dateStr, days = 5) => {
                    if (!dateStr) return false;
                    const updated = new Date(dateStr);
                    const diffDays = (now - updated) / (1000 * 60 * 60 * 24);
                    return diffDays > days;
                };

                // Identify Alerts
                const newAlerts = [];
                contracts.forEach(c => {
                    // 1. Expiring Soon (Next 7 days)
                    if (c.expiry_date) {
                        const expiry = new Date(c.expiry_date);
                        const diffDays = (expiry - now) / (1000 * 60 * 60 * 24);
                        if (diffDays > 0 && diffDays <= 7) {
                            newAlerts.push({
                                id: c._id || c.id,
                                title: 'Contract Expiring Soon',
                                message: `"${c.title}" expires in ${Math.ceil(diffDays)} days.`,
                                type: 'warning',
                                icon: <AlertCircle size={16} />,
                                fileName: c.title
                            });
                        }
                    }

                    // 2. Overdue Approvals (> 5 days)
                    if (c.status === 'Pending Approval' && checkDelayed(c.updatedAt, 5)) {
                        newAlerts.push({
                            id: c._id || c.id,
                            title: 'Overdue Approval',
                            message: `"${c.title}" has been pending approval for over 5 days.`,
                            type: 'danger',
                            icon: <AlertTriangle size={16} />,
                            fileName: c.title
                        });
                    }

                    // 3. Signature Issues (> 48h)
                    if ((c.status === 'Sent for Signature' || c.status === 'Pending Signature') && checkDelayed(c.updatedAt, 2)) {
                        newAlerts.push({
                            id: c._id || c.id,
                            title: 'Signature Stalled',
                            message: `"${c.title}" is pending signature for more than 48 hours.`,
                            type: 'danger',
                            icon: <PenTool size={16} />,
                            fileName: c.title
                        });
                    }
                });
                setAlerts(newAlerts.slice(0, 5)); // Show top 5 alerts

                // Process Chart Data
                const statusMap = contracts.reduce((acc, c) => {
                    const s = c.status || 'Draft';
                    acc[s] = (acc[s] || 0) + 1;
                    return acc;
                }, {});
                const statusData = Object.keys(statusMap).map(name => ({ name, value: statusMap[name] }));

                const deptMap = contracts.reduce((acc, c) => {
                    const d = c.department || 'General';
                    acc[d] = (acc[d] || 0) + 1;
                    return acc;
                }, {});
                const deptData = Object.keys(deptMap).map(name => ({ name, count: deptMap[name] }));

                // Group by month
                const timeMap = contracts.reduce((acc, c) => {
                    const date = new Date(c.createdAt || Date.now());
                    const month = date.toLocaleString('default', { month: 'short' });
                    acc[month] = (acc[month] || 0) + 1;
                    return acc;
                }, {});
                const timeData = Object.keys(timeMap).map(name => ({ name, count: timeMap[name] }));

                // Pipeline vs Stage (Mocking logic based on existing data if fields missing)
                const pipelineData = [
                    { name: 'Lead', pipeline: 12, contract: 2 },
                    { name: 'Quote', pipeline: 8, contract: 4 },
                    { name: 'Negotiation', pipeline: 15, contract: 9 },
                    { name: 'Closing', pipeline: 6, contract: 5 },
                ];

                setStats({
                    users: users.filter(u => u.role === 'User').length,
                    admins: users.filter(u => u.role === 'Admin' || u.role === 'Legal' || u.role === 'Finance').length,
                    contracts: contracts.length,
                    totalValue,
                    drafts: contracts.filter(c => c.status === 'Draft' || c.stage === 'Draft').length,
                    underReview: contracts.filter(c => c.status === 'Under Review' || c.stage?.includes('Review')).length,
                    pending: contracts.filter(c => c.status === 'Pending Approval' || c.stage === 'Manager Approval').length,
                    executed: contracts.filter(c => c.status === 'Executed' || c.status === 'Signed' || c.status === 'Active').length,
                    pendingDOA: contracts.filter(c => c.status === 'Pending Approval').length,
                    delayed: contracts.filter(c => c.status === 'Pending Approval' && checkDelayed(c.updatedAt)).length,
                    sentSignature: contracts.filter(c => c.status === 'Sent for Signature').length,
                    signed: contracts.filter(c => c.status === 'Signed' || c.status === 'Executed').length,
                    pendingSign: contracts.filter(c => c.status === 'Pending Signature').length
                });
                setChartData({ status: statusData, time: timeData, dept: deptData, pipeline: pipelineData });
                setRecentLogs(logs.slice(0, 20)); // show up to 20 logs

                const healthRes = await fetch('/api/admin/health');
                const healthData = await healthRes.json();
                setHealth(healthData);
            } catch (err) {
                console.error("Dashboard data fetch failed", err);
            }
        };
        fetchData();
    }, []);

    const STATUS_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#94A3B8', '#8B5CF6'];

    return (
        <div className={styles.superadminDashboard}>
            <div className={styles.welcomeSection} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1>System Overview</h1>
                    <p>Global monitoring and administrative control panel.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {alerts.length > 0 && (
                        <div style={{ padding: '4px 12px', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', borderRadius: '100px', fontSize: '11px', fontWeight: '800', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                            {alerts.length} ACTIVE ALERTS
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Actions Bar */}
            <div className={styles.quickActionsBar}>
                <button className={styles.quickActionBtn} onClick={() => navigate('/superadmin/manage-admins')}>
                    <Shield size={18} />
                    <span>Create Admin</span>
                </button>
                <button className={styles.quickActionBtn} onClick={() => navigate('/superadmin/manage-users')}>
                    <Users size={18} />
                    <span>Add User</span>
                </button>
                <button className={styles.quickActionBtn} onClick={() => navigate('/superadmin/settings')}>
                    <SettingsIcon size={18} />
                    <span>Configure DOA</span>
                </button>
                <button className={styles.quickActionBtn} onClick={() => navigate('/superadmin/contracts')}>
                    <FileText size={18} />
                    <span>View Contracts</span>
                </button>
            </div>

            {/* Alerts Panel */}
            {alerts.length > 0 && (
                <div className={styles.alertsPanel}>
                    {alerts.map((alert, idx) => (
                        <div 
                            key={idx} 
                            className={`${styles.alertItem} ${alert.type === 'warning' ? styles.warning : ''}`}
                            onClick={() => window.location.hash = `#/contracts?search=${encodeURIComponent(alert.fileName)}`}
                        >
                            <div className={styles.alertIcon} style={{ background: alert.type === 'warning' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: alert.type === 'warning' ? '#F59E0B' : '#EF4444' }}>
                                {alert.icon}
                            </div>
                            <div className={styles.alertContent}>
                                <div className={styles.alertTitle}>{alert.title}</div>
                                <div className={styles.alertMessage}>{alert.message}</div>
                            </div>
                            <div className={styles.alertAction}>
                                View Details &rarr;
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Top Row: System Metrics */}
            <div className={styles.kpiGrid}>
                {[
                    { label: 'Total Users', value: stats.users, icon: <Users size={20} />, color: '#3B82F6' },
                    { label: 'Active Admins', value: stats.admins, icon: <Shield size={20} />, color: '#8B5CF6' },
                    { label: 'Total Contracts', value: stats.contracts, icon: <FileText size={20} />, color: '#00C9B1' },
                    { label: 'System Value', value: `$${(stats.totalValue / 1000000).toFixed(1)}M`, icon: <CircleDollarSign size={20} />, color: '#F59E0B' },
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

            {/* Charts Row 1: Status and Trends */}
            <div className={styles.chartsGrid}>
                <div className={styles.chartCard}>
                    <h3><LayoutGrid size={18} /> Contracts by Status</h3>
                    <div className={styles.chartContainer}>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={chartData.status}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {chartData.status.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className={styles.chartCard}>
                    <h3><TrendingUp size={18} /> Creation Trends</h3>
                    <div className={styles.chartContainer}>
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={chartData.time}>
                                <defs>
                                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                                <YAxis stroke="var(--text-muted)" fontSize={12} />
                                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: '#fff' }} />
                                <Area type="monotone" dataKey="count" stroke="#3B82F6" fillOpacity={1} fill="url(#colorCount)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Charts Row 2: Department and Pipeline */}
            <div className={styles.chartsGrid}>
                <div className={styles.chartCard}>
                    <h3><Scale size={18} /> Department Distribution</h3>
                    <div className={styles.chartContainer}>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={chartData.dept}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                                <YAxis stroke="var(--text-muted)" fontSize={12} />
                                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: '#fff' }} />
                                <Bar dataKey="count" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className={styles.chartCard}>
                    <h3><List size={18} /> Pipeline vs Contract Stage</h3>
                    <div className={styles.chartContainer}>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={chartData.pipeline}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                                <YAxis stroke="var(--text-muted)" fontSize={12} />
                                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: '#fff' }} />
                                <Legend />
                                <Bar dataKey="pipeline" fill="#F59E0B" name="Sales Pipeline" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="contract" fill="#10B981" name="Contract Stage" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Second Row: Contract Status Breakdown */}
            <div style={{ marginTop: '24px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Contract Lifecycle Status
                </h3>
                <div className={styles.kpiGrid}>
                    {[
                        { label: 'Draft Contracts', value: stats.drafts, icon: <PenTool size={20} />, color: '#94A3B8' },
                        { label: 'Under Review', value: stats.underReview, icon: <Search size={20} />, color: '#3B82F6' },
                        { label: 'Pending Approval', value: stats.pending, icon: <Hourglass size={20} />, color: '#F59E0B' },
                        { label: 'Executed / Signed', value: stats.executed, icon: <CheckCircle size={20} />, color: '#10B981' },
                    ].map((kpi, idx) => (
                        <div key={idx} className={styles.kpiCard} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ 
                                    width: '36px', height: '36px', borderRadius: '8px', 
                                    background: `${kpi.color}15`, color: kpi.color,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    {React.cloneElement(kpi.icon, { size: 18 })}
                                </div>
                                <div className={styles.kpiInfo}>
                                    <span style={{ fontSize: '20px', fontWeight: '800', color: '#fff' }}>{kpi.value}</span>
                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>{kpi.label}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Third Row: Approval & Signature Tracking */}
            <div style={{ marginTop: '-16px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Approval & Signature Tracking
                </h3>
                <div className={styles.kpiGrid} style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
                    {[
                        { label: 'Pending DOA', value: stats.pendingDOA, icon: <ClipboardList size={20} />, color: '#3B82F6' },
                        { label: 'Delayed (>5 Days)', value: stats.delayed, icon: <AlertCircle size={20} />, color: '#EF4444' },
                        { label: 'Sent for Sign', value: stats.sentSignature, icon: <ArrowUpCircle size={20} />, color: '#8B5CF6' },
                        { label: 'Signed/Done', value: stats.signed, icon: <Gem size={20} />, color: '#10B981' },
                        { label: 'Pending Sign', value: stats.pendingSign, icon: <PenTool size={20} />, color: '#F59E0B' },
                    ].map((kpi, idx) => (
                        <div key={idx} className={styles.kpiCard} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', padding: '16px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div style={{ color: kpi.color }}>{React.cloneElement(kpi.icon, { size: 20 })}</div>
                                <div className={styles.kpiInfo}>
                                    <span style={{ fontSize: '24px', fontWeight: '800', color: '#fff' }}>{kpi.value}</span>
                                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>{kpi.label}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Fourth Row: System Health Monitoring */}
            <div style={{ marginTop: '24px', marginBottom: '24px' }}>
                <div className={styles.healthPanel}>
                    <div className={styles.healthHeader}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', margin: 0 }}>
                            <Activity size={18} /> System Health & Integrations
                        </h3>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Real-time Status</span>
                    </div>
                    <div className={styles.healthGrid}>
                        <div className={styles.healthItem}>
                            <div className={styles.healthIcon}><Server size={18} /></div>
                            <div className={styles.healthInfo}>
                                <span className={styles.healthLabel}>Core API</span>
                                <div className={styles.healthStatus}>
                                    <span className={`${styles.statusDot} ${health.api === 'Running' ? styles.online : styles.offline}`}></span>
                                    <span className={health.api === 'Running' ? styles.statusTextOnline : styles.statusTextOffline}>{health.api}</span>
                                </div>
                            </div>
                        </div>
                        <div className={styles.healthItem}>
                            <div className={styles.healthIcon}><LayoutGrid size={18} /></div>
                            <div className={styles.healthInfo}>
                                <span className={styles.healthLabel}>Database</span>
                                <div className={styles.healthStatus}>
                                    <span className={`${styles.statusDot} ${health.database === 'Running' ? styles.online : styles.offline}`}></span>
                                    <span className={health.database === 'Running' ? styles.statusTextOnline : styles.statusTextOffline}>{health.database}</span>
                                </div>
                            </div>
                        </div>
                        <div className={styles.healthItem}>
                            <div className={styles.healthIcon}><Mail size={18} /></div>
                            <div className={styles.healthInfo}>
                                <span className={styles.healthLabel}>Email Service</span>
                                <div className={styles.healthStatus}>
                                    <span className={`${styles.statusDot} ${health.email === 'Running' ? styles.online : styles.offline}`}></span>
                                    <span className={health.email === 'Running' ? styles.statusTextOnline : styles.statusTextOffline}>{health.email}</span>
                                </div>
                            </div>
                        </div>
                        <div className={styles.healthItem}>
                            <div className={styles.healthIcon}><CheckSquare size={18} /></div>
                            <div className={styles.healthInfo}>
                                <span className={styles.healthLabel}>DigiInk Sign</span>
                                <div className={styles.healthStatus}>
                                    <span className={`${styles.statusDot} ${health.digiInk === 'Running' ? styles.online : styles.offline}`}></span>
                                    <span className={health.digiInk === 'Running' ? styles.statusTextOnline : styles.statusTextOffline}>{health.digiInk}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.bottomGrid}>
                <div className={styles.tableCard}>
                    <div className={styles.cardHeader}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Clock size={18} /> Recent System Activity
                        </h3>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>
                            {recentLogs.length} events
                        </span>
                    </div>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Timestamp</th>
                                <th>User</th>
                                <th>Action</th>
                                <th>Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentLogs.length > 0 ? recentLogs.map((log, idx) => {
                                // Determine badge color by action type
                                const actionColors = {
                                    'Create Contract': { bg: 'rgba(0, 201, 177, 0.12)', color: '#00C9B1' },
                                    'Save Draft': { bg: 'rgba(148, 163, 184, 0.12)', color: '#94A3B8' },
                                    'Contract Review': { bg: 'rgba(59, 130, 246, 0.12)', color: '#3B82F6' },
                                    'DOA Approval': { bg: 'rgba(245, 158, 11, 0.12)', color: '#F59E0B' },
                                    'CAS Approval': { bg: 'rgba(139, 92, 246, 0.12)', color: '#8B5CF6' },
                                    'Create User': { bg: 'rgba(16, 185, 129, 0.12)', color: '#10B981' },
                                    'Delete User': { bg: 'rgba(239, 68, 68, 0.12)', color: '#EF4444' },
                                };
                                const badge = actionColors[log.action] || { bg: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' };
                                return (
                                    <tr key={idx}>
                                        <td style={{ whiteSpace: 'nowrap', fontSize: '12px', color: 'var(--text-muted)' }}>
                                            {new Date(log.timestamp).toLocaleString()}
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: '700', fontSize: '13px' }}>{log.user}</div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                                <span style={{ background: 'rgba(255,255,255,0.05)', padding: '1px 6px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.08)' }}>
                                                    {log.role}
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <span style={{ background: badge.bg, color: badge.color, padding: '4px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: '800', whiteSpace: 'nowrap' }}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '300px' }}>
                                            {log.details}
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                    <Clock size={24} style={{ opacity: 0.3, marginBottom: '8px', display: 'block', margin: '0 auto 8px' }} />
                                    No activity logs yet. Actions like creating contracts, approvals, and user management will appear here.
                                </td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const Dashboard = ({ user }) => {
    const [activeKpi, setActiveKpi] = useState(null);

    const getDashboardHeader = () => {
        switch (user?.role) {
            case 'Admin': return 'Admin Dashboard';
            case 'Sales': return 'My Sales Dashboard';
            case 'Legal': return 'Legal Counsel Dashboard';
            case 'Finance': return 'Finance Approval Dashboard';
            case 'Compliance': return 'Compliance Dashboard';
            case 'Procurement': return 'Procurement Dashboard';
            case 'Manager': return 'Manager Approval Dashboard';
            case 'CEO': return 'CEO Approval Dashboard';
            case 'User': return 'User Dashboard';
            case 'Superadmin': return 'Superadmin Control Panel';
            default: return 'User Dashboard';
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.dashboardHeader}>
                <h2>{getDashboardHeader()}</h2>
            </header>

            {user?.role === 'Admin' && <AdminDashboard activeKpi={activeKpi} setActiveKpi={setActiveKpi} />}
            {user?.role === 'Sales' && <SalesDashboard />}
            {user?.role === 'Legal' && <LegalDashboard />}
            {user?.role === 'Finance' && <FinanceDashboard />}
            {user?.role === 'Compliance' && <ComplianceDashboard />}
            {user?.role === 'Procurement' && <ProcurementDashboard />}
            {user?.role === 'Manager' && <ManagerDashboard />}
            {user?.role === 'CEO' && <CEODashboard />}
            {user?.role === 'User' && <UserDashboard user={user} />}
            {user?.role === 'Superadmin' && <SuperadminDashboard />}
        </div>
    );
};

export default Dashboard;
