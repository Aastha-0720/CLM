import React, { useState, useEffect } from 'react';
import styles from './AiVerificationPanel.module.css';
import { contractService } from '../../services/contractService';
import { ChevronDown, AlertCircle, FileText, CheckCircle2, Save, Send, RefreshCw } from 'lucide-react';

const DEPT_COLORS = {
    Legal:       { bg: 'rgba(37,99,235,0.15)',  text: '#60a5fa' },
    Finance:     { bg: 'rgba(16,185,129,0.15)', text: '#34d399' },
    Compliance:  { bg: 'rgba(139,92,246,0.15)', text: '#c084fc' },
    Procurement: { bg: 'rgba(249,115,22,0.15)', text: '#fb923c' },
};

const VALID_DEPARTMENTS = ['Legal', 'Finance', 'Compliance', 'Procurement'];

const AiVerificationPanel = ({ data, onSuccess }) => {
    const [verificationResult, setVerificationResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    
    // UI States
    const [expandedSections, setExpandedSections] = useState({ critical: true, missing: false });
    const [editedDept, setEditedDept] = useState('');
    const [contractValue, setContractValue] = useState('');
    const [notes, setNotes] = useState('');
    const [contractId, setContractId] = useState(data?.id || data?.contract_id || null);

    const normalizeValue = (value) => {
        if (value == null) return '';
        const stringValue = String(value).trim();
        if (stringValue === 'NoneNone' || stringValue === 'nullnull') return '';
        return stringValue;
    };

    const normalizeDepartment = (value) => VALID_DEPARTMENTS.includes(value) ? value : '';

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
                // Set defaults from AI
                setEditedDept(normalizeDepartment(result.fullAnalysis?.suggestedDepartment));
                setContractValue(normalizeValue(data.contractValue || result.fullAnalysis?.extractedValue || ''));
                setContractId(data?.id || data?.contract_id || null);
            } catch (error) {
                console.error('Verification failed', error);
                setVerificationResult({
                    complianceScore: 0,
                    risks: [{ level: "Info", message: "AI verification could not be completed." }],
                    missingFields: [],
                    fullAnalysis: {
                        executiveSummary: "AI analysis encountered an error. Manual review required.",
                        contractType: "Not Available",
                        suggestedDepartment: "Not Available",
                        complianceScore: 0,
                        riskScore: 0,
                        criticalIssues: ["Analysis Error: Manual check recommended"],
                        missingClauses: ["Data extraction incomplete"],
                        keyClauses: {
                            payment_terms: "Not Available",
                            liability: "Not Available",
                            termination: "Not Available"
                        },
                        overallRiskScore: "Unknown"
                    }
                });
                setEditedDept('');
                setContractValue(normalizeValue(data.contractValue || ''));
                setContractId(data?.id || data?.contract_id || null);
            } finally {
                setIsLoading(false);
            }
        };
        const timer = setTimeout(runVerification, 500);
        return () => clearTimeout(timer);
    }, [data]);

    const handleSaveDraft = async () => {
        if (isSubmitting) return;
        if (!editedDept) {
            showToast('Select a department before sending.', 'error');
            return;
        }
        setIsSubmitting(true);

        try {
            const valueNum = parseFloat(String(contractValue).replace(/[^0-9.]/g, '')) || 0;
            const userRole = localStorage.getItem('user_role') || 'Sales';
            const token = localStorage.getItem('token') || 'mock-token';

            const payload = {
                title: data.title || 'New Contract',
                company: data.counterparty || 'Not Available',
                value: valueNum,
                department: 'Sales',
                submittedBy: userRole,
                status: 'Draft',
                stage: 'Draft',
                draftText: notes,
                clauses: data.clauses || [],
                duration: data.duration || '',
                businessUnit: data.businessUnit || '',
                contractOwner: data.contractOwner || '',
                category: data.category || 'General',
                riskLevel: data.riskLevel || 'Medium',
                salesOpportunityId: data.salesOpportunityId || data.opportunityId || ''
            };

            const response = await fetch('/api/contracts/save-draft', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result?.detail || result?.message || 'Action failed');
            }

            if (result?.id) {
                setContractId(result.id);
            }
            showToast('Draft saved successfully');
        } catch (err) {
            showToast(err.message || 'Action failed', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmit = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);

        const normalizedValue = normalizeValue(contractValue);
        const userRole = localStorage.getItem('user_role') || 'Sales';
        const token = localStorage.getItem('token') || 'mock-token';

        console.log("Sending Data:", {
            contract_id: contractId,
            department: editedDept,
            value: normalizedValue || null
        });

        try {
            const payload = {
                contract_id: contractId,
                department: editedDept,
                value: normalizedValue || null,
                notes,
                contract_data: {
                    title: data.title || 'New Contract',
                    company: data.counterparty || 'Not Available',
                    duration: data.duration || '',
                    businessUnit: data.businessUnit || '',
                    contractOwner: data.contractOwner || '',
                    category: data.category || 'General',
                    riskLevel: data.riskLevel || 'Medium',
                    salesOpportunityId: data.salesOpportunityId || data.opportunityId || '',
                    submittedBy: userRole,
                    clauses: data.clauses || [],
                    counterparty_email: data.counterparty_email || '',
                    signer_name: data.signer_name || '',
                    expiryDate: data.expiryDate || ''
                }
            };

            const res = await fetch('/api/contracts/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const responseData = await res.json();

            if (!res.ok) {
                console.error('Error:', responseData);
                throw new Error(responseData?.detail || responseData?.message || 'Failed');
            }

            if (responseData?.id) {
                setContractId(responseData.id);
            }

            showToast(`Sent to ${editedDept} Department`);
            setTimeout(() => {
                if (onSuccess) onSuccess();
            }, 1000);
        } catch (err) {
            console.error('Submit Error:', err);
            showToast(err.message || 'Action failed', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading && !verificationResult) {
        return (
            <div className={styles.panelContainer}>
                <div className={styles.skeletonCard} style={{ marginBottom: '1rem' }}></div>
                <div className={styles.emptyState}>
                    <RefreshCw className={styles.spin} style={{ marginRight: '10px' }} />
                    Analyzing contract documents...
                </div>
                <div className={styles.skeletonCard} style={{ height: '200px' }}></div>
            </div>
        );
    }

    const analysis = verificationResult?.fullAnalysis || {};
    const score = analysis.riskScore ?? analysis.riskPercentage ?? 0;
    const keyClauses = analysis.keyClauses || {};
    const clauseHighlights = [
        { label: 'Payment Terms', value: keyClauses.payment_terms || 'Not Available' },
        { label: 'Liability', value: keyClauses.liability || 'Not Available' },
        { label: 'Termination', value: keyClauses.termination || 'Not Available' }
    ];

    return (
        <div className={styles.panelContainer}>
            <div className={styles.panelHeader}>
                <div className={styles.titleGroup}>
                    <h4>AI Analysis Review</h4>
                    <p>Verified extraction results for {data.title}</p>
                </div>
            </div>

            {/* Section A: AI Summary Card */}
            <div className={styles.summaryCard}>
                <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Contract Type</span>
                    <span className={styles.summaryValue}>{analysis.contractType || 'Not Available'}</span>
                </div>
                <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Suggested Dept</span>
                    <span className={styles.summaryValue}>
                        <span style={{ 
                            background: DEPT_COLORS[analysis.suggestedDepartment]?.bg || 'rgba(255,255,255,0.1)',
                            color: DEPT_COLORS[analysis.suggestedDepartment]?.text || '#fff',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '0.8rem'
                        }}>
                            {analysis.suggestedDepartment || 'Not Available'}
                        </span>
                    </span>
                </div>
                <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Risk Score</span>
                    <div className={`${styles.complianceBadge} ${score > 80 ? styles.riskLow : score > 50 ? styles.riskMedium : styles.riskHigh}`}>
                        {score > 80 ? 'High Risk' : score > 50 ? 'Medium Risk' : 'Low Risk'} ({score}%)
                    </div>
                </div>
            </div>

            <div className={styles.assistBanner}>
                AI suggestions are advisory only. Sales must confirm the department before routing this contract.
            </div>

            <div className={styles.highlightsCard}>
                <div className={styles.highlightsHeader}>
                    <h5>Clause Highlights</h5>
                    <span>AI extracted the most important commercial and legal terms.</span>
                </div>
                <div className={styles.highlightsGrid}>
                    {clauseHighlights.map((item) => (
                        <div key={item.label} className={styles.highlightItem}>
                            <div className={styles.highlightLabel}>{item.label}</div>
                            <div className={styles.highlightValue}>{item.value || 'Not Available'}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Section B: Issues & Insights (Collapsible) */}
            <div className={styles.insightsSection}>
                <div className={styles.collapsible}>
                    <div 
                        className={styles.collapsibleHeader} 
                        onClick={() => setExpandedSections(p => ({ ...p, critical: !p.critical }))}
                    >
                        <span className={styles.collapsibleTitle}>
                            <AlertCircle size={18} color="#ef4444" />
                            Critical Issues ({analysis.criticalIssues?.length || 0})
                        </span>
                        <ChevronDown className={`${styles.chevron} ${expandedSections.critical ? styles.chevronExpanded : ''}`} size={18} />
                    </div>
                    {expandedSections.critical && (
                        <div className={styles.collapsibleContent}>
                            {analysis.criticalIssues?.length > 0 ? (
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                    {analysis.criticalIssues.map((issue, i) => (
                                        <li key={i} style={{ color: '#ef4444', fontSize: '0.9rem', marginBottom: '8px', display: 'flex', gap: '8px' }}>
                                            • {issue}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p style={{ color: '#10b981', fontSize: '0.9rem', margin: 0 }}>No critical issues detected.</p>
                            )}
                        </div>
                    )}
                </div>

                <div className={styles.collapsible}>
                    <div 
                        className={styles.collapsibleHeader} 
                        onClick={() => setExpandedSections(p => ({ ...p, missing: !p.missing }))}
                    >
                        <span className={styles.collapsibleTitle}>
                            <FileText size={18} color="#f59e0b" />
                            Missing Clauses ({analysis.missingClauses?.length || 0})
                        </span>
                        <ChevronDown className={`${styles.chevron} ${expandedSections.missing ? styles.chevronExpanded : ''}`} size={18} />
                    </div>
                    {expandedSections.missing && (
                        <div className={styles.collapsibleContent}>
                            {analysis.missingClauses?.length > 0 ? (
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                    {analysis.missingClauses.map((clause, i) => (
                                        <li key={i} style={{ color: '#cbd5e1', fontSize: '0.85rem', marginBottom: '6px' }}>
                                            ⚠️ {clause}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p style={{ color: '#10b981', fontSize: '0.9rem', margin: 0 }}>All required clauses found.</p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Section C: Sales Review & Action Panel */}
            <div className={styles.actionPanel}>
                <div className={styles.panelGrid}>
                <div className={styles.inputGroup}>
                    <label>Reviewing Department</label>
                    <select 
                        className={styles.selectField}
                        value={editedDept}
                        onChange={(e) => setEditedDept(e.target.value)}
                    >
                        <option value="">Select department</option>
                        <option value="Legal">Legal</option>
                        <option value="Finance">Finance</option>
                        <option value="Compliance">Compliance</option>
                        <option value="Procurement">Procurement</option>
                        </select>
                    </div>
                    <div className={styles.inputGroup}>
                        <label>Total Contract Value</label>
                        <input 
                            type="text" 
                            className={styles.inputField}
                            placeholder="$0.00"
                            value={contractValue}
                            onChange={(e) => setContractValue(e.target.value)}
                        />
                    </div>
                </div>
                <div className={styles.inputGroup} style={{ marginBottom: '20px' }}>
                    <label>Additional Notes (Internal)</label>
                    <textarea 
                        className={styles.textareaField}
                        placeholder="Add any context for the reviewing department..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />
                </div>

                <div className={styles.actionFooter}>
                    <div className={styles.footerLeft}>
                        <button className={styles.secondaryBtn} onClick={onSuccess}>
                            <RefreshCw size={16} /> Re-upload
                        </button>
                        <button className={styles.secondaryBtn} onClick={handleSaveDraft}>
                            <Save size={16} /> Save Draft
                        </button>
                    </div>
                    <button 
                        className={styles.submitBtn} 
                        style={{ display: 'flex', gap: '10px', alignItems: 'center' }}
                        onClick={handleSubmit}
                        disabled={isSubmitting || !editedDept}
                    >
                        {isSubmitting ? 'Sending...' : (
                            <>
                                <Send size={18} /> Send to {editedDept}
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Toast rendering */}
            {toast.show && (
                <div style={{
                    position: 'fixed', bottom: '24px', right: '24px',
                    background: toast.type === 'success' ? '#10B981' : '#EF4444',
                    color: '#fff', padding: '14px 24px', borderRadius: '10px',
                    fontWeight: '600', fontSize: '14px', zIndex: 9999,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                    animation: 'fadeIn 0.3s'
                }}>
                    {toast.type === 'success' ? <CheckCircle2 size={18} style={{ display: 'inline', marginRight: '8px' }} /> : '❌ '}
                    {toast.message}
                </div>
            )}
        </div>
    );
};

export default AiVerificationPanel;
