import React, { useState, useEffect } from 'react';
import styles from './Login.module.css';
import logo from '../assets/Artboard 1 copy 15.svg';

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

const Login = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (response.ok) {
                const user = await response.json();
                onLogin(user);
            } else {
                const data = await response.json();
                setError(data.detail || 'Invalid email or password. Please try again.');
            }
        } catch (err) {
            console.error('Login failed', err);
            setError('An error occurred during login. Please try again.');
        }
    };

    return (
        <div className={styles.loginContainer}>
            <div className={styles.loginCard}>
                <div className={styles.logoContainer}>
                    <img src={logo} alt="Infinia Logo" style={{ width: '200px', height: 'auto' }} />
                </div>

                <div className={styles.header}>
                    <h1>Welcome Back</h1>
                    <p>Sign in to your CLM Platform</p>
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
                                style={{
                                    position: 'absolute',
                                    right: '12px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--text-muted)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '4px'
                                }}
                            >
                                {showPassword ? <EyeOff /> : <EyeOpen />}
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
