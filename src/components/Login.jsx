import React, { useState } from 'react';
import styles from './Login.module.css';

const DEMO_USERS = [
    { email: 'admin@apeiro.com', password: 'Admin@2026', name: 'Admin User', role: 'Admin' },
    { email: 'legal@apeiro.com', password: 'Legal@2026', name: 'Legal Counsel', role: 'Legal' },
    { email: 'finance@apeiro.com', password: 'Finance@2026', name: 'Finance Controller', role: 'Finance' },
    { email: 'compliance@apeiro.com', password: 'Comply@2026', name: 'Compliance Officer', role: 'Compliance' },
    { email: 'procurement@apeiro.com', password: 'Procure@2026', name: 'Procurement Lead', role: 'Procurement' },
    { email: 'sales@apeiro.com', password: 'Sales@2026', name: 'Sales Manager', role: 'Sales' },
    { email: 'manager@apeiro.com', password: 'Manager@2026', name: 'Operations Manager', role: 'Manager' },
    { email: 'ceo@apeiro.com', password: 'CEO@2026', name: 'Chief Executive Officer', role: 'CEO' },
];

const Login = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        const user = DEMO_USERS.find(u => u.email === email && u.password === password);

        if (user) {
            onLogin(user);
        } else {
            setError('Invalid email or password. Please try again.');
        }
    };

    return (
        <div className={styles.loginContainer}>
            <div className={styles.loginCard}>
                <div className={styles.logoContainer}>
                    <div className={styles.logoIcon}>A</div>
                    <span className={styles.logoText}>Apeiro CLM</span>
                </div>

                <div className={styles.header}>
                    <h1>Welcome Back</h1>
                    <p>Sign in to CLM Platform</p>
                </div>

                <form className={styles.form} onSubmit={handleSubmit}>
                    <div className={styles.inputGroup}>
                        <label>Email Address</label>
                        <input
                            type="email"
                            className={styles.inputField}
                            placeholder="name@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label>Password</label>
                        <div className={styles.inputWrapper}>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                className={styles.inputField}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                className={styles.togglePassword}
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? '👁️' : '👁️‍🗨️'}
                            </button>
                        </div>
                    </div>

                    {error && <div className={styles.errorMsg}>{error}</div>}

                    <button type="submit" className={styles.signInBtn}>
                        Sign In
                    </button>
                </form>

                <div className={styles.footer}>
                    &copy; 2026 Apeiro CLM System. All rights reserved.
                </div>
            </div>
        </div>
    );
};

export default Login;
