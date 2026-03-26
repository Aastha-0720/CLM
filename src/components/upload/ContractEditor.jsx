import React, { useState, useEffect } from 'react';
import { Save, X, RotateCcw, FileText, CheckCircle } from 'lucide-react';
import styles from './ContractEditor.module.css';
import { contractService } from '../../services/contractService';

const ContractEditor = ({ contract, onSave, onCancel }) => {
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [originalContent, setOriginalContent] = useState('');
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
    };

    useEffect(() => {
        const fetchContent = async () => {
            try {
                setLoading(true);
                const data = await contractService.getEditorContent(contract.id);
                setContent(data.content || '');
                setOriginalContent(data.content || '');
            } catch (error) {
                console.error('Error fetching editor content:', error);
                showToast('Failed to load contract content', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchContent();
    }, [contract.id]);

    const handleSave = async () => {
        try {
            setSaving(true);
            const result = await contractService.saveEditorContent(contract.id, content);
            setOriginalContent(content);
            showToast(result.message || 'Changes saved successfully!');
            if (onSave) onSave();
        } catch (error) {
            console.error('Error saving content:', error);
            showToast('Failed to save changes', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        if (window.confirm('Are you sure you want to revert all changes to the last saved version?')) {
            setContent(originalContent);
        }
    };

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
                <p>Loading document content...</p>
            </div>
        );
    }

    const hasChanges = content !== originalContent;

    return (
        <div className={styles.editorWrapper}>
            <div className={styles.editorHeader}>
                <div className={styles.headerInfo}>
                    <FileText size={20} className={styles.headerIcon} />
                    <div>
                        <h3 className={styles.headerTitle}>Editing: {contract.title}</h3>
                        <p className={styles.headerSub}>Editing {contract.company} agreement content</p>
                    </div>
                </div>
                <div className={styles.headerActions}>
                    <button className={styles.secondaryBtn} onClick={handleReset} title="Revert to original">
                        <RotateCcw size={16} /> Revert
                    </button>
                    <button className={styles.secondaryBtn} onClick={onCancel}>
                        <X size={16} /> Cancel
                    </button>
                    <button className={styles.primaryBtn} onClick={handleSave} disabled={saving || !hasChanges}>
                        {saving ? (
                            <>
                                <div className={styles.miniSpinner}></div> Saving...
                            </>
                        ) : (
                            <>
                                <Save size={16} /> Save New Version
                            </>
                        )}
                    </button>
                </div>
            </div>

            <div className={styles.editorBody}>
                <div className={styles.toolbar}>
                    <div className={styles.toolbarGroup}>
                        <span className={styles.toolbarLabel}>Editor View</span>
                        <div className={styles.badge}>Live Sync Enabled</div>
                        {hasChanges ? (
                            <div className={styles.unsavedBadge}>● Unsaved Changes</div>
                        ) : (
                            <div className={styles.savedBadge}>✓ All changes saved</div>
                        )}
                    </div>
                </div>
                <textarea
                    className={styles.textArea}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Start typing your contract content here..."
                    spellCheck="false"
                />
            </div>

            {toast.show && (
                <div className={`${styles.toast} ${styles[toast.type]}`}>
                    {toast.type === 'success' ? <CheckCircle size={18} /> : <span>⚠️ </span>}
                    {toast.message}
                </div>
            )}
        </div>
    );
};

export default ContractEditor;
