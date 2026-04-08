import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import styles from './PdfAnnotationViewer.module.css';
import { getAuthHeaders } from '../services/authHelper';
import DocxRenderer from './common/DocxRenderer';

pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

const COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6'];

const PdfAnnotationViewer = ({ contractId, readOnly, user, onClose, actionLabel, onAction }) => {
    const [docMode, setDocMode] = useState('pdf'); // 'docx' | 'pdf'
    const [docxViewData, setDocxViewData] = useState(null);
    const [activeDocxDocumentId, setActiveDocxDocumentId] = useState(null);
    const [pdfDoc, setPdfDoc] = useState(null);
    const [pageNum, setPageNum] = useState(1);
    const [pageCount, setPageCount] = useState(0);
    const [annotations, setAnnotations] = useState([]);
    const [isAnnotating, setIsAnnotating] = useState(false);
    const [draftAnnotation, setDraftAnnotation] = useState(null);
    const [commentText, setCommentText] = useState('');
    const [selectedColor, setSelectedColor] = useState(COLORS[0]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activePin, setActivePin] = useState(null);
    const [canvasSize, setCanvasSize] = useState({ w: 0, h: 0 });

    // ── Edit mode states ──────────────────────────────────────────────────────
    const [editMode, setEditMode] = useState(false);
    const [editText, setEditText] = useState('');
    const [editDocxHtml, setEditDocxHtml] = useState('');
    const [editDocxParagraphs, setEditDocxParagraphs] = useState([]);
    const [loadingEditText, setLoadingEditText] = useState(false);
    const [savingEdit, setSavingEdit] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');
    const [pdfKey, setPdfKey] = useState(0); // increment to force PDF reload

    const canvasRef = useRef(null);
    const wrapperRef = useRef(null);
    const docxWrapperRef = useRef(null);
    const [docxSize, setDocxSize] = useState({ w: 0, h: 0 });

    const loadPinnedAnnotations = useCallback(async (mode, documentId = null) => {
        const params = new URLSearchParams();
        params.set('doc_type', mode === 'docx' ? 'docx' : 'pdf');
        if (mode === 'docx' && documentId) params.set('document_id', documentId);
        const annRes = await fetch(`/api/contracts/${contractId}/pdf-annotations?${params.toString()}`, {
            headers: getAuthHeaders()
        });
        if (annRes.ok) {
            setAnnotations(await annRes.json());
        } else {
            setAnnotations([]);
        }
    }, [contractId]);

    // ── Load DOCX-first review content; fallback to PDF + annotations ───────
    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            try {
                setError(null);
                setLoading(true);

                const ensureRes = await fetch(`/api/contracts/${contractId}/ensure-docx`, {
                    method: 'POST',
                    headers: getAuthHeaders()
                });
                if (ensureRes.ok) {
                    const ensureData = await ensureRes.json();
                    if (ensureData?.document_id) {
                        const viewRes = await fetch(`/api/documents/${ensureData.document_id}/view`, {
                            headers: getAuthHeaders()
                        });
                        if (viewRes.ok) {
                            const viewData = await viewRes.json();
                            if (!cancelled && viewData?.type === 'docx') {
                                setDocMode('docx');
                                setActiveDocxDocumentId(ensureData.document_id);
                                setDocxViewData(viewData);
                                await loadPinnedAnnotations('docx', ensureData.document_id);
                                setLoading(false);
                                return;
                            }
                        }
                    }
                }

                // Fallback to legacy PDF mode
                if (!cancelled) await loadPinnedAnnotations('pdf');

                const task = pdfjsLib.getDocument({
                    url: `/api/contracts/${contractId}/pdf?v=${pdfKey}`,
                    httpHeaders: getAuthHeaders()
                });
                const pdf = await task.promise;
                if (!cancelled) {
                    setDocMode('pdf');
                    setDocxViewData(null);
                    setPdfDoc(pdf);
                    setPageCount(pdf.numPages);
                    setPageNum(1);
                    setLoading(false);
                }
            } catch (e) {
                if (!cancelled) {
                    setError('Failed to load PDF.');
                    setLoading(false);
                }
            }
        };
        load();
        return () => { cancelled = true; };
    }, [contractId, pdfKey, loadPinnedAnnotations]);

    // ── Render page ─────────────────────────────────────────────────────────
    useEffect(() => {
        if (!pdfDoc || !canvasRef.current || editMode) return;
        let task = null;
        const render = async () => {
            const page = await pdfDoc.getPage(pageNum);
            const vp = page.getViewport({ scale: 1.5 });
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            canvas.width = vp.width;
            canvas.height = vp.height;
            canvas.style.width = `${vp.width}px`;
            canvas.style.height = `${vp.height}px`;
            setCanvasSize({ w: vp.width, h: vp.height });
            task = page.render({ canvasContext: ctx, viewport: vp });
            await task.promise;
        };
        render();
        return () => { if (task) task.cancel(); };
    }, [pdfDoc, pageNum, editMode]);

    // ── Enter edit mode — fetch current contract text ─────────────────────
    const enterEditMode = async () => {
        if (docMode === 'docx' && activeDocxDocumentId) {
            setLoadingEditText(true);
            try {
                const viewRes = await fetch(`/api/documents/${activeDocxDocumentId}/view`, {
                    headers: getAuthHeaders()
                });
                if (viewRes.ok) {
                    const viewData = await viewRes.json();
                    setDocxViewData(viewData);
                    if (viewData?.render_mode === 'html') {
                        setEditDocxHtml(viewData.content || '');
                    } else {
                        setEditDocxHtml('');
                    }
                    setEditDocxParagraphs([]);
                }
            } finally {
                setLoadingEditText(false);
                setIsAnnotating(false);
                setDraftAnnotation(null);
                setEditMode(true);
            }
            return;
        }

        setLoadingEditText(true);
        try {
            const res = await fetch(`/api/contracts/${contractId}/editor-content`, {
                headers: getAuthHeaders()
            });
            if (res.ok) {
                const data = await res.json();
                setEditText(data.content || '');
            } else {
                setEditText('Unable to load document text. Please type your edited content here.');
            }
        } catch (e) {
            setEditText('');
        } finally {
            setLoadingEditText(false);
            setIsAnnotating(false);
            setDraftAnnotation(null);
            setEditMode(true);
        }
    };

    // ── Save edits — generate DOCX ──────────────────────────────────────────
    const saveEdit = async () => {
        setSavingEdit(true);
        const contentToSave = docMode === 'docx'
            ? (editDocxHtml || docxViewData?.content || '')
            : editText;
        if (docMode === 'docx' && !contentToSave.trim()) {
            alert('The DOCX editor is still loading. Please wait a moment and try saving again.');
            setSavingEdit(false);
            return;
        }
        try {
            const res = await fetch(`/api/contracts/${contractId}/save-editor-content`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify({
                    content: contentToSave,
                    paragraph_texts: docMode === 'docx' ? editDocxParagraphs : undefined,
                    base_document_id: docMode === 'docx' ? activeDocxDocumentId : undefined,
                    user: user?.email || 'User'
                })
            });
            if (res.ok) {
                const result = await res.json();
                setSaveSuccess(result.docx_generated !== false);
                setSaveMessage(result.message || 'Document saved.');
                setTimeout(() => setSaveSuccess(false), 3000);
                setEditMode(false);
                if (result.document_id) {
                    setActiveDocxDocumentId(result.document_id);
                    const viewRes = await fetch(`/api/documents/${result.document_id}/view`, {
                        headers: getAuthHeaders()
                    });
                    if (viewRes.ok) {
                        const viewData = await viewRes.json();
                        if (viewData?.type === 'docx') {
                            setDocMode('docx');
                            setDocxViewData(viewData);
                            await loadPinnedAnnotations('docx', result.document_id);
                        }
                    }
                }
                if (!result.docx_generated) {
                    setTimeout(() => alert('Text saved, but DOCX generation failed. Please check backend logs.'), 500);
                }
            } else {
                const err = await res.json().catch(() => ({}));
                alert(`Failed to save: ${err.detail || 'Unknown error'}`);
            }
        } catch (e) {
            alert('Error saving edits. Please check your connection.');
        } finally {
            setSavingEdit(false);
        }
    };


    // ── Click handler ───────────────────────────────────────────────────────
    const handleDocumentClick = useCallback((e) => {
        if (!isAnnotating || readOnly) return;

        if (docMode === 'pdf') {
            if (!canvasRef.current) return;
            const canvas = canvasRef.current;
            const rect = canvas.getBoundingClientRect();
            const px = e.clientX - rect.left;
            const py = e.clientY - rect.top;
            const x = Math.max(0, Math.min(1, px / canvas.width));
            const y = Math.max(0, Math.min(1, py / canvas.height));
            setDraftAnnotation({ x, y, px, py, page: pageNum });
        } else if (docMode === 'docx') {
            if (!docxWrapperRef.current) return;
            const rect = docxWrapperRef.current.getBoundingClientRect();
            const px = e.clientX - rect.left;
            const py = e.clientY - rect.top;
            const x = Math.max(0, Math.min(1, px / Math.max(rect.width, 1)));
            const y = Math.max(0, Math.min(1, py / Math.max(rect.height, 1)));
            setDraftAnnotation({ x, y, px, py, page: 1 });
        } else {
            return;
        }
        setCommentText('');
        setActivePin(null);
    }, [isAnnotating, readOnly, pageNum, docMode]);

    // ── Save annotation ─────────────────────────────────────────────────────
    const submitAnnotation = async () => {
        if (!commentText.trim() || !draftAnnotation) return;
        const payload = {
            page: docMode === 'pdf' ? pageNum : 1,
            x: draftAnnotation.x,
            y: draftAnnotation.y,
            text: commentText,
            author: user?.name || user?.email || 'Reviewer',
            role: user?.role || 'User',
            color: selectedColor,
            doc_type: docMode === 'docx' ? 'docx' : 'pdf',
            document_id: docMode === 'docx' ? activeDocxDocumentId : undefined
        };
        try {
            const res = await fetch(`/api/contracts/${contractId}/pdf-annotations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                const saved = await res.json();
                setAnnotations(prev => [...prev, saved]);
                setDraftAnnotation(null);
                setCommentText('');
                setIsAnnotating(false);
            }
        } catch (e) {
            console.error('Save annotation failed', e);
        }
    };

    // ── Delete annotation ───────────────────────────────────────────────────
    const deleteAnnotation = async (annId) => {
        try {
            const res = await fetch(`/api/contracts/${contractId}/pdf-annotations/${annId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            if (res.ok) {
                setAnnotations(prev => prev.filter(a => (a._id || a.id) !== annId));
                if (activePin === annId) setActivePin(null);
            }
        } catch (e) {
            console.error('Delete annotation failed', e);
        }
    };

    const pinStyle = (ann, size = canvasSize) => ({
        position: 'absolute',
        left: `${ann.x * size.w}px`,
        top: `${ann.y * size.h}px`,
        transform: 'translate(-12px, -24px)',
        cursor: 'pointer',
        zIndex: 10,
        color: ann.color || '#f59e0b',
        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
        width: 24, height: 24,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
    });

    const currentPageAnnotations = annotations.filter(a => (docMode === 'pdf' ? a.page === pageNum : true));

    useEffect(() => {
        if (docMode !== 'docx' || editMode) return;
        const el = docxWrapperRef.current;
        if (!el) return;
        const update = () => {
            const rect = el.getBoundingClientRect();
            setDocxSize({ w: rect.width, h: rect.height });
        };
        update();
        const ro = new ResizeObserver(update);
        ro.observe(el);
        return () => ro.disconnect();
    }, [docMode, editMode, docxViewData]);

    return (
        <div className={styles.overlay} onClick={(e) => {
            if (e.target === e.currentTarget && onClose) onClose();
        }}>
            <div className={styles.viewerContainer}>

                {/* ────────────────── Toolbar ────────────────── */}
                <div className={styles.toolbar}>
                    <div className={styles.toolbarLeft}>
                        <div className={styles.title}>
                            {editMode ? '✏️ Edit Document' : (docMode === 'docx' ? 'DOCX Document Review' : 'PDF Document Review')}
                        </div>
                        {!editMode && docMode === 'pdf' && (
                            <>
                                <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                                    Page {pageNum} of {pageCount}
                                </div>
                                <div style={{ display: 'flex', gap: '8px', marginLeft: '8px' }}>
                                    <button className={styles.btn} onClick={() => setPageNum(p => Math.max(1, p - 1))} disabled={pageNum === 1}>Prev</button>
                                    <button className={styles.btn} onClick={() => setPageNum(p => Math.min(pageCount, p + 1))} disabled={pageNum === pageCount}>Next</button>
                                </div>
                            </>
                        )}
                    </div>

                    <div className={styles.toolbarRight}>
                        {/* Edit toggle — available to non-readOnly roles */}
                        {!readOnly && !editMode && (
                            <button
                                className={styles.btn}
                                style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.4)' }}
                                onClick={enterEditMode}
                                title="Edit document text and save as DOCX"
                            >
                                ✏️ Edit Document
                            </button>
                        )}

                        {editMode && (
                            <>
                                <button
                                    className={styles.btn}
                                    style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}
                                    onClick={() => setEditMode(false)}
                                >
                                    ✕ Cancel Edit
                                </button>
                                <button
                                    className={styles.btn}
                                    style={{
                                        background: savingEdit ? '#334155' : '#10b981',
                                        color: 'white', border: 'none', fontWeight: 'bold'
                                    }}
                                onClick={saveEdit}
                                disabled={savingEdit}
                            >
                                    {savingEdit ? '⏳ Saving...' : '💾 Save as DOCX'}
                                </button>
                            </>
                        )}

                        {!editMode && !readOnly && (docMode === 'pdf' || docMode === 'docx') && (
                            <button
                                className={`${styles.btn} ${isAnnotating ? styles.btnActive : ''}`}
                                onClick={() => { setIsAnnotating(!isAnnotating); setDraftAnnotation(null); }}
                                title={isAnnotating ? 'Click anywhere on the document to place a comment pin' : 'Enable comment mode'}
                            >
                                {isAnnotating ? '📌 Click to place pin' : '💬 Add Comment'}
                            </button>
                        )}

                        {actionLabel && onAction && !editMode && (
                            <button
                                className={styles.btn}
                                style={{ background: '#10b981', color: 'white', border: 'none', fontWeight: 'bold' }}
                                onClick={onAction}
                            >
                                {actionLabel}
                            </button>
                        )}
                        <button className={styles.btnClose} onClick={onClose}>Close ✕</button>
                    </div>
                </div>

                {/* ── Save success toast ── */}
                {saveSuccess && (
                    <div style={{
                        position: 'absolute', top: '70px', left: '50%', transform: 'translateX(-50%)',
                        background: '#10b981', color: 'white', padding: '10px 24px',
                        borderRadius: '8px', fontWeight: '700', zIndex: 9999, fontSize: '13px',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.4)'
                    }}>
                        ✓ {saveMessage || 'Document saved — DOCX generated.'}
                    </div>
                )}

                {/* ────────────────── Main Content ────────────────── */}
                <div className={styles.mainContent}>

                    {/* ── PDF / Edit Area ── */}
                    <div className={styles.pdfArea}>
                        {/* ── EDIT MODE: rich textarea ── */}
                        {editMode && (
                            <div style={{ width: '100%', maxWidth: '820px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {loadingEditText ? (
                                    <div style={{
                                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                                        justifyContent: 'center', padding: '60px',
                                        color: '#94a3b8', gap: '16px'
                                    }}>
                                        <div style={{
                                            width: '36px', height: '36px', border: '3px solid #334155',
                                            borderTopColor: '#00C9B1', borderRadius: '50%',
                                            animation: 'spin 0.8s linear infinite'
                                        }} />
                                        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                                        <span>Loading document content...</span>
                                    </div>
                                ) : docMode === 'docx' ? (
                                    <>
                                        <div style={{
                                            background: 'rgba(139,92,246,0.08)',
                                            border: '1px solid rgba(139,92,246,0.3)',
                                            borderRadius: '8px', padding: '10px 16px',
                                            color: '#a78bfa', fontSize: '13px',
                                            display: 'flex', alignItems: 'center', gap: '8px'
                                        }}>
                                            ✏️ <span><strong>Edit Mode:</strong> Preserve structure while editing the document directly. Numbering, indentation, and list hierarchy stay intact.</span>
                                        </div>
                                        <DocxRenderer
                                            viewData={docxViewData}
                                            editable={true}
                                            onHtmlChange={(payload) => {
                                                if (typeof payload === 'string') {
                                                    setEditDocxHtml(payload);
                                                    setEditDocxParagraphs([]);
                                                    return;
                                                }
                                                setEditDocxHtml(payload?.html || '');
                                                setEditDocxParagraphs(Array.isArray(payload?.paragraph_texts) ? payload.paragraph_texts : []);
                                            }}
                                        />
                                    </>
                                ) : (
                                    <>
                                        <div style={{
                                            background: 'rgba(139,92,246,0.08)',
                                            border: '1px solid rgba(139,92,246,0.3)',
                                            borderRadius: '8px', padding: '10px 16px',
                                            color: '#a78bfa', fontSize: '13px',
                                            display: 'flex', alignItems: 'center', gap: '8px'
                                        }}>
                                            ✏️ <span><strong>Edit Mode:</strong> The contract text is loaded below. Make your changes directly, then click <strong>"Save as DOCX"</strong> to generate an updated DOCX while preserving layout.</span>
                                        </div>
                                        <div style={{
                                            background: 'white',
                                            borderRadius: '4px',
                                            boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
                                            border: '2px solid rgba(139,92,246,0.4)',
                                            overflow: 'hidden'
                                        }}>
                                            <textarea
                                                value={editText}
                                                onChange={e => setEditText(e.target.value)}
                                                spellCheck={true}
                                                style={{
                                                    width: '100%',
                                                    minHeight: 'calc(95vh - 220px)',
                                                    background: 'white',
                                                    color: '#111827',
                                                    border: 'none',
                                                    padding: '48px 56px',
                                                    fontSize: '13.5px',
                                                    lineHeight: '1.8',
                                                    fontFamily: '"Times New Roman", Times, serif',
                                                    resize: 'none',
                                                    outline: 'none',
                                                    boxSizing: 'border-box',
                                                    display: 'block',
                                                }}
                                            />
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#64748b', textAlign: 'right' }}>
                                            {editText.split(' ').filter(Boolean).length} words &nbsp;·&nbsp; {editText.length} characters
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* ── VIEW MODE: canvas PDF ── */}
                        {!editMode && docMode === 'docx' && (
                            <div
                                ref={docxWrapperRef}
                                style={{
                                    position: 'relative',
                                    width: '100%',
                                    maxWidth: '920px',
                                    cursor: isAnnotating ? 'crosshair' : 'default'
                                }}
                                onClick={handleDocumentClick}
                            >
                                <DocxRenderer viewData={docxViewData} />
                                {currentPageAnnotations.map(ann => {
                                    const id = ann._id || ann.id;
                                    const isActive = activePin === id;
                                    return (
                                        <div key={id} style={pinStyle(ann, docxSize)}
                                            onClick={(e) => { e.stopPropagation(); setActivePin(isActive ? null : id); }}
                                        >
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="white" strokeWidth="1.5">
                                                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                                            </svg>
                                            {isActive && (
                                                <div onClick={e => e.stopPropagation()} style={{
                                                    position: 'absolute',
                                                    bottom: '28px', left: '50%',
                                                    transform: 'translateX(-50%)',
                                                    background: '#1e293b',
                                                    border: `2px solid ${ann.color || '#f59e0b'}`,
                                                    borderRadius: '8px', padding: '10px 12px',
                                                    width: '230px', boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                                                    zIndex: 100, color: 'white', fontSize: '13px',
                                                }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                                        <strong style={{ color: ann.color || '#f59e0b' }}>{ann.author}</strong>
                                                        <span style={{ color: '#94a3b8', fontSize: '11px' }}>DOCX</span>
                                                    </div>
                                                    <div style={{ lineHeight: '1.4', marginBottom: '8px' }}>{ann.text}</div>
                                                    {!readOnly && (
                                                        <button onClick={() => deleteAnnotation(id)} style={{
                                                            background: 'rgba(239,68,68,0.15)',
                                                            border: '1px solid rgba(239,68,68,0.4)',
                                                            color: '#ef4444', borderRadius: '4px',
                                                            padding: '3px 10px', fontSize: '11px',
                                                            cursor: 'pointer', fontWeight: '600'
                                                        }}>
                                                            Delete
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                                {draftAnnotation && (
                                    <>
                                        <div style={{
                                            ...pinStyle({ x: draftAnnotation.x, y: draftAnnotation.y, color: selectedColor }, docxSize),
                                            pointerEvents: 'none', opacity: 0.8,
                                        }}>
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="white" strokeWidth="1.5">
                                                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                                            </svg>
                                        </div>
                                        <div onClick={e => e.stopPropagation()} style={{
                                            position: 'absolute',
                                            left: draftAnnotation.x > 0.6
                                                ? `${draftAnnotation.x * docxSize.w - 250}px`
                                                : `${draftAnnotation.x * docxSize.w + 16}px`,
                                            top: draftAnnotation.y > 0.75
                                                ? `${draftAnnotation.y * docxSize.h - 160}px`
                                                : `${draftAnnotation.y * docxSize.h}px`,
                                            background: '#1e293b',
                                            border: `2px solid ${selectedColor}`,
                                            borderRadius: '10px', padding: '12px',
                                            width: '240px',
                                            boxShadow: '0 8px 30px rgba(0,0,0,0.7)', zIndex: 200,
                                        }}>
                                            <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px', fontWeight: '600' }}>Add Comment</div>
                                            <textarea
                                                autoFocus
                                                placeholder="Type your comment here..."
                                                value={commentText}
                                                onChange={e => setCommentText(e.target.value)}
                                                style={{
                                                    width: '100%', background: '#0f172a',
                                                    border: '1px solid #334155', borderRadius: '6px',
                                                    color: '#fff', padding: '8px', fontSize: '13px',
                                                    resize: 'none', height: '70px', marginBottom: '8px',
                                                    fontFamily: 'inherit', boxSizing: 'border-box',
                                                }}
                                            />
                                            <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                                                {COLORS.map(c => (
                                                    <div key={c} onClick={() => setSelectedColor(c)} style={{
                                                        width: 16, height: 16, borderRadius: '50%', background: c,
                                                        cursor: 'pointer',
                                                        border: selectedColor === c ? '2px solid white' : '2px solid transparent',
                                                    }} />
                                                ))}
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button onClick={() => setDraftAnnotation(null)} style={{
                                                    flex: 1, padding: '5px', background: 'transparent',
                                                    border: '1px solid #334155', color: '#94a3b8',
                                                    borderRadius: '5px', cursor: 'pointer', fontSize: '12px'
                                                }}>Cancel</button>
                                                <button onClick={submitAnnotation} disabled={!commentText.trim()} style={{
                                                    flex: 1, padding: '5px',
                                                    background: commentText.trim() ? selectedColor : '#334155',
                                                    border: 'none', color: 'white', borderRadius: '5px',
                                                    cursor: commentText.trim() ? 'pointer' : 'not-allowed',
                                                    fontSize: '12px', fontWeight: '700'
                                                }}>Save</button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {!editMode && docMode === 'pdf' && (
                            <>
                                {loading && <div style={{ color: 'white', padding: '40px' }}>Loading PDF...</div>}
                                {error && <div style={{ color: '#ef4444', padding: '40px' }}>{error}</div>}

                                <div
                                    ref={wrapperRef}
                                    style={{
                                        position: 'relative',
                                        width: canvasSize.w > 0 ? `${canvasSize.w}px` : 'auto',
                                        height: canvasSize.h > 0 ? `${canvasSize.h}px` : 'auto',
                                        boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
                                        background: 'white',
                                        cursor: isAnnotating ? 'crosshair' : 'default',
                                    }}
                                    onClick={handleDocumentClick}
                                >
                                    <canvas ref={canvasRef} style={{ display: 'block', userSelect: 'none' }} />

                                    {/* Existing annotation pins */}
                                    {currentPageAnnotations.map(ann => {
                                        const id = ann._id || ann.id;
                                        const isActive = activePin === id;
                                        return (
                                            <div key={id} style={pinStyle(ann)}
                                                onClick={(e) => { e.stopPropagation(); setActivePin(isActive ? null : id); }}
                                            >
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="white" strokeWidth="1.5">
                                                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                                                </svg>

                                                {isActive && (
                                                    <div onClick={e => e.stopPropagation()} style={{
                                                        position: 'absolute',
                                                        bottom: '28px', left: '50%',
                                                        transform: 'translateX(-50%)',
                                                        background: '#1e293b',
                                                        border: `2px solid ${ann.color || '#f59e0b'}`,
                                                        borderRadius: '8px', padding: '10px 12px',
                                                        width: '230px', boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                                                        zIndex: 100, color: 'white', fontSize: '13px',
                                                    }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                                            <strong style={{ color: ann.color || '#f59e0b' }}>{ann.author}</strong>
                                                            <span style={{ color: '#94a3b8', fontSize: '11px' }}>{ann.role} · Pg {ann.page}</span>
                                                        </div>
                                                        <div style={{ lineHeight: '1.4', marginBottom: '8px' }}>{ann.text}</div>
                                                        {!readOnly && (
                                                            <button onClick={() => deleteAnnotation(id)} style={{
                                                                background: 'rgba(239,68,68,0.15)',
                                                                border: '1px solid rgba(239,68,68,0.4)',
                                                                color: '#ef4444', borderRadius: '4px',
                                                                padding: '3px 10px', fontSize: '11px',
                                                                cursor: 'pointer', fontWeight: '600'
                                                            }}>
                                                                🗑 Delete
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}

                                    {/* Draft pin + comment input */}
                                    {draftAnnotation && (
                                        <>
                                            <div style={{
                                                ...pinStyle({ x: draftAnnotation.x, y: draftAnnotation.y, color: selectedColor }),
                                                pointerEvents: 'none', opacity: 0.8,
                                            }}>
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="white" strokeWidth="1.5">
                                                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                                                </svg>
                                            </div>

                                            <div onClick={e => e.stopPropagation()} style={{
                                                position: 'absolute',
                                                left: draftAnnotation.x > 0.6
                                                    ? `${draftAnnotation.x * canvasSize.w - 250}px`
                                                    : `${draftAnnotation.x * canvasSize.w + 16}px`,
                                                top: draftAnnotation.y > 0.75
                                                    ? `${draftAnnotation.y * canvasSize.h - 160}px`
                                                    : `${draftAnnotation.y * canvasSize.h}px`,
                                                background: '#1e293b',
                                                border: `2px solid ${selectedColor}`,
                                                borderRadius: '10px', padding: '12px',
                                                width: '240px',
                                                boxShadow: '0 8px 30px rgba(0,0,0,0.7)', zIndex: 200,
                                            }}>
                                                <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px', fontWeight: '600' }}>
                                                    Add Comment
                                                </div>
                                                <textarea
                                                    autoFocus
                                                    placeholder="Type your comment here..."
                                                    value={commentText}
                                                    onChange={e => setCommentText(e.target.value)}
                                                    onKeyDown={e => {
                                                        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submitAnnotation();
                                                        if (e.key === 'Escape') setDraftAnnotation(null);
                                                    }}
                                                    style={{
                                                        width: '100%', background: '#0f172a',
                                                        border: '1px solid #334155', borderRadius: '6px',
                                                        color: '#fff', padding: '8px', fontSize: '13px',
                                                        resize: 'none', height: '70px', marginBottom: '8px',
                                                        fontFamily: 'inherit', boxSizing: 'border-box',
                                                    }}
                                                />
                                                <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                                                    {COLORS.map(c => (
                                                        <div key={c} onClick={() => setSelectedColor(c)} style={{
                                                            width: 16, height: 16, borderRadius: '50%', background: c,
                                                            cursor: 'pointer',
                                                            border: selectedColor === c ? '2px solid white' : '2px solid transparent',
                                                        }} />
                                                    ))}
                                                </div>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button onClick={() => setDraftAnnotation(null)} style={{
                                                        flex: 1, padding: '5px', background: 'transparent',
                                                        border: '1px solid #334155', color: '#94a3b8',
                                                        borderRadius: '5px', cursor: 'pointer', fontSize: '12px'
                                                    }}>Cancel</button>
                                                    <button onClick={submitAnnotation} disabled={!commentText.trim()} style={{
                                                        flex: 1, padding: '5px',
                                                        background: commentText.trim() ? selectedColor : '#334155',
                                                        border: 'none', color: 'white', borderRadius: '5px',
                                                        cursor: commentText.trim() ? 'pointer' : 'not-allowed',
                                                        fontSize: '12px', fontWeight: '700'
                                                    }}>Save</button>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    {/* ── Sidebar ── */}
                    {!editMode && (
                        <div className={styles.sidebar}>
                            <div className={styles.sidebarHeader}>
                                💬 Pinned Comments ({annotations.length}) {docMode === 'docx' ? '• DOCX' : ''}
                            </div>
                            <div className={styles.commentsList}>
                                {annotations.length === 0 ? (
                                    <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '6px', fontSize: '13px' }}>
                                        No pinned comments added yet.
                                    </div>
                                ) : (
                                    annotations.map(ann => {
                                        const id = ann._id || ann.id;
                                        const isOnPage = docMode === 'pdf' ? ann.page === pageNum : true;
                                        return (
                                            <div
                                                key={id}
                                                className={styles.commentCard}
                                                style={{
                                                    borderLeftColor: ann.color || '#f59e0b',
                                                    opacity: isOnPage ? 1 : 0.5,
                                                    cursor: 'pointer',
                                                    transition: 'all 0.15s',
                                                }}
                                                onClick={() => {
                                                    if (docMode === 'pdf' && !isOnPage) setPageNum(ann.page);
                                                    else setActivePin(activePin === id ? null : id);
                                                }}
                                            >
                                                <div className={styles.commentHeader}>
                                                    <div>
                                                        <span className={styles.commentAuthor}>{ann.author}</span>
                                                        <span className={styles.commentRole}>{ann.role}</span>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <span className={styles.commentTime}>{docMode === 'pdf' ? `Pg ${ann.page}` : 'DOCX'}</span>
                                                        {!readOnly && (
                                                            <button
                                                                title="Delete comment"
                                                                onClick={(e) => { e.stopPropagation(); deleteAnnotation(id); }}
                                                                style={{
                                                                    background: 'none', border: 'none',
                                                                    color: '#ef4444', cursor: 'pointer',
                                                                    fontSize: '16px', padding: '0 2px', lineHeight: 1
                                                                }}
                                                            >×</button>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className={styles.commentText}>{ann.text}</div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PdfAnnotationViewer;
