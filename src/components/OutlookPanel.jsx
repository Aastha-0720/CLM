import React, { useState, useEffect, useRef } from 'react';
import styles from './OutlookPanel.module.css';
import UploadContract from './UploadContract';
import CAS from './CAS';
import DOAApprovals from './DOAApprovals';
import Reports from './Reports';
import Dashboard from './Dashboard';
import Reviews from './Reviews';
import { contractService } from '../services/contractService';

const OutlookPanel = ({ user, onLogout }) => {
    const [selectedEmail, setSelectedEmail] = useState(null);
    const [activeNav, setActiveNav] = useState('Dashboard');

    // Live Clock State
    const [time, setTime] = useState(new Date());

    // Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchModalContract, setSearchModalContract] = useState(null);
    const searchRef = useRef(null);

    // Notifications State
    const [notifs, setNotifs] = useState([]);
    const [showNotifs, setShowNotifs] = useState(false);
    const notifRef = useRef(null);

    const allNavItems = [
        { name: 'Dashboard', icon: '📊' },
        { name: 'Upload Contracts', icon: '📤' },
        { name: 'Reviews', icon: '⚖️' },
        { name: 'CAS', icon: '📄' },
        { name: 'DOA Approvals', icon: '✍️' },
        { name: 'Reports', icon: '📋' },
        { name: 'Settings', icon: '⚙️' },
    ];

    const getNavItemsByRole = (role) => {
        switch (role) {
            case 'Legal':
            case 'Finance':
            case 'Compliance':
            case 'Procurement':
                return allNavItems.filter(item => ['Dashboard', 'Reviews', 'Reports'].includes(item.name));
            case 'Sales':
                return allNavItems.filter(item => ['Dashboard'].includes(item.name));
            case 'Manager':
                return allNavItems.filter(item => ['Dashboard', 'DOA Approvals', 'CAS', 'Reports'].includes(item.name));
            case 'CEO':
                return allNavItems.filter(item => ['Dashboard', 'DOA Approvals', 'CAS', 'Reports', 'Settings'].includes(item.name));
            case 'Admin':
            default:
                return allNavItems;
        }
    };

    const navItems = getNavItemsByRole(user?.role || 'Admin');

    const getInitials = (name) => {
        return name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';
    };

    // Live clock effect
    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Search effect
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchQuery.length > 2) {
                setIsSearching(true);
                try {
                    const all = await contractService.getAllContracts();
                    const lowerQ = searchQuery.toLowerCase();
                    const filtered = all.filter(c =>
                        (c.title && c.title.toLowerCase().includes(lowerQ)) ||
                        (c.company && c.company.toLowerCase().includes(lowerQ)) ||
                        (c.id && c.id.toLowerCase().includes(lowerQ))
                    );
                    setSearchResults(filtered);
                } catch (e) {
                    console.error('Search failed', e);
                }
                setIsSearching(false);
            } else {
                setSearchResults([]);
            }
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    // Notifications effect — real API polling every 30s
    const fetchNotifications = async () => {
        try {
            const data = await contractService.getNotifications(user?.role || 'Admin');
            setNotifs(data || []);
        } catch (e) {
            // Silently fail if backend is down — keep existing notifs
            console.error('Notif fetch failed', e);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [user?.role]);

    // Click outside handler
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setSearchResults([]);
                // Don't clear query so user can see what they typed, just hide results if desired,
                // but usually clearing results array hides the dropdown.
            }
            if (notifRef.current && !notifRef.current.contains(event.target)) {
                setShowNotifs(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const openContractDetail = (contract) => {
        setSearchModalContract(contract);
        setSearchResults([]);
        setSearchQuery('');
    };

    const formatDate = (date) => {
        const options = { month: 'short', day: 'numeric', year: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    };

    const formatTime = (date) => {
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    };

    return (
        <div className={styles.container}>
            {/* Sidebar Navigation */}
            <aside className={styles.sidebar}>
                <div className={styles.logoContainer}>
                    <div className={styles.logoIcon}>
                        <span className={styles.logoSymbol}>A</span>
                    </div>
                    <div className={styles.logoTextWrapper}>
                        <span className={styles.logoBrand}>Infinia</span>
                        <span className={styles.logoSub}>CLM System</span>
                    </div>
                </div>

                <nav className={styles.nav}>
                    <div className={styles.navGroup}>
                        <span className={styles.navLabel}>PAGES</span>
                        {navItems.map((item) => (
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
                    <div className={styles.avatar}>{getInitials(user?.name)}</div>
                    <div className={styles.userInfo}>
                        <span className={styles.userName}>{user?.name || 'User'}</span>
                        <span className={styles.userRoleBadge}>{user?.role || 'Role'}</span>
                    </div>
                    <button className={styles.logoutBtn} onClick={onLogout} title="Logout">
                        Logout
                    </button>
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
                        <div className={styles.searchContainer} ref={searchRef}>
                            <span className={styles.searchIcon}>🔍</span>
                            <input
                                type="text"
                                placeholder="Global search..."
                                className={styles.topSearch}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searchResults.length > 0 && searchQuery.length > 2 && (
                                <div className={styles.searchResults}>
                                    {searchResults.map(res => (
                                        <div key={res.id} className={styles.searchResultItem} onClick={() => openContractDetail(res)}>
                                            <div className={styles.searchResultTitle}>{res.title}</div>
                                            <div className={styles.searchResultSub}>{res.id} • {res.company}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {isSearching && searchQuery.length > 2 && searchResults.length === 0 && (
                                <div className={styles.searchResults}>
                                    <div className={styles.searchResultItem}>
                                        <div className={styles.searchResultSub}>Searching...</div>
                                    </div>
                                </div>
                            )}
                            {!isSearching && searchQuery.length > 2 && searchResults.length === 0 && (
                                <div className={styles.searchResults}>
                                    <div className={styles.searchResultItem}>
                                        <div className={styles.searchResultSub}>No results found for "{searchQuery}"</div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className={styles.dateTime}>
                            <span className={styles.time}>{formatTime(time)}</span>
                            <span className={styles.date}>{formatDate(time)}</span>
                        </div>

                        <div className={styles.notifTrigger} ref={notifRef} onClick={() => setShowNotifs(!showNotifs)}>
                            <span className={styles.notifIcon}>🔔</span>
                            {notifs.length > 0 && (
                                <span className={styles.notifBadge}>{notifs.length}</span>
                            )}
                            {showNotifs && (
                                <div className={styles.notifDropdown} onClick={(e) => e.stopPropagation()}>
                                    <div className={styles.notifHeader}>
                                        Notifications ({notifs.length})
                                    </div>
                                    <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
                                        {notifs.length > 0 ? notifs.map(n => {
                                            const timeAgo = (() => {
                                                const diff = Math.floor((Date.now() - new Date(n.createdAt).getTime()) / 1000);
                                                if (diff < 60) return 'Just now';
                                                if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
                                                if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
                                                return `${Math.floor(diff / 86400)}d ago`;
                                            })();
                                            return (
                                                <div key={n.id} className={styles.notifItem} onClick={async () => {
                                                    try {
                                                        const updated = await contractService.markNotificationRead(n.id, user?.role || 'Admin');
                                                        setNotifs(updated || []);
                                                    } catch (e) { console.error(e); }
                                                    setShowNotifs(false);
                                                    setActiveNav('Reviews');
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                                        <span style={{ fontSize: '16px', marginTop: '2px' }}>🟢</span>
                                                        <div style={{ flex: 1 }}>
                                                            <div className={styles.notifItemTitle}>{n.message}</div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
                                                                <span className={styles.notifItemSub}>{timeAgo}</span>
                                                                <span className={styles.notifItemBadge}>→ {n.action}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }) : (
                                            <div className={styles.notifEmpty}>No pending notifications</div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <main className={styles.mainContent}>
                    {activeNav === 'Upload Contracts' ? (
                        <div className={styles.fullWidthSection}>
                            <UploadContract />
                        </div>
                    ) : activeNav === 'CAS' ? (
                        <div className={styles.fullWidthSection}>
                            <CAS user={user} />
                        </div>
                    ) : activeNav === 'DOA Approvals' ? (
                        <div className={styles.fullWidthSection}>
                            <DOAApprovals />
                        </div>
                    ) : activeNav === 'Reviews' ? (
                        <div className={styles.fullWidthSection}>
                            <Reviews user={user} />
                        </div>
                    ) : activeNav === 'Reports' ? (
                        <div className={styles.fullWidthSection}>
                            <Reports user={user} />
                        </div>
                    ) : activeNav === 'Dashboard' ? (
                        <div className={styles.fullWidthSection}>
                            <Dashboard user={user} />
                        </div>
                    ) : (
                        <div className={styles.placeholder}>
                            <h3>{activeNav}</h3>
                            <p>This module is currently under development.</p>
                        </div>
                    )}
                </main>
            </div>

            {/* Contract Detail Modal from Search/Notifs */}
            {searchModalContract && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>
                            <div>
                                <h3 className={styles.modalTitle}>{searchModalContract.title}</h3>
                                <div className={styles.modalSub}>{searchModalContract.id} • {searchModalContract.company}</div>
                            </div>
                            <button className={styles.modalClose} onClick={() => setSearchModalContract(null)}>×</button>
                        </div>
                        <div className={styles.modalBody}>
                            <div className={styles.modalRow}>
                                <span className={styles.modalLabel}>Status</span>
                                <span className={styles.modalValue}>{searchModalContract.status || 'N/A'}</span>
                            </div>
                            <div className={styles.modalRow}>
                                <span className={styles.modalLabel}>Stage</span>
                                <span className={styles.modalValue}>{searchModalContract.stage || 'N/A'}</span>
                            </div>
                            <div className={styles.modalRow}>
                                <span className={styles.modalLabel}>Value</span>
                                <span className={styles.modalValue}>${Number(searchModalContract.value || 0).toLocaleString()}</span>
                            </div>
                            <div className={styles.modalRow}>
                                <span className={styles.modalLabel}>Owner</span>
                                <span className={styles.modalValue}>{searchModalContract.submittedBy || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
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
