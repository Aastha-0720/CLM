import React, { useState } from 'react';
import styles from '../UploadContract.module.css';
import { getAuthHeaders } from '../../services/authHelper';
import AiVerificationPanel from './AiVerificationPanel';

const FileUploadTab = ({ onDataChange }) => {
    const [file, setFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [extractedData, setExtractedData] = useState(null);
    const [error, setError] = useState('');

    const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = () => setIsDragging(false);

    const MAX_SIZE_MB = 5;

    const validateFile = (selectedFile) => {
        if (!selectedFile) return 'No file selected.';
        const ext = selectedFile.name.split('.').pop().toLowerCase();
        if (!['pdf', 'docx'].includes(ext)) {
            return `Unsupported file type ".${ext}". Only PDF and DOCX files are allowed.`;
        }
        const sizeMB = selectedFile.size / (1024 * 1024);
        if (sizeMB > MAX_SIZE_MB) {
            return `File is too large (${sizeMB.toFixed(1)} MB). Maximum allowed size is ${MAX_SIZE_MB} MB.`;
        }
        return null;
    };

    const getFileTypeBadge = (filename) => {
        const ext = (filename || '').split('.').pop().toLowerCase();
        if (ext === 'pdf') return { label: 'PDF', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' };
        if (ext === 'docx') return { label: 'DOCX', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' };
        return { label: ext.toUpperCase(), color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' };
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        if (!droppedFile) return;
        const validationError = validateFile(droppedFile);
        if (validationError) {
            setError(validationError);
            setFile(null);
        } else {
            setFile(droppedFile);
            setError('');
            if (onDataChange) onDataChange({ title: droppedFile.name, type: 'file' });
        }
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;
        const validationError = validateFile(selectedFile);
        if (validationError) {
            setError(validationError);
            setFile(null);
            e.target.value = ''; // reset input
        } else {
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
            const response = await fetch('/api/ai/extract-file', { 
                method: 'POST', 
                headers: getAuthHeaders(true),
                body: formData 
            });
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.detail || 'Extraction failed');
            }
            const data = await response.json();
            if (!data.counterparty && !data.contractValue) {
                setError('AI could not extract data. Please try a different file.');
                return;
            }
            setExtractedData({ ...data, title: file.name.replace(/\.(pdf|docx)$/i, '') });
            if (onDataChange) onDataChange({ ...data, title: file.name });
        } catch (err) {
            setError(err.message || 'Failed to extract data from file. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReset = () => { setFile(null); setExtractedData(null); setError(''); };

    if (extractedData) {
        return (
            <div className={styles.formPanel} style={{ animation: 'fadeIn 0.4s ease' }}>
                <style dangerouslySetInnerHTML={{ __html: `@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }` }} />
                <div className={styles.formHeader}>
                    <div className={styles.formTitleGroup}>
                        <h3 className={styles.formTitle}>AI Analysis Complete</h3>
                        <p className={styles.formSub}>Deep extraction results for {file.name}</p>
                    </div>
                </div>

                {/* Extracted summary */}
                <div style={{ background: 'rgba(15,23,42,0.3)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '1.5rem' }}>
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

                {/* Clause table */}
                {extractedData.clauses?.length > 0 && (
                    <div style={{ marginBottom: '1.5rem' }}>
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
                                    {extractedData.clauses.map((clause, idx) => (
                                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <td style={{ padding: '12px', fontSize: '0.9rem', color: 'var(--text-primary)' }}>"{clause.text}"</td>
                                            <td style={{ padding: '12px' }}>
                                                <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600', background: 'rgba(37,99,235,0.2)', color: '#60a5fa' }}>{clause.type}</span>
                                            </td>
                                            <td style={{ padding: '12px' }}>
                                                <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600', background: 'rgba(16,185,129,0.2)', color: '#34d399' }}>{clause.department}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                <AiVerificationPanel data={extractedData} file={file} onSuccess={handleReset} />

                <div className={styles.formFooter} style={{ marginTop: '1rem' }}>
                    <button className={styles.cancelBtn} onClick={handleReset}>Upload Different File</button>
                </div>
            </div>
        );
    }

    const badge = file ? getFileTypeBadge(file.name) : null;

    return (
        <div className={styles.formPanel}>
            <div className={styles.formHeader}>
                <div className={styles.formTitleGroup}>
                    <h3 className={styles.formTitle}>Direct File Extraction</h3>
                    <p className={styles.formSub}>Upload contract documents for deep AI analysis and clause classification.</p>
                </div>
            </div>

            <div style={{ position: 'relative' }}>
                <div
                    className={`${styles.uploadBox} ${isDragging ? styles.dragging : ''}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    style={{
                        position: 'relative',
                        border: isDragging ? '2px solid #2563eb' : '2px dashed rgba(255,255,255,0.1)',
                        backgroundColor: isDragging ? 'rgba(37,99,235,0.1)' : 'transparent',
                        transition: 'all 0.3s ease'
                    }}
                >
                    {file ? (
                        /* ── File selected: show info card ── */
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '0.5rem 0' }}>
                            <div style={{ fontSize: '2.5rem' }}>
                                {badge?.label === 'PDF' ? '🔴' : '📘'}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                                <span style={{
                                    background: badge.bg,
                                    color: badge.color,
                                    border: `1px solid ${badge.color}55`,
                                    borderRadius: '6px',
                                    padding: '3px 10px',
                                    fontSize: '0.72rem',
                                    fontWeight: '700',
                                    letterSpacing: '0.04em',
                                    textTransform: 'uppercase'
                                }}>
                                    {badge.label}
                                </span>
                                <strong style={{ color: '#e2e8f0', fontSize: '0.95rem', wordBreak: 'break-all' }}>
                                    {file.name}
                                </strong>
                            </div>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                {(file.size / (1024 * 1024)).toFixed(2)} MB &nbsp;•&nbsp; Click or drag to replace
                            </span>
                        </div>
                    ) : (
                        /* ── Empty state ── */
                        <>
                            <div className={styles.uploadIcon} style={{ fontSize: '3rem', marginBottom: '1rem' }}>📄</div>
                            <div className={styles.uploadText}>
                                <strong>Click to upload</strong> or drag and drop
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                    PDF or DOCX · Max {MAX_SIZE_MB} MB
                                </p>
                            </div>
                        </>
                    )}
                    <input
                        type="file"
                        id="file-upload-input"
                        accept=".pdf,.docx"
                        onChange={handleFileChange}
                        style={{ position: 'absolute', opacity: 0, inset: 0, cursor: 'pointer' }}
                    />
                </div>
            </div>

            {error && (
                <div style={{
                    color: '#ef4444',
                    marginTop: '1rem',
                    padding: '0.75rem 1rem',
                    backgroundColor: 'rgba(239,68,68,0.08)',
                    borderRadius: '8px',
                    border: '1px solid rgba(239,68,68,0.25)',
                    fontSize: '0.88rem',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px'
                }}>
                    <span style={{ flexShrink: 0 }}>⚠️</span>
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
        </div>
    );
};

export default FileUploadTab;
