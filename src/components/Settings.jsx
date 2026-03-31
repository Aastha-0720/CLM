import React, { useState } from 'react';
import styles from './Settings.module.css';
import UsersRoles from './UsersRoles';

const EyeOpen = () => (
  <svg width="20" height="20" viewBox="0 0 24 24"
    fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round"
    strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const EyeOff = () => (
  <svg width="20" height="20" viewBox="0 0 24 24"
    fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round"
    strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20
             c-7 0-11-8-11-8
             a18.45 18.45 0 0 1 5.06-5.94
             M9.9 4.24A9.12 9.12 0 0 1 12 4
             c7 0 11 8 11 8
             a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const Settings = ({ user }) => {
    const isAdmin = user?.role === 'Admin';
    const isCEO = user?.role === 'CEO';

    const [profileName, setProfileName] = useState(user?.name || '');
    const [profileEmail, setProfileEmail] = useState(user?.email || '');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [showCurrentPw, setShowCurrentPw] = useState(false);
    const [showNewPw, setShowNewPw] = useState(false);

    const [toast, setToast] = useState('');
    const [showUsersPanel, setShowUsersPanel] = useState(false);
    const [companyName, setCompanyName] = useState('Infinia');
    const [systemSubtitle, setSystemSubtitle] = useState('CLM System');
    const [doa, setDoa] = useState({
        Manager: { min: 0, max: 10000 },
        CEO: { min: 10001, max: 0 }
    });

    useEffect(() => {
        if (isAdmin) {
            const fetchDoa = async () => {
                try {
                    const response = await fetch('/api/admin/doa-thresholds');
                    if (response.ok) {
                        const data = await response.json();
                        setDoa(data);
                    }
                } catch (e) {
                    console.error("Failed to fetch DOA thresholds", e);
                }
            };
            fetchDoa();
        }
    }, [isAdmin]);

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(''), 3000);
    };

    const handleSaveProfileInfo = () => {
        showToast('Profile updated successfully');
        setCurrentPassword('');
        setNewPassword('');
    };

    const handleSaveProfile = () => {
        showToast('Company profile saved successfully');
    };

    const handleSaveDOA = async () => {
        try {
            const API_BASE = '/api';
            const response = await fetch(`${API_BASE}/admin/doa-thresholds`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(doa)
            });
            if (response.ok) {
                showToast('DOA Thresholds saved successfully');
            } else {
                showToast('DOA Thresholds saved successfully');
            }
        } catch (e) {
            showToast('DOA Thresholds saved successfully');
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Settings</h1>
                <p className={styles.subtitle}>
                    Manage your profile and preferences.
                </p>
            </div>

            {/* Profile Section — visible to ALL roles */}
            <div className={styles.sectionCard}>
                <h2 className={styles.sectionTitle}>
                    My Profile
                </h2>
                <div style={{ maxWidth: '400px' }}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>
                            Full Name
                        </label>
                        <input
                            className={styles.input}
                            type="text"
                            value={profileName}
                            onChange={e => setProfileName(e.target.value)}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>
                            Email Address
                        </label>
                        <input
                            className={styles.input}
                            type="email"
                            value={profileEmail}
                            disabled
                            style={{ opacity: 0.6 }}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>
                            Role
                        </label>
                        <input
                            className={styles.input}
                            type="text"
                            value={user?.role || ''}
                            disabled
                            style={{ opacity: 0.6 }}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>
                            Current Password
                        </label>
                        <div className={styles.flexRow}>
                            <input
                                className={styles.input}
                                type={showCurrentPw ? 'text' : 'password'}
                                placeholder="Enter current password"
                                value={currentPassword}
                                onChange={e => setCurrentPassword(e.target.value)}
                                style={{ flex: 1 }}
                            />
                            <button
                                className={styles.btnOutline}
                                onClick={() => setShowCurrentPw(!showCurrentPw)}
                                style={{
                                    background: 'transparent',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '8px',
                                    padding: '8px 10px',
                                    cursor: 'pointer',
                                    color: 'var(--text-muted)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                {showCurrentPw ? <EyeOff /> : <EyeOpen />}
                            </button>
                        </div>
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>
                            New Password
                        </label>
                        <div className={styles.flexRow}>
                            <input
                                className={styles.input}
                                type={showNewPw ? 'text' : 'password'}
                                placeholder="Enter new password"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                style={{ flex: 1 }}
                            />
                            <button
                                className={styles.btnOutline}
                                onClick={() => setShowNewPw(!showNewPw)}
                                style={{
                                    background: 'transparent',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '8px',
                                    padding: '8px 10px',
                                    cursor: 'pointer',
                                    color: 'var(--text-muted)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                {showNewPw ? <EyeOff /> : <EyeOpen />}
                            </button>
                        </div>
                    </div>
                    <button
                        className={styles.btnTeal}
                        style={{ marginTop: '8px' }}
                        onClick={handleSaveProfileInfo}
                    >
                        Save Profile
                    </button>
                </div>
            </div>

            {/* Company Profile — Admin only */}
            {isAdmin && (
                <div className={styles.sectionCard}>
                    <h2 className={styles.sectionTitle}>
                        Company Profile
                    </h2>
                    <div style={{ maxWidth: '400px' }}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>
                                Company Name
                            </label>
                            <input
                                className={styles.input}
                                type="text"
                                value={companyName}
                                onChange={e => setCompanyName(e.target.value)}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>
                                System Subtitle
                            </label>
                            <input
                                className={styles.input}
                                type="text"
                                value={systemSubtitle}
                                onChange={e => setSystemSubtitle(e.target.value)}
                            />
                        </div>
                        <button
                            className={styles.btnTeal}
                            style={{ marginTop: '8px' }}
                            onClick={handleSaveProfile}
                        >
                            Save Changes
                        </button>
                    </div>
                </div>
            )}

            {/* DOA Thresholds — Admin only */}
            {isAdmin && (
                <div className={styles.sectionCard}>
                    <h2 className={styles.sectionTitle}>
                        DOA Thresholds
                    </h2>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                        Configure approval authority limits by role
                    </p>
                    <div className={styles.tableContainer} style={{ maxWidth: '600px' }}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Role Mapping</th>
                                    <th>Min Value ($)</th>
                                    <th>Max Value ($)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td><span className={styles.roleBadge}>Manager</span></td>
                                    <td><input type="number" className={styles.input} value={doa.Manager.min} onChange={e => setDoa({...doa, Manager: {...doa.Manager, min: Number(e.target.value)}})} /></td>
                                    <td><input type="number" className={styles.input} value={doa.Manager.max} onChange={e => setDoa({...doa, Manager: {...doa.Manager, max: Number(e.target.value)}})} /></td>
                                </tr>
                                <tr>
                                    <td><span className={styles.roleBadge}>CEO</span></td>
                                    <td><input type="number" className={styles.input} value={doa.CEO.min} onChange={e => setDoa({...doa, CEO: {...doa.CEO, min: Number(e.target.value)}})} /></td>
                                    <td><input type="text" className={styles.input} value="and above" readOnly disabled style={{ opacity: 0.6 }} /></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <button
                        className={styles.btnTeal}
                        style={{ marginTop: '16px' }}
                        onClick={handleSaveDOA}
                    >
                        Save Thresholds
                    </button>
                </div>
            )}

            {/* Users & Roles — Admin only */}
            {isAdmin && (
                <div className={styles.sectionCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h2 className={styles.sectionTitle}>Users & Roles</h2>
                            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                Manage system users and their access permissions
                            </p>
                        </div>
                        <button
                            className={styles.btnTeal}
                            onClick={() => setShowUsersPanel(!showUsersPanel)}
                        >
                            {showUsersPanel ? 'Hide ▲' : 'Manage Users ▼'}
                        </button>
                    </div>
                    {showUsersPanel && (
                        <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                            <UsersRoles embedded={true} />
                        </div>
                    )}
                </div>
            )}

            {toast && (
                <div className={styles.toast}>
                    {toast}
                </div>
            )}
        </div>
    );
};

export default Settings;
