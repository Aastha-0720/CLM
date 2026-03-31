import React, { useState, useEffect } from 'react';
import styles from './AiVerificationPanel.module.css';
import { contractService } from '../../services/contractService';
import { getAuthHeaders } from '../../services/authHelper';

const DEPT_COLORS = {
    Legal:       { bg: 'rgba(37,99,235,0.15)',  text: '#60a5fa' },
    Finance:     { bg: 'rgba(16,185,129,0.15)', text: '#34d399' },
    Compliance:  { bg: 'rgba(139,92,246,0.15)', text: '#c084fc' },
    Procurement: { bg: 'rgba(249,115,22,0.15)', text: '#fb923c' },
};

const AiVerificationPanel = ({ data, file, onSuccess }) => {
    const [verificationResult, setVerificationResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
    };

    useEffect(() => {
        if (!data || Object.keys(data).length === 0) {
            setVerificationResult(null);
            return;
        }
        const runVerification = async () => {
            setIsLoading(true);
            try {
                const result = await contractService.verifyContract(data);
                setVerificationResult(result);
            } catch (error) {
                console.error('Verification failed', error);
            } finally {
                setIsLoading(false);
            }
        };
        const timer = setTimeout(runVerification, 500);
        return () => clearTimeout(timer);
    }, [data]);

    // Build routing preview from clauses
    const buildRoutingPreview = () => {
        const clauses = data?.clauses || [];
        const counts = {};
        clauses.forEach(c => {
            const dept = c.department || 'Legal';
            counts[dept] = (counts[dept] || 0) + 1;
        });
        // Always include Legal as default minimum
        if (Object.keys(counts).length === 0) {
            counts['Legal'] = 0;
        }
        return counts;
    };

    const handleSubmit = async () => {
        if (!verificationResult || verificationResult.complianceScore < 60) return;
        setIsSubmitting(true);
        
        try {
            const savedUser = JSON.parse(localStorage.getItem('clm-user') || '{}');
            const userEmail = savedUser.email || 'Admin';
            
            const valueNum = parseFloat(
                (data.contractValue || '0').replace(/[^0-9.]/g, '')
            ) || 0;

            const response = await fetch('/api/contracts/create', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    title: data.title || (file ? file.name : (data.counterparty || 'New Contract')),
                    company: data.counterparty || 'Unknown',
                    value: valueNum,
                    department: 'Legal',
                    submittedBy: userEmail,
                    duration: data.duration || null,
                    category: data.category || null,
                    risk_classification: data.riskLevel || null,
                    business_unit: data.businessUnit || null,
                    clauses: data.clauses || [],
                })
            });
            
            if (!response.ok) throw new Error('Failed');
            const result = await response.json();
            const contractId = result.id;

            // 2. Upload the file if present
            if (file && contractId) {
                await contractService.uploadContractDocument(contractId, file);
            }

            showToast('Contract submitted for Legal Review!');
            setTimeout(() => {
                if (onSuccess) onSuccess();
            }, 1500);
        } catch (err) {
            console.error("Submission error:", err);
            showToast('Failed to submit contract.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!data || Object.keys(data).length === 0) {
        return (
            <div className={styles.panelContainer}>
                <div className={styles.emptyState}>
                    Start filling in contract details to see real-time AI compliance analysis...
                </div>
            </div>
        );
    }

    if (isLoading && !verificationResult) {
        return (
            <div className={styles.panelContainer}>
                <div className={styles.emptyState} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.1)', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                    AI Analyzing Compliance...
                </div>
                <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { to { transform: rotate(360deg); } }` }} />
            </div>
        );
    }

    const routingPreview = buildRoutingPreview();
    const score = verificationResult?.complianceScore ?? 0;
    const canSubmit = score >= 60 && !isSubmitting;

    return (
        <div className={styles.panelContainer}>
            <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { to { transform: rotate(360deg); } }` }} />

            {/* Header + Score */}
            <div className={styles.panelHeader}>
                <div className={styles.titleGroup}>
                    <h4>AI Verification Panel</h4>
                    <p>Real-time compliance and risk analysis across extracted data.</p>
                </div>
                {verificationResult && (
                    <div className={styles.scoreWrapper}>
                        <div className={styles.scoreText}>{score}%</div>
                        <div className={styles.progressBarTrack}>
                            <div
                                className={styles.progressBarFill}
                                style={{
                                    width: `${score}%`,
                                    background: score < 50 ? '#ef4444' : score < 80 ? '#f59e0b' : '#10b981'
                                }}
                            />
                        </div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>Compliance Score</span>
                    </div>
                )}
            </div>

            {/* Risk + Gaps */}
            <div className={styles.contentGrid}>
                <div>
                    <div className={styles.sectionTitle}>Risk Assessment</div>
                    <div className={styles.riskList}>
                        {verificationResult?.risks?.length > 0 ? (
                            verificationResult.risks.map((risk, index) => (
                                <div key={index} className={`${styles.riskBadge} ${risk.level === 'High' ? styles.badgeHigh : risk.level === 'Medium' ? styles.badgeMedium : styles.badgeLow}`}>
                                    <div className={styles.dot}></div>
                                    {risk.level}: {risk.message}
                                </div>
                            ))
                        ) : (
                            <div style={{ color: '#10b981', fontSize: '0.9rem' }}>✅ No immediate risks identified</div>
                        )}
                    </div>
                </div>
                <div>
                    <div className={styles.sectionTitle}>Identified Gaps</div>
                    <ul className={styles.warningList}>
                        {verificationResult?.missingFields?.length > 0 ? (
                            verificationResult.missingFields.map((field, index) => (
                                <li key={index} className={styles.warningItem}>
                                    <span className={styles.warningIcon}>⚠️</span>
                                    {field}
                                </li>
                            ))
                        ) : (
                            <li className={styles.warningItem} style={{ color: '#10b981' }}>
                                <span style={{ marginRight: '10px' }}>✅</span>
                                All critical fields present
                            </li>
                        )}
                    </ul>
                </div>
            </div>

            {/* Routing Preview */}
            <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                <div className={styles.sectionTitle} style={{ marginBottom: '0.75rem' }}>Routing Preview</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {Object.entries(routingPreview).map(([dept, count]) => {
                        const color = DEPT_COLORS[dept] || { bg: 'rgba(100,100,100,0.15)', text: '#aaa' };
                        return (
                            <span key={dept} style={{
                                background: color.bg,
                                color: color.text,
                                padding: '5px 12px',
                                borderRadius: '20px',
                                fontSize: '0.78rem',
                                fontWeight: '600',
                                border: `1px solid ${color.text}33`
                            }}>
                                {dept} {count > 0 ? `(${count} clause${count !== 1 ? 's' : ''})` : ''}
                            </span>
                        );
                    })}
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                    Contract will route through the departments shown above sequentially.
                </p>
            </div>

            {/* Submit */}
            <div className={styles.footer}>
                {score < 60 && verificationResult && (
                    <p style={{ fontSize: '0.78rem', color: '#f59e0b', marginBottom: '8px' }}>
                        ⚠️ Compliance score must be ≥ 60 to submit for review.
                    </p>
                )}
                <button
                    className={styles.submitBtn}
                    onClick={handleSubmit}
                    disabled={!canSubmit || !verificationResult}
                    style={{ opacity: (!canSubmit || !verificationResult) ? 0.5 : 1 }}
                >
                    {isSubmitting ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                            <div style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
                            Submitting...
                        </span>
                    ) : score < 60 && verificationResult ? 'Score Too Low for Review' : 'Send for Official Review'}
                </button>
            </div>

            {/* Toast */}
            {toast.show && (
                <div style={{
                    position: 'fixed', bottom: '24px', right: '24px',
                    background: toast.type === 'success' ? '#10B981' : '#EF4444',
                    color: '#fff', padding: '14px 24px', borderRadius: '10px',
                    fontWeight: '600', fontSize: '14px', zIndex: 9999,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
                }}>
                    {toast.type === 'success' ? '✅ ' : '❌ '}{toast.message}
                </div>
            )}
        </div>
    );
};

export default AiVerificationPanel;
