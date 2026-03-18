import React, { useState, useEffect, useCallback } from 'react';
import styles from './PipelineStages.module.css';

const PipelineStages = () => {
    const [stages, setStages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentStage, setCurrentStage] = useState(null); // For editing
    const [draggedItemIndex, setDraggedItemIndex] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        key: '',
        order: '',
        status: 'Enabled'
    });

    const fetchStages = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/stages');
            if (!response.ok) throw new Error('Failed to fetch stages');
            const data = await response.json();
            // Sort by 'order' or 'position' if provided by API
            const sortedData = data.sort((a, b) => (a.order || 0) - (b.order || 0));
            setStages(sortedData);
            setError(null);
        } catch (err) {
            console.error('Fetch stages error:', err);
            setError('Using demo pipeline stages.');
            // Fallback demo data
            setStages([
                { id: 1, name: 'Opportunity Identified', key: 'opportunity_identified', order: 0, status: 'Enabled' },
                { id: 2, name: 'Proposal Submission', key: 'proposal_submission', order: 1, status: 'Enabled' },
                { id: 3, name: 'Negotiation', key: 'negotiation', order: 2, status: 'Enabled' },
                { id: 4, name: 'Internal Approval', key: 'internal_approval', order: 3, status: 'Enabled' },
                { id: 5, name: 'Contract Award', key: 'contract_award', order: 4, status: 'Enabled' },
                { id: 6, name: 'Contract Execution', key: 'contract_execution', order: 5, status: 'Enabled' },
                { id: 7, name: 'Contract Management', key: 'contract_management', order: 6, status: 'Enabled' },
            ]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStages();
    }, [fetchStages]);

    // Drag and Drop Logic
    const onDragStart = (e, index) => {
        setDraggedItemIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        // Essential for Firefox
        e.dataTransfer.setData('text/html', e.target.parentNode);
    };

    const onDragOver = (index) => {
        if (draggedItemIndex === index) return;
        
        const reorderedStages = [...stages];
        const draggedItem = reorderedStages[draggedItemIndex];
        
        // Remove dragged item
        reorderedStages.splice(draggedItemIndex, 1);
        // Insert at new position
        reorderedStages.splice(index, 0, draggedItem);
        
        // Update order property
        const updatedStages = reorderedStages.map((stage, i) => ({
            ...stage,
            order: i
        }));
        
        setDraggedItemIndex(index);
        setStages(updatedStages);
    };

    const onDragEnd = async () => {
        setDraggedItemIndex(null);
        // Sync with API
        try {
            await fetch('/api/stages/reorder', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ stages })
            });
        } catch (err) {
            console.warn('Reorder sync failed, keeping local state.');
        }
    };

    // Modal Handlers
    const handleOpenModal = (stage = null) => {
        if (stage) {
            setCurrentStage(stage);
            setFormData({
                name: stage.name,
                key: stage.key,
                order: stage.order.toString(),
                status: stage.status
            });
        } else {
            setCurrentStage(null);
            setFormData({
                name: '',
                key: '',
                order: stages.length.toString(),
                status: 'Enabled'
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentStage(null);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newData = { ...prev, [name]: value };
            // Auto-generate key from name if new stage
            if (name === 'name' && !currentStage) {
                newData.key = value.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
            }
            return newData;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const url = currentStage ? `/api/stages/${currentStage.id}` : '/api/stages';
        const method = currentStage ? 'PATCH' : 'POST';

        try {
            const body = { 
                ...formData, 
                order: parseInt(formData.order) || (currentStage ? currentStage.order : stages.length)
            };
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!response.ok) throw new Error('Failed to save stage');
            fetchStages();
            handleCloseModal();
        } catch (err) {
            // Mock update for demo
            if (currentStage) {
                setStages(stages.map(s => s.id === currentStage.id ? { ...s, ...formData, order: parseInt(formData.order) || s.order } : s));
            } else {
                setStages([...stages, { id: Date.now(), ...formData, order: parseInt(formData.order) || stages.length }]);
            }
            handleCloseModal();
        }
    };

    const toggleStatus = async (stage) => {
        const newStatus = stage.status === 'Enabled' ? 'Disabled' : 'Enabled';
        try {
            await fetch(`/api/stages/${stage.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            fetchStages();
        } catch (err) {
            setStages(stages.map(s => s.id === stage.id ? { ...s, status: newStatus } : s));
        }
    };

    if (isLoading && stages.length === 0) return (
        <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Loading pipeline configuration...</p>
        </div>
    );

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2>Pipeline Stages</h2>
                <button className={styles.addBtn} onClick={() => handleOpenModal()}>
                    <span>+</span> Add New Stage
                </button>
            </div>

            {error && <div className={styles.errorContainer}>{error}</div>}

            <div className={styles.stageList}>
                {stages.map((stage, index) => (
                    <div 
                        key={stage.id} 
                        className={`${styles.stageItem} ${draggedItemIndex === index ? styles.dragging : ''} ${stage.status === 'Disabled' ? styles.disabled : ''}`}
                        onDragOver={(e) => {
                            e.preventDefault();
                            onDragOver(index);
                        }}
                    >
                        <div 
                            className={styles.dragHandle}
                            draggable
                            onDragStart={(e) => onDragStart(e, index)}
                            onDragEnd={onDragEnd}
                        >
                            ⋮⋮
                        </div>
                        
                        <div className={styles.orderBadge}>
                            {index + 1}
                        </div>

                        <div className={styles.stageInfo}>
                            <span className={styles.stageName}>{stage.name}</span>
                            <span className={styles.stageKey}>{stage.key}</span>
                        </div>

                        <div className={styles.statusWrapper}>
                            <span className={`${styles.statusBadge} ${stage.status === 'Enabled' ? styles.enabled : styles.disabled}`}>
                                {stage.status}
                            </span>
                        </div>

                        <div className={styles.actions}>
                            <button className={styles.actionBtn} onClick={() => toggleStatus(stage)}>
                                {stage.status === 'Enabled' ? '🚫' : '✅'}
                            </button>
                            <button className={styles.actionBtn} onClick={() => handleOpenModal(stage)}>
                                ✎
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <h3>{currentStage ? 'Edit Stage' : 'Add New Pipeline Stage'}</h3>
                            <button className={styles.closeBtn} onClick={handleCloseModal}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className={styles.modalBody}>
                                <div className={styles.formGroup}>
                                    <label>Stage Name</label>
                                    <input 
                                        name="name"
                                        className={styles.input}
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        placeholder="e.g. Contract Negotiation"
                                        required
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>System Key</label>
                                    <input 
                                        name="key"
                                        className={styles.input}
                                        value={formData.key}
                                        onChange={handleInputChange}
                                        placeholder="contract_negotiation"
                                        disabled={!!currentStage}
                                        required
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Order</label>
                                    <input 
                                        type="number"
                                        name="order"
                                        className={styles.input}
                                        value={formData.order}
                                        onChange={handleInputChange}
                                        placeholder="0"
                                        min="0"
                                        max="99"
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Initial Status</label>
                                    <select 
                                        name="status"
                                        className={styles.input}
                                        value={formData.status}
                                        onChange={handleInputChange}
                                    >
                                        <option value="Enabled">Enabled</option>
                                        <option value="Disabled">Disabled</option>
                                    </select>
                                </div>
                            </div>
                            <div className={styles.modalFooter}>
                                <button type="button" className={styles.cancelBtn} onClick={handleCloseModal}>Cancel</button>
                                <button type="submit" className={styles.submitBtn}>
                                    {currentStage ? 'Save Changes' : 'Add Stage'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PipelineStages;
