import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from './NotificationDropdown.module.css';

const NotificationDropdown = () => {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const fetchNotifications = useCallback(async () => {
        try {
            const response = await fetch('/api/notifications');
            if (!response.ok) throw new Error('Failed to fetch');
            const data = await response.json();
            setNotifications(data);
        } catch (err) {
            // Mock notifications
            setNotifications([
                { id: 1, type: 'approval', message: 'New contract approval pending for Adani Green (OPP-101)', time: '2 mins ago', read: false },
                { id: 2, type: 'stage', message: 'Opportunity "TATA Power" moved to Negotiation', time: '1 hour ago', read: false },
                { id: 3, type: 'signature', message: 'Signature completed by Reliance Retail for CON-003', time: '3 hours ago', read: true },
                { id: 4, type: 'approval', message: 'VP Approval required for deal over 50L: Vedanta Infra', time: '5 hours ago', read: false },
                { id: 5, type: 'stage', message: 'Opportunity "JSW Steel" closed as WON', time: 'Yesterday', read: true }
            ]);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
        // Close on click outside
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [fetchNotifications]);

    const unreadCount = notifications.filter(n => !n.read).length;

    const handleMarkAsRead = async (id) => {
        try {
            await fetch(`/api/notifications/${id}`, { method: 'PATCH', body: JSON.stringify({ read: true }) });
            setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
        } catch (err) {
            setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await fetch('/api/notifications/read-all', { method: 'POST' });
            setNotifications(notifications.map(n => ({ ...n, read: true })));
        } catch (err) {
            setNotifications(notifications.map(n => ({ ...n, read: true })));
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'approval': return '⏳';
            case 'stage': return '📈';
            case 'signature': return '✍️';
            default: return '🔔';
        }
    };

    return (
        <div className={styles.notificationContainer} ref={dropdownRef}>
            <button className={styles.bellButton} onClick={() => setIsOpen(!isOpen)}>
                <span>🔔</span>
                {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
            </button>

            {isOpen && (
                <div className={styles.dropdown}>
                    <div className={styles.dropdownHeader}>
                        <h3>Notifications</h3>
                        {unreadCount > 0 && (
                            <button className={styles.markAllBtn} onClick={handleMarkAllRead}>
                                Mark all as read
                            </button>
                        )}
                    </div>

                    <div className={styles.notificationList}>
                        {notifications.length > 0 ? (
                            notifications.map(notif => (
                                <div 
                                    key={notif.id} 
                                    className={`${styles.notificationItem} ${!notif.read ? styles.unread : ''}`}
                                    onClick={() => handleMarkAsRead(notif.id)}
                                >
                                    <div className={`${styles.iconWrapper} ${styles[`type_${notif.type}`]}`}>
                                        {getIcon(notif.type)}
                                    </div>
                                    <div className={styles.content}>
                                        <span className={styles.message}>{notif.message}</span>
                                        <span className={styles.time}>{notif.time}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className={styles.emptyState}>No new notifications</div>
                        )}
                    </div>

                    <div className={styles.footer}>
                        <a href="#view-all" className={styles.viewAll}>View all notifications</a>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationDropdown;
