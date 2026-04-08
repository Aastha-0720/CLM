import React, { useEffect, useRef, useState } from 'react';
import { renderAsync } from 'docx-preview';
import { getAuthHeaders } from '../../services/authHelper';
import styles from './DocxRenderer.module.css';

const DocxRenderer = ({ viewData, editable = false, onHtmlChange }) => {
    const containerRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const emitContent = () => {
        if (!editable || !onHtmlChange || !containerRef.current) return;
        const root = containerRef.current;
        let paragraphNodes = Array.from(root.querySelectorAll('.docx p'));
        if (!paragraphNodes.length) {
            paragraphNodes = Array.from(root.querySelectorAll('p, li, h1, h2, h3, h4, h5, h6, div'));
        }
        const paragraphTexts = paragraphNodes.map((node) =>
            (node.innerText || node.textContent || '')
                .replace(/\u00a0/g, ' ')
                .replace(/\r/g, '')
        );
        onHtmlChange({
            html: root.innerHTML,
            paragraph_texts: paragraphTexts
        });
    };

    useEffect(() => {
        let cancelled = false;

        const renderDocxBinary = async () => {
            const container = containerRef.current;
            if (!container || !viewData?.url) return;
            setLoading(true);
            setError('');
            container.innerHTML = '';
            try {
                const res = await fetch(viewData.url, { headers: getAuthHeaders() });
                if (!res.ok) {
                    throw new Error(`Failed to fetch DOCX (${res.status})`);
                }
                const arrayBuffer = await res.arrayBuffer();
                if (cancelled) return;

                await renderAsync(arrayBuffer, container, undefined, {
                    className: 'docx',
                    inWrapper: true,
                    ignoreWidth: false,
                    ignoreHeight: false,
                    breakPages: true,
                    useBase64URL: true,
                    renderHeaders: true,
                    renderFooters: true,
                    renderFootnotes: true,
                    renderEndnotes: true,
                    renderComments: false,
                    renderChanges: false,
                });

                if (!cancelled) {
                    emitContent();
                }
            } catch (e) {
                if (!cancelled) {
                    setError('Unable to render DOCX preview.');
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        if (viewData?.render_mode === 'docx-preview') {
            renderDocxBinary();
        }

        return () => {
            cancelled = true;
        };
    }, [viewData?.render_mode, viewData?.url]);

    useEffect(() => {
        if (viewData?.render_mode !== 'html') return;
        const container = containerRef.current;
        if (!container) return;

        container.innerHTML = viewData?.content || '<p>No DOCX content available.</p>';
        emitContent();
    }, [viewData?.render_mode, viewData?.content]);

    const handleInput = () => {
        emitContent();
    };

    return (
        <div className={styles.paper}>
            {loading && <div className={styles.loading}>Rendering DOCX...</div>}
            {error && <div className={styles.error}>{error}</div>}
            <div
                ref={containerRef}
                className={styles.docxHost}
                contentEditable={editable}
                suppressContentEditableWarning={true}
                onInput={handleInput}
            />
        </div>
    );
};

export default DocxRenderer;
