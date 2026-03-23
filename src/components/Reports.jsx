import React, { useState, useEffect, useMemo } from 'react';
import styles from './Reports.module.css';
import { contractService } from '../services/contractService';

const Reports = ({ user }) => {
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [statusFilter, setStatusFilter] = useState('All');
    const [deptFilter, setDeptFilter] = useState('All');
    const [riskFilter, setRiskFilter] = useState('All');

    // Sorting
    const [sortKey, setSortKey] = useState('title');
    const [sortDir, setSortDir] = useState('asc');
    const [logSortKey, setLogSortKey] = useState('date');
    const [logSortDir, setLogSortDir] = useState('desc');

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const data = await contractService.getAllContracts();
                let filtered = data || [];
                if (user?.role && ['Legal', 'Finance', 'Compliance', 'Procurement'].includes(user.role)) {
                    filtered = filtered.filter(c => c.department === user.role);
                }
                setContracts(filtered);
            } catch (e) {
                console.error("Failed to load report data", e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    // ──── Derived Analytics ────
    const totalContracts = contracts.length;
    const totalVal = contracts.reduce((s, c) => s + (Number(c.value) || 0), 0);

    // Risk Level Counts
    const riskCounts = useMemo(() => {
        const counts = { Low: 0, Medium: 0, High: 0 };
        contracts.forEach(c => {
            const p = c.priority || 'Medium';
            if (counts[p] !== undefined) counts[p]++;
        });
        return counts;
    }, [contracts]);

    // Average Review Time (mock: daysPending average)
    const avgReviewTime = useMemo(() => {
        if (!contracts.length) return 0;
        const total = contracts.reduce((s, c) => s + (c.daysPending || 0), 0);
        return (total / contracts.length).toFixed(1);
    }, [contracts]);

    // Department workload
    const deptWorkload = useMemo(() => {
        const map = {};
        contracts.forEach(c => {
            const d = c.department || 'Unassigned';
            map[d] = (map[d] || 0) + 1;
        });
        return Object.entries(map).map(([dept, count]) => ({ dept, count })).sort((a, b) => b.count - a.count);
    }, [contracts]);

    // Delayed contracts (daysPending > 5)
    const delayedContracts = useMemo(() => contracts.filter(c => (c.daysPending || 0) > 5), [contracts]);

    // Status counts
    const statusCounts = useMemo(() => {
        const acc = {};
        contracts.forEach(c => {
            const s = c.status || 'Draft';
            acc[s] = (acc[s] || 0) + 1;
        });
        return acc;
    }, [contracts]);

    const sortedLog = useMemo(() => {
        const logs = contracts.slice(0, 10).map(c => ({
            date: c.updatedAt || c.createdAt || '',
            user: c.submittedBy || 'System',
            action: c.status || c.stage || 'Draft',
            id: c.id,
            title: c.title || ''
        }));
        return logs.sort((a, b) => {
            const va = a[logSortKey] ?? '';
            const vb = b[logSortKey] ?? '';
            return logSortDir === 'asc'
                ? String(va).localeCompare(String(vb))
                : String(vb).localeCompare(String(va));
        });
    }, [contracts, logSortKey, logSortDir]);

    // ──── Filtered & Sorted Contracts ────
    const filteredContracts = useMemo(() => {
        let result = [...contracts];
        if (statusFilter !== 'All') result = result.filter(c => (c.status || 'Draft') === statusFilter);
        if (deptFilter !== 'All') result = result.filter(c => (c.department || 'Unassigned') === deptFilter);
        if (riskFilter !== 'All') result = result.filter(c => (c.priority || 'Medium') === riskFilter);
        result.sort((a, b) => {
            const va = a[sortKey] ?? '';
            const vb = b[sortKey] ?? '';
            if (typeof va === 'number' && typeof vb === 'number') {
                return sortDir === 'asc' ? va - vb : vb - va;
            }
            return sortDir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
        });
        return result;
    }, [contracts, statusFilter, deptFilter, riskFilter, sortKey, sortDir]);

    // ──── Unique Values for Filters ────
    const uniqueStatuses = [...new Set(contracts.map(c => c.status || 'Draft'))];
    const uniqueDepts = [...new Set(contracts.map(c => c.department || 'Unassigned'))];

    // ──── Sort Toggle ────
    const handleSort = (key) => {
        if (sortKey === key) {
            setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDir('asc');
        }
    };

    const sortIndicator = (key) => {
        if (sortKey !== key) return ' ↕';
        return sortDir === 'asc' ? ' ↑' : ' ↓';
    };

    const handleLogSort = (key) => {
        if (logSortKey === key) {
            setLogSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setLogSortKey(key);
            setLogSortDir('asc');
        }
    };

    const logSortIndicator = (key) => {
        if (logSortKey !== key) return ' ↕';
        return logSortDir === 'asc' ? ' ↑' : ' ↓';
    };

    // ──── Export CSV ────
    const exportToCSV = () => {
        if (!filteredContracts.length) return;
        const headers = ['ID', 'Title', 'Company', 'Status', 'Stage', 'Department', 'Value', 'Risk', 'Days Pending', 'Submitted By'];
        const rows = [headers.join(',')];
        filteredContracts.forEach(c => {
            rows.push([
                '#' + (c.id || '').slice(-8).toUpperCase(), `"${(c.title || '').replace(/"/g, '""')}"`, `"${(c.company || '').replace(/"/g, '""')}"`,
                c.status || '', c.stage || '', c.department || '', c.value || 0,
                c.priority || 'Medium', c.daysPending || 0, `"${(c.submittedBy || '').replace(/"/g, '""')}"`
            ].join(','));
        });
        const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `contracts_report_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    // ──── Export PDF (Mock) ────
    const exportToPDF = () => {
        const rows = filteredContracts.map(c => `
            <tr>
                <td>#${(c.id||'').slice(-8).toUpperCase()}</td>
                <td>${c.title||''}</td>
                <td>${c.company||''}</td>
                <td>${c.status||'Draft'}</td>
                <td>${c.department||''}</td>
                <td>$${Number(c.value||0).toLocaleString()}</td>
                <td>${c.priority||'Medium'}</td>
            </tr>`).join('');

        const html = `<!DOCTYPE html><html><head>
            <title>Contracts Report</title>
            <style>
                @page { margin: 20mm; }
                body { font-family: Arial, sans-serif; color: #1a1a2e; }
                .header { border-bottom: 3px solid #00C9B1; padding-bottom: 12px; margin-bottom: 20px; }
                h1 { font-size: 20px; margin: 0 0 4px; }
                p { color: var(--text-muted); font-size: 12px; margin: 0; }
                table { width: 100%; border-collapse: collapse; margin-top: 16px; }
                th { background: #f1f5f9; color: #475569; font-size: 10px; text-transform: uppercase;
                     letter-spacing: 1px; padding: 10px; text-align: left; border-bottom: 2px solid var(--text-primary); }
                td { padding: 10px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
                tr:nth-child(even) { background: #f8fafc; }
                .footer { text-align: center; margin-top: 32px; font-size: 11px; color: #94a3b8;
                          border-top: 1px solid var(--text-primary); padding-top: 12px; }
            </style></head><body>
            <div class="header">
                <h1>Contracts Report — Infinia CLM System</h1>
                <p>Generated: ${new Date().toLocaleString()} &nbsp;|&nbsp; Total: ${filteredContracts.length} contracts</p>
            </div>
            <table>
                <thead><tr>
                    <th>Ref ID</th><th>Title</th><th>Company</th>
                    <th>Status</th><th>Dept</th><th>Value</th><th>Risk</th>
                </tr></thead>
                <tbody>${rows}</tbody>
            </table>
            <div class="footer">Infinia CLM System &nbsp;|&nbsp; Confidential &nbsp;|&nbsp; For Internal Use Only</div>
            </body></html>`;

        const win = window.open('', '_blank', 'width=900,height=700');
        win.document.write(html);
        win.document.close();
        setTimeout(() => win.print(), 500);
    };

    // ──── Donut Chart Helper ────
    const riskColors = { Low: '#10b981', Medium: '#f59e0b', High: '#ef4444' };
    const riskTotal = riskCounts.Low + riskCounts.Medium + riskCounts.High || 1;
    const donutGradient = useMemo(() => {
        let angle = 0;
        const segments = [];
        ['Low', 'Medium', 'High'].forEach(level => {
            const pct = (riskCounts[level] / riskTotal) * 360;
            segments.push(`${riskColors[level]} ${angle}deg ${angle + pct}deg`);
            angle += pct;
        });
        return `conic-gradient(${segments.join(', ')})`;
    }, [riskCounts]);

    // ──── Bar chart helper for dept workload ────
    const maxDeptCount = Math.max(...deptWorkload.map(d => d.count), 1);

    if (loading) {
        return <div className={styles.container} style={{ justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>Loading reports...</div>;
    }

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.pageHeader}>
                <div className={styles.titleArea}>
                    <h2 className={styles.pageTitle}>Reports & Analytics</h2>
                    <p className={styles.pageSubtitle}>Comprehensive insights into contracts, risk, workload and performance.</p>
                </div>
                <div className={styles.headerActions}>
                    <button className={styles.exportCsv} onClick={exportToCSV}>📥 Export CSV</button>
                    <button className={styles.exportPdf} onClick={exportToPDF}>📄 Export PDF</button>
                </div>
            </div>

            {/* ── KPI Row ── */}
            <div className={styles.statsRow}>
                <div className={styles.kpiCard}>
                    <div className={styles.kpiIcon} style={{ backgroundColor: '#00C9B115', color: '#00C9B1' }}>📄</div>
                    <div className={styles.kpiData}>
                        <div className={styles.kpiValue}>{totalContracts}</div>
                        <div className={styles.kpiLabel}>Total Contracts</div>
                    </div>
                </div>
                <div className={styles.kpiCard}>
                    <div className={styles.kpiIcon} style={{ backgroundColor: '#3B82F615', color: '#3B82F6' }}>💰</div>
                    <div className={styles.kpiData}>
                        <div className={styles.kpiValue}>${(totalVal / 1000).toFixed(1)}k</div>
                        <div className={styles.kpiLabel}>Total Value</div>
                    </div>
                </div>
                <div className={styles.kpiCard}>
                    <div className={styles.kpiIcon} style={{ backgroundColor: '#A855F715', color: '#A855F7' }}>⏱</div>
                    <div className={styles.kpiData}>
                        <div className={styles.kpiValue}>{avgReviewTime} days</div>
                        <div className={styles.kpiLabel}>Avg. Review Time</div>
                    </div>
                </div>
                <div className={styles.kpiCard}>
                    <div className={styles.kpiIcon} style={{ backgroundColor: '#EF444415', color: '#EF4444' }}>⚠️</div>
                    <div className={styles.kpiData}>
                        <div className={styles.kpiValue}>{delayedContracts.length}</div>
                        <div className={styles.kpiLabel}>Delayed Contracts</div>
                    </div>
                </div>
            </div>

            {/* ── Charts Row ── */}
            <div className={styles.chartsRow} style={{ gridTemplateColumns: '1fr 400px' }}>
                {/* Department Workload Bar Chart */}
                <div className={styles.chartCard}>
                    <div className={styles.cardHeader}><h3>Department-wise Workload</h3></div>
                    <div className={styles.barChartContainer}>
                        <div className={styles.barGrid}>
                            {deptWorkload.map((d, i) => (
                                <div key={i} className={styles.barGroup}>
                                    <div className={styles.barWrapper}>
                                        <div
                                            className={styles.bar}
                                            style={{ height: `${(d.count / maxDeptCount) * 100}%` }}
                                        >
                                            <span className={styles.barValue}>{d.count}</span>
                                        </div>
                                    </div>
                                    <span className={styles.barLabel}>{d.dept}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Risk Distribution Donut */}
                <div className={styles.chartCard}>
                    <div className={styles.cardHeader}><h3>Risk Distribution</h3></div>
                    <div className={styles.donutChartSection}>
                        <div className={styles.donutWrapper}>
                            <div className={styles.donut} style={{ background: donutGradient }}>
                                <div className={styles.donutHole}>
                                    <span className={styles.donutTotal}>{riskTotal}</span>
                                    <span className={styles.donutSub}>Total</span>
                                </div>
                            </div>
                        </div>
                        <div className={styles.donutLegend}>
                            {['Low', 'Medium', 'High'].map(level => (
                                <div key={level} className={styles.legendItem}>
                                    <span className={styles.legendDot} style={{ backgroundColor: riskColors[level] }}></span>
                                    <span className={styles.legendName}>{level} Risk</span>
                                    <span className={styles.legendValue}>{riskCounts[level]}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Contracts by Status Table ── */}
            <div className={styles.chartsRow} style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className={styles.tableCard}>
                    <div className={styles.cardHeader} style={{ padding: '24px', borderBottom: '1px solid var(--border-color)' }}>
                        <h3>Contracts by Status</h3>
                    </div>
                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Status</th>
                                    <th>Count</th>
                                    <th>Percentage</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(statusCounts).sort((a, b) => b[1] - a[1]).map(([status, count], i) => (
                                    <tr key={i}>
                                        <td className={styles.titleCell}>{status}</td>
                                        <td className={styles.valueCell}>{count}</td>
                                        <td>{totalContracts ? Math.round((count / totalContracts) * 100) : 0}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Delayed Contracts */}
                <div className={styles.tableCard}>
                    <div className={styles.cardHeader} style={{ padding: '24px', borderBottom: '1px solid var(--border-color)' }}>
                        <h3>Delayed Contracts (Overdue &gt; 5 days)</h3>
                    </div>
                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Company</th>
                                    <th>Days Overdue</th>
                                    <th>Risk</th>
                                </tr>
                            </thead>
                            <tbody>
                                {delayedContracts.length === 0 ? (
                                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>No delayed contracts 🎉</td></tr>
                                ) : delayedContracts.map((c, i) => (
                                    <tr key={i}>
                                        <td className={styles.titleCell}>{c.title}</td>
                                        <td>{c.company}</td>
                                        <td style={{ color: '#ef4444', fontWeight: 700 }}>{c.daysPending} days</td>
                                        <td>
                                            <span className={styles.statusBadge} style={{
                                                background: c.priority === 'High' ? 'rgba(239,68,68,0.15)' : c.priority === 'Medium' ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)',
                                                color: c.priority === 'High' ? '#ef4444' : c.priority === 'Medium' ? '#f59e0b' : '#10b981'
                                            }}>
                                                {c.priority || 'Medium'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* ── Filters ── */}
            <div className={styles.filterSection}>
                <div className={styles.filterGroup}>
                    <label>Status</label>
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                        <option value="All">All Statuses</option>
                        {uniqueStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div className={styles.filterGroup}>
                    <label>Department</label>
                    <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
                        <option value="All">All Departments</option>
                        {uniqueDepts.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>
                <div className={styles.filterGroup}>
                    <label>Risk Level</label>
                    <select value={riskFilter} onChange={e => setRiskFilter(e.target.value)}>
                        <option value="All">All Risks</option>
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                    </select>
                </div>
            </div>

            {/* ── Main Contracts Table (sortable) ── */}
            <div className={styles.tableCard}>
                <div className={styles.cardHeader} style={{ padding: '24px', borderBottom: '1px solid var(--border-color)' }}>
                    <h3>All Contracts ({filteredContracts.length})</h3>
                </div>
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('id')}>ID{sortIndicator('id')}</th>
                                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('title')}>Title{sortIndicator('title')}</th>
                                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('company')}>Company{sortIndicator('company')}</th>
                                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('status')}>Status{sortIndicator('status')}</th>
                                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('department')}>Dept{sortIndicator('department')}</th>
                                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('value')}>Value{sortIndicator('value')}</th>
                                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('priority')}>Risk{sortIndicator('priority')}</th>
                                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('daysPending')}>Days{sortIndicator('daysPending')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredContracts.length === 0 ? (
                                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No contracts match the selected filters.</td></tr>
                            ) : filteredContracts.map((c, i) => (
                                <tr key={i}>
                                    <td className={styles.idCell}>#{(c.id || '').slice(-8).toUpperCase()}</td>
                                    <td className={styles.titleCell}>{c.title}</td>
                                    <td>{c.company}</td>
                                    <td>
                                        <span className={styles.statusBadge} style={{
                                            background: c.status === 'Approved' ? 'rgba(16,185,129,0.15)' : c.status === 'Rejected' ? 'rgba(239,68,68,0.15)' : 'rgba(59,130,246,0.15)',
                                            color: c.status === 'Approved' ? '#10b981' : c.status === 'Rejected' ? '#ef4444' : '#3b82f6'
                                        }}>
                                            {c.status || 'Draft'}
                                        </span>
                                    </td>
                                    <td>{c.department || 'N/A'}</td>
                                    <td className={styles.valueCell}>${Number(c.value).toLocaleString()}</td>
                                    <td>
                                        <span className={styles.statusBadge} style={{
                                            background: c.priority === 'High' ? 'rgba(239,68,68,0.15)' : c.priority === 'Medium' ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)',
                                            color: c.priority === 'High' ? '#ef4444' : c.priority === 'Medium' ? '#f59e0b' : '#10b981'
                                        }}>
                                            {c.priority || 'Medium'}
                                        </span>
                                    </td>
                                    <td style={{ color: (c.daysPending || 0) > 5 ? '#ef4444' : 'inherit', fontWeight: (c.daysPending || 0) > 5 ? 700 : 400 }}>
                                        {c.daysPending || 0}d
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Recent Activity Log ── */}
            <div className={styles.auditLogCard}>
                <div className={styles.cardHeader} style={{ marginBottom: '16px' }}>
                    <h3>Recent Activity Log</h3>
                </div>
                <div className={styles.logList}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '100px 80px 160px 100px 1fr',
                        padding: '8px 0',
                        borderBottom: '1px solid var(--border-color)',
                        marginBottom: '4px'
                    }}>
                        <span onClick={() => handleLogSort('date')} 
                            style={{fontSize:'10px',fontWeight:'600',color: logSortKey==='date' ? '#00C9B1' : 'var(--text-muted)',
                            textTransform:'uppercase',letterSpacing:'1px',cursor:'pointer'}}>
                            DATE{logSortIndicator('date')}
                        </span>
                        <span onClick={() => handleLogSort('user')}
                            style={{fontSize:'10px',fontWeight:'600',color: logSortKey==='user' ? '#00C9B1' : 'var(--text-muted)',
                            textTransform:'uppercase',letterSpacing:'1px',cursor:'pointer'}}>
                            USER{logSortIndicator('user')}
                        </span>
                        <span onClick={() => handleLogSort('action')}
                            style={{fontSize:'10px',fontWeight:'600',color: logSortKey==='action' ? '#00C9B1' : 'var(--text-muted)',
                            textTransform:'uppercase',letterSpacing:'1px',cursor:'pointer'}}>
                            ACTION{logSortIndicator('action')}
                        </span>
                        <span onClick={() => handleLogSort('id')}
                            style={{fontSize:'10px',fontWeight:'600',color: logSortKey==='id' ? '#00C9B1' : 'var(--text-muted)',
                            textTransform:'uppercase',letterSpacing:'1px',cursor:'pointer'}}>
                            REF ID{logSortIndicator('id')}
                        </span>
                        <span onClick={() => handleLogSort('title')}
                            style={{fontSize:'10px',fontWeight:'600',color: logSortKey==='title' ? '#00C9B1' : 'var(--text-muted)',
                            textTransform:'uppercase',letterSpacing:'1px',cursor:'pointer'}}>
                            CONTRACT TITLE{logSortIndicator('title')}
                        </span>
                    </div>
                    {sortedLog.map((c, i) => (
                        <div key={i} 
                            className={styles.logItem} 
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '100px 80px 160px 100px 1fr',
                                padding: '10px 0',
                                borderBottom: '1px solid var(--border-color)',
                                alignItems: 'center',
                                cursor: 'pointer',
                                transition: 'background 0.15s',
                                borderRadius: '6px',
                                paddingLeft: '8px',
                                paddingRight: '8px'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,201,177,0.05)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                            <span className={styles.logTime}>{new Date(c.date).toLocaleDateString()}</span>
                            <span className={styles.logUser}>{c.user}</span>
                            <span className={styles.logAction} style={{color: c.action==='Approved'?'#10B981':'#00C9B1'}}>
                                Updated: {c.action}
                            </span>
                            <span className={styles.logId}>#{(c.id||'').slice(-8).toUpperCase()}</span>
                            <span className={styles.logDetails}>{c.title}</span>
                        </div>
                    ))}
                    {contracts.length === 0 && (
                        <div style={{ padding: '16px', color: 'var(--text-secondary)' }}>No activity recorded yet.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Reports;
