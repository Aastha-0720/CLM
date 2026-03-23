import React, { useState, useCallback } from 'react';
import styles from '../UploadContract.module.css';
import { contractService } from '../../services/contractService';

const FileUploadTab = ({ onDataChange }) => {
    const [file, setFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [extractedData, setExtractedData] = useState(null);
    const [error, setError] = useState('');

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && (droppedFile.type === 'application/pdf' || droppedFile.name.endsWith('.docx'))) {
            setFile(droppedFile);
            setError('');
            if (onDataChange) {
                onDataChange({ title: droppedFile.name, type: 'file' });
            }
        } else {
            setError('Please upload a PDF or DOCX file.');
        }
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setError('');
            if (onDataChange) {
                onDataChange({ title: selectedFile.name, type: 'file' });
            }
        }
    };

    const handleProcessFile = async () => {
        if (!file) {
            setError('Please select a file to process.');
            return;
        }

        setIsProcessing(true);
        setError('');

        try {
            const data = await contractService.extractContractData(file);
            setExtractedData(data);
            if (onDataChange) {
                onDataChange({ ...data, title: file.name });
            }
        } catch (err) {
            setError('Failed to extract data from file.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReset = () => {
        setFile(null);
        setExtractedData(null);
        setError('');
    };

    return (
        <div className={styles.formPanel}>
            {!extractedData ? (
                <>
                    <div className={styles.formHeader}>
                        <div className={styles.formTitleGroup}>
                            <h3 className={styles.formTitle}>Direct File Extraction</h3>
                            <p className={styles.formSub}>Upload contract documents for deep AI analysis and clause classification.</p>
                        </div>
                    </div>

                    <div
                        className={`${styles.uploadBox} ${isDragging ? styles.dragging : ''}`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        style={{
                            border: isDragging ? '2px solid #2563eb' : '2px dashed rgba(255,255,255,0.1)',
                            backgroundColor: isDragging ? 'rgba(37, 99, 235, 0.1)' : 'transparent',
                            transition: 'all 0.3s ease'
                        }}
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
                        <input
                            type="file"
                            accept=".pdf,.docx"
                            onChange={handleFileChange}
                            style={{ position: 'absolute', opacity: 0, inset: 0, cursor: 'pointer' }}
                        />
                    </div>

                    {error && (
                        <div style={{ color: '#ef4444', marginTop: '1rem', padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                            {error}
                        </div>
                    )}

                    <div className={styles.formFooter} style={{ marginTop: '2rem' }}>
                        <button
                            className={styles.submitBtn}
                            onClick={handleProcessFile}
                            disabled={!file || isProcessing}
                            style={{ width: '100%' }}
                        >
                            {isProcessing ? 'AI Analyzing Document...' : 'Process Document'}
                        </button>
                    </div>
                </>
            ) : (
                <div style={{ animation: 'fadeIn 0.4s ease' }}>
                    <div className={styles.formHeader}>
                        <div className={styles.formTitleGroup}>
                            <h3 className={styles.formTitle}>AI Analysis Complete</h3>
                            <p className={styles.formSub}>Deep extraction results for {file.name}</p>
                        </div>
                    </div>

                    <div style={{ background: 'rgba(15, 23, 42, 0.3)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '2rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
                            <div>
                                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Counterparty</label>
                                <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#fff' }}>{extractedData.counterparty}</div>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Value</label>
                                <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#10b981' }}>{extractedData.contractValue}</div>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Duration</label>
                                <div style={{ color: 'var(--text-primary)' }}>{extractedData.duration}</div>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Key Dates</label>
                                <div style={{ color: 'var(--text-primary)' }}>{extractedData.keyDates}</div>
                            </div>
                        </div>
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <h4 style={{ marginBottom: '1rem', color: '#cbd5e1' }}>Smart Clause Classification</h4>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                        <th style={{ textAlign: 'left', padding: '12px', color: '#94a3b8', fontSize: '0.85rem' }}>Clause Preview</th>
                                        <th style={{ textAlign: 'left', padding: '12px', color: '#94a3b8', fontSize: '0.85rem' }}>Classification</th>
                                        <th style={{ textAlign: 'left', padding: '12px', color: '#94a3b8', fontSize: '0.85rem' }}>Routing</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {extractedData.clauses.map(clause => (
                                        <tr key={clause.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <td style={{ padding: '12px', fontSize: '0.9rem', color: 'var(--text-primary)' }}>"{clause.text}"</td>
                                            <td style={{ padding: '12px' }}>
                                                <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600', background: 'rgba(37, 99, 235, 0.2)', color: '#60a5fa' }}>
                                                    {clause.type}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px' }}>
                                                <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}>
                                                    {clause.department}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className={styles.formFooter}>
                        <button className={styles.cancelBtn} onClick={handleReset}>Upload Different File</button>
                        <button className={styles.submitBtn}
                            onClick={async () => {
                                try {
                                    const valueNum = parseFloat(
                                        (extractedData.contractValue || '0')
                                        .replace(/[^0-9.]/g, '')
                                    ) || 0;

                                    const response = await fetch('/api/contracts/create', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            title: file.name.replace(/\.(pdf|docx)$/i, ''),
                                            company: extractedData.counterparty || 'Unknown',
                                            value: valueNum,
                                            department: 'Legal',
                                            submittedBy: 'Admin'
                                        })
                                    });
                                    if (!response.ok) throw new Error('Failed');
                                    handleReset();
                                    alert('Contract submitted for Legal Review!');
                                } catch (err) {
                                    alert('Failed to submit contract. Please try again.');
                                }
                            }}>
                            Proceed to Verification
                        </button>
                    </div>
                </div>
            )}
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}} />
        </div>
    );
};

export default FileUploadTab;
