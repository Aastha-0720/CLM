import React from 'react';
import styles from './OutlookPanel.module.css';
import logo from '../assets/Artboard 1 copy 15.svg';
import { LayoutDashboard, Scale, ClipboardCheck, Settings as SettingsIcon, Upload, FileText, BarChart2 } from 'lucide-react';

const ALL_NAV_ITEMS = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} strokeWidth={1.5} /> },
    { name: 'Upload Contracts', icon: <Upload size={20} strokeWidth={1.5} /> },
    { name: 'Reviews', icon: <Scale size={20} strokeWidth={1.5} /> },
    { name: 'CAS', icon: <FileText size={20} strokeWidth={1.5} /> },
    { name: 'DOA Approvals', icon: <ClipboardCheck size={20} strokeWidth={1.5} /> },
    { name: 'Reports', icon: <BarChart2 size={20} strokeWidth={1.5} /> },
    { name: 'All Contracts', icon: <ClipboardCheck size={20} strokeWidth={1.5} /> },
    { name: 'Settings', icon: <SettingsIcon size={20} strokeWidth={1.5} /> },
];

const getNavItemsByRole = (role) => {
    switch (role) {
        case 'Legal':
        case 'Finance':
        case 'Compliance':
        case 'Procurement':
            return ALL_NAV_ITEMS.filter(item => ['Dashboard', 'Reviews', 'All Contracts', 'Settings'].includes(item.name));
        case 'Sales':
            return ALL_NAV_ITEMS.filter(item => ['Dashboard', 'All Contracts', 'Settings'].includes(item.name));
        case 'Manager':
        case 'CEO':
            return ALL_NAV_ITEMS.filter(item => ['Dashboard', 'DOA Approvals', 'CAS', 'Reports', 'Settings'].includes(item.name));
        case 'Admin':
            return ALL_NAV_ITEMS.filter(item => item.name !== 'Upload Contracts');
        default:
            return ALL_NAV_ITEMS.filter(item => item.name !== 'Upload Contracts');
    }
};

const NavItem = ({ item, active, onClick }) => (
    <button
        className={`${styles.navItem} ${active ? styles.active : ''}`}
        onClick={() => onClick(item.name)}
    >
        {item.icon}
        <span className={styles.label}>{item.name}</span>
        {active && <div className={styles.activeIndicator}></div>}
    </button>
);

const Sidebar = ({ user, onLogout, theme, activeNav, onNavigate }) => {
    const navItems = getNavItemsByRole(user?.role || 'Admin');
    const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';

    return (
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
                            onClick={onNavigate}
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
    );
};

export default Sidebar;
