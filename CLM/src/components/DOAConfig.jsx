import React, { useState, useEffect, useCallback } from 'react';
import styles from './DOAConfig.module.css';

const DOAConfig = () => {
    const [rules, setRules] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentRule, setCurrentRule] = useState(null);
    const [formData, setFormData] = useState({
        min_value: '',
        max_value: '',
        approver_role: 'Manager'
    });
    const [validationError, setValidationError] = useState(null);

    const fetchRules = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/doa');
            if (!response.ok) throw new Error('Failed to fetch DOA rules');
            const data = await response.json();
            setRules(data.sort((a, b) => a.min_value - b.min_value));
            setError(null);
        } catch (err) {
            console.error('Fetch DOA error:', err);
            setError('Using simulated DOA rules.');
            // Fallback demo data
            setRules([
                { id: 1, min_value: 0, max_value: 1000000, approver_role: 'Manager' },
                { id: 2, min_value: 1000000, max_value: 5000000, approver_role: 'Director' },
                { id: 3, min_value: 5000000, max_value: Infinity, approver_role: 'VP' }
            ]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRules();
    }, [fetchRules]);

    const handleOpenModal = (rule = null) => {
        if (rule) {
            setCurrentRule(rule);
            setFormData({
                min_value: rule.min_value,
                max_value: rule.max_value === Infinity ? 'Plus' : rule.max_value,
                approver_role: rule.approver_role
            });
        } else {
            setCurrentRule(null);
            setFormData({
                min_value: '',
                max_value: '',
                approver_role: 'Manager'
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentRule(null);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear validation error when user starts typing
        if (validationError) setValidationError(null);
    };

    const validateForm = () => {
        const min = Number(formData.min_value);
        const max = formData.max_value === 'Plus' ? Infinity : Number(formData.max_value);

        if (min < 0 || max < 0) {
            setValidationError('Values cannot be negative');
            return false;
        }

        if (max !== Infinity && min >= max) {
            setValidationError('Minimum value must be less than maximum value');
            return false;
        }

        // Check for overlapping ranges (optional enhancement)
        const newRule = { min_value: min, max_value: max };
        const overlapping = rules.some(rule => {
            if (currentRule && rule.id === currentRule.id) return false;
            return (min >= rule.min_value && min <= rule.max_value) ||
                   (max >= rule.min_value && max <= rule.max_value) ||
                   (rule.min_value >= min && rule.min_value <= max);
        });

        if (overlapping) {
            setValidationError('This range overlaps with an existing rule');
            return false;
        }

        setValidationError(null);
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate form before submission
        if (!validateForm()) return;
        
        const url = currentRule ? `/api/doa/${currentRule.id}` : '/api/doa';
        const method = currentRule ? 'PATCH' : 'POST';

        const payload = {
            ...formData,
            min_value: Number(formData.min_value),
            max_value: formData.max_value === 'Plus' ? Infinity : Number(formData.max_value)
        };

        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error('Failed to save rule');
            fetchRules();
            handleCloseModal();
        } catch (err) {
            // Mock update
            if (currentRule) {
                setRules(rules.map(r => r.id === currentRule.id ? { ...r, ...payload } : r).sort((a, b) => a.min_value - b.min_value));
            } else {
                setRules([...rules, { id: Date.now(), ...payload }].sort((a, b) => a.min_value - b.min_value));
            }
            handleCloseModal();
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this rule?')) return;
        try {
            await fetch(`/api/doa/${id}`, { method: 'DELETE' });
            fetchRules();
        } catch (err) {
            setRules(rules.filter(r => r.id !== id));
        }
    };

    const formatCurrency = (val) => {
        if (val === Infinity) return 'Above';
        if (val >= 100000) return `${val / 100000}L`;
        return val.toLocaleString();
    };

    if (isLoading && rules.length === 0) return (
        <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
        </div>
    );

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2>Delegation of Authority (DOA)</h2>
                <button className={styles.addBtn} onClick={() => handleOpenModal()}>
                    <span>+</span> Add Approval Rule
                </button>
            </div>

            <div className={styles.rulesCard}>
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Value Range (INR)</th>
                                <th>Minimum</th>
                                <th>Maximum</th>
                                <th>Approver Role</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rules.map(rule => (
                                <tr key={rule.id}>
                                    <td>
                                        <span className={styles.valueRange}>
                                            {formatCurrency(rule.min_value)} — {rule.max_value === Infinity ? 'Above' : formatCurrency(rule.max_value)}
                                        </span>
                                    </td>
                                    <td>₹ {rule.min_value.toLocaleString()}</td>
                                    <td>{rule.max_value === Infinity ? '∞' : `₹ ${rule.max_value.toLocaleString()}`}</td>
                                    <td>
                                        <div className={styles.approverRole}>
                                            <span className={styles.roleIcon}>👤</span>
                                            {rule.approver_role}
                                        </div>
                                    </td>
                                    <td>
                                        <div className={styles.actions}>
                                            <button className={styles.actionBtn} onClick={() => handleOpenModal(rule)}>✎</button>
                                            <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => handleDelete(rule.id)}>🗑</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <h3>{currentRule ? 'Edit Approval Rule' : 'New Approval Rule'}</h3>
                            <button onClick={handleCloseModal} style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer' }}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className={styles.modalBody}>
                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Minimum Value (₹)</label>
                                        <input 
                                            name="min_value"
                                            className={styles.input}
                                            type="number"
                                            value={formData.min_value}
                                            onChange={handleInputChange}
                                            min="0"
                                            step="1000"
                                            required
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Maximum Value (₹)</label>
                                        <input 
                                            name="max_value"
                                            className={styles.input}
                                            type="number"
                                            value={formData.max_value}
                                            onChange={handleInputChange}
                                            placeholder="Use 'Plus' for above"
                                            min="0"
                                            step="1000"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Approver Role</label>
                                    <select 
                                        name="approver_role"
                                        className={styles.select}
                                        value={formData.approver_role}
                                        onChange={handleInputChange}
                                    >
                                        <option value="Manager">Manager</option>
                                        <option value="Director">Director</option>
                                        <option value="VP">VP</option>
                                        <option value="CFO">CFO / CEO</option>
                                    </select>
                                </div>
                                
                                {validationError && (
                                    <div className={styles.validationError}>
                                        ⚠️ {validationError}
                                    </div>
                                )}
                            </div>
                            <div className={styles.modalFooter}>
                                <button type="button" className={styles.cancelBtn} onClick={handleCloseModal}>Cancel</button>
                                <button type="submit" className={styles.submitBtn}>
                                    {currentRule ? 'Save Rule' : 'Create Rule'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DOAConfig;
