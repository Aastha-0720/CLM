import os
import re

components = [
    "LegalReview.jsx",
    "FinanceReview.jsx",
    "ComplianceReview.jsx",
    "ProcurementReview.jsx"
]

dept_map = {
    "LegalReview.jsx": "Legal",
    "FinanceReview.jsx": "Finance",
    "ComplianceReview.jsx": "Compliance",
    "ProcurementReview.jsx": "Procurement"
}

def fix_file(file_path, dept):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. CLAUSE_DEPT_MAP at top
    if "const CLAUSE_DEPT_MAP =" not in content:
        import_match = re.search(r'import .+?;', content)
        if import_match:
            insert_pos = import_match.end()
            map_str = """

const CLAUSE_DEPT_MAP = {
    Legal: ['liability', 'indemnity', 'termination', 'dispute', 'intellectual', 'governing law'],
    Finance: ['payment', 'invoice', 'penalty', 'price', 'cost', 'fee', 'financial'],
    Compliance: ['gdpr', 'regulatory', 'compliance', 'data protection', 'audit', 'privacy'],
    Procurement: ['vendor', 'supplier', 'delivery', 'sla', 'procurement', 'purchase']
};
"""
            content = content[:insert_pos] + map_str + content[insert_pos:]

    # 2. State variables
    state_to_remove = r"const \[reviewMode, setReviewMode\] = useState\('sequential'\);.*?;"
    content = re.sub(state_to_remove, "", content)
    
    if "const [redlineModal, setRedlineModal]" not in content:
        toast_state = "const [toast, setToast] = useState(null);"
        new_states = f"""{toast_state}
    const [redlineModal, setRedlineModal] = useState(null);
    const [redlineLoading, setRedlineLoading] = useState(false);
    const [changeRequests, setChangeRequests] = useState([]);
    const [crForm, setCrForm] = useState({{ description: '', clauseId: '' }});
    const [crLoading, setCrLoading] = useState(false);
"""
        content = content.replace(toast_state, new_states)

    # 3. isPrevApproved
    old_is_prev = r"const isPrevApproved = \(contract\) => \{.*?return contract\?\.reviews\?\.\[prevDept\]\?\.status === 'Approved';\n    \};"
    new_is_prev = f"""const isPrevApproved = (contract) => {{
        if (!contract) return false;
        if (contract.review_mode === 'parallel') return true;
        const stages = contract.review_stages || contract.required_reviewers || ['Legal', 'Finance', 'Compliance', 'Procurement'];
        const myIndex = stages.indexOf('{dept}');
        if (myIndex <= 0) return true;
        const prevDept = stages[myIndex - 1];
        return contract?.reviews?.[prevDept]?.status === 'Approved';
    }};"""
    content = re.sub(old_is_prev, new_is_prev, content, flags=re.DOTALL)

    # 4. loadData filter
    old_filter = r"const filtered = data\.filter\(c => \{.*?return current_stage\.includes.*?\n.*?\n            \}\);"
    new_filter = f"""const filtered = data.filter(c => {{
                const stages = c.review_stages || ['Legal', 'Finance', 'Compliance', 'Procurement'];
                return stages.includes('{dept}');
            }});"""
    content = re.sub(old_filter, new_filter, content, flags=re.DOTALL)

    # 5. Review Mode Delete
    review_mode_dropdown = r"<div className=\{styles\.filterGroup\}>\s*<label className=\{styles\.filterLabel\}>Review Mode</label>\s*<select.*?<\/div>"
    content = re.sub(review_mode_dropdown, "", content, flags=re.DOTALL)

    # 6. openReview load change requests
    if "const crs = await contractService.fetchChangeRequests(contract.id);" not in content:
        open_review = r"loadComments\(contract\.id\);\n    \};"
        new_open_review = r"loadComments(contract.id);\n        const crs = await contractService.fetchChangeRequests(contract.id);\n        setChangeRequests(crs || []);\n    };"
        content = re.sub(open_review, new_open_review, content)

    # 7. wordDiff and handlers
    if "const wordDiff = " not in content:
        handlers = f"""
    const wordDiff = (original, revised) => {{
        const origWords = (original || '').split(' ');
        const revWords = (revised || '').split(' ');
        const result = [];
        let i = 0, j = 0;
        while (i < origWords.length || j < revWords.length) {{
            if (i < origWords.length && j < revWords.length && origWords[i] === revWords[j]) {{
                result.push({{ type: 'same', word: origWords[i] }});
                i++; j++;
            }} else if (j < revWords.length && (i >= origWords.length || !origWords.includes(revWords[j]))) {{
                result.push({{ type: 'added', word: revWords[j] }});
                j++;
            }} else {{
                result.push({{ type: 'removed', word: origWords[i] }});
                i++;
            }}
        }}
        return result;
    }};

    const handleRedline = async (clause) => {{
        setRedlineLoading(true);
        try {{
            const result = await contractService.redlineClause({{
                clause: clause.content,
                section: clause.title,
                issue: 'Review for risk',
                company: 'Our Company',
                role: 'Buyer',
                risk_tolerance: selectedContract.risk_classification || 'Medium',
                industry: 'General'
            }});
            setRedlineModal({{ clause, result }});
        }} catch (e) {{
            alert('Redline failed. Please try again.');
        }} finally {{
            setRedlineLoading(false);
        }}
    }};

    const handleAcceptRedline = () => {{
        if (!redlineModal) return;
        setClauses(prev => prev.map(c =>
            c.id === redlineModal.clause.id
                ? {{ ...c, content: redlineModal.result.redlinedClause, status: 'Reviewed' }}
                : c
        ));
        setRedlineModal(null);
    }};

    const handleSaveRedlineToContract = async () => {{
        handleAcceptRedline();
        const updatedClauses = clauses.map(c =>
            c.id === redlineModal?.clause.id
                ? {{ ...c, content: redlineModal.result.redlinedClause }}
                : c
        );
        try {{
            await contractService.updateContract(selectedContract.id, {{ clauses: updatedClauses }});
            setToast('Redline saved to contract');
            setTimeout(() => setToast(null), 3000);
        }} catch (e) {{
            alert('Failed to save to contract');
        }}
    }};

    const handleCreateCR = async () => {{
        if (!crForm.description.trim()) return;
        setCrLoading(true);
        try {{
            const newCR = await contractService.createChangeRequest(selectedContract.id, {{
                department: '{dept}',
                requestedBy: user?.name || 'Admin',
                clauseId: crForm.clauseId || null,
                description: crForm.description
            }});
            setChangeRequests(prev => [...prev, newCR]);
            setCrForm({{ description: '', clauseId: '' }});
        }} catch (e) {{
            alert('Failed to create change request');
        }} finally {{
            setCrLoading(false);
        }}
    }};

    const handleUpdateCR = async (crId, status) => {{
        const resolution = status === 'Resolved' ? 'Resolved by reviewer' : 'Rejected by reviewer';
        try {{
            const updated = await contractService.updateChangeRequest(crId, {{ status, resolution }});
            setChangeRequests(prev => prev.map(cr => cr._id === crId || cr.id === crId ? updated : cr));
        }} catch (e) {{
            alert('Failed to update change request');
        }}
    }};
"""
        # Insert before openReview
        open_rev_match = content.find("const openReview = ")
        content = content[:open_rev_match] + handlers + content[open_rev_match:]

    # 8. Add tabs
    if "Change Requests" not in content and "setActiveRightTab('ChangeRequests')" not in content:
        history_btn = r"<button[ \n]+className=\{\`\$\{styles\.tabBtn\} \$\{activeRightTab === 'Timeline' \? styles\.activeTab : ''\}\`\}[ \n]+onClick=\{\(\) => \{.+?loadTimeline\(selectedContract\.id\);\s*\}\}[ \n]+>[ \n]+History[ \n]+<\/button>"
        new_history_btn = """<button
                                            className={`${styles.tabBtn} ${activeRightTab === 'Timeline' ? styles.activeTab : ''}`}
                                            onClick={() => {
                                                setActiveRightTab('Timeline');
                                                loadTimeline(selectedContract.id);
                                            }}
                                        >
                                            History
                                        </button>
                                        <button
                                            className={`${styles.tabBtn} ${activeRightTab === 'ChangeRequests' ? styles.activeTab : ''}`}
                                            onClick={() => setActiveRightTab('ChangeRequests')}
                                        >
                                            Change Requests
                                        </button>"""
        content = re.sub(history_btn, new_history_btn, content, flags=re.DOTALL)

    # 9. Review Assignment in metadata Grid
    if "Review assignment" not in content:
        metadata_grid = r"(<div className=\{styles\.metadataGrid\}.+?<\/div>)"
        review_assignment = f"""
        \\1
<div style={{{{ marginBottom: '16px', marginTop: '16px', padding: '12px', background: 'var(--color-background-secondary)', borderRadius: '8px', border: '0.5px solid var(--color-border-tertiary)' }}}}>
    <div style={{{{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}}}>
        <div style={{{{ fontSize: '12px', fontWeight: '500', color: 'var(--color-text-secondary)' }}}}>Review assignment</div>
        {{selectedContract && (
            <span style={{{{
                padding: '3px 10px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '500',
                background: selectedContract.review_mode === 'parallel' ? '#EEEDFE' : '#E1F5EE',
                color: selectedContract.review_mode === 'parallel' ? '#534AB7' : '#0F6E56'
            }}}}>
                {{selectedContract.review_mode === 'parallel' ? 'Parallel Review' : 'Sequential Review'}}
            </span>
        )}}
    </div>
    <div style={{{{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}}}>
        {{(selectedContract.review_stages || ['Legal','Finance','Compliance','Procurement']).map(dept => (
            <span key={{dept}} style={{{{
                padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '500',
                background: 'var(--color-background-info)', color: 'var(--color-text-info)'
            }}}}>{{dept}}</span>
        )))}}
    </div>
    <div style={{{{ fontSize: '12px', color: 'var(--color-text-secondary)' }}}}>
        {{(selectedContract.clauses || [])
            .filter(cl => {{
                const text = (cl.title + ' ' + cl.content).toLowerCase();
                return CLAUSE_DEPT_MAP['{dept}'].some(kw => text.includes(kw));
            }})
            .map(cl => (
                <div key={{cl.id}} style={{{{ marginTop: '4px' }}}}>
                    • <strong>{{cl.title}}</strong> triggered this review
                </div>
            ))
        }}
        {{(selectedContract.clauses || []).filter(cl => {{
            const text = (cl.title + ' ' + cl.content).toLowerCase();
            return CLAUSE_DEPT_MAP['{dept}'].some(kw => text.includes(kw));
        }}).length === 0 && (
            <div style={{{{ color: 'var(--color-text-tertiary)' }}}}>All-department review (no specific clause match)</div>
        )}}
    </div>
</div>
"""
        content = re.sub(metadata_grid, review_assignment, content, count=1, flags=re.DOTALL)

    # 10. Redline button in clause footer
    if "Analyzing..." not in content:
        clause_footer = r"(<button\s+className=\{styles\.clauseActionBtn\}.+?<\/button>)"
        redline_button = """\\1
<button
    onClick={() => handleRedline(clause)}
    disabled={redlineLoading}
    style={{ fontSize: '12px', marginLeft: '6px', padding: '3px 10px', borderRadius: '6px', border: '0.5px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer' }}>
    {redlineLoading ? 'Analyzing...' : 'Redline'}
</button>"""
        content = re.sub(clause_footer, redline_button, content)

    # 11. Right pane conditional rendering (Change Requests)
    if "Change Request Tab Content" not in content and "Raise change request" not in content:
        # We find the `) : (` that splits `Review` and `Timeline`
        timeline_block = r"\)[ \n]+:[ \n]+\([ \n]+<div className=\{styles\.timelineContainer\}>.+?<\/div>[ \n]+\)"
        cr_content = f""") : activeRightTab === 'Timeline' ? (
                                    <div className={{styles.timelineContainer}}>
                                        <h4 className={{styles.sectionLabel}}>Activity Timeline</h4>
                                        <div className={{styles.timelineList}}>
                                            {{timeline.map((event, idx) => {{
                                                let dotType = 'review';
                                                if (event.action?.includes('created') || event.action?.includes('saved')) dotType = 'create';
                                                if (event.action?.includes('updated')) dotType = 'edit';
                                                
                                                return (
                                                    <div key={{event.id || idx}} className={{styles.timelineItem}}>
                                                        <div className={{`${{styles.timelineDot}} ${{styles['dot' + dotType]}}`}}></div>
                                                        {{idx !== timeline.length - 1 && <div className={{styles.timelineLine}}></div>}}
                                                        <div className={{styles.timelineContent}}>
                                                            <div className={{styles.timelineEvent}}>
                                                                <strong>{{event.userName || 'System'}}</strong> {{event.action}}
                                                            </div>
                                                            <div className={{styles.timelineTime}}>
                                                                {{new Date(event.timestamp).toLocaleString([], {{ month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }})}}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            }})}}
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <div style={{{{ marginBottom: '14px' }}}}>
                                            <textarea
                                                placeholder="Describe the change needed..."
                                                value={{crForm.description}}
                                                onChange={{e => setCrForm(prev => ({{ ...prev, description: e.target.value }}))}}
                                                rows={{3}}
                                                style={{{{ width: '100%', padding: '8px', borderRadius: '8px', border: '0.5px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', fontSize: '13px', resize: 'vertical', boxSizing: 'border-box' }}}}
                                            />
                                            <select
                                                value={{crForm.clauseId}}
                                                onChange={{e => setCrForm(prev => ({{ ...prev, clauseId: e.target.value }}))}}
                                                style={{{{ width: '100%', marginTop: '6px', padding: '7px', borderRadius: '8px', border: '0.5px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', fontSize: '13px' }}}}>
                                                <option value="">No specific clause</option>
                                                {{clauses.map(cl => <option key={{cl.id}} value={{cl.id}}>{{cl.title}}</option>)}}
                                            </select>
                                            <button
                                                onClick={{handleCreateCR}}
                                                disabled={{crLoading || !crForm.description.trim()}}
                                                style={{{{ marginTop: '8px', width: '100%', padding: '8px', borderRadius: '8px', background: 'var(--accent-teal)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: '500', fontSize: '13px' }}}}>
                                                {{crLoading ? 'Submitting...' : 'Raise change request'}}
                                            </button>
                                        </div>

                                        {{changeRequests.length === 0 ? (
                                            <div style={{{{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}}}>No change requests yet</div>
                                        ) : (
                                            changeRequests.map(cr => (
                                                <div key={{cr._id || cr.id}} style={{{{ padding: '10px', marginBottom: '8px', borderRadius: '8px', border: '0.5px solid var(--border-color)', background: 'rgba(255,255,255,0.02)' }}}}>
                                                    <div style={{{{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}}}>
                                                        <span style={{{{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)' }}}}>{{cr.department}}</span>
                                                        <span style={{{{
                                                            fontSize: '11px', padding: '2px 8px', borderRadius: '12px', fontWeight: '500',
                                                            background: cr.status === 'Open' ? '#FAEEDA' : cr.status === 'Resolved' ? '#EAF3DE' : '#FCEBEB',
                                                            color: cr.status === 'Open' ? '#854F0B' : cr.status === 'Resolved' ? '#3B6D11' : '#A32D2D'
                                                        }}}}>{{cr.status}}</span>
                                                    </div>
                                                    <div style={{{{ fontSize: '13px', color: 'var(--text-primary)', marginBottom: '6px' }}}}>{{cr.description}}</div>
                                                    {{cr.resolution && <div style={{{{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}}}>Resolution: {{cr.resolution}}</div>}}
                                                    {{cr.status === 'Open' && cr.department === '{dept}' && (
                                                        <div style={{{{ display: 'flex', gap: '6px' }}}}>
                                                            <button onClick={{() => handleUpdateCR(cr._id || cr.id, 'Resolved')}} style={{{{ fontSize: '12px', padding: '4px 10px', borderRadius: '6px', background: '#10b981', color: '#fff', border: 'none', cursor: 'pointer' }}}}>Resolve</button>
                                                            <button onClick={{() => handleUpdateCR(cr._id || cr.id, 'Rejected')}} style={{{{ fontSize: '12px', padding: '4px 10px', borderRadius: '6px', background: '#dc2626', color: '#fff', border: 'none', cursor: 'pointer' }}}}>Reject</button>
                                                        </div>
                                                    )}}
                                                </div>
                                            ))
                                        )}}
                                    </div>
                                )"""
        content = re.sub(timeline_block, cr_content, content, flags=re.DOTALL)

    # 12. Redline Modal at bottom
    if "Redline Modal Placement" not in content and "Accept redline" not in content:
        toast_block = r"\{toast && \("
        redline_modal = """{redlineModal && (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
        <div style={{ background: 'var(--bg-card)', borderRadius: '12px', padding: '24px', width: '560px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span style={{ fontWeight: '600', fontSize: '16px', color: 'var(--text-primary)' }}>Redline: {redlineModal.clause.title}</span>
                <button onClick={() => setRedlineModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: 'var(--text-muted)' }}>×</button>
            </div>

            <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '8px' }}>Comparison</div>
            <div style={{ fontSize: '14px', lineHeight: '1.6', padding: '12px', background: 'var(--bg-input)', borderRadius: '8px', marginBottom: '16px', color: 'var(--text-primary)' }}>
                {wordDiff(redlineModal.clause.content, redlineModal.result.redlinedClause || '').map((token, i) => (
                    <span key={i} style={{
                        background: token.type === 'added' ? 'rgba(16, 185, 129, 0.2)' : token.type === 'removed' ? 'rgba(220, 38, 38, 0.2)' : 'transparent',
                        textDecoration: token.type === 'removed' ? 'line-through' : 'none',
                        color: token.type === 'added' ? '#10b981' : token.type === 'removed' ? '#f87171' : 'inherit',
                        marginRight: '4px'
                    }}>{token.word}</span>
                ))}
            </div>

            {redlineModal.result.issues?.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '8px' }}>Issues found</div>
                    {redlineModal.result.issues.map((issue, i) => (
                        <div key={i} style={{ fontSize: '13px', padding: '4px 0', color: 'var(--text-primary)' }}>• {issue.problem || issue}</div>
                    ))}
                </div>
            )}

            {redlineModal.result.justification && (
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
                    <strong>Justification:</strong> {redlineModal.result.justification}
                </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={handleAcceptRedline} style={{ flex: 1, padding: '10px', borderRadius: '8px', background: '#f59e0b', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: '500', fontSize: '14px' }}>
                    Accept Redline
                </button>
                <button onClick={handleSaveRedlineToContract} style={{ flex: 1, padding: '10px', borderRadius: '8px', background: '#10b981', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: '500', fontSize: '14px' }}>
                    Save to Contract
                </button>
            </div>
        </div>
    </div>
)}
"""
        content = content.replace("{toast && (", redline_modal + "\n            {toast && (")

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

src_dir = os.path.join("/home/rani-sahu/Apeiro/CLM/src/components")
for comp in components:
    fix_file(os.path.join(src_dir, comp), dept_map[comp])

print("Modifications done.")
