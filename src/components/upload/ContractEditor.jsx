import React, { useState, useEffect, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import FontFamily from '@tiptap/extension-font-family';
import { Save, X, RotateCcw, FileText, CheckCircle } from 'lucide-react';
import styles from './ContractEditor.module.css';
import { contractService } from '../../services/contractService';

// ─── Toolbar Button ────────────────────────────────────────────────
const ToolBtn = ({ onClick, active, title, children }) => (
    <button
        type="button"
        title={title}
        onMouseDown={(e) => { e.preventDefault(); onClick(); }}
        className={`${styles.toolBtn} ${active ? styles.toolBtnActive : ''}`}
    >
        {children}
    </button>
);

// ─── Menu Bar ──────────────────────────────────────────────────────
const MenuBar = ({ editor }) => {
    if (!editor) return null;

    return (
        <div className={styles.menuBar}>
            {/* Undo / Redo */}
            <div className={styles.toolGroup}>
                <ToolBtn title="Undo (Ctrl+Z)" onClick={() => editor.chain().focus().undo().run()}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13"/></svg>
                </ToolBtn>
                <ToolBtn title="Redo (Ctrl+Y)" onClick={() => editor.chain().focus().redo().run()}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 019-9 9 9 0 016 2.3L21 13"/></svg>
                </ToolBtn>
            </div>

            <div className={styles.sep} />

            {/* Heading Selector */}
            <div className={styles.toolGroup}>
                <select
                    className={styles.headingSelect}
                    value={
                        editor.isActive('heading', { level: 1 }) ? 'h1' :
                        editor.isActive('heading', { level: 2 }) ? 'h2' :
                        editor.isActive('heading', { level: 3 }) ? 'h3' : 'p'
                    }
                    onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'p') editor.chain().focus().setParagraph().run();
                        else editor.chain().focus().toggleHeading({ level: parseInt(val[1]) }).run();
                    }}
                >
                    <option value="p">Paragraph</option>
                    <option value="h1">Heading 1</option>
                    <option value="h2">Heading 2</option>
                    <option value="h3">Heading 3</option>
                </select>
            </div>

            <div className={styles.sep} />

            {/* Font Family */}
            <div className={styles.toolGroup}>
                <select
                    className={styles.headingSelect}
                    onChange={(e) => editor.chain().focus().setFontFamily(e.target.value).run()}
                    defaultValue=""
                >
                    <option value="">Font</option>
                    <option value="Arial, sans-serif">Arial</option>
                    <option value="'Times New Roman', serif">Times New Roman</option>
                    <option value="'Courier New', monospace">Courier New</option>
                    <option value="Georgia, serif">Georgia</option>
                    <option value="Verdana, sans-serif">Verdana</option>
                    <option value="Calibri, sans-serif">Calibri</option>
                </select>
            </div>

            <div className={styles.sep} />

            {/* Text Formatting */}
            <div className={styles.toolGroup}>
                <ToolBtn title="Bold (Ctrl+B)" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
                    <strong>B</strong>
                </ToolBtn>
                <ToolBtn title="Italic (Ctrl+I)" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
                    <em>I</em>
                </ToolBtn>
                <ToolBtn title="Underline (Ctrl+U)" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
                    <u>U</u>
                </ToolBtn>
                <ToolBtn title="Strikethrough" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>
                    <s>S</s>
                </ToolBtn>
                <ToolBtn title="Inline Code" active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()}>
                    {'</>'}
                </ToolBtn>
            </div>

            <div className={styles.sep} />

            {/* Text Color */}
            <div className={styles.toolGroup}>
                <label className={styles.colorLabel} title="Text Color">
                    <span className={styles.colorIcon}>A</span>
                    <input
                        type="color"
                        className={styles.colorInput}
                        onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
                        defaultValue="#e2e8f0"
                    />
                </label>
            </div>

            <div className={styles.sep} />

            {/* Alignment */}
            <div className={styles.toolGroup}>
                <ToolBtn title="Align Left" active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="21" y1="6" x2="3" y2="6"/><line x1="15" y1="12" x2="3" y2="12"/><line x1="17" y1="18" x2="3" y2="18"/></svg>
                </ToolBtn>
                <ToolBtn title="Align Center" active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="21" y1="6" x2="3" y2="6"/><line x1="18" y1="12" x2="6" y2="12"/><line x1="21" y1="18" x2="3" y2="18"/></svg>
                </ToolBtn>
                <ToolBtn title="Align Right" active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="12" x2="9" y2="12"/><line x1="21" y1="18" x2="7" y2="18"/></svg>
                </ToolBtn>
                <ToolBtn title="Justify" active={editor.isActive({ textAlign: 'justify' })} onClick={() => editor.chain().focus().setTextAlign('justify').run()}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="12" x2="3" y2="12"/><line x1="21" y1="18" x2="3" y2="18"/></svg>
                </ToolBtn>
            </div>

            <div className={styles.sep} />

            {/* Lists */}
            <div className={styles.toolGroup}>
                <ToolBtn title="Bullet List" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1" fill="currentColor"/><circle cx="4" cy="12" r="1" fill="currentColor"/><circle cx="4" cy="18" r="1" fill="currentColor"/></svg>
                </ToolBtn>
                <ToolBtn title="Numbered List" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4"/><path d="M4 10H6"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg>
                </ToolBtn>
                <ToolBtn title="Block Quote" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/></svg>
                </ToolBtn>
                <ToolBtn title="Divider" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </ToolBtn>
            </div>

            <div className={styles.sep} />

            {/* Clear formatting */}
            <div className={styles.toolGroup}>
                <ToolBtn title="Clear Formatting" onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
                </ToolBtn>
            </div>
        </div>
    );
};

// ─── ContractEditor ────────────────────────────────────────────────
const ContractEditor = ({ contract, onSave, onCancel }) => {
    const [saving, setSaving] = useState(false);
    const [originalContent, setOriginalContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
    };

    const editor = useEditor({
        extensions: [
            StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
            Underline,
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            TextStyle,
            Color,
            FontFamily,
        ],
        content: '',
        editorProps: {
            attributes: {
                class: styles.proseMirror,
                spellcheck: 'false',
            },
        },
    });

    useEffect(() => {
        const fetchContent = async () => {
            try {
                setLoading(true);
                const data = await contractService.getEditorContent(contract.id);
                const text = data.content || '';
                setOriginalContent(text);
                // Set content as plain text inside a paragraph
                if (editor) {
                    const html = text
                        .split('\n\n')
                        .map(para => {
                            if (!para.trim()) return '';
                            if (para.startsWith('# ')) return `<h1>${para.slice(2)}</h1>`;
                            if (para.startsWith('## ')) return `<h2>${para.slice(3)}</h2>`;
                            if (para.startsWith('### ')) return `<h3>${para.slice(4)}</h3>`;
                            return `<p>${para.replace(/\n/g, '<br/>')}</p>`;
                        })
                        .join('');
                    editor.commands.setContent(html || '<p></p>');
                }
            } catch (error) {
                showToast('Failed to load contract content', 'error');
            } finally {
                setLoading(false);
            }
        };
        if (editor) fetchContent();
    }, [contract.id, editor]);

    const handleSave = async () => {
        try {
            setSaving(true);
            const html = editor.getHTML();
            const result = await contractService.saveEditorContent(contract.id, html);
            setOriginalContent(html);
            showToast(result.message || 'Changes saved successfully!');
            if (onSave) onSave();
        } catch (error) {
            showToast('Failed to save changes', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        if (window.confirm('Revert all changes to the last saved version?')) {
            if (editor) editor.commands.setContent(originalContent);
        }
    };

    const hasChanges = editor ? editor.getHTML() !== originalContent : false;

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
                <p>Loading document content...</p>
            </div>
        );
    }

    return (
        <div className={styles.editorWrapper}>
            {/* Header */}
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
                            <><div className={styles.miniSpinner}></div> Saving...</>
                        ) : (
                            <><Save size={16} /> Save New Version</>
                        )}
                    </button>
                </div>
            </div>

            {/* Status bar */}
            <div className={styles.statusBar}>
                <span className={styles.toolbarLabel}>Editor View</span>
                <div className={styles.badge}>Live Sync Enabled</div>
                {hasChanges ? (
                    <div className={styles.unsavedBadge}>● Unsaved Changes</div>
                ) : (
                    <div className={styles.savedBadge}>✓ All changes saved</div>
                )}
            </div>

            {/* Toolbar */}
            <MenuBar editor={editor} />

            {/* Editor area */}
            <div className={styles.editorArea}>
                <div className={styles.pageCard}>
                    <EditorContent editor={editor} />
                </div>
            </div>

            {toast.show && (
                <div className={`${styles.toast} ${styles[toast.type]}`}>
                    {toast.type === 'success' ? <CheckCircle size={18} /> : <span>⚠️</span>}
                    {toast.message}
                </div>
            )}
        </div>
    );
};

export default ContractEditor;
