import React, { useState } from 'react';
import styles from '../UploadContract.module.css';
import AiVerificationPanel from './AiVerificationPanel';

const EmailBucketTab = ({ onDataChange }) => {
    const [rawContent, setRawContent] = useState('');
    const [file, setFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [extractedData, setExtractedData] = useState(null);
    const [error, setError] = useState('');

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setRawContent('');
    };

    const handleProcessEmail = async () => {
        if (!file && !rawContent.trim()) {
            setError('Please upload an email file or paste email content.');
            return;
        }
        setIsProcessing(true);
        setError('');
        setExtractedData(null);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        try {
            let emailText = rawContent;
            if (file) emailText = await file.text();
            const token = localStorage.getItem('token') || 'mock-token-admin';
            const response = await fetch('/api/ai/extract-email', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                signal: controller.signal,
                body: JSON.stringify({ email_text: emailText })
            });
            clearTimeout(timeoutId);

            if (!response.ok) throw new Error('Extraction failed');
            const data = await response.json();
            // Robust check: at least one meaningful field should exist
            const hasData = (data.counterpartyName && data.counterpartyName.trim() !== "") || 
                           (data.contractValue && data.contractValue !== "") ||
                           (data.subject && data.subject !== "");
            
            if (!hasData) {
                setError('AI could not extract data. Please paste email content manually.');
                return;
            }
            setExtractedData(data);
            if (onDataChange) onDataChange(data);
        } catch (err) {
            clearTimeout(timeoutId);
            console.error('Email process error:', err);
            if (err.name === 'AbortError') {
                setError('AI extraction taking too long. You can enter details manually or try again.');
            } else {
                setError('Failed to process email. Please try again.');
            }
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDataChange = (field, value) => {
        const updated = { ...extractedData, [field]: value };
        setExtractedData(updated);
        if (onDataChange) onDataChange(updated);
    };

    const handleReset = () => { setExtractedData(null); setRawContent(''); setFile(null); };

    // Build panel data from email extracted data
    const panelData = extractedData ? {
        title: extractedData.subject || 'Contract from Email',
        counterparty: extractedData.counterpartyName,
        contractValue: extractedData.contractValue,
        duration: extractedData.dates || '',
        clauses: [],
        complianceScore: 0,
        risks: [],
        missingFields: [],
    } : null;

    return (
        <div className={styles.formPanel}>
            <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { to { transform: rotate(360deg); } } @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }` }} />

            {!extractedData ? (
                <>
                    <div className={styles.formHeader}>
                        <div className={styles.formTitleGroup}>
                            <h3 className={styles.formTitle}>Email Bucket Parser</h3>
                            <p className={styles.formSub}>Extract contract metadata from .eml/.msg files or raw email text using AI.</p>
                        </div>
                    </div>

                    <div className={styles.form}>
                        <div className={styles.uploadArea}>
                            <div className={styles.uploadBox}>
                                <div className={styles.uploadIcon}>📧</div>
                                <div className={styles.uploadText}>
                                    <input type="file" accept=".eml,.msg" onChange={handleFileChange} style={{ marginBottom: '1rem' }} />
                                    {file && <div style={{ color: '#10b981' }}>Selected: {file.name}</div>}
                                </div>
                                <div className={styles.uploadLimit}>Supports .eml and .msg files</div>
                            </div>
                        </div>

                        <div style={{ textAlign: 'center', color: 'var(--text-muted)', margin: '1rem 0', fontWeight: 'bold' }}>OR</div>

                        <div className={styles.formGroup}>
                            <label>Paste Raw Email Content</label>
                            <textarea
                                className={styles.input}
                                rows="8"
                                placeholder="Paste the full email body here..."
                                value={rawContent}
                                onChange={(e) => { setRawContent(e.target.value); setFile(null); }}
                                style={{ resize: 'vertical', minHeight: '150px' }}
                            />
                        </div>

                        {error && (
                            <div style={{ color: '#ef4444', padding: '0.75rem', backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: '4px', border: '1px solid rgba(239,68,68,0.2)' }}>
                                {error}
                            </div>
                        )}

                        <div className={styles.formFooter}>
                            <button className={styles.submitBtn} onClick={handleProcessEmail} disabled={isProcessing}>
                                {isProcessing ? (
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                        <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
                                        Processing with AI...
                                    </div>
                                ) : 'Process Email with AI Extraction'}
                            </button>
                        </div>
                    </div>
                </>
            ) : (
                <div style={{ animation: 'fadeIn 0.5s ease' }}>
                    <div className={styles.formHeader}>
                        <div className={styles.formTitleGroup}>
                            <h3 className={styles.formTitle}>Review Extracted Metadata</h3>
                            <p className={styles.formSub}>AI has extracted the following details. Verify and edit if necessary.</p>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                        <div className={styles.formGroup}>
                            <label>Counterparty Name</label>
                            <input className={styles.input} type="text" value={extractedData.counterpartyName} onChange={(e) => handleDataChange('counterpartyName', e.target.value)} />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Contract Value</label>
                            <input className={styles.input} type="text" value={extractedData.contractValue} onChange={(e) => handleDataChange('contractValue', e.target.value)} />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Subject / Type</label>
                            <input className={styles.input} type="text" value={extractedData.subject} onChange={(e) => handleDataChange('subject', e.target.value)} />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Proposed Dates</label>
                            <input className={styles.input} type="text" value={extractedData.dates} onChange={(e) => handleDataChange('dates', e.target.value)} />
                        </div>
                    </div>

                    {/* AI Verification Panel */}
                    <AiVerificationPanel data={panelData} onSuccess={handleReset} />

                    <div className={styles.formFooter} style={{ marginTop: '1rem' }}>
                        <button className={styles.cancelBtn} onClick={handleReset}>Reset &amp; Try Again</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmailBucketTab;
