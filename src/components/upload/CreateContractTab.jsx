import React, { useState } from 'react';
import styles from '../UploadContract.module.css';
import { contractService } from '../../services/contractService';
import AiVerificationPanel from './AiVerificationPanel';
import ContractEditor from './ContractEditor';

const CreateContractTab = ({ onDataChange, onNavigate, onRefresh }) => {
    const [formData, setFormData] = useState({
        title: '',
        counterpartyName: '',
        contractValue: '',
        duration: '',
        businessUnit: '',
        contractOwner: '',
        salesOpportunityId: '',
        category: '',
        riskLevel: 'Medium',
        startDate: '',
        endDate: '',
        expiryDate: ''
    });

    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedDraft, setGeneratedDraft] = useState('');
    const [errors, setErrors] = useState({});
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [isEditing, setIsEditing] = useState(false);
    const [draftId, setDraftId] = useState(null);

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        const updatedFormData = { ...formData, [name]: value };
        setFormData(updatedFormData);
        if (onDataChange) {
            onDataChange(updatedFormData);
        }
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.title.trim()) newErrors.title = 'Title is required';
        if (!formData.counterpartyName.trim()) newErrors.counterpartyName = 'Counterparty is required';
        if (!formData.contractValue.trim()) newErrors.contractValue = 'Value is required';
        if (!formData.duration.trim()) newErrors.duration = 'Duration is required';
        if (!formData.businessUnit.trim()) newErrors.businessUnit = 'Business Unit is required';
        if (!formData.contractOwner?.trim()) newErrors.contractOwner = 'Contract Owner is required';
        if (!formData.category) newErrors.category = 'Category is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleGenerateDraft = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsGenerating(true);
        setGeneratedDraft('');

        try {
            const draft = await contractService.generateContractDraft(formData);
            setGeneratedDraft(draft);
            
            // Immediate persistence
            try {
                const token = localStorage.getItem('token') || 'mock-token-admin';
                const response = await fetch('/api/contracts/create', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        title: formData.title,
                        company: formData.counterpartyName,
                        value: parseFloat(formData.contractValue) || 0,
                        duration: formData.duration,
                        business_unit: formData.businessUnit,
                        category: formData.category,
                        risk_classification: formData.riskLevel,
                        contract_owner: formData.contractOwner,
                        salesOpportunityId: formData.salesOpportunityId,
                        status: 'Draft',
                        draftText: draft,
                        submittedBy: 'Admin'
                    })
                });
                if (response.ok) {
                    const resData = await response.json();
                    setDraftId(resData.id || resData._id);
                    showToast('Draft initialized in database.');
                }
            } catch (saveErr) {
                console.error("Failed to auto-save draft:", saveErr);
            }
        } catch (error) {
            alert('Failed to generate contract draft.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleReset = () => {
        setGeneratedDraft('');
        setFormData({
            title: '',
            counterpartyName: '',
            contractValue: '',
            duration: '',
            businessUnit: '',
            contractOwner: '',
            salesOpportunityId: '',
            category: '',
            riskLevel: 'Medium',
            startDate: '',
            endDate: '',
            expiryDate: ''
        });
    };

    if (generatedDraft) {
        const panelData = {
            title: formData.title,
            counterparty: formData.counterpartyName,
            contractValue: formData.contractValue,
            duration: formData.duration,
            category: formData.category,
            riskLevel: formData.riskLevel,
            businessUnit: formData.businessUnit,
            contractOwner: formData.contractOwner,
            salesOpportunityId: formData.salesOpportunityId,
            clauses: [],
            complianceScore: 0,
            risks: [],
            missingFields: [],
            id: draftId
        };
        return (
            <div className={styles.formPanel} style={{ animation: 'fadeIn 0.5s ease' }}>
                <div className={styles.formHeader}>
                    <div className={styles.formTitleGroup}>
                        <h3 className={styles.formTitle}>Draft Generated Successfully</h3>
                        <p className={styles.formSub}>AI has prepared a draft based on your inputs. Review the content below.</p>
                    </div>
                </div>

                <div 
                    onClick={() => setIsEditing(true)}
                    className={styles.clickablePreview}
                    style={{
                        position: 'relative',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        border: '1px solid var(--border-color)',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        marginBottom: '2rem'
                    }}
                >
                    <div className={styles.previewOverlay}>
                        <div style={{
                            position: 'absolute',
                            top: 0, left: 0, right: 0, bottom: 0,
                            background: 'rgba(0,0,0,0.4)',
                            zIndex: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: 0,
                            transition: 'opacity 0.2s',
                            color: '#fff',
                            fontWeight: '700',
                            fontSize: '1.2rem',
                            backdropFilter: 'blur(2px)'
                        }}>
                            Click to Edit Full Contract
                        </div>
                    </div>

                    <div style={{
                        background: 'var(--bg-card)',
                        padding: '2rem',
                        borderRadius: '12px',
                        color: 'var(--text-primary)',
                        fontSize: '0.9rem',
                        lineHeight: '1.8',
                        maxHeight: '400px',
                        overflowY: 'auto'
                    }}>
                    {generatedDraft.split('\n').map((line, index) => {
                        // H1 heading
                        if (line.startsWith('# ')) {
                            return <h2 key={index} style={{ 
                                fontSize: '1.2rem', fontWeight: '700', 
                                color: '#00C9B1', marginBottom: '8px', 
                                marginTop: '16px' 
                            }}>{line.replace('# ', '')}</h2>;
                        }
                        // H2 heading
                        if (line.startsWith('## ')) {
                            return <h3 key={index} style={{ 
                                fontSize: '1rem', fontWeight: '600', 
                                color: 'var(--text-primary)', 
                                marginBottom: '6px', marginTop: '14px',
                                borderBottom: '1px solid var(--border-color)',
                                paddingBottom: '4px'
                            }}>{line.replace('## ', '')}</h3>;
                        }
                        // Bold text **text**
                        if (line.includes('**')) {
                            const parts = line.split('**');
                            return <p key={index} style={{ marginBottom: '6px' }}>
                                {parts.map((part, i) => 
                                    i % 2 === 1 
                                        ? <strong key={i}>{part}</strong> 
                                        : part
                                )}
                            </p>;
                        }
                        // Empty line
                        if (line.trim() === '') {
                            return <br key={index} />;
                        }
                        // Normal line
                        return <p key={index} style={{ 
                            marginBottom: '4px',
                            color: 'var(--text-secondary)'
                        }}>{line}</p>;
                    })}
                </div>
            </div>

                <div className={styles.formFooter}>
                    <button className={styles.cancelBtn} onClick={() => setGeneratedDraft('')}>Edit Details</button>
                    <button className={styles.cancelBtn} onClick={() => setIsEditing(true)}>View Full Contract</button>
                    <button className={styles.cancelBtn} onClick={handleReset}>Start Over</button>
                </div>

                {isEditing && (
                    <ContractEditor 
                        data={{
                            ...formData,
                            draftText: generatedDraft,
                            id: draftId,
                            _id: draftId
                        }}
                        onBack={() => setIsEditing(false)}
                        onUpdate={(updated) => {
                            if (updated.draftText) setGeneratedDraft(updated.draftText);
                            if (updated._id) setDraftId(updated._id);
                        }}
                        onSuccess={() => {
                            setIsEditing(false);
                            handleReset();
                            if (onRefresh) onRefresh();
                            if (onNavigate) onNavigate('Dashboard');
                        }}
                    />
                )}

                <AiVerificationPanel 
                    data={panelData} 
                    onSuccess={() => {
                        handleReset();
                        if (onRefresh) onRefresh();
                        if (onNavigate) onNavigate('Dashboard');
                    }} 
                />
            </div>
        );
    }

    return (
        <div className={styles.formPanel}>
            <div className={styles.formHeader}>
                <div className={styles.formTitleGroup}>
                    <h3 className={styles.formTitle}>Create Manual Contract</h3>
                    <p className={styles.formSub}>Initialize a new contract record and generate a draft using AI.</p>
                </div>
            </div>

            <form onSubmit={handleGenerateDraft} className={styles.form}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div className={styles.formGroup}>
                        <label>Contract Title *</label>
                        <input
                            name="title"
                            className={`${styles.input} ${errors.title ? styles.inputError : ''}`}
                            type="text"
                            placeholder="e.g. Service Level Agreement 2026"
                            value={formData.title}
                            onChange={handleInputChange}
                        />
                        {errors.title && <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>{errors.title}</span>}
                    </div>

                    <div className={styles.formGroup}>
                        <label>Counterparty Name *</label>
                        <input
                            name="counterpartyName"
                            className={`${styles.input} ${errors.counterpartyName ? styles.inputError : ''}`}
                            type="text"
                            placeholder="Enter legal entity name"
                            value={formData.counterpartyName}
                            onChange={handleInputChange}
                        />
                        {errors.counterpartyName && <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>{errors.counterpartyName}</span>}
                    </div>

                    <div className={styles.formGroup}>
                        <label>Contract Value *</label>
                        <input
                            name="contractValue"
                            className={`${styles.input} ${errors.contractValue ? styles.inputError : ''}`}
                            type="text"
                            placeholder="e.g. $50,000"
                            value={formData.contractValue}
                            onChange={handleInputChange}
                        />
                        {errors.contractValue && <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>{errors.contractValue}</span>}
                    </div>

                    <div className={styles.formGroup}>
                        <label>Duration *</label>
                        <input
                            name="duration"
                            className={`${styles.input} ${errors.duration ? styles.inputError : ''}`}
                            type="text"
                            placeholder="e.g. 12 Months"
                            value={formData.duration}
                            onChange={handleInputChange}
                        />
                        {errors.duration && <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>{errors.duration}</span>}
                    </div>

                    <div className={styles.formGroup}>
                        <label>Start Date</label>
                        <input
                            name="startDate"
                            className={styles.input}
                            type="date"
                            value={formData.startDate}
                            onChange={handleInputChange}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>End Date</label>
                        <input
                            name="endDate"
                            className={styles.input}
                            type="date"
                            value={formData.endDate}
                            onChange={handleInputChange}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Expiry Date</label>
                        <input
                            name="expiryDate"
                            className={styles.input}
                            type="date"
                            value={formData.expiryDate}
                            onChange={handleInputChange}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Business Unit *</label>
                        <input
                            name="businessUnit"
                            className={`${styles.input} ${errors.businessUnit ? styles.inputError : ''}`}
                            type="text"
                            placeholder="e.g. IT Operations"
                            value={formData.businessUnit}
                            onChange={handleInputChange}
                        />
                        {errors.businessUnit && <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>{errors.businessUnit}</span>}
                    </div>

                    <div className={styles.formGroup}>
                        <label>Contract Owner *</label>
                        <input
                            name="contractOwner"
                            className={`${styles.input} ${errors.contractOwner ? styles.inputError : ''}`}
                            type="text"
                            placeholder="e.g. John Doe"
                            value={formData.contractOwner}
                            onChange={handleInputChange}
                        />
                        {errors.contractOwner && <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>{errors.contractOwner}</span>}
                    </div>

                    <div className={styles.formGroup}>
                        <label>Sales Opportunity ID</label>
                        <input
                            name="salesOpportunityId"
                            className={styles.input}
                            type="text"
                            placeholder="e.g. OPP-12345"
                            value={formData.salesOpportunityId}
                            onChange={handleInputChange}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Category *</label>
                        <select
                            name="category"
                            className={`${styles.select} ${errors.category ? styles.inputError : ''}`}
                            value={formData.category}
                            onChange={handleInputChange}
                        >
                            <option value="">Select Category</option>
                            <option value="Software">Software Licensing</option>
                            <option value="Hardware">Hardware Procurement</option>
                            <option value="Services">Professional Services</option>
                            <option value="Facility">Facility Management</option>
                            <option value="Marketing">Marketing & Advertising</option>
                        </select>
                        {errors.category && <span style={{ color: '#ef4444', fontSize: '0.75rem' }}>{errors.category}</span>}
                    </div>

                    <div className={styles.formGroup}>
                        <label>Risk Level</label>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                            {['Low', 'Medium', 'High'].map(level => (
                                <button
                                    key={level}
                                    type="button"
                                    onClick={() => {
                                        const updatedFormData = { ...formData, riskLevel: level };
                                        setFormData(updatedFormData);
                                        if (onDataChange) {
                                            onDataChange(updatedFormData);
                                        }
                                    }}
                                    style={{
                                        flex: 1,
                                        padding: '0.75rem',
                                        borderRadius: '8px',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        background: formData.riskLevel === level
                                            ? (level === 'Low' ? 'rgba(16, 185, 129, 0.2)' : level === 'Medium' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(239, 68, 68, 0.2)')
                                            : 'rgba(15, 23, 42, 0.4)',
                                        color: formData.riskLevel === level
                                            ? (level === 'Low' ? '#34d399' : level === 'Medium' ? '#fbbf24' : '#f87171')
                                            : '#94a3b8',
                                        cursor: 'pointer',
                                        fontWeight: '600',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {level}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className={styles.formFooter} style={{ marginTop: '1rem' }}>
                    <button type="button" className={styles.cancelBtn} onClick={handleReset}>Clear Form</button>
                    <button
                        type="button"
                        className={styles.cancelBtn}
                        onClick={async () => {
                            if (!formData.title || !formData.counterpartyName) {
                                showToast('Please fill Title and Counterparty Name', 'error');
                                return;
                            }
                            try {
                                const token = localStorage.getItem('token') || 'mock-token-admin';
                                const response = await fetch('/api/contracts/save-draft', {
                                    method: 'POST',
                                    headers: { 
                                        'Content-Type': 'application/json',
                                        'Authorization': `Bearer ${token}`
                                    },
                                    body: JSON.stringify({
                                        title: formData.title,
                                        company: formData.counterpartyName,
                                        value: parseFloat((formData.contractValue || '0').replace(/[^0-9.]/g, '')) || 0,
                                        department: formData.businessUnit || 'Legal',
                                        category: formData.category || 'General',
                                        riskLevel: formData.riskLevel || 'Medium',
                                        duration: formData.duration || '',
                                        startDate: formData.startDate || '',
                                        endDate: formData.endDate || '',
                                        expiryDate: formData.expiryDate || '',
                                        contract_owner: formData.contractOwner || '',
                                        businessUnit: formData.businessUnit || '',
                                        salesOpportunityId: formData.salesOpportunityId || '',
                                        draftText: generatedDraft || '',
                                        submittedBy: 'Admin'
                                    })
                                });
                                if (!response.ok) throw new Error('Failed');
                                const resData = await response.json();
                                setDraftId(resData.id || resData._id);
                                showToast('Draft saved successfully!');
                                // Don't reset if we want to keep editing
                            } catch (err) {
                                showToast('Failed to save draft.', 'error');
                            }
                        }}
                    >
                        💾 Save as Draft
                    </button>
                    <button type="submit" className={styles.submitBtn} disabled={isGenerating}>
                        {isGenerating ? 'AI Generating Draft...' : 'Generate Contract Draft'}
                    </button>
                </div>
            </form>
            <style dangerouslySetInnerHTML={{
                __html: `
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

export default CreateContractTab;
