import React, { useState, useEffect, useRef } from 'react';
import styles from './SelfServicePortal.module.css';
import {
    Zap, Send, FileText, CheckCircle2, ChevronRight, Briefcase, UploadCloud, Sparkles
} from 'lucide-react';
import { getAuthHeaders } from '../services/authHelper';

const DOC_CATEGORIES = [
    {
        key: 'Self-Service (AI Instant)',
        quick: true,
        options: ['NDA', 'Simple Service Agreement', 'Data Processing Agreement (DPA)', 'Memorandum of Understanding (MOU)']
    },
    {
        key: 'Business Contracts (Legal Review)',
        options: ['Master Service Agreement (MSA)', 'Statement of Work (SOW)', 'Service Level Agreement (SLA)']
    },
    {
        key: 'Vendor / Procurement',
        options: ['Vendor Agreement', 'Supplier Contract']
    },
    {
        key: 'Compliance / Legal',
        options: ['Data Privacy Agreement', 'Compliance Agreement', 'Regulatory Document']
    },
    {
        key: 'Legal Assistance',
        options: ['Contract Review Request', 'Legal Advice', 'Draft Custom Contract', 'Clause Review']
    }
];

const QUICK_OPTIONS = ['NDA', 'Simple Service Agreement', 'Memorandum of Understanding (MOU)'];
const SELF_SERVICE_CATEGORY = 'Self-Service (AI Instant)';

const findCategoryByDocument = (documentType) => {
    const found = DOC_CATEGORIES.find((category) => category.options.includes(documentType));
    return found?.key || 'Legal Assistance';
};

const classifyFromIntent = (message) => {
    const lower = message.toLowerCase();
    const intentRules = [
        { doc: 'NDA', keys: ['nda', 'non disclosure', 'non-disclosure', 'confidential'] },
        { doc: 'Simple Service Agreement', keys: ['service agreement', 'consulting', 'services'] },
        { doc: 'Data Processing Agreement (DPA)', keys: ['dpa', 'data processing', 'processor', 'controller'] },
        { doc: 'Memorandum of Understanding (MOU)', keys: ['mou', 'memorandum'] },
        { doc: 'Master Service Agreement (MSA)', keys: ['msa', 'master service'] },
        { doc: 'Statement of Work (SOW)', keys: ['sow', 'statement of work', 'deliverables'] },
        { doc: 'Service Level Agreement (SLA)', keys: ['sla', 'uptime', 'service level'] },
        { doc: 'Vendor Agreement', keys: ['vendor', 'onboarding vendor'] },
        { doc: 'Supplier Contract', keys: ['supplier', 'procurement'] },
        { doc: 'Data Privacy Agreement', keys: ['privacy', 'personal data', 'pii'] },
        { doc: 'Compliance Agreement', keys: ['compliance', 'policy', 'controls'] },
        { doc: 'Regulatory Document', keys: ['regulatory', 'authority', 'license'] },
        { doc: 'Contract Review Request', keys: ['review existing', 'review contract'] },
        { doc: 'Legal Advice', keys: ['legal advice', 'guidance', 'counsel'] },
        { doc: 'Draft Custom Contract', keys: ['custom contract', 'new custom'] },
        { doc: 'Clause Review', keys: ['clause', 'redline', 'specific clause'] },
    ];

    for (const rule of intentRules) {
        if (rule.keys.some((key) => lower.includes(key))) {
            return rule.doc;
        }
    }

    return 'Contract Review Request';
};

const SelfServicePortal = ({ user, onClose, onSuccess }) => {
    const [step, setStep] = useState('chat'); // chat | form | upload | success
    const [messages, setMessages] = useState([
        {
            type: 'ai',
            text: `Hi ${user?.name || 'there'}! I'm your Legal AI Assistant. How would you like to proceed?`,
            ui: 'entry-gate'
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isMoreOptionsOpen, setIsMoreOptionsOpen] = useState(false);
    const [expandedCategories, setExpandedCategories] = useState({
        'Business Contracts (Legal Review)': false,
        'Vendor / Procurement': false,
        'Compliance / Legal': false,
        'Legal Assistance': false,
    });
    const [aiGuidedMode, setAiGuidedMode] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const [uploadSubmitting, setUploadSubmitting] = useState(false);
    const [uploadResult, setUploadResult] = useState(null);
    const messagesEndRef = useRef(null);

    const [requestContext, setRequestContext] = useState({
        request_mode: 'generated',
        document_category: SELF_SERVICE_CATEGORY,
        template_type: 'NDA',
        ai_classification_result: null,
    });

    const [formData, setFormData] = useState({
        title: '',
        company: '',
        department: user?.department || 'Sales',
        value: '',
        description: '',
        expiry_date: '',
    });
    const [submitting, setSubmitting] = useState(false);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const withTyping = (fn, delay = 900) => {
        setIsTyping(true);
        setTimeout(() => {
            setIsTyping(false);
            fn();
        }, delay);
    };

    const askCreateFlow = () => {
        setMessages((prev) => [
            ...prev,
            {
                type: 'ai',
                text: 'Great choice. Pick a document type. You can use quick picks or expand more options by category.',
                ui: 'create-options'
            }
        ]);
    };

    const ENTRY_ACTIONS = {
        CREATE: 'create',
        UPLOAD: 'upload',
        AI_DECIDE: 'ai-decide',
    };

    const chooseEntryOption = (action, label) => {
        setMessages((prev) => [...prev, { type: 'user', text: label }]);

        if (action === ENTRY_ACTIONS.CREATE) {
            setAiGuidedMode(false);
            setRequestContext((prev) => ({ ...prev, request_mode: 'generated' }));
            withTyping(() => askCreateFlow());
            return;
        }

        if (action === ENTRY_ACTIONS.UPLOAD) {
            setAiGuidedMode(false);
            setRequestContext((prev) => ({ ...prev, request_mode: 'uploaded' }));
            withTyping(() => {
                setMessages((prev) => [...prev, {
                    type: 'ai',
                    text: 'Upload your contract file (PDF, DOC, or DOCX). I will parse it, classify the document, extract key metadata, and route it to Legal Counsel.',
                }]);
                setStep('upload');
            });
            return;
        }

        setAiGuidedMode(true);
        withTyping(() => {
            setMessages((prev) => [...prev, {
                type: 'ai',
                text: 'I can decide for you. Tell me what you need in one sentence (business objective + whether you already have a file).',
            }]);
        });
    };

    const handleTemplateSelect = (templateType) => {
        const category = findCategoryByDocument(templateType);
        const isSelfService = category === SELF_SERVICE_CATEGORY;

        setMessages((prev) => [...prev, { type: 'user', text: templateType }]);
        setRequestContext((prev) => ({
            ...prev,
            request_mode: 'generated',
            template_type: templateType,
            document_category: category,
            ai_classification_result: {
                document_type: templateType,
                document_category: category,
                routing_decision: isSelfService ? 'AI Template Generation' : 'Legal Counsel Review',
                confidence: 'high',
            },
        }));

        withTyping(() => {
            setMessages((prev) => [...prev, {
                type: 'ai',
                text: isSelfService
                    ? `${templateType} is in Self-Service. I will help generate a draft using our template and send it into the legal review pipeline.`
                    : `${templateType} requires Legal Counsel review. I will capture details and route it as Under Review in Module A workflow.`,
            }]);
            setStep('form');
        }, 1000);
    };

    const handleSendMessage = () => {
        if (!inputValue.trim()) return;

        const userMsg = inputValue.trim();
        setMessages((prev) => [...prev, { type: 'user', text: userMsg }]);
        setInputValue('');

        if (aiGuidedMode) {
            const inferredType = classifyFromIntent(userMsg);
            const category = findCategoryByDocument(inferredType);
            const hasFileIntent = /upload|attached|existing file|already have/i.test(userMsg);

            withTyping(() => {
                if (hasFileIntent) {
                    setRequestContext((prev) => ({ ...prev, request_mode: 'uploaded' }));
                    setMessages((prev) => [...prev, {
                        type: 'ai',
                        text: `Based on your input, the best flow is to upload your existing file. I will classify it (likely ${inferredType}) and route it to Legal.`,
                    }]);
                    setStep('upload');
                } else {
                    setMessages((prev) => [...prev, {
                        type: 'ai',
                        text: `Based on your intent, I recommend: ${inferredType} in ${category}. I'll pre-select it for you.`,
                    }]);
                    setAiGuidedMode(false);
                    handleTemplateSelect(inferredType);
                }
            });
            return;
        }

        withTyping(() => {
            setMessages((prev) => [...prev, {
                type: 'ai',
                text: 'Use the guided options above: Create new document, Upload existing document, or Let AI decide.',
                ui: 'entry-gate',
            }]);
        });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));

        if (name === 'company' && !formData.title?.trim()) {
            setFormData((prev) => ({ ...prev, company: value, title: `${value} - ${requestContext.template_type}` }));
        }
    };

    const handleSubmit = async () => {
        if (!formData.company || !formData.description) return;

        setSubmitting(true);
        try {
            const response = await fetch('/api/self-service/request', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    ...formData,
                    template_type: requestContext.template_type,
                    request_mode: requestContext.request_mode,
                    document_category: requestContext.document_category,
                    ai_classification_result: requestContext.ai_classification_result,
                    submittedBy: user?.email,
                })
            });

            if (response.ok) {
                setUploadResult(null);
                setStep('success');
            } else {
                console.error('Submission failed');
            }
        } catch (error) {
            console.error('Error submitting request:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleFileChange = (event) => {
        const file = event?.target?.files?.[0];
        if (file) {
            setSelectedFile(file);
        }
    };

    const handleDrop = (event) => {
        event.preventDefault();
        event.stopPropagation();
        setDragActive(false);
        const file = event.dataTransfer?.files?.[0];
        if (file) {
            setSelectedFile(file);
        }
    };

    const handleUploadSubmit = async () => {
        if (!selectedFile) return;

        setUploadSubmitting(true);
        try {
            const payload = new FormData();
            payload.append('file', selectedFile);
            payload.append('title', formData.title || `${selectedFile.name} - Legal Review`);
            payload.append('company', formData.company || 'Unknown');
            payload.append('department', formData.department || user?.department || 'Sales');
            payload.append('value', formData.value || '0');
            payload.append('description', formData.description || 'Uploaded for legal review.');
            payload.append('submittedBy', user?.email || '');

            const response = await fetch('/api/self-service/upload-request', {
                method: 'POST',
                headers: getAuthHeaders(true),
                body: payload,
            });

            const result = await response.json();
            if (response.ok) {
                setRequestContext((prev) => ({
                    ...prev,
                    request_mode: 'uploaded',
                    document_category: result?.document_category || prev.document_category,
                    ai_classification_result: result?.ai_classification_result || null,
                }));
                setUploadResult(result);
                setStep('success');
            } else {
                console.error(result?.detail || 'Upload failed');
            }
        } catch (error) {
            console.error('Error submitting uploaded request:', error);
        } finally {
            setUploadSubmitting(false);
        }
    };

    const renderEntryGate = () => (
        <div className={styles.optionsGrid}>
            <button className={styles.optionBtn} onClick={() => chooseEntryOption(ENTRY_ACTIONS.CREATE, 'use existing templatre')}>
                use existing templatre <ChevronRight size={16} />
            </button>
            <button className={styles.optionBtn} onClick={() => chooseEntryOption(ENTRY_ACTIONS.UPLOAD, 'uplaod documnent')}>
                uplaod documnent <ChevronRight size={16} />
            </button>
            <button className={styles.optionBtn} onClick={() => chooseEntryOption(ENTRY_ACTIONS.AI_DECIDE, 'Not sure? Let AI decide')}>
                Not sure? Let AI decide <Sparkles size={16} />
            </button>
        </div>
    );

    const renderCreateOptions = () => {
        return (
            <div className={styles.createOptionsWrap}>
                <div className={styles.quickRow}>
                    {QUICK_OPTIONS.map((doc) => (
                        <button key={doc} className={styles.optionBtn} onClick={() => handleTemplateSelect(doc)}>
                            {doc} <ChevronRight size={16} />
                        </button>
                    ))}
                </div>

                <button
                    className={styles.moreToggleBtn}
                    onClick={() => setIsMoreOptionsOpen((prev) => !prev)}
                >
                    {isMoreOptionsOpen ? 'Hide More Options' : 'More Options'}
                </button>

                {isMoreOptionsOpen && (
                    <div className={styles.expandSectionList}>
                        {DOC_CATEGORIES.filter((category) => !category.quick).map((category) => {
                            const isExpanded = expandedCategories[category.key];
                            return (
                                <div key={category.key} className={styles.categorySection}>
                                    <button
                                        className={styles.categoryHeader}
                                        onClick={() => setExpandedCategories((prev) => ({ ...prev, [category.key]: !prev[category.key] }))}
                                    >
                                        <span>{category.key}</span>
                                        <span>{isExpanded ? '−' : '+'}</span>
                                    </button>
                                    {isExpanded && (
                                        <div className={styles.categoryOptions}>
                                            {category.options.map((option) => (
                                                <button
                                                    key={option}
                                                    className={styles.optionBtn}
                                                    onClick={() => handleTemplateSelect(option)}
                                                >
                                                    {option} <ChevronRight size={16} />
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    };

    const selectedIsSelfService = requestContext.document_category === SELF_SERVICE_CATEGORY;

    return (
        <div className={styles.portalContainer}>
            <div className={styles.header}>
                <div className={styles.headerTitle}>
                    <div className={styles.iconWrap}>
                        <Zap size={20} />
                    </div>
                    <div>
                        <h3>Service Portal</h3>
                        <p>AI-Guided Legal Request Intake</p>
                    </div>
                </div>
            </div>

            <div className={styles.body}>
                {step === 'chat' && (
                    <div className={styles.chatContainer}>
                        {messages.map((msg, i) => (
                            <div key={`${msg.type}-${i}`} className={`${styles.messageRow} ${msg.type === 'ai' ? styles.aiMessageRow : styles.userMessageRow}`}>
                                <div className={`${styles.messageBubble} ${msg.type === 'ai' ? styles.aiMessage : styles.userMessage}`}>
                                    {msg.text}
                                </div>

                                {msg.type === 'ai' && msg.ui === 'entry-gate' && renderEntryGate()}
                                {msg.type === 'ai' && msg.ui === 'create-options' && renderCreateOptions()}
                            </div>
                        ))}

                        {isTyping && (
                            <div className={`${styles.messageRow} ${styles.aiMessageRow}`}>
                                <div className={styles.typingIndicator}>
                                    <span className={styles.typingDot}></span>
                                    <span className={styles.typingDot}></span>
                                    <span className={styles.typingDot}></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                )}

                {step === 'form' && (
                    <div className={styles.formContainer}>
                        <div className={styles.templateSummary}>
                            <div className={styles.templateIcon}>
                                {selectedIsSelfService ? <FileText size={24} /> : <Briefcase size={24} />}
                            </div>
                            <div>
                                <h4>{requestContext.template_type}</h4>
                                <p>
                                    Category: {requestContext.document_category}. {selectedIsSelfService
                                        ? 'AI will generate a template-based draft before continuing through legal review.'
                                        : 'This request will be routed directly to Legal Counsel as Under Review.'}
                                </p>
                            </div>
                        </div>

                        <div className={styles.formGrid}>
                            <div className={styles.formGroup}>
                                <label>Counterparty / Company Name *</label>
                                <input
                                    type="text"
                                    className={styles.formInput}
                                    name="company"
                                    value={formData.company}
                                    onChange={handleInputChange}
                                    placeholder="e.g. Acme Corp"
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Request Title</label>
                                <input
                                    type="text"
                                    className={styles.formInput}
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    placeholder="Auto-generated if left blank"
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Department</label>
                                <select
                                    className={styles.formInput}
                                    name="department"
                                    value={formData.department}
                                    onChange={handleInputChange}
                                >
                                    <option value="Sales">Sales</option>
                                    <option value="Procurement">Procurement</option>
                                    <option value="IT">IT</option>
                                    <option value="HR">HR</option>
                                    <option value="Marketing">Marketing</option>
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label>Expiry Date (Optional)</label>
                                <input
                                    type="date"
                                    className={styles.formInput}
                                    name="expiry_date"
                                    value={formData.expiry_date}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                <label>Business Context / Request Note *</label>
                                <textarea
                                    className={`${styles.formInput} ${styles.formTextarea}`}
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    placeholder="Describe the business need, counterpart expectations, and any legal sensitivity."
                                ></textarea>
                            </div>
                        </div>
                    </div>
                )}

                {step === 'upload' && (
                    <div className={styles.formContainer}>
                        <div className={styles.templateSummary}>
                            <div className={styles.templateIcon}>
                                <UploadCloud size={24} />
                            </div>
                            <div>
                                <h4>Upload Existing Document</h4>
                                <p>Supported formats: PDF, DOC, DOCX. AI will parse metadata, classify type, detect clause categories, and route to Legal Counsel.</p>
                            </div>
                        </div>

                        <div
                            className={`${styles.uploadDropzone} ${dragActive ? styles.uploadDropzoneActive : ''}`}
                            onDragEnter={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setDragActive(true);
                            }}
                            onDragOver={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                            }}
                            onDragLeave={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setDragActive(false);
                            }}
                            onDrop={handleDrop}
                        >
                            <UploadCloud size={30} />
                            <p>Drag & drop a file here, or browse</p>
                            <label className={styles.uploadBrowseBtn}>
                                Browse File
                                <input
                                    type="file"
                                    accept=".pdf,.doc,.docx"
                                    onChange={handleFileChange}
                                    style={{ display: 'none' }}
                                />
                            </label>
                            {selectedFile && <span className={styles.fileTag}>{selectedFile.name}</span>}
                        </div>

                        <div className={styles.formGrid} style={{ marginTop: '20px' }}>
                            <div className={styles.formGroup}>
                                <label>Company (Optional if file includes it)</label>
                                <input
                                    type="text"
                                    className={styles.formInput}
                                    name="company"
                                    value={formData.company}
                                    onChange={handleInputChange}
                                    placeholder="Counterparty name"
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Request Title (Optional)</label>
                                <input
                                    type="text"
                                    className={styles.formInput}
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    placeholder="e.g. Vendor MSA review"
                                />
                            </div>
                            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                <label>Context Note</label>
                                <textarea
                                    className={`${styles.formInput} ${styles.formTextarea}`}
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    placeholder="Any business context for Legal review"
                                ></textarea>
                            </div>
                        </div>
                    </div>
                )}

                {step === 'success' && (
                    <div className={styles.successContainer}>
                        <div className={styles.successIcon}>
                            <CheckCircle2 size={32} />
                        </div>
                        <h3>Request Submitted Successfully!</h3>
                        {requestContext.request_mode === 'generated' ? (
                            <p>
                                {selectedIsSelfService
                                    ? 'Template draft generated and routed into Legal review workflow.'
                                    : 'Request routed to Legal Counsel and marked Under Review for Module A workflow.'}
                            </p>
                        ) : (
                            <p>
                                Uploaded document parsed and classified. Request routed to Legal Counsel as Under Review.
                            </p>
                        )}
                        {uploadResult?.ai_classification_result && (
                            <div className={styles.classificationCard}>
                                <strong>AI Classification</strong>
                                <span>Type: {uploadResult.ai_classification_result.document_type}</span>
                                <span>Category: {uploadResult.ai_classification_result.document_category}</span>
                                <span>Clauses: {(uploadResult.ai_classification_result.clause_categories || []).join(', ')}</span>
                            </div>
                        )}
                        <button className={styles.successBtn} onClick={onSuccess}>Done</button>
                    </div>
                )}
            </div>

            {step === 'chat' && (
                <div className={styles.chatInputArea}>
                    <input
                        type="text"
                        placeholder="Describe what you need..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                    <button className={styles.sendBtn} onClick={handleSendMessage}>
                        <Send size={18} />
                    </button>
                </div>
            )}

            {step === 'form' && (
                <div className={styles.formActions}>
                    <button className={styles.btnCancel} onClick={() => setStep('chat')}>Back to AI Chat</button>
                    <button
                        className={styles.btnSubmit}
                        onClick={handleSubmit}
                        disabled={!formData.company || !formData.description || submitting}
                    >
                        {submitting ? 'Submitting...' : (
                            <>{selectedIsSelfService ? 'Generate Contract' : 'Submit for Legal Review'} <Zap size={16} fill="currentColor" /></>
                        )}
                    </button>
                </div>
            )}

            {step === 'upload' && (
                <div className={styles.formActions}>
                    <button className={styles.btnCancel} onClick={() => setStep('chat')}>Back to AI Chat</button>
                    <button
                        className={styles.btnSubmit}
                        onClick={handleUploadSubmit}
                        disabled={!selectedFile || uploadSubmitting}
                    >
                        {uploadSubmitting ? 'Uploading...' : (
                            <>Upload & Route <UploadCloud size={16} /></>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
};

export default SelfServicePortal;
