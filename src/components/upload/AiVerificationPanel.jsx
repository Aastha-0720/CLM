import React, { useState, useEffect } from 'react';
import styles from './AiVerificationPanel.module.css';
import { contractService } from '../../services/contractService';

const AiVerificationPanel = ({ data }) => {
    const [verificationResult, setVerificationResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

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
                console.error("Verification failed", error);
            } finally {
                setIsLoading(false);
            }
        };

        const timer = setTimeout(runVerification, 500); // Debounce to avoid too many mock calls
        return () => clearTimeout(timer);
    }, [data]);

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
                    <div className="spinner" style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.1)', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                    AI Analyzing Compliance...
                </div>
                <style dangerouslySetInnerHTML={{
                    __html: `
                    @keyframes spin { to { transform: rotate(360deg); } }
                `}} />
            </div>
        );
    }

    return (
        <div className={styles.panelContainer}>
            <div className={styles.panelHeader}>
                <div className={styles.titleGroup}>
                    <h4>AI Verification Panel</h4>
                    <p>Real-time compliance and risk analysis across extracted data.</p>
                </div>
                {verificationResult && (
                    <div className={styles.scoreWrapper}>
                        <div className={styles.scoreText}>{verificationResult.complianceScore}%</div>
                        <div className={styles.progressBarTrack}>
                            <div
                                className={styles.progressBarFill}
                                style={{
                                    width: `${verificationResult.complianceScore}%`,
                                    background: verificationResult.complianceScore < 50 ? '#ef4444' : verificationResult.complianceScore < 80 ? '#f59e0b' : '#10b981'
                                }}
                            ></div>
                        </div>
                        <span style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px' }}>Compliance Score</span>
                    </div>
                )}
            </div>

            <div className={styles.contentGrid}>
                <div>
                    <div className={styles.sectionTitle}>Risk Assessment</div>
                    <div className={styles.riskList}>
                        {verificationResult?.risks.length > 0 ? (
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
                        {verificationResult?.missingFields.length > 0 ? (
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

            <div className={styles.footer}>
                <button
                    className={styles.submitBtn}
                    onClick={() => alert('Sending contract for official review pipeline...')}
                    disabled={verificationResult?.complianceScore < 60}
                >
                    {verificationResult?.complianceScore < 60 ? 'Score Too Low for Review' : 'Send for Official Review'}
                </button>
            </div>
        </div>
    );
};

export default AiVerificationPanel;
