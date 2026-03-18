import React, { useState, useEffect } from 'react';
import styles from './UploadContract.module.css';

const UploadContract = ({ email }) => {
    const [formData, setFormData] = useState({
        title: '',
        counterparty: '',
        value: '',
        category: 'Service',
        businessUnit: 'Sales',
        riskLevel: 'Low',
    });

    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        if (email) {
            setFormData((prev) => ({
                ...prev,
                title: email.subject,
                counterparty: email.sender,
            }));
            setShowForm(false);
        }
    }, [email]);

    if (!email) {
        return (
            <div className={styles.emptyContainer}>
                <div className={styles.emptyState}>
                    <div className={styles.emptyIllustration}>
                        <div className={styles.circle}>📧</div>
                    </div>
                    <h3 className={styles.emptyTitle}>No Email Selected</h3>
                    <p className={styles.emptyDesc}>Select an email from the inbox to view details or initiate the contract upload workflow.</p>
                </div>
            </div>
        );
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        alert('Contract submitted for review successfully!');
        setShowForm(false);
    };

    return (
        <div className={styles.container}>
            {/* Email Preview Area */}
            {!showForm ? (
                <div className={styles.preview}>
                    <div className={styles.previewCard}>
                        <div className={styles.previewHeader}>
                            <div className={styles.avatarLarge} style={{ backgroundColor: `${email.color}20`, color: email.color }}>
                                {email.initials}
                            </div>
                            <div className={styles.previewMeta}>
                                <h2 className={styles.previewSubject}>{email.subject}</h2>
                                <div className={styles.fromTo}>
                                    <span className={styles.fromName}>{email.sender}</span>
                                    <span className={styles.fromEmail}>&lt;{email.email}&gt;</span>
                                    <span className={styles.dot}>•</span>
                                    <span className={styles.previewDate}>{email.date}</span>
                                </div>
                            </div>
                        </div>

                        <div className={styles.emailBodyWrapper}>
                            <div className={styles.emailBody}>
                                {email.body}
                            </div>
                        </div>

                        {email.attachments.length > 0 && (
                            <div className={styles.attachmentsSection}>
                                <h4 className={styles.sectionHeading}>ATTACHMENTS ({email.attachments.length})</h4>
                                <div className={styles.attGrid}>
                                    {email.attachments.map((att, idx) => (
                                        <div key={idx} className={styles.attachmentItem}>
                                            <div className={styles.attIconBox}>📄</div>
                                            <div className={styles.attDetails}>
                                                <span className={styles.attName}>{att.name}</span>
                                                <span className={styles.attSize}>{att.size}</span>
                                            </div>
                                            <button className={styles.attDownload}>↓</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className={styles.previewActions}>
                            <button
                                className={styles.uploadBtn}
                                onClick={() => setShowForm(true)}
                            >
                                <span>Upload Contract to CLM</span>
                                <span className={styles.btnIcon}>→</span>
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                /* Contract Upload Form */
                <div className={styles.formPanel}>
                    <div className={styles.formHeader}>
                        <div className={styles.formTitleGroup}>
                            <h3 className={styles.formTitle}>Initialize Contract</h3>
                            <p className={styles.formSub}>Complete the details below to start the review workflow.</p>
                        </div>
                    </div>

                    <form className={styles.form} onSubmit={handleSubmit}>
                        <div className={styles.formSection}>
                            <h4 className={styles.formSectionLabel}>GENERAL INFORMATION</h4>

                            <div className={styles.formGroup}>
                                <label>Contract Title</label>
                                <input
                                    type="text"
                                    name="title"
                                    className={styles.input}
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Counterparty Name</label>
                                <input
                                    type="text"
                                    name="counterparty"
                                    className={styles.input}
                                    value={formData.counterparty}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className={styles.formSection}>
                            <h4 className={styles.formSectionLabel}>METADATA & RISK</h4>
                            <div className={styles.gridRow}>
                                <div className={styles.formGroup}>
                                    <label>Value (USD)</label>
                                    <div className={styles.inputWithIcon}>
                                        <span className={styles.prefix}>$</span>
                                        <input
                                            type="number"
                                            name="value"
                                            className={styles.inputNoBorder}
                                            placeholder="0.00"
                                            value={formData.value}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Risk Level</label>
                                    <select name="riskLevel" className={styles.select} value={formData.riskLevel} onChange={handleInputChange}>
                                        <option>Low</option>
                                        <option>Medium</option>
                                        <option>High</option>
                                    </select>
                                </div>
                            </div>

                            <div className={styles.gridRow}>
                                <div className={styles.formGroup}>
                                    <label>Category</label>
                                    <select name="category" className={styles.select} value={formData.category} onChange={handleInputChange}>
                                        <option>Service</option>
                                        <option>Product</option>
                                        <option>License</option>
                                        <option>AMC</option>
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Business Unit</label>
                                    <select name="businessUnit" className={styles.select} value={formData.businessUnit} onChange={handleInputChange}>
                                        <option>Sales</option>
                                        <option>Legal</option>
                                        <option>Finance</option>
                                        <option>Compliance</option>
                                        <option>Procurement</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className={styles.uploadArea}>
                            <div className={styles.uploadBox}>
                                <div className={styles.uploadIcon}>☁️</div>
                                <div className={styles.uploadText}>
                                    <strong>Click to upload</strong> or drag and drop
                                </div>
                                <div className={styles.uploadLimit}>PDF or DOCX (MAX. 10MB)</div>
                            </div>
                        </div>

                        <div className={styles.formFooter}>
                            <button type="button" className={styles.cancelBtn} onClick={() => setShowForm(false)}>
                                Cancel
                            </button>
                            <button type="submit" className={styles.submitBtn}>
                                Submit for Review
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default UploadContract;
