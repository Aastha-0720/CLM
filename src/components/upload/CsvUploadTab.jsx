import React, { useState } from 'react';
import { contractService } from '../../services/contractService';
import styles from '../UploadContract.module.css';

const CsvUploadTab = ({ onDataChange }) => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState('');

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        setFile(selectedFile);
        if (selectedFile && onDataChange) {
            onDataChange({ title: selectedFile.name, type: 'csv' });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) {
            setMessage('Please select a CSV file to upload.');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);
        setMessage('');

        try {
            const resp = await contractService.uploadContract(formData);
            setMessage(resp.message || 'File uploaded successfully!');
            setFile(null);
        } catch (error) {
            setMessage('Error uploading file. Make sure it is a valid CSV.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className={styles.formPanel}>
            <div className={styles.formHeader}>
                <div className={styles.formTitleGroup}>
                    <h3 className={styles.formTitle}>Batch Contract Initialization</h3>
                    <p className={styles.formSub}>Upload a CSV file containing counterparties' emails to automatically generate contracts via Mock AI extraction.</p>
                </div>
            </div>

            <form className={styles.form} onSubmit={handleSubmit}>
                <div className={styles.uploadArea}>
                    <div className={styles.uploadBox}>
                        <div className={styles.uploadIcon}>☁️</div>
                        <div className={styles.uploadText}>
                            <input
                                type="file"
                                accept=".csv"
                                onChange={handleFileChange}
                                style={{ marginBottom: '1rem' }}
                            />
                            {file && <div>Selected: {file.name}</div>}
                        </div>
                        <div className={styles.uploadLimit}>CSV Format Only</div>
                    </div>
                </div>

                {message && (
                    <div style={{
                        marginTop: '1rem',
                        padding: '1rem',
                        backgroundColor: message.includes('Error') || message.includes('Please') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                        color: message.includes('Error') || message.includes('Please') ? '#ef4444' : '#10b981',
                        borderRadius: '4px',
                        border: `1px solid ${message.includes('Error') || message.includes('Please') ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`
                    }}>
                        {message}
                    </div>
                )}

                <div className={styles.formFooter}>
                    <button type="submit" className={styles.submitBtn} disabled={uploading}>
                        {uploading ? 'Processing...' : 'Upload & Process CSV'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CsvUploadTab;
