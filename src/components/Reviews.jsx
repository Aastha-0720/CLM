import React, { useState, useEffect } from 'react';
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
                // In a real app we might have a dedicated stats endpoint
                // For now, fetch 'Under Review' contracts and count by department
                const data = await contractService.getContractsByStage('Under Review');
                const newCounts = { Legal: 0, Finance: 0, Compliance: 0, Procurement: 0 };

                if (data && Array.isArray(data)) {
                    data.forEach(c => {
                        const dept = c.department || 'Legal'; // fallback to Legal
                        if (newCounts[dept] !== undefined) {
                            newCounts[dept]++;
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
        { id: 'Legal', name: 'Legal Review', icon: '⚖️', color: '#10B981', component: <LegalReview /> },
        { id: 'Finance', name: 'Finance Review', icon: '💰', color: '#3B82F6', component: <FinanceReview /> },
        { id: 'Compliance', name: 'Compliance Review', icon: '🛡️', color: '#A855F7', component: <ComplianceReview /> },
        { id: 'Procurement', name: 'Procurement Review', icon: '🛒', color: '#F59E0B', component: <ProcurementReview /> },
    ];

    if (user?.role === 'Legal') return <LegalReview />;
    if (user?.role === 'Finance') return <FinanceReview />;
    if (user?.role === 'Compliance') return <ComplianceReview />;
    if (user?.role === 'Procurement') return <ProcurementReview />;

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
                            <div className={styles.cardIcon} style={{ backgroundColor: `${dept.color}15`, color: dept.color }}>
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
