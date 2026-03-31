import React, { useState, useEffect } from 'react';
import styles from './DocumentViewer.module.css';
import { contractService } from '../services/contractService';
import { ArrowLeft, FileText, History, MessageSquare, Send, Calendar, User, DollarSign, Clock, Shield } from 'lucide-react';

const DocumentViewer = ({ contractId, onBack }) => {
    const [contract, setContract] = useState(null);
    const [documents, setDocuments] = useState([]);
    const [activeDocument, setActiveDocument] = useState(null);
    const [viewData, setViewData] = useState(null);
    const [comments, setComments] = useState([]);
    const [activeTab, setActiveTab] = useState('details');
    const [isLoading, setIsLoading] = useState(true);
    const [isViewLoading, setIsViewLoading] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);

    useEffect(() => {
        const loadInitialData = async () => {
            setIsLoading(true);
            try {
                const [contractData, docsData] = await Promise.all([
                    contractService.getContractById(contractId),
                    contractService.getContractDocuments(contractId)
                ]);
                
                setContract(contractData);
                setDocuments(docsData);
                
                if (docsData && docsData.length > 0) {
                    // Set latest version as active by default
                    const latestDoc = docsData[0];
                    setActiveDocument(latestDoc);
                    loadDocumentView(latestDoc.id);
                }
                
                loadComments();
            } catch (error) {
                console.error('Failed to load contract data', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadInitialData();
    }, [contractId]);

    const loadDocumentView = async (docId) => {
        setIsViewLoading(true);
        try {
            const data = await contractService.getDocumentViewData(docId);
            setViewData(data);
        } catch (error) {
            console.error('Failed to load document view', error);
        } finally {
            setIsViewLoading(false);
        }
    };

    const loadComments = async () => {
        try {
            const commentsData = await contractService.getComments(contractId);
            setComments(commentsData);
        } catch (error) {
            console.error('Failed to load comments', error);
        }
    };

    const handleVersionClick = (doc) => {
        if (activeDocument?.id === doc.id) return;
        setActiveDocument(doc);
        loadDocumentView(doc.id);
    };

    const handleCommentSubmit = async () => {
        if (!newComment.trim() || isSubmittingComment) return;
        
        setIsSubmittingComment(true);
        try {
            const userEmail = localStorage.getItem('userEmail') || 'Unknown User';
            await contractService.addComment(
                contractId, 
                null, 
                newComment, 
                'General', 
                userEmail
            );
            setNewComment('');
            loadComments();
        } catch (error) {
            console.error('Failed to add comment', error);
        } finally {
            setIsSubmittingComment(false);
        }
    };

    if (isLoading) {
        return (
            <div className={styles.viewerContainer}>
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>Loading Contract Environment...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.viewerContainer}>
            {/* Left: Document Pane */}
            <div className={styles.documentPane}>
                <div className={styles.paneHeader}>
                    <button className={styles.backBtn} onClick={onBack}>
                        <ArrowLeft size={16} />
                        Back to Ledger
                    </button>
                    <h2 className={styles.docTitle}>{contract?.title || 'Contract Viewer'}</h2>
                    <div style={{ width: '100px' }}></div> {/* Spacer */}
                </div>

                <div className={styles.viewArea}>
                    {isViewLoading ? (
                        <div className={styles.loading}>
                            <div className={styles.spinner}></div>
                            <p>Initializing Secure Viewer...</p>
                        </div>
                    ) : viewData?.type === 'pdf' ? (
                        <iframe 
                            src={viewData.url} 
                            className={styles.pdfFrame} 
                            title="PDF Viewer"
                        />
                    ) : viewData?.type === 'docx' ? (
                        <div className={styles.docxContent} dangerouslySetInnerHTML={{ __html: viewData.content }} />
                    ) : viewData?.type === 'text' ? (
                        <div className={styles.docxContent}>
                            <pre style={{ whiteSpace: 'pre-wrap' }}>{viewData.content}</pre>
                        </div>
                    ) : (
                        <div className={styles.emptyState}>
                            <FileText size={48} />
                            <p>Document content unavailable for this file type.</p>
                            <a href={`/api/documents/${activeDocument?.id}/download`} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', marginTop: '10px' }}>
                                Download to view externally
                            </a>
                        </div>
                    )}
                </div>
            </div>

            {/* Right: Side Panel */}
            <div className={styles.sidePanel}>
                <div className={styles.tabHeader}>
                    <div 
                        className={`${styles.tab} ${activeTab === 'details' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('details')}
                    >
                        Details
                    </div>
                    <div 
                        className={`${styles.tab} ${activeTab === 'versions' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('versions')}
                    >
                        Versions
                    </div>
                    <div 
                        className={`${styles.tab} ${activeTab === 'comments' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('comments')}
                    >
                        Comments
                    </div>
                </div>

                <div className={styles.panelContent}>
                    {activeTab === 'details' && (
                        <div className={styles.detailsGrid}>
                            <div className={styles.detailItem}>
                                <span className={styles.detailLabel}>Counterparty</span>
                                <span className={styles.detailValue}><Shield size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} /> {contract?.company}</span>
                            </div>
                            <div className={styles.detailItem}>
                                <span className={styles.detailLabel}>Contract Value</span>
                                <span className={styles.detailValue}><DollarSign size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} /> ${parseFloat(contract?.value || 0).toLocaleString()}</span>
                            </div>
                            <div className={styles.detailItem}>
                                <span className={styles.detailLabel}>Duration</span>
                                <span className={styles.detailValue}><Clock size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} /> {contract?.duration || 'Not specified'}</span>
                            </div>
                            <div className={styles.detailItem}>
                                <span className={styles.detailLabel}>Department</span>
                                <span className={styles.detailValue}><User size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} /> {contract?.department}</span>
                            </div>
                            <div className={styles.detailItem}>
                                <span className={styles.detailLabel}>Business Unit</span>
                                <span className={styles.detailValue}> {contract?.business_unit || 'N/A'}</span>
                            </div>
                            <div className={styles.detailItem}>
                                <span className={styles.detailLabel}>Status</span>
                                <span style={{ 
                                    padding: '4px 10px', 
                                    borderRadius: '12px', 
                                    fontSize: '11px', 
                                    fontWeight: '700',
                                    background: (contract?.status === 'Approved' || contract?.status === 'Executed') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                    color: (contract?.status === 'Approved' || contract?.status === 'Executed') ? '#10b981' : '#f59e0b',
                                    width: 'fit-content',
                                    marginTop: '4px'
                                }}>
                                    {contract?.status?.toUpperCase()}
                                </span>
                            </div>
                        </div>
                    )}

                    {activeTab === 'versions' && (
                        <div className={styles.versionList}>
                            {documents.map((doc, idx) => (
                                <div 
                                    key={doc.id} 
                                    className={`${styles.versionItem} ${activeDocument?.id === doc.id ? styles.activeVersion : ''}`}
                                    onClick={() => handleVersionClick(doc)}
                                >
                                    <div className={styles.versionHeader}>
                                        <span className={styles.versionName}>V{documents.length - idx}: {doc.fileName}</span>
                                        <span className={styles.versionDate}>
                                            {new Date(doc.uploadedAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className={styles.versionMeta}>
                                        Uploaded by: {doc.uploadedBy} • {(doc.fileSize / 1024).toFixed(1)} KB
                                    </div>
                                </div>
                            ))}
                            {documents.length === 0 && (
                                <div className={styles.emptyState}>
                                    <History size={32} />
                                    <p>No version history available.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'comments' && (
                        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                            <div className={styles.commentList}>
                                {comments.map((comment) => (
                                    <div key={comment.id} className={styles.commentItem}>
                                        <div className={styles.commentHeader}>
                                            <span className={styles.commentAuthor}>{comment.commentedBy}</span>
                                            <span className={styles.commentTime}>
                                                {new Date(comment.createdAt).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className={styles.commentText}>{comment.comment}</div>
                                    </div>
                                ))}
                                {comments.length === 0 && (
                                    <div className={styles.emptyState}>
                                        <MessageSquare size={32} />
                                        <p>No comments yet. Start the discussion below.</p>
                                    </div>
                                )}
                            </div>

                            <div className={styles.commentInputArea}>
                                <textarea 
                                    className={styles.commentInput} 
                                    placeholder="Write a comment..."
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                />
                                <button 
                                    className={styles.submitBtn}
                                    onClick={handleCommentSubmit}
                                    disabled={!newComment.trim() || isSubmittingComment}
                                >
                                    {isSubmittingComment ? 'Sending...' : 'Post Comment'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DocumentViewer;
