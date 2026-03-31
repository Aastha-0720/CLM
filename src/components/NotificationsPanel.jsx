import React from 'react';
import styles from './NotificationsPanel.module.css';
import { Bell, Check, Clock, Info, AlertTriangle, FileText, UserCheck, Shield, X } from 'lucide-react';

const NotificationsPanel = ({ notifs, onMarkRead, onClose }) => {
    const getIcon = (type) => {
        switch (type) {
            case 'assignment': return <UserCheck size={16} className={styles.assignmentIcon} />;
            case 'cas_ready': return <FileText size={16} className={styles.casIcon} />;
            case 'signature_ready': return <Check size={16} className={styles.signIcon} />;
            case 'expiry_alert': return <Clock size={16} className={styles.expiryIcon} />;
            case 'escalation': return <AlertTriangle size={16} className={styles.escalationIcon} />;
            case 'approval': return <ShieldAlert size={16} className={styles.approvalIcon} />;
            default: return <Info size={16} className={styles.infoIcon} />;
        }
    };

    const formatTime = (dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = (now - date) / 1000; // seconds

        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className={styles.panel}>
            <div className={styles.header}>
                <h3>Notifications</h3>
                <button className={styles.closeBtn} onClick={onClose}>
                    <X size={18} />
                </button>
            </div>

            <div className={styles.list}>
                {notifs.length === 0 ? (
                    <div className={styles.empty}>
                        <Bell size={40} strokeWidth={1} />
                        <p>No new notifications</p>
                    </div>
                ) : (
                    notifs.map((n) => (
                        <div key={n.id} className={styles.item} onClick={() => onMarkRead(n.id)}>
                            <div className={styles.iconArea}>
                                {getIcon(n.type)}
                            </div>
                            <div className={styles.content}>
                                <div className={styles.message}>{n.message}</div>
                                <div className={styles.meta}>
                                    {n.contract_title && <span className={styles.contract}>{n.contract_title}</span>}
                                    <span className={styles.time}>{formatTime(n.createdAt)}</span>
                                </div>
                                {n.action && <div className={styles.action}>{n.action}</div>}
                            </div>
                        </div>
                    ))
                )}
            </div>
            
            <div className={styles.footer}>
                <p>Real-time updates active</p>
            </div>
        </div>
    );
};

export default NotificationsPanel;
