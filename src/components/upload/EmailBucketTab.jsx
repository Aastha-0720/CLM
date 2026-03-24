import React, { useState } from 'react';
import styles from '../UploadContract.module.css';
import { contractService } from '../../services/contractService';

const EmailBucketTab = ({ onDataChange }) => {
    const [rawContent, setRawContent] = useState('');
    const [file, setFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [extractedData, setExtractedData] = useState(null);
    const [error, setError] = useState('');
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
    };

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setRawContent(''); // Clear raw content if file is uploaded
    };

    const handleProcessEmail = async () => {
        if (!file && !rawContent.trim()) {
            setError('Please upload an email file or paste email content.');
            return;
        }
        setIsProcessing(true);
        setError('');
        setExtractedData(null);
        try {
            let emailText = rawContent;
            if (file) {
                emailText = await file.text();
            }
            const response = await fetch('/api/ai/extract-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email_text: emailText })
            });
            if (!response.ok) throw new Error('Extraction failed');
            const data = await response.json();
            
            // Make sure data has values
            if (!data.counterpartyName && !data.contractValue) {
                setError('AI could not extract data. Please paste email content manually.');
                return;
            }
            setExtractedData(data);
            if (onDataChange) onDataChange(data);
        } catch (err) {
            console.error('Email extraction error:', err);
            setError('Failed to process email. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleGenerateContract = async () => {
        try {
            const valueNum = parseFloat(
                (extractedData.contractValue || '0')
                .replace(/[^0-9.]/g, '')
            ) || 0;

            const response = await fetch('/api/contracts/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: extractedData.subject || 'Contract from Email',
                    company: extractedData.counterpartyName || 'Unknown',
                    value: valueNum,
                    department: 'Legal',
                    submittedBy: 'Admin'
                })
            });
            if (!response.ok) throw new Error('Failed');
            setExtractedData(null);
            setRawContent('');
            setFile(null);
            showToast('Contract created and sent for Legal Review!');
        } catch (err) {
            showToast('Failed to create contract.', 'error');
        }
    };

    const handleDataChange = (field, value) => {
        const updatedData = { ...extractedData, [field]: value };
        setExtractedData(updatedData);
        if (onDataChange) {
            onDataChange(updatedData);
        }
    };

    return (
        <div className={styles.formPanel}>
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
                                    <input
                                        type="file"
                                        accept=".eml,.msg"
                                        onChange={handleFileChange}
                                        style={{ marginBottom: '1rem' }}
                                    />
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
                                onChange={(e) => {
                                    setRawContent(e.target.value);
                                    setFile(null); // Clear file if text is pasted
                                }}
                                style={{ resize: 'vertical', minHeight: '150px' }}
                            ></textarea>
                        </div>

                        {error && (
                            <div style={{ color: '#ef4444', padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '4px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                {error}
                            </div>
                        )}

                        <div className={styles.formFooter}>
                            <button
                                className={styles.submitBtn}
                                onClick={handleProcessEmail}
                                disabled={isProcessing}
                            >
                                {isProcessing ? (
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                        <div className="spinner" style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
                                        Processing with AI...
                                    </div>
                                ) : 'Process Email with AI Extraction'}
                            </button>
                        </div>
                    </div>
                </>
            ) : (
                <div className="metadata-review" style={{ animation: 'fadeIn 0.5s ease' }}>
                    <div className={styles.formHeader}>
                        <div className={styles.formTitleGroup}>
                            <h3 className={styles.formTitle}>Review Extracted Metadata</h3>
                            <p className={styles.formSub}>AI has extracted the following details. Please verify and edit if necessary.</p>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                        <div className={styles.formGroup}>
                            <label>Counterparty Name</label>
                            <input
                                className={styles.input}
                                type="text"
                                value={extractedData.counterpartyName}
                                onChange={(e) => handleDataChange('counterpartyName', e.target.value)}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Contract Value</label>
                            <input
                                className={styles.input}
                                type="text"
                                value={extractedData.contractValue}
                                onChange={(e) => handleDataChange('contractValue', e.target.value)}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Subject / Type</label>
                            <input
                                className={styles.input}
                                type="text"
                                value={extractedData.subject}
                                onChange={(e) => handleDataChange('subject', e.target.value)}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Proposed Dates</label>
                            <input
                                className={styles.input}
                                type="text"
                                value={extractedData.dates}
                                onChange={(e) => handleDataChange('dates', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className={styles.formFooter}>
                        <button
                            className={styles.cancelBtn}
                            onClick={() => setExtractedData(null)}
                        >
                            Reset & Try Again
                        </button>
                        <button
                            className={styles.submitBtn}
                            onClick={handleGenerateContract}
                        >
                            Generate Contract from Email
                        </button>
                    </div>
                </div>
            )}
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}} />
            {toast.show && (
                <div style={{
                    position: 'fixed',
                    bottom: '24px',
                    right: '24px',
                    background: toast.type === 'success' ? '#10B981' : '#EF4444',
                    color: '#fff',
                    padding: '14px 24px',
                    borderRadius: '10px',
                    fontWeight: '600',
                    fontSize: '14px',
                    zIndex: 9999,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
                }}>
                    {toast.type === 'success' ? '✅ ' : '❌ '}{toast.message}
                </div>
            )}
        </div>
    );
};

export default EmailBucketTab;
