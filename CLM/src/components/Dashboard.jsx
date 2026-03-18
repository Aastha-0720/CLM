import React, { useState, useEffect, useMemo } from 'react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    PieChart, Pie, Cell, FunnelChart, Funnel, LabelList 
} from 'recharts';
import { 
    FileText, Clock, TrendingUp, Users, AlertCircle, 
    ArrowUpRight, CheckCircle, Activity, MoreVertical, Search
} from 'lucide-react';
import styles from './Dashboard.module.css';

const Dashboard = () => {
    const [isLoading, setIsLoading] = useState(true);
    
    // Mock Data for demonstration
    const mockData = {
        stats: [
            { id: 'contracts', label: 'Total Contracts', value: '428', trend: '+12%', status: 'success', icon: <FileText size={20} /> },
            { id: 'approvals', label: 'Pending Approvals', value: '14', badge: '5 New', status: 'warning', icon: <Clock size={20} /> },
            { id: 'pipeline', label: 'Total Pipeline Value (₹)', value: '₹ 2.4 Cr', trend: '+18%', status: 'info', icon: <TrendingUp size={20} /> },
            { id: 'users', label: 'Active Users', value: '1,120', subValue: 'of 1,240 total', status: 'primary', icon: <Users size={20} /> },
        ],
        revenueData: [
            { month: 'Oct', revenue: 4500000 },
            { month: 'Nov', revenue: 5200000 },
            { month: 'Dec', revenue: 4800000 },
            { month: 'Jan', revenue: 6100000 },
            { month: 'Feb', revenue: 5900000 },
            { month: 'Mar', revenue: 7400000 },
        ],
        pipelineData: [
            { value: 100, name: 'Identified', fill: '#00d4aa' },
            { value: 80, name: 'Proposal', fill: '#00bfa5' },
            { value: 60, name: 'Negotiation', fill: '#00a693' },
            { value: 40, name: 'Approval', fill: '#008e7e' },
            { value: 20, name: 'Awarded', fill: '#007569' },
        ],
        contractStatus: [
            { name: 'Active', value: 245, color: '#00d4aa' },
            { name: 'Pending', value: 112, color: '#f59e0b' },
            { name: 'Draft', value: 48, color: '#3b82f6' },
            { name: 'Expired', value: 23, color: '#ef4444' },
        ],
        activity: [
            { id: 1, user: 'AS', name: 'Aastha Sharma', action: 'Created Contract', target: 'CON-2024-082', time: '2 mins ago', type: 'create' },
            { id: 2, user: 'JD', name: 'John Doe', action: 'Approved Opportunity', target: 'OPP-552', time: '15 mins ago', type: 'approve' },
            { id: 3, user: 'MH', name: 'Mike Harris', action: 'Modified System Config', target: 'Security', time: '1 hour ago', type: 'config' },
            { id: 4, user: 'RK', name: 'Ritu Kapoor', action: 'Deleted User', target: 'ID: 441', time: '3 hours ago', type: 'delete' },
            { id: 5, user: 'AD', name: 'Admin', action: 'Logged In', target: 'Session-X3', time: '5 hours ago', type: 'auth' },
            { id: 6, user: 'SB', name: 'SecureBank', action: 'Signed Contract', target: 'CON-2024-011', time: '1 day ago', type: 'success' },
            { id: 7, user: 'PL', name: 'Procure Logistics', action: 'Rejected Proposal', target: 'OPP-990', time: '2 days ago', type: 'reject' },
            { id: 8, user: 'SA', name: 'Super Admin', action: 'Updated Roles', target: 'Permissions', time: '3 days ago', type: 'config' },
            { id: 9, user: 'EM', name: 'Emma Watson', action: 'Assigned Owner', target: 'OPP-112', time: '4 days ago', type: 'assign' },
            { id: 10, user: 'TC', name: 'TechCorp', action: 'Requested Review', target: 'CON-2024-001', time: '5 days ago', type: 'review' },
        ],
        pendingApprovals: [
            { id: 1, name: 'License Agreement', value: '₹ 15.2 L', status: 'Pending', approver: 'Regional Head' },
            { id: 2, name: 'SaaS Subscription', value: '₹ 8.5 L', status: 'Under Review', approver: 'Finance Desk' },
            { id: 3, name: 'Service Contract', value: '₹ 4.1 L', status: 'Pending', approver: 'Legal Team' },
            { id: 4, name: 'Cloud Migration', value: '₹ 22.0 L', status: 'Awaiting Sign', approver: 'CTO' },
            { id: 5, name: 'NDA Renewal', value: '₹ 3.2 L', status: 'Pending', approver: 'Legal Team' },
            { id: 6, name: 'Support Contract', value: '₹ 18.7 L', status: 'Under Review', approver: 'Operations' },
        ],
        systemHealth: [
            { id: 1, component: 'API Server', status: 'Operational', statusCode: 'success', lastChecked: '2 mins ago', responseTime: '120ms' },
            { id: 2, component: 'Database', status: 'Operational', statusCode: 'success', lastChecked: '1 min ago', responseTime: '45ms' },
            { id: 3, component: 'Email Service', status: 'Degraded', statusCode: 'warning', lastChecked: '5 mins ago', responseTime: '280ms' },
            { id: 4, component: 'File Storage', status: 'Operational', statusCode: 'success', lastChecked: '3 mins ago', responseTime: '75ms' },
            { id: 5, component: 'CRM Integration', status: 'Down', statusCode: 'error', lastChecked: '10 mins ago', responseTime: 'N/A' },
            { id: 6, component: 'Payment Gateway', status: 'Operational', statusCode: 'success', lastChecked: '1 min ago', responseTime: '92ms' }
        ]
    };

    useEffect(() => {
        // Simulate loading
        const timer = setTimeout(() => setIsLoading(false), 800);
        return () => clearTimeout(timer);
    }, []);

    const formatINR = (value) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumSignificantDigits: 3
        }).format(value);
    };

    if (isLoading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
                <p>Preparing Super Admin Console...</p>
            </div>
        );
    }

    return (
        <div className={styles.dashboard}>
            {/* Stats Row */}
            <header className={styles.statsRow}>
                {mockData.stats.map(stat => (
                    <div key={stat.id} className={styles.statCard}>
                        <div className={styles.statHeader}>
                            <div className={`${styles.statIcon} ${styles[stat.status]}`}>
                                {stat.icon}
                            </div>
                            {stat.trend && (
                                <span className={styles.trend}>
                                    <ArrowUpRight size={14} /> {stat.trend}
                                </span>
                            )}
                            {stat.badge && (
                                <span className={styles.badge}>{stat.badge}</span>
                            )}
                        </div>
                        <div className={styles.statContent}>
                            <span className={styles.statLabel}>{stat.label}</span>
                            <span className={styles.statValue}>{stat.value}</span>
                            {stat.subValue && <span className={styles.statSubValue}>{stat.subValue}</span>}
                        </div>
                    </div>
                ))}
            </header>

            {/* Charts Row */}
            <div className={styles.chartsGrid}>
                {/* Pipeline Funnel */}
                <div className={styles.chartCard}>
                    <div className={styles.cardHeader}>
                        <h3>Pipeline Stage Funnel</h3>
                        <MoreVertical size={18} className={styles.moreIcon} />
                    </div>
                    <div className={styles.chartWrapper}>
                        <ResponsiveContainer width="100%" height={250}>
                            <FunnelChart>
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#1a1f2e', border: '1px solid #2d3343' }}
                                    itemStyle={{ color: '#F9FAFB' }}
                                />
                                <Funnel
                                    dataKey="value"
                                    data={mockData.pipelineData}
                                    isAnimationActive
                                >
                                    <LabelList position="right" fill="#9CA3AF" stroke="none" dataKey="name" />
                                </Funnel>
                            </FunnelChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Contract Status Donut */}
                <div className={styles.chartCard}>
                    <div className={styles.cardHeader}>
                        <h3>Contract Distribution</h3>
                        <MoreVertical size={18} className={styles.moreIcon} />
                    </div>
                    <div className={styles.chartWrapper}>
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={mockData.contractStatus}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {mockData.contractStatus.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#1a1f2e', border: '1px solid #2d3343' }}
                                    itemStyle={{ color: '#F9FAFB' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className={styles.donutLegend}>
                            {mockData.contractStatus.map(s => (
                                <div key={s.name} className={styles.legendItem}>
                                    <span className={styles.dot} style={{ backgroundColor: s.color }}></span>
                                    <span>{s.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Monthly Revenue Bar */}
                <div className={styles.chartCard}>
                    <div className={styles.cardHeader}>
                        <h3>Revenue Trend (6M)</h3>
                        <MoreVertical size={18} className={styles.moreIcon} />
                    </div>
                    <div className={styles.chartWrapper}>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={mockData.revenueData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1F2937" />
                                <XAxis dataKey="month" stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis hide />
                                <Tooltip 
                                    cursor={{fill: 'rgba(255,255,255,0.05)'}}
                                    contentStyle={{ backgroundColor: '#1a1f2e', border: '1px solid #2d3343' }}
                                    formatter={(value) => formatINR(value)}
                                />
                                <Bar dataKey="revenue" fill="#00d4aa" radius={[4, 4, 0, 0]} barSize={30} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Bottom Section */}
            <div className={styles.bottomGrid}>
{/* Pending Approvals List */}
                    <div className={styles.widgetCard}>
                        <div className={styles.cardHeader}>
                            <h3>Pending Approvals List</h3>
                            <button className={styles.textBtn}>View All</button>
                        </div>
                        <div className={styles.tableContainer}>
                            <table className={styles.approvalsTable}>
                                <thead>
                                    <tr>
                                        <th>Contract Name</th>
                                        <th>Value</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {mockData.pendingApprovals.map(approval => (
                                        <tr key={approval.id} className={styles.tableRow}>
                                            <td>
                                                <div className={styles.contractInfo}>
                                                    <span className={styles.contractTitle}>{approval.name}</span>
                                                    <span className={styles.approverName}>Approver: {approval.approver}</span>
                                                </div>
                                            </td>
                                            <td className={styles.valueCell}>{approval.value}</td>
                                            <td>
                                                <span className={`${styles.statusBadge} ${styles[approval.status.toLowerCase().replace(' ', '_')]}`}>
                                                    {approval.status}
                                                </span>
                                            </td>
                                            <td>
                                                <button className={styles.actionBtn}>
                                                    <CheckCircle size={16} />
                                                    <span>Approve</span>
                                                </button>
                                                <button className={styles.actionBtnSecondary}>
                                                    <AlertCircle size={16} />
                                                    <span>Reject</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                    </div>
                </div>

                {/* Recent Activity Feed */}
                <div className={styles.widgetCard}>
                    <div className={styles.cardHeader}>
                        <h3>Recent Activity Feed</h3>
                        <button className={styles.textBtn}>View All</button>
                    </div>
                    <div className={styles.activityTableContainer}>
                        <table className={styles.activityTable}>
                            <thead>
                                <tr>
                                    <th>User Name</th>
                                    <th>Action</th>
                                    <th>Timestamp</th>
                                </tr>
                            </thead>
                            <tbody>
                                {mockData.activity.map(item => (
                                    <tr key={item.id} className={styles.activityRow}>
                                        <td>
                                            <div className={styles.userInfo}>
                                                <div className={styles.userAvatar}>
                                                    {item.user}
                                                </div>
                                                <span className={styles.userName}>{item.name}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className={styles.actionInfo}>
                                                <span className={styles.actionText}>{item.action}</span>
                                                <span className={styles.targetTag}>{item.target}</span>
                                            </div>
                                        </td>
                                        <td className={styles.timestampCell}>{item.time}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className={styles.cardFooter}>
                        <button className={styles.viewAllBtn}>View Full Activity Log</button>
                    </div>
                </div>
            </div>

            {/* System Health Status */}
            <div className={styles.healthSection}>
                <h3 className={styles.sectionTitle}>System Health Status</h3>
                <div className={styles.healthGrid}>
                    {mockData.systemHealth.map(service => (
                        <div key={service.id} className={`${styles.healthCard} ${styles[service.statusCode]}`}>
                            <div className={styles.healthHeader}>
                                <h4>{service.component}</h4>
                                <span className={styles.healthStatus}>{service.status}</span>
                            </div>
                            <div className={styles.healthDetails}>
                                <div className={styles.healthMetric}>
                                    <span className={styles.metricLabel}>Last Check:</span>
                                    <span className={styles.metricValue}>{service.lastChecked}</span>
                                </div>
                                <div className={styles.healthMetric}>
                                    <span className={styles.metricLabel}>Response:</span>
                                    <span className={styles.metricValue}>{service.responseTime}</span>
                                </div>
                            </div>
                            <div className={styles.healthIndicator}>
                                <div className={styles.indicator}></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
