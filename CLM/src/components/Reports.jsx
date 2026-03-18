import React, { useState, useEffect } from 'react';
import styles from './Reports.module.css';

const Reports = () => {
    const formatCurrency = (val) => {
        if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
        if (val >= 1000) return `$${(val / 1000).toFixed(1)}K`;
        return `$${val.toLocaleString()}`;
    };

    const [reportType, setReportType] = useState(null);
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });
    const [reportData, setReportData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const reportTypes = [
      { id: 'sales', name: 'Sales Pipeline Report', icon: '📊', description: 'Detailed breakdown of all opportunities, deal values, and conversion stages.' },
      { id: 'contracts', name: 'Contract Status Report', icon: '📄', description: 'Monitoring of contract approvals, signatures, and expiration dates.' },
      { id: 'performance', name: 'User Performance', icon: '👤', description: 'Analysis of deal win rates and activity levels per sales owner.' }
    ];

    const generateReport = async () => {
        if (!reportType) return;
        setIsLoading(true);
        
        try {
            // Simulate API fetch with filters
            const response = await fetch(`/api/reports?type=${reportType}&start=${dateRange.start}&end=${dateRange.end}`);
            // In a real app we'd wait for response.json()
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Mock data generation based on type
            let data = [];
            if (reportType === 'sales') {
                data = [
                    { id: 'OPP-101', title: 'Adani Green Energy', customer: 'Adani Group', value: 1500000, stage: 'Negotiation', owner: 'Aastha Sharma' },
                    { id: 'OPP-102', title: 'TATA Power Grid', customer: 'Tata Motors', value: 890000, stage: 'Proposed', owner: 'John Doe' },
                    { id: 'OPP-103', title: 'Reliance Retail', customer: 'Reliance Ind', value: 2100000, stage: 'Closing', owner: 'Jane Smith' },
                    { id: 'OPP-104', title: 'VEDANTA Infra', customer: 'Vedanta Ltd', value: 450000, stage: 'Identified', owner: 'Aastha Sharma' }
                ];
            } else if (reportType === 'contracts') {
                data = [
                    { id: 'CON-001', opportunity: 'OPP-101', status: 'Approved', signatures: 'Complete', expiry: '2025-12-31' },
                    { id: 'CON-002', opportunity: 'OPP-102', status: 'Pending', signatures: 'Partial', expiry: '2026-06-15' },
                    { id: 'CON-003', opportunity: 'OPP-103', status: 'Draft', signatures: 'None', expiry: '2025-09-20' }
                ];
            } else {
                data = [
                    { owner: 'Aastha Sharma', deals: 24, winRate: '78%', value: 8500000 },
                    { owner: 'John Doe', deals: 15, winRate: '62%', value: 4200000 },
                    { owner: 'Jane Smith', deals: 19, winRate: '84%', value: 6700000 }
                ];
            }
            
            setReportData(data);
        } catch (err) {
            console.error('Report generation error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const exportCSV = () => {
        if (!reportData) return;
        const headers = Object.keys(reportData[0]);
        const csvRows = [headers.join(',')];
        
        reportData.forEach(row => {
            const values = headers.map(header => {
                const val = typeof row[header] === 'string' ? `"${row[header]}"` : row[header];
                return val;
            });
            csvRows.push(values.join(','));
        });
        
        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportType}_report_${dateRange.start}_to_${dateRange.end}.csv`;
        a.click();
    };

    const exportPDF = () => {
        window.print();
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2>Systems Report Center</h2>
            </div>

            <div className={styles.selectionRow}>
                {reportTypes.map(type => (
                    <div 
                        key={type.id} 
                        className={`${styles.reportCard} ${reportType === type.id ? styles.activeCard : ''}`}
                        onClick={() => {
                          setReportType(type.id);
                          setReportData(null);
                        }}
                    >
                        <span className={styles.cardIcon}>{type.icon}</span>
                        <h3>{type.name}</h3>
                        <p>{type.description}</p>
                    </div>
                ))}
            </div>

            {reportType && (
                <div className={styles.filterBar}>
                    <div className={styles.filterGroup}>
                        <label>Start Date</label>
                        <input 
                            type="date" 
                            className={styles.input} 
                            value={dateRange.start}
                            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                        />
                    </div>
                    <div className={styles.filterGroup}>
                        <label>End Date</label>
                        <input 
                            type="date" 
                            className={styles.input} 
                            value={dateRange.end}
                            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                        />
                    </div>
                    <button className={styles.generateBtn} onClick={generateReport}>
                        Generate Full Report
                    </button>
                </div>
            )}

            {isLoading && (
                <div className={styles.loadingContainer}>
                    <div className={styles.spinner}></div>
                    <p style={{ marginTop: '16px', color: 'var(--text-muted)' }}>Compiling data points...</p>
                </div>
            )}

            {reportData && !isLoading && (
                <div className={styles.reportResult}>
                    {reportType === 'sales' && (
                        <div className={styles.chartsRow}>
                            <div className={styles.chartCard}>
                                <h3>Revenue Trend (Monthly)</h3>
                                <div className={styles.barChart}>
                                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month, i) => {
                                        const value = Math.floor(Math.random() * 400000) + 100000;
                                        return (
                                            <div key={i} className={styles.barGroup}>
                                                <div className={styles.barArea}>
                                                    <div 
                                                        className={styles.bar} 
                                                        style={{ height: `${(value / 500000) * 100}%` }}
                                                    >
                                                        <span className={styles.barVal}>{formatCurrency(value)}</span>
                                                    </div>
                                                </div>
                                                <span className={styles.barLabel}>{month}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className={styles.chartCard}>
                                <h3>Opportunities by BU</h3>
                                <div className={styles.donutChartArea}>
                                    <div className={styles.donut} style={{
                                        background: `conic-gradient(
                                            #00C9B1 0% 20%, 
                                            #3B82F6 20% 45%, 
                                            #A855F7 45% 70%, 
                                            #F59E0B 70% 85%, 
                                            #EC4899 85% 100%)`
                                    }}>
                                        <div className={styles.donutHole}>
                                            <span className={styles.donutTotalValue}>{reportData.length}</span>
                                            <span className={styles.donutTotalLabel}>Total</span>
                                        </div>
                                    </div>
                                    <div className={styles.donutLegend}>
                                        {[
                                            { name: 'Sales', color: '#00C9B1', count: 3 },
                                            { name: 'Enterprise', color: '#3B82F6', count: 11 },
                                            { name: 'Marketing', color: '#A855F7', count: 4 },
                                            { name: 'Legal', color: '#F59E0B', count: 2 },
                                            { name: 'Compliance', color: '#EC4899', count: 9 }
                                        ].map((bu, i) => (
                                            <div key={i} className={styles.legendItem}>
                                                <div className={styles.legendDot} style={{ backgroundColor: bu.color }}></div>
                                                <span className={styles.legendLabel}>{bu.name} ({bu.count})</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div className={styles.actionArea}>
                        <button className={styles.exportBtn} onClick={exportCSV}>📥 Download CSV</button>
                        <button className={styles.exportBtn} onClick={exportPDF}>📄 Export PDF</button>
                    </div>
                    <div className={styles.reportTableCard}>
                        <div className={styles.tableWrapper}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        {Object.keys(reportData[0]).map(header => (
                                            <th key={header}>{header.replace(/([A-Z])/g, ' $1').toUpperCase()}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.map((row, idx) => (
                                        <tr key={idx}>
                                            {Object.values(row).map((val, i) => (
                                                <td key={i}>
                                                    {typeof val === 'number' && !headerIncludes(Object.keys(row)[i], 'deals') ? `$${val.toLocaleString()}` : val}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {!reportType && !reportData && (
                <div className={styles.placeholder}>
                    <p>Select a report type above to begin configuration.</p>
                </div>
            )}
        </div>
    );
};

// Helper for dynamic formatting
const headerIncludes = (header, text) => header.toLowerCase().includes(text);

export default Reports;
