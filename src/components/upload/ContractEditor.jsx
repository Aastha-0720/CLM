import React, { useState, useEffect, useRef } from 'react';
import styles from './ContractEditor.module.css';
import { contractService } from '../../services/contractService';
import { Save, Send, X, ArrowLeft, FileText, Building2, CircleDollarSign } from 'lucide-react';

const ContractEditor = ({ data, onBack, onSuccess, onUpdate }) => {
    const [title, setTitle] = useState(data.title || '');
    const [company, setCompany] = useState(data.company || data.counterparty || '');
    const [value, setValue] = useState(data.value || data.contractValue || '');
    const [draftText, setDraftText] = useState(data.draftText || '');
    const [isSaving, setIsSaving] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const autoSaveTimerRef = useRef(null);
    const lastSavedText = useRef(data.draftText || '');

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
    };

    useEffect(() => {
        if (draftText !== lastSavedText.current) {
            if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
            autoSaveTimerRef.current = setTimeout(() => {
                handleAction(false, true);
            }, 5000);
        }
        return () => clearTimeout(autoSaveTimerRef.current);
    }, [draftText, title, company, value]);

    const handleAction = async (isFinalize = false, isAutoSave = false) => {
        if (!data.id && !data._id) {
            if (!isAutoSave) showToast('Save as Draft first to initialize ID', 'error');
            return;
        }

        if (!isAutoSave) setIsSaving(true);
        try {
            const contractId = data.id || data._id;
            const valueNum = parseFloat(String(value).replace(/[^0-9.]/g, '')) || 0;
            
            const updatePayload = {
                title,
                company,
                value: valueNum,
                draftText,
                status: isFinalize ? 'Under Review' : 'Draft',
                stage: isFinalize ? 'Under Review' : 'Draft'
            };

            const updated = await contractService.updateContract(contractId, updatePayload);
            lastSavedText.current = draftText;
            
            if (onUpdate) onUpdate(updated);
            
            if (!isAutoSave) {
                showToast(isFinalize ? 'Contract submitted successfully for review' : 'Draft saved successfully!');
            }
            
            if (isFinalize && onSuccess) {
                setTimeout(() => onSuccess(), 1500);
            }
        } catch (err) {
            if (!isAutoSave) {
                showToast('Failed to update contract.', 'error');
                console.error(err);
            }
        } finally {
            if (!isAutoSave) setIsSaving(false);
        }
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.editorContainer}>
                <header className={styles.header}>
                    <div className={styles.headerLeft}>
                        <button className={styles.backBtn} onClick={onBack}>
                            <ArrowLeft size={18} />
                        </button>
                        <div className={styles.titleArea}>
                            <h2 className={styles.editorTitle}>Full Contract Editor</h2>
                            <p className={styles.editorSub}>Review and refine the contract content before proceeding.</p>
                        </div>
                    </div>
                    
                    <div className={styles.headerActions}>
                        <button 
                            className={styles.saveBtn} 
                            onClick={() => handleAction(false)}
                            disabled={isSaving}
                        >
                            <Save size={18} />
                            {isSaving ? 'Saving...' : 'Save Draft'}
                        </button>
                        <button 
                            className={styles.finalizeBtn} 
                            onClick={() => handleAction(true)}
                            disabled={isSaving}
                        >
                            <Send size={18} />
                            {isSaving ? 'Submitting...' : 'Finalize & Submit'}
                        </button>
                        <button className={styles.closeBtn} onClick={onBack}>
                            <X size={20} />
                        </button>
                    </div>
                </header>

                <div className={styles.metadataBar}>
                    <div className={styles.metaField}>
                        <div className={styles.metaIcon}><FileText size={16} /></div>
                        <div className={styles.metaContent}>
                            <label>Contract Title</label>
                            <input 
                                value={title} 
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Untitled Contract"
                            />
                        </div>
                    </div>
                    <div className={styles.metaField}>
                        <div className={styles.metaIcon}><Building2 size={16} /></div>
                        <div className={styles.metaContent}>
                            <label>Counterparty</label>
                            <input 
                                value={company} 
                                onChange={(e) => setCompany(e.target.value)}
                                placeholder="Unknown Entity"
                            />
                        </div>
                    </div>
                    <div className={styles.metaField}>
                        <div className={styles.metaIcon}><CircleDollarSign size={16} /></div>
                        <div className={styles.metaContent}>
                            <label>Contract Value</label>
                            <input 
                                value={value} 
                                onChange={(e) => setValue(e.target.value)}
                                placeholder="$0.00"
                            />
                        </div>
                    </div>
                </div>

                <div className={styles.editorBody}>
                    <textarea
                        className={styles.textarea}
                        value={draftText}
                        onChange={(e) => setDraftText(e.target.value)}
                        placeholder="Start typing your contract here..."
                    />
                </div>
            </div>

            {toast.show && (
                <div className={`${styles.toast} ${styles[toast.type]}`}>
                    {toast.type === 'success' ? '✅ ' : '❌ '}{toast.message}
                </div>
            )}
        </div>
    );
};

export default ContractEditor;
