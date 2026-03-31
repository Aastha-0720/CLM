import React, { useState } from 'react';
import styles from '../UploadContract.module.css';
import AiVerificationPanel from './AiVerificationPanel';

const FileUploadTab = ({ onDataChange }) => {
    const [file, setFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [extractedData, setExtractedData] = useState(null);
    const [error, setError] = useState('');

    const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = () => setIsDragging(false);

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && (droppedFile.type === 'application/pdf' || droppedFile.name.endsWith('.docx'))) {
            setFile(droppedFile);
            setError('');
            if (onDataChange) onDataChange({ title: droppedFile.name, type: 'file' });
        } else {
            setError('Please upload a PDF or DOCX file.');
        }
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setError('');
            if (onDataChange) onDataChange({ title: selectedFile.name, type: 'file' });
        }
    };

    const handleProcessFile = async () => {
        if (!file) { setError('Please select a file to process.'); return; }
        setIsProcessing(true);
        setError('');
        try {
            const formData = new FormData();
            formData.append('file', file);
            const token = localStorage.getItem('token') || 'mock-token-admin';
            const response = await fetch('/api/ai/extract-file', { 
                method: 'POST', 
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData 
            });
            if (!response.ok) throw new Error('Extraction failed');
            const data = await response.json();

            const hasExtractedData = Boolean(
                data.counterparty ||
                data.contractValue ||
                data.effectiveDate ||
                data.expiryDate ||
                (Array.isArray(data.clauses) && data.clauses.length > 0)
            );

            if (!hasExtractedData) {
                setError(data.error || 'AI could not extract data. Please try a different file.');
                return;
            }

            setExtractedData({ ...data, title: file.name.replace(/\.(pdf|docx)$/i, '') });
            if (onDataChange) onDataChange({ ...data, title: file.name });
        } catch (err) {
            setError('Failed to extract data from file. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReset = () => { setFile(null); setExtractedData(null); setError(''); };

    if (extractedData) {
        return (
            <div className={styles.formPanel} style={{ animation: 'fadeIn 0.4s ease' }}>
                <AiVerificationPanel data={extractedData} onSuccess={handleReset} />
            </div>
        );
    }


    return (
        <div className={styles.formPanel}>
            <div className={styles.formHeader}>
                <div className={styles.formTitleGroup}>
                    <h3 className={styles.formTitle}>Direct File Extraction</h3>
                    <p className={styles.formSub}>Upload contract documents for deep AI analysis and clause classification.</p>
                </div>
            </div>

            <input type="file" accept=".pdf,.docx" onChange={handleFileChange} style={{ marginBottom: '12px' }} />
            <div style={{ position: 'relative' }}>
                <div
                    className={`${styles.uploadBox} ${isDragging ? styles.dragging : ''}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    style={{ position: 'relative', border: isDragging ? '2px solid #2563eb' : '2px dashed rgba(255,255,255,0.1)', backgroundColor: isDragging ? 'rgba(37,99,235,0.1)' : 'transparent', transition: 'all 0.3s ease' }}
                >
                    <div className={styles.uploadIcon} style={{ fontSize: '3rem', marginBottom: '1rem' }}>📄</div>
                    <div className={styles.uploadText}>
                        {file ? (
                            <strong style={{ color: '#10b981' }}>{file.name}</strong>
                        ) : (
                            <>
                                <strong>Click to upload</strong> or drag and drop
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>PDF or DOCX documents allowed</p>
                            </>
                        )}
                    </div>
                    <input type="file" accept=".pdf,.docx" onChange={handleFileChange} style={{ position: 'absolute', opacity: 0, inset: 0, cursor: 'pointer' }} />
                </div>
            </div>

            {error && (
                <div style={{ color: '#ef4444', marginTop: '1rem', padding: '0.75rem', backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.2)' }}>
                    {error}
                </div>
            )}

            <div className={styles.formFooter} style={{ marginTop: '2rem' }}>
                <button className={styles.submitBtn} onClick={handleProcessFile} disabled={!file || isProcessing} style={{ width: '100%' }}>
                    {isProcessing ? 'AI Analyzing Document...' : 'Process Document'}
                </button>
            </div>
        </div>
    );
};

export default FileUploadTab;
