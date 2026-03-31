import React, { useState, useEffect } from 'react';
import { Scale, CircleDollarSign, ShieldCheck, ShoppingCart } from 'lucide-react';
import styles from './Reviews.module.css';
import LegalReview from './LegalReview';
import FinanceReview from './FinanceReview';
import ComplianceReview from './ComplianceReview';
import ProcurementReview from './ProcurementReview';
import { contractService } from '../services/contractService';

const Reviews = ({ user }) => {
    const [activeDepartment, setActiveDepartment] = useState(null);
    const [counts, setCounts] = useState({
        Legal: 0,
        Finance: 0,
        Compliance: 0,
        Procurement: 0
    });

    useEffect(() => {
        const fetchCounts = async () => {
            try {
                const data = await contractService.getAllContracts();
                const newCounts = { Legal: 0, Finance: 0, Compliance: 0, Procurement: 0 };

                if (data && Array.isArray(data)) {
                    data.forEach(c => {
                        if (['Under Review', 'Pending', 'Overdue'].includes(c.status) && c.department && newCounts[c.department] != null) {
                            newCounts[c.department]++;
                        }
                    });
                }
                setCounts(newCounts);
            } catch (err) {
                console.error("Failed to fetch review counts", err);
            }
        };

        fetchCounts();
    }, []);

    const departments = [
        { id: 'Legal', name: 'Legal Review', icon: <Scale size={20} strokeWidth={1.5} />, color: '#10B981', component: <LegalReview user={user} /> },
        { id: 'Finance', name: 'Finance Review', icon: <CircleDollarSign size={20} strokeWidth={1.5} />, color: '#3B82F6', component: <FinanceReview user={user} /> },
        { id: 'Compliance', name: 'Compliance Review', icon: <ShieldCheck size={20} strokeWidth={1.5} />, color: '#A855F7', component: <ComplianceReview user={user} /> },
        { id: 'Procurement', name: 'Procurement Review', icon: <ShoppingCart size={20} strokeWidth={1.5} />, color: '#F59E0B', component: <ProcurementReview user={user} /> },
    ];

    if (user?.role === 'Legal') return <LegalReview user={user} />;
    if (user?.role === 'Finance') return <FinanceReview user={user} />;
    if (user?.role === 'Compliance') return <ComplianceReview user={user} />;
    if (user?.role === 'Procurement') return <ProcurementReview user={user} />;

    if (activeDepartment) {
        const activeItem = departments.find(d => d.id === activeDepartment);
        return (
            <div className={styles.container} style={{ padding: 0 }}>
                <div style={{ padding: '24px 24px 0 24px' }}>
                    <button className={styles.backBtn} onClick={() => setActiveDepartment(null)}>
                        <span>←</span> Back to Reviews
                    </button>
                </div>
                {activeItem?.component}
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <header className={styles.pageHeader}>
                <div className={styles.titleArea}>
                    <h2>Departmental Reviews</h2>
                    <p>Overview of all pending contract reviews across departments.</p>
                </div>
            </header>

            <div className={styles.cardsGrid}>
                {departments.map(dept => (
                    <div key={dept.id} className={styles.reviewCard}>
                        <div className={styles.cardHeader}>
                            <div className={styles.cardIcon} style={{ color: dept.color }}>
                                {dept.icon}
                            </div>
                            <div className={styles.cardTitle}>{dept.name}</div>
                        </div>

                        <div className={styles.cardStats}>
                            <div className={styles.statValue}>{counts[dept.id] || 0}</div>
                            <div className={styles.statLabel}>Pending Contracts</div>
                        </div>

                        <button className={styles.openBtn} onClick={() => setActiveDepartment(dept.id)}>
                            Open Queue
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Reviews;
