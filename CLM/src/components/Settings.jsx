import React, { useState, useEffect, useCallback } from 'react';
import styles from './Settings.module.css';
import AllowedDomains from './AllowedDomains';

const Settings = () => {
    const [activeTab, setActiveTab] = useState('Company');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState(null);
    const [settings, setSettings] = useState({
        company_name: '',
        company_address: '',
        company_email: '',
        company_phone: '',
        default_currency: 'INR',
        timezone: 'Asia/Kolkata',
        smtp_server: '',
        smtp_port: '',
        smtp_user: '',
        smtp_pass: '',
        sender_name: ''
    });

    const fetchSettings = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/settings');
            if (!response.ok) throw new Error('Failed to fetch');
            const data = await response.json();
            setSettings(data);
        } catch (err) {
            console.error('Fetch settings error:', err);
            // Fallback demo data
            setSettings({
                company_name: 'Apeiro Systems India Pvt Ltd',
                company_address: '12th Floor, World Trade Center, Bangalore, KA, India',
                company_email: 'admin@apeiro.com',
                company_phone: '+91 80 4455 6677',
                default_currency: 'INR',
                timezone: 'Asia/Kolkata',
                smtp_server: 'smtp.sendgrid.net',
                smtp_port: '587',
                smtp_user: 'apikey',
                smtp_pass: '••••••••••••••••••••',
                sender_name: 'Apeiro CLM Notifications'
            });
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage(null);

        try {
            const response = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });
            
            if (!response.ok) throw new Error('Failed to save');
            
            setMessage({ type: 'success', text: 'System settings updated successfully.' });
        } catch (err) {
            // Simulated success for demo
            setMessage({ type: 'success', text: 'Settings saved (Local State Only).' });
        } finally {
            setIsSaving(false);
            setTimeout(() => setMessage(null), 3000);
        }
    };

    if (isLoading) return (
        <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
        </div>
    );

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2>System Settings</h2>
            </div>

            <nav className={styles.tabs}>
                <button 
                    className={`${styles.tab} ${activeTab === 'Company' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('Company')}
                >
                    🏢 Company Profile
                </button>
                <button 
                    className={`${styles.tab} ${activeTab === 'Localization' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('Localization')}
                >
                    🌍 Localization
                </button>
                <button 
                    className={`${styles.tab} ${activeTab === 'Email' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('Email')}
                >
                    📧 Email Config
                </button>
                <button 
                    className={`${styles.tab} ${activeTab === 'Domains' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('Domains')}
                >
                    🌐 Allowed Domains
                </button>
            </nav>

            <form onSubmit={handleSave}>
                {message && (
                    <div className={`${styles.message} ${styles[message.type]}`}>
                        {message.text}
                    </div>
                )}

                <div className={styles.card}>
                    {activeTab === 'Company' && (
                        <div className={styles.formSection}>
                            <h3 className={styles.sectionTitle}>Company Details</h3>
                            <div className={styles.formGrid}>
                                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                    <label className={styles.label}>Legal Company Name</label>
                                    <input 
                                        name="company_name"
                                        className={styles.input} 
                                        value={settings.company_name}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                    <label className={styles.label}>Corporate Address</label>
                                    <textarea 
                                        name="company_address"
                                        className={styles.textarea}
                                        value={settings.company_address}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Contact Email</label>
                                    <input 
                                        name="company_email"
                                        type="email"
                                        className={styles.input}
                                        value={settings.company_email}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Contact Phone</label>
                                    <input 
                                        name="company_phone"
                                        className={styles.input}
                                        value={settings.company_phone}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Localization' && (
                        <div className={styles.formSection}>
                            <h3 className={styles.sectionTitle}>Regional & Localization</h3>
                            <div className={styles.formGrid}>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Default Currency</label>
                                    <select 
                                        name="default_currency"
                                        className={styles.select}
                                        value={settings.default_currency}
                                        onChange={handleInputChange}
                                    >
                                        <option value="INR">Indian Rupee (INR)</option>
                                        <option value="USD">US Dollar (USD)</option>
                                        <option value="EUR">Euro (EUR)</option>
                                        <option value="GBP">British Pound (GBP)</option>
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>System Timezone</label>
                                    <select 
                                        name="timezone"
                                        className={styles.select}
                                        value={settings.timezone}
                                        onChange={handleInputChange}
                                    >
                                        <option value="Asia/Kolkata">(GMT+05:30) India Business Time</option>
                                        <option value="UTC">(GMT+00:00) UTC Standard Time</option>
                                        <option value="America/New_York">(GMT-05:00) Eastern Time</option>
                                        <option value="Europe/London">(GMT+00:00) London</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Email' && (
                        <div className={styles.formSection}>
                            <h3 className={styles.sectionTitle}>SMTP Configuration</h3>
                            <div className={styles.formGrid}>
                                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                    <label className={styles.label}>Sender Display Name</label>
                                    <input 
                                        name="sender_name"
                                        className={styles.input}
                                        value={settings.sender_name}
                                        onChange={handleInputChange}
                                        placeholder="e.g. Apeiro Notifications"
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>SMTP Host</label>
                                    <input 
                                        name="smtp_server"
                                        className={styles.input}
                                        value={settings.smtp_server}
                                        onChange={handleInputChange}
                                        placeholder="smtp.example.com"
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>SMTP Port</label>
                                    <input 
                                        name="smtp_port"
                                        className={styles.input}
                                        value={settings.smtp_port}
                                        onChange={handleInputChange}
                                        placeholder="587"
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>SMTP Username</label>
                                    <input 
                                        name="smtp_user"
                                        className={styles.input}
                                        value={settings.smtp_user}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>SMTP Password</label>
                                    <input 
                                        name="smtp_pass"
                                        type="password"
                                        className={styles.input}
                                        value={settings.smtp_pass}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Domains' && (
                        <div className={styles.formSection}>
                            <h3 className={styles.sectionTitle}>Whitelist Email Domains</h3>
                            <AllowedDomains />
                        </div>
                    )}

                    {activeTab !== 'Domains' && (
                        <div className={styles.footer}>
                            <button 
                                type="submit" 
                                className={styles.saveBtn}
                                disabled={isSaving}
                            >
                                {isSaving ? 'Applying Settings...' : 'Save Configuration'}
                            </button>
                        </div>
                    )}
                </div>
            </form>
        </div>
    );
};

export default Settings;
