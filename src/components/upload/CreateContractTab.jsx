import React, { useState } from 'react';
import styles from '../UploadContract.module.css';
import { contractService } from '../../services/contractService';
import { FileText, Save, Send, Upload, CheckCircle } from 'lucide-react';

const CreateContractTab = ({ onDataChange }) => {
    const [formData, setFormData] = useState({
        title: '',
        company: '',
        value: '',
        duration: '',
        businessUnit: '',
        department: 'Legal',
        riskLevel: 'Medium'
    });
    
    const [file, setFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        if (onDataChange) {
            onDataChange({ ...formData, [name]: value });
        }
        
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (selected && (selected.type === 'application/pdf' || selected.name.endsWith('.docx'))) {
            setFile(selected);
            if (errors.file) setErrors(prev => ({ ...prev, file: '' }));
        } else {
            setErrors(prev => ({ ...prev, file: 'Please upload a valid PDF or DOCX file.' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.title.trim()) newErrors.title = 'Title is required';
        if (!formData.company.trim()) newErrors.company = 'Counterparty Name is required';
        if (!formData.value.trim()) newErrors.value = 'Contract Value is required';
        if (!formData.duration.trim()) newErrors.duration = 'Duration is required';
        if (!formData.businessUnit.trim()) newErrors.businessUnit = 'Business Unit is required';
        if (!file) newErrors.file = 'A document upload is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (actionType) => {
        if (!validateForm()) return;

        setIsSubmitting(true);
        const isDraft = actionType === 'draft';
        
        const payload = {
            ...formData,
            stage: isDraft ? 'Draft' : 'Under Review',
            status: isDraft ? 'Draft' : 'Pending Approval'
        };

        try {
            const valueNum = parseFloat(formData.value.replace(/[^0-9.]/g, '')) || 0;
            
            // 1. Create the contract entry
            const token = localStorage.getItem('token');
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;
            
            // If they are logged in using headers (the app uses specific headers in authHelper usually:
            // "X-User-Role", "X-User-Email" -- wait, `contractService.js` `getAuthHeaders` does this.
            // I'll fetch `authHeaders` from the module manually to be safe.
            const { getAuthHeaders } = await import('../../services/authHelper.js');
            const authHeaders = getAuthHeaders();
            
            const response = await fetch('/api/contracts/create', {
                method: 'POST',
                headers: { ...headers, ...authHeaders },
                body: JSON.stringify({
                    title: formData.title,
                    company: formData.company,
                    value: valueNum,
                    department: formData.department,
                    duration: formData.duration,
                    risk_classification: formData.riskLevel,
                    business_unit: formData.businessUnit,
                    stage: payload.stage,
                    status: payload.status,
                    clauses: [] // Manual upload so no extracted clauses initially
                })
            });

            if (!response.ok) throw new Error('API Error creating contract');
            const result = await response.json();

            // 2. Upload the associated document
            if (result.id && file) {
                await contractService.uploadContractDocument(result.id, file);
            }

            showToast(isDraft ? 'Draft saved successfully!' : 'Contract submitted for review!');
            
            // Reset form
            setFormData({
                title: '', company: '', value: '', duration: '', businessUnit: '', department: 'Legal', riskLevel: 'Medium'
            });
            setFile(null);
        } catch (error) {
            console.error('Submission failed:', error);
            showToast('Failed to create contract.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={styles.formPanel} style={{ animation: 'fadeIn 0.4s ease' }}>
            <style dangerouslySetInnerHTML={{ __html: `@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }` }} />
            
            <div className={styles.formHeader}>
                <div className={styles.formTitleGroup}>
                    <h3 className={styles.formTitle}>Initialize New Contract</h3>
                    <p className={styles.formSub}>Manually enter contract details and upload the source document.</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                {/* Title */}
                <div className={styles.inputGroup}>
                    <label className={styles.label}>Contract Title <span style={{color: '#ef4444'}}>*</span></label>
                    <input 
                        type="text" 
                        name="title" 
                        value={formData.title} 
                        onChange={handleInputChange} 
                        className={styles.input} 
                        placeholder="e.g. Master Service Agreement" 
                    />
                    {errors.title && <span style={{color: '#ef4444', fontSize: '12px'}}>{errors.title}</span>}
                </div>

                {/* Counterparty */}
                <div className={styles.inputGroup}>
                    <label className={styles.label}>Counterparty Name <span style={{color: '#ef4444'}}>*</span></label>
                    <input 
                        type="text" 
                        name="company" 
                        value={formData.company} 
                        onChange={handleInputChange} 
                        className={styles.input} 
                        placeholder="e.g. Acme Corp." 
                    />
                    {errors.company && <span style={{color: '#ef4444', fontSize: '12px'}}>{errors.company}</span>}
                </div>

                {/* Value */}
                <div className={styles.inputGroup}>
                    <label className={styles.label}>Contract Value ($) <span style={{color: '#ef4444'}}>*</span></label>
                    <input 
                        type="text" 
                        name="value" 
                        value={formData.value} 
                        onChange={handleInputChange} 
                        className={styles.input} 
                        placeholder="e.g. 50000" 
                    />
                    {errors.value && <span style={{color: '#ef4444', fontSize: '12px'}}>{errors.value}</span>}
                </div>

                {/* Duration */}
                <div className={styles.inputGroup}>
                    <label className={styles.label}>Duration <span style={{color: '#ef4444'}}>*</span></label>
                    <input 
                        type="text" 
                        name="duration" 
                        value={formData.duration} 
                        onChange={handleInputChange} 
                        className={styles.input} 
                        placeholder="e.g. 12 Months" 
                    />
                    {errors.duration && <span style={{color: '#ef4444', fontSize: '12px'}}>{errors.duration}</span>}
                </div>

                {/* Business Unit */}
                <div className={styles.inputGroup}>
                    <label className={styles.label}>Business Unit <span style={{color: '#ef4444'}}>*</span></label>
                    <input 
                        type="text" 
                        name="businessUnit" 
                        value={formData.businessUnit} 
                        onChange={handleInputChange} 
                        className={styles.input} 
                        placeholder="e.g. APAC Operations" 
                    />
                    {errors.businessUnit && <span style={{color: '#ef4444', fontSize: '12px'}}>{errors.businessUnit}</span>}
                </div>

                {/* Department */}
                <div className={styles.inputGroup}>
                    <label className={styles.label}>Department</label>
                    <select name="department" value={formData.department} onChange={handleInputChange} className={styles.select}>
                        <option value="Legal">Legal</option>
                        <option value="Sales">Sales</option>
                        <option value="Finance">Finance</option>
                        <option value="Procurement">Procurement</option>
                        <option value="HR">HR</option>
                    </select>
                </div>

                {/* Risk Level */}
                <div className={styles.inputGroup}>
                    <label className={styles.label}>Risk Level</label>
                    <select name="riskLevel" value={formData.riskLevel} onChange={handleInputChange} className={styles.select}>
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                    </select>
                </div>
            </div>

            {/* File Upload Section */}
            <div className={styles.inputGroup} style={{ marginBottom: '32px' }}>
                <label className={styles.label}>Upload Document <span style={{color: '#ef4444'}}>*</span></label>
                <div style={{
                    border: '2px dashed rgba(255,255,255,0.1)', 
                    padding: '30px', 
                    borderRadius: '12px', 
                    textAlign: 'center',
                    background: 'rgba(255,255,255,0.02)',
                    position: 'relative'
                }}>
                    <Upload size={32} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
                    {file ? (
                        <div style={{ color: '#10b981', fontWeight: '600' }}>{file.name}</div>
                    ) : (
                        <div style={{ color: 'var(--text-primary)' }}>Click to upload PDF or DOCX file</div>
                    )}
                    <input 
                        type="file" 
                        accept=".pdf,.docx" 
                        onChange={handleFileChange} 
                        style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                    />
                </div>
                {errors.file && <span style={{color: '#ef4444', fontSize: '12px', display: 'block', mt: '4px'}}>{errors.file}</span>}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
                <button 
                    onClick={() => handleSubmit('draft')} 
                    disabled={isSubmitting}
                    style={{
                        padding: '10px 20px', borderRadius: '8px', fontWeight: '600',
                        background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)',
                        border: '1px solid var(--border-color)', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '8px'
                    }}
                >
                    <Save size={18} />
                    Save as Draft
                </button>
                <button 
                    onClick={() => handleSubmit('submit')} 
                    disabled={isSubmitting}
                    style={{
                        padding: '10px 24px', borderRadius: '8px', fontWeight: '600',
                        background: '#3b82f6', color: '#fff',
                        border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '8px',
                        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                    }}
                >
                    <Send size={18} />
                    {isSubmitting ? 'Processing...' : 'Submit for Review'}
                </button>
            </div>

            {/* Toast */}
            {toast.show && (
                <div style={{
                    position: 'fixed', bottom: '24px', right: '24px',
                    background: toast.type === 'success' ? '#10B981' : '#EF4444',
                    color: '#fff', padding: '14px 24px', borderRadius: '10px',
                    fontWeight: '600', fontSize: '14px', zIndex: 9999,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: '8px'
                }}>
                    <CheckCircle size={18} />
                    {toast.message}
                </div>
            )}
        </div>
    );
};

export default CreateContractTab;
