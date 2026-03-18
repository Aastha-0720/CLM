import React from 'react';
import styles from './Notifications.module.css';

const sampleNotifications = [
    {
        id: 'NT-101',
        type: 'assignment',
        title: 'Review Assignment',
        message: 'Agreement for AWS Migration assigned to you.',
        contractId: 'CTR-2026-045',
        timestamp: '10 mins ago',
        icon: '👤',
        color: '#3B82F6',
    },
    {
        id: 'NT-102',
        type: 'approval',
        title: 'Approval Request',
        message: 'Michael Scott requested approval for Paper Contract.',
        contractId: 'CTR-2026-089',
        timestamp: '2 hours ago',
        icon: '✅',
        color: '#F59E0B',
    },
    {
        id: 'NT-103',
        type: 'signature',
        title: 'Pending Signature',
        message: 'Signature required for Cyberdyne License v2.',
        contractId: 'CTR-2026-021',
        timestamp: 'Yesterday',
        icon: '🖋️',
        color: '#00C9B1',
    },
    {
        id: 'NT-104',
        type: 'expiry',
        title: 'Contract Expiry',
        message: 'AMC for Data Center expires in 30 days.',
        contractId: 'CTR-2025-998',
        timestamp: 'Mar 14',
        icon: '⚠️',
        color: '#EF4444',
    },
    {
        id: 'NT-105',
        type: 'assignment',
        title: 'Review Assignment',
        message: 'New NDA for Project X needs legal clearance.',
        contractId: 'CTR-2026-112',
        timestamp: 'Mar 12',
        icon: '👤',
        color: '#3B82F6',
    },
];

const Notifications = () => {
    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerInfo}>
                    <h3 className={styles.title}>Notifications</h3>
                    <span className={styles.badge}>{sampleNotifications.length}</span>
                </div>
                <button className={styles.clearBtn}>Clear all</button>
            </div>

            <div className={styles.list}>
                {sampleNotifications.map((notif) => (
                    <div key={notif.id} className={styles.card}>
                        <div className={styles.cardContent}>
                            <div className={styles.notifHeader}>
                                <div
                                    className={styles.iconBox}
                                    style={{ backgroundColor: `${notif.color}15`, color: notif.color }}
                                >
                                    {notif.icon}
                                </div>
                                <div className={styles.headerText}>
                                    <span className={styles.notifTitle}>{notif.title}</span>
                                    <span className={styles.timestamp}>{notif.timestamp}</span>
                                </div>
                            </div>

                            <p className={styles.message}>{notif.message}</p>

                            <div className={styles.footer}>
                                <span className={styles.contractId}>{notif.contractId}</span>
                                <button className={styles.viewBtn}>View details</button>
                            </div>
                        </div>
                        <div className={styles.colorStrip} style={{ backgroundColor: notif.color }}></div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Notifications;
