import React, { useState, useEffect, useRef } from 'react';
import styles from './OutlookPanel.module.css';
import logo from '../assets/Artboard 1 copy 15.svg';
import UploadContract from './UploadContract';
import CAS from './CAS';
import DOAApprovals from './DOAApprovals';
import Reports from './Reports';
import Dashboard from './Dashboard';
import Reviews from './Reviews';
import Settings from './Settings';
import AdminManagement from './AdminManagement';
import UserManagement from './UserManagement';
import AuditLogs from './AuditLogs';
import MyContracts from './MyContracts';
import DocumentViewer from './DocumentViewer';

import { contractService } from '../services/contractService';
import { LayoutDashboard, Upload, Scale, FileText, 
         ClipboardCheck, BarChart2, Settings as SettingsIcon,
         Bell, Search, Sun, Moon, Shield, Users, ClipboardList } from 'lucide-react';

import { useNavigate, useLocation } from 'react-router-dom';

const OutlookPanel = ({ user, onLogout, theme, onToggleTheme }) => {
    const navigate = useNavigate();
    const location = useLocation();

    // Derive activeNav from URL
    const getActiveNavFromUrl = () => {
        const path = location.pathname.split('/').pop(); // Gets 'dashboard', 'contracts', etc.
        if (!path || path === user?.role?.toLowerCase()) return 'Dashboard';
        
        // Map path back to Nav Item Name
        const mapping = {
            'dashboard': 'Dashboard',
            'contracts': 'Contracts',
            'my-contracts': 'My Contracts',
            'create-contract': 'Create Contract',
            'reviews': 'Reviews',
            'cas': 'CAS',
            'doa-approvals': 'DOA Approvals',
            'reports': 'Reports',
            'settings': 'Settings',
            'manage-admins': 'Manage Admins',
            'manage-users': 'Manage Users',
            'audit-logs': 'Audit Logs'
        };
        return mapping[path] || 'Dashboard';
    };

    const activeNav = getActiveNavFromUrl();
    const setActiveNav = (navName) => {
        const mapping = {
            'Dashboard': 'dashboard',
            'Contracts': 'contracts',
            'My Contracts': 'my-contracts',
            'Create Contract': 'create-contract',
            'Reviews': 'reviews',
            'CAS': 'cas',
            'DOA Approvals': 'doa-approvals',
            'Reports': 'reports',
            'Settings': 'settings',
            'Manage Admins': 'manage-admins',
            'Manage Users': 'manage-users',
            'Audit Logs': 'audit-logs'
        };
        const path = mapping[navName] || 'dashboard';
        navigate(`/${user.role.toLowerCase()}/${path}`);
    };

    // Live Clock State
    const [time, setTime] = useState(new Date());

    // Search State
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [searchModalContract, setSearchModalContract] = useState(null);
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const searchRef = useRef(null);

    // Notifications State
    const [notifs, setNotifs] = useState([]);
    const [showNotifs, setShowNotifs] = useState(false);
    const notifRef = useRef(null);
    const [viewingContractId, setViewingContractId] = useState(null);
    const [isHealthPanelOpen, setIsHealthPanelOpen] = useState(false);

    const allNavItems = [
        { name: 'Dashboard', icon: <LayoutDashboard size={20} strokeWidth={1.5} /> },
        { name: 'Contracts', icon: <Upload size={20} strokeWidth={1.5} /> },
        { name: 'My Contracts', icon: <FileText size={20} strokeWidth={1.5} /> },
        { name: 'Create Contract', icon: <Upload size={20} strokeWidth={1.5} /> },
        { name: 'Reviews', icon: <Scale size={20} strokeWidth={1.5} /> },
        { name: 'CAS', icon: <FileText size={20} strokeWidth={1.5} /> },
        { name: 'DOA Approvals', icon: <ClipboardCheck size={20} strokeWidth={1.5} /> },
        { name: 'Reports', icon: <BarChart2 size={20} strokeWidth={1.5} /> },
        { name: 'Settings', icon: <SettingsIcon size={20} strokeWidth={1.5} /> },
        { name: 'Manage Admins', icon: <Shield size={20} strokeWidth={1.5} /> },
        { name: 'Manage Users', icon: <Users size={20} strokeWidth={1.5} /> },
        { name: 'Audit Logs', icon: <ClipboardList size={20} strokeWidth={1.5} /> },
    ];

    const getNavItemsByRole = (role) => {
        switch (role) {
            case 'Superadmin':
                return allNavItems.filter(item => [
                    'Dashboard', 'Manage Admins', 'Manage Users', 
                    'Contracts', 'Settings', 'Reports', 'Audit Logs'
                ].includes(item.name));
            case 'User':
                return allNavItems.filter(item => [
                    'Dashboard', 'My Contracts', 'Create Contract', 
                    'Reviews', 'DOA Approvals', 'Settings'
                ].includes(item.name));
            case 'Legal':
            case 'Finance':
            case 'Compliance':
            case 'Procurement':
                return allNavItems.filter(item => ['Dashboard', 'Reviews', 'Reports', 'Settings'].includes(item.name));
            case 'Sales':
                return allNavItems.filter(item => ['Dashboard', 'Settings'].includes(item.name));
            case 'Manager':
                return allNavItems.filter(item => ['Dashboard', 'DOA Approvals', 'CAS', 'Reports', 'Settings'].includes(item.name));
            case 'CEO':
                return allNavItems.filter(item => ['Dashboard', 'DOA Approvals', 'CAS', 'Reports', 'Settings'].includes(item.name));
            case 'Admin':
            default:
                return allNavItems.filter(item => ![
                    'My Contracts', 'Create Contract', 'Manage Admins', 'Manage Users', 'Audit Logs'
                ].includes(item.name));
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

    const handleClearNotifications = async () => {
        try {
            await fetch('/api/admin/clear-notifications', { method: 'DELETE' });
            setNotifs([]);
        } catch (err) {
            console.error(err);
        }
    };

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
                <div className={styles.logoContainer} style={{ height: '80px', padding: '0 24px', overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
                    <img src={logo} alt="Infinia Logo" style={{
                        width: '160px',
                        height: 'auto',
                        filter: theme === 'light' ? 'brightness(0)' : 'brightness(1)',
                        transition: 'filter 0.3s'
                    }} />
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
                            <span className={styles.searchIcon}><Search size={20} strokeWidth={1.5} /></span>
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
                        
                        <button
                            onClick={onToggleTheme}
                            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                            style={{
                                background: 'transparent',
                                border: '1px solid var(--border-color)',
                                borderRadius: '8px',
                                padding: '6px 12px',
                                cursor: 'pointer',
                                color: 'var(--text-secondary)',
                                fontSize: '18px',
                                display: 'flex',
                                alignItems: 'center',
                                transition: 'all 0.2s'
                            }}
                        >
                            {theme === 'dark' ? <Sun size={20} strokeWidth={1.5} /> : <Moon size={20} strokeWidth={1.5} />}
                        </button>

                        <div className={styles.notifTrigger} ref={notifRef} onClick={() => setShowNotifs(!showNotifs)}>
                            <span className={styles.notifIcon}><Bell size={20} strokeWidth={1.5} /></span>
                            {notifs.length > 0 && (
                                <span className={styles.notifBadge}>{notifs.length}</span>
                            )}
                            {showNotifs && (
                                <div className={styles.notifDropdown} onClick={(e) => e.stopPropagation()}>
                                    <div className={styles.notifHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span>Notifications ({notifs.length})</span>
                                        {notifs.length > 0 && (
                                            <button 
                                                onClick={handleClearNotifications}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', padding: '4px' }}
                                                title="Clear All Notifications"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                  <polyline points="3 6 5 6 21 6"/>
                                                  <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                                                  <path d="M10 11v6"/>
                                                  <path d="M14 11v6"/>
                                                  <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                                                </svg>
                                                Clear All
                                            </button>
                                        )}
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
                    {viewingContractId ? (
                        <div className={styles.fullWidthSection}>
                            <DocumentViewer 
                                contractId={viewingContractId} 
                                onBack={() => setViewingContractId(null)} 
                            />
                        </div>
                    ) : (() => {
                        const navItems = getNavItemsByRole(user?.role);
                        const isAllowed = navItems.some(item => item.name === activeNav) || activeNav === 'Dashboard';
                        
                        if (!isAllowed) {
                            return (
                                <div className={styles.placeholder}>
                                    <h3 style={{ color: '#EF4444' }}>Access Denied</h3>
                                    <p>Your account ({user?.role}) does not have permission to access the "{activeNav}" module.</p>
                                </div>
                            );
                        }

                        if (activeNav === 'Contracts') {
                            return <div className={styles.fullWidthSection}><UploadContract onOpenContract={setViewingContractId} /></div>;
                        }
                        if (activeNav === 'My Contracts') {
                            return <div className={styles.fullWidthSection}><MyContracts user={user} onOpenContract={setViewingContractId} /></div>;
                        }
                        if (activeNav === 'Create Contract') {
                            return <div className={styles.fullWidthSection}><UploadContract initialTab="create" onOpenContract={setViewingContractId} /></div>;
                        }
                        if (activeNav === 'CAS') {
                            return <div className={styles.fullWidthSection}><CAS user={user} /></div>;
                        }
                        if (activeNav === 'DOA Approvals') {
                            return <div className={styles.fullWidthSection}><DOAApprovals user={user} onNavigate={setActiveNav} /></div>;
                        }
                        if (activeNav === 'Reviews') {
                            return <div className={styles.fullWidthSection}><Reviews user={user} /></div>;
                        }
                        if (activeNav === 'Reports') {
                            return <div className={styles.fullWidthSection}><Reports user={user} /></div>;
                        }
                        if (activeNav === 'Dashboard') {
                            return <div className={styles.fullWidthSection}><Dashboard user={user} /></div>;
                        }
                        if (activeNav === 'Settings') {
                            return <div className={styles.fullWidthSection}><Settings user={user} /></div>;
                        }
                        if (activeNav === 'Manage Admins') {
                            return <div className={styles.fullWidthSection}><AdminManagement /></div>;
                        }
                        if (activeNav === 'Manage Users') {
                            return <div className={styles.fullWidthSection}><UserManagement /></div>;
                        }
                        if (activeNav === 'Audit Logs') {
                            return <div className={styles.fullWidthSection}><AuditLogs /></div>;
                        }
                        
                        return (
                            <div className={styles.placeholder}>
                                <h3>{activeNav}</h3>
                                <p>This module is currently under development.</p>
                            </div>
                        );
                    })()}
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
        {item.icon}
        <span className={styles.label}>{item.name}</span>
        {active && <div className={styles.activeIndicator}></div>}
    </button>
);

export default OutlookPanel;
