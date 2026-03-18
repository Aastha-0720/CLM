import React, { useState } from 'react';
import styles from './OutlookPanel.module.css';
import EmailList from './EmailList';
import UploadContract from './UploadContract';
import Notifications from './Notifications';
import SalesPipeline from './SalesPipeline';
import CAS from './CAS';
import DOAApprovals from './DOAApprovals';
import DigiInk from './DigiInk';
import Reports from './Reports';
import Dashboard from './Dashboard';

const OutlookPanel = () => {
    const [selectedEmail, setSelectedEmail] = useState(null);
    const [activeNav, setActiveNav] = useState('Dashboard');

    const navItems = [
        { name: 'Dashboard', icon: '📊' },
        { name: 'Outlook Integration', icon: '📧' },
        { name: 'Sales Pipeline', icon: '📈' },
        { name: 'CAS', icon: '🛡️' },
        { name: 'DOA Approvals', icon: '✍️' },
        { name: 'DigiInk Signatures', icon: '🖋️' },
        { name: 'Reports', icon: '📋' },
        { name: 'Settings', icon: '⚙️' },
    ];

    return (
        <div className={styles.container}>
            {/* Sidebar Navigation */}
            <aside className={styles.sidebar}>
                <div className={styles.logoContainer}>
                    <div className={styles.logoIcon}>
                        <span className={styles.logoSymbol}>A</span>
                    </div>
                    <div className={styles.logoTextWrapper}>
                        <span className={styles.logoBrand}>Apeiro</span>
                        <span className={styles.logoSub}>CLM System</span>
                    </div>
                </div>

                <nav className={styles.nav}>
                    <div className={styles.navGroup}>
                        <span className={styles.navLabel}>MAIN MENU</span>
                        {navItems.slice(0, 3).map((item) => (
                            <NavItem
                                key={item.name}
                                item={item}
                                active={activeNav === item.name}
                                onClick={() => setActiveNav(item.name)}
                            />
                        ))}
                    </div>

                    <div className={styles.navGroup}>
                        <span className={styles.navLabel}>CONTRACTS</span>
                        {navItems.slice(3, 6).map((item) => (
                            <NavItem
                                key={item.name}
                                item={item}
                                active={activeNav === item.name}
                                onClick={() => setActiveNav(item.name)}
                            />
                        ))}
                    </div>

                    <div className={styles.navGroup}>
                        <span className={styles.navLabel}>SYSTEM</span>
                        {navItems.slice(6).map((item) => (
                            <NavItem
                                key={item.name}
                                item={item}
                                active={activeNav === item.name}
                                onClick={() => setActiveNav(item.name)}
                            />
                        ))}
                    </div>
                </nav>

                <div className={styles.userProfile}>
                    <div className={styles.avatar}>RS</div>
                    <div className={styles.userInfo}>
                        <span className={styles.userName}>Rani Sahu</span>
                        <span className={styles.userRole}>Admin User</span>
                    </div>
                    <button className={styles.userAction}>⋮</button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className={styles.contentWrapper}>
                <header className={styles.header}>
                    <div className={styles.breadcrumb}>
                        <span className={styles.breadParent}>Dashboard</span>
                        <span className={styles.breadDivider}>/</span>
                        <span className={styles.breadCurrent}>{activeNav}</span>
                    </div>

                    <div className={styles.headerActions}>
                        <div className={styles.searchContainer}>
                            <span className={styles.searchIcon}>🔍</span>
                            <input type="text" placeholder="Global search..." className={styles.topSearch} />
                        </div>

                        <div className={styles.dateTime}>
                            <span className={styles.time}>12:45 PM</span>
                            <span className={styles.date}>Mar 17, 2026</span>
                        </div>

                        <div className={styles.notifTrigger}>
                            <span className={styles.notifIcon}>🔔</span>
                            <span className={styles.notifBadge}>3</span>
                        </div>
                    </div>
                </header>

                <main className={styles.mainContent}>
                    {activeNav === 'Outlook Integration' ? (
                        <>
                            <div className={styles.sectionA}>
                                <EmailList onSelectEmail={setSelectedEmail} selectedEmailId={selectedEmail?.id} />
                            </div>

                            <div className={styles.sectionB}>
                                <UploadContract email={selectedEmail} />
                            </div>

                            <div className={styles.sectionC}>
                                <Notifications />
                            </div>
                        </>
                    ) : activeNav === 'Sales Pipeline' ? (
                        <div className={styles.fullWidthSection}>
                            <SalesPipeline />
                        </div>
                    ) : activeNav === 'CAS' ? (
                        <div className={styles.fullWidthSection}>
                            <CAS />
                        </div>
                    ) : activeNav === 'DOA Approvals' ? (
                        <div className={styles.fullWidthSection}>
                            <DOAApprovals />
                        </div>
                    ) : activeNav === 'DigiInk Signatures' ? (
                        <div className={styles.fullWidthSection}>
                            <DigiInk />
                        </div>
                    ) : activeNav === 'Reports' ? (
                        <div className={styles.fullWidthSection}>
                            <Reports />
                        </div>
                    ) : activeNav === 'Dashboard' ? (
                        <div className={styles.fullWidthSection}>
                            <Dashboard />
                        </div>
                    ) : (
                        <div className={styles.placeholder}>
                            <h3>{activeNav}</h3>
                            <p>This module is currently under development.</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

const NavItem = ({ item, active, onClick }) => (
    <button
        className={`${styles.navItem} ${active ? styles.active : ''}`}
        onClick={onClick}
    >
        <span className={styles.icon}>{item.icon}</span>
        <span className={styles.label}>{item.name}</span>
        {active && <div className={styles.activeIndicator}></div>}
    </button>
);

export default OutlookPanel;
