import React, { useState, lazy, Suspense } from 'react';
import styles from './SuperAdminDashboard.module.css';

// Lazy load components for performance
const SalesPipeline = lazy(() => import('./SalesPipeline'));
const Dashboard = lazy(() => import('./Dashboard'));
const UserManagement = lazy(() => import('./UserManagement'));
const RolesPermissions = lazy(() => import('./RolesPermissions'));
const PipelineStages = lazy(() => import('./PipelineStages'));
const AdminOpportunities = lazy(() => import('./AdminOpportunities'));
const AdminContracts = lazy(() => import('./AdminContracts'));
const DOAConfig = lazy(() => import('./DOAConfig'));
const Integrations = lazy(() => import('./Integrations'));
const Reports = lazy(() => import('./Reports'));
const AuditLogs = lazy(() => import('./AuditLogs'));
const Settings = lazy(() => import('./Settings'));
const NotificationDropdown = lazy(() => import('./NotificationDropdown'));

const SuperAdminDashboard = () => {
    const [activeNav, setActiveNav] = useState('Dashboard');
    const [searchTerm, setSearchTerm] = useState('');

    const sidebarItems = [
        { group: 'MAIN', items: [
            { name: 'Dashboard', icon: '📊' },
            { name: 'Opportunities', icon: '📈' },
            { name: 'Contracts', icon: '📜' },
        ]},
        { group: 'ADMINISTRATION', items: [
            { name: 'Users', icon: '👥' },
            { name: 'Roles & Permissions', icon: '🔐' },
            { name: 'Pipeline Stages', icon: '🏗️' },
            { name: 'DOA', icon: '✍️' },
        ]},
        { group: 'SYSTEM & ANALYTICS', items: [
            { name: 'Integrations', icon: '🔌' },
            { name: 'Reports', icon: '📋' },
            { name: 'Audit Logs', icon: '🔍' },
            { name: 'Settings', icon: '⚙️' },
        ]}
    ];

    const renderContent = () => {
        switch (activeNav) {
            case 'Dashboard':
                return <Dashboard />;
            case 'Opportunities':
                return <AdminOpportunities />;
            case 'Contracts':
                return <AdminContracts />;
            case 'DOA':
                return <DOAConfig />;
            case 'Integrations':
                return <Integrations />;
            case 'Reports':
                return <Reports />;
            case 'Audit Logs':
                return <AuditLogs />;
            case 'Users':
                return <UserManagement />;
            case 'Roles & Permissions':
                return <RolesPermissions />;
            case 'Pipeline Stages':
                return <PipelineStages />;
            case 'Settings':
                return <Settings />;
            default:
                return (
                    <div className={styles.placeholder}>
                        <h3>{activeNav}</h3>
                        <p>The <strong>{activeNav}</strong> module is currently under development for the Super Admin portal.</p>
                        <div className={styles.toolIcon}>🛠️</div>
                    </div>
                );
        }
    };

    return (
        <div className={styles.container}>
            {/* Left Sidebar */}
            <aside className={styles.sidebar}>
                <div className={styles.logoContainer}>
                    <div className={styles.logoIcon}>
                        <span>A</span>
                    </div>
                    <div className={styles.logoTextWrapper}>
                        <span className={styles.logoBrand}>Apeiro</span>
                        <span className={styles.logoSub}>Admin Portal</span>
                    </div>
                </div>

                <nav className={styles.nav}>
                    {sidebarItems.map((group, idx) => (
                        <div key={idx} className={styles.navGroup}>
                            <span className={styles.navLabel}>{group.group}</span>
                            {group.items.map((item) => (
                                <button
                                    key={item.name}
                                    className={`${styles.navItem} ${activeNav === item.name ? styles.active : ''}`}
                                    onClick={() => setActiveNav(item.name)}
                                >
                                    <span className={styles.icon}>{item.icon}</span>
                                    <span className={styles.label}>{item.name}</span>
                                    {activeNav === item.name && <div className={styles.activeIndicator}></div>}
                                </button>
                            ))}
                        </div>
                    ))}
                </nav>

                <div className={styles.userProfile}>
                    <div className={styles.avatar}>SA</div>
                    <div className={styles.userInfo}>
                        <span className={styles.userName}>Super Admin</span>
                        <span className={styles.userRole}>System Administrator</span>
                    </div>
                    <button className={styles.userAction}>⋮</button>
                </div>
            </aside>

            {/* Main Content Wrapper */}
            <div className={styles.contentWrapper}>
                <header className={styles.header}>
                    <div className={styles.breadcrumb}>
                        <span className={styles.breadParent}>Admin</span>
                        <span className={styles.breadDivider}>/</span>
                        <span className={styles.breadCurrent}>{activeNav}</span>
                    </div>

                    <div className={styles.headerActions}>
                        <div className={styles.searchContainer}>
                            <span className={styles.searchIcon}>🔍</span>
                            <input 
                                type="text" 
                                placeholder="Search system records..." 
                                className={styles.topSearch}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <NotificationDropdown />

                        <div className={styles.avatar} style={{ cursor: 'pointer' }}>AD</div>
                    </div>
                </header>

                <main className={styles.mainContent}>
                    <Suspense fallback={<div className={styles.loader}>Loading section...</div>}>
                        {renderContent()}
                    </Suspense>
                </main>
            </div>
        </div>
    );
};

export default SuperAdminDashboard;
