import React, { useState, useEffect } from 'react';
import OutlookPanel from './components/OutlookPanel';
import Login from './components/Login';

function App() {
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('clm-user');
        return saved ? JSON.parse(saved) : null;
    });
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('clm-theme') || 'dark';
    });

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('clm-theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    const handleLogin = (userData) => {
        setUser(userData);
        localStorage.setItem('clm-user', JSON.stringify(userData));
        if (userData.token) localStorage.setItem('token', userData.token);
    };
    
    const handleLogout = () => {
        setUser(null);
        localStorage.removeItem('clm-user');
        localStorage.removeItem('token');
    };

    return (
        <div className="app-container">
            {user ? (
                <OutlookPanel
                    user={user}
                    onLogout={handleLogout}
                    theme={theme}
                    onToggleTheme={toggleTheme}
                />
            ) : (
                <Login onLogin={handleLogin} />
            )}
        </div>
    );
}

export default App;
