import React, { useState, useEffect } from 'react';
import OutlookPanel from './components/OutlookPanel';
import Login from './components/Login';

function App() {
    const [user, setUser] = useState(null);
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

    const handleLogin = (userData) => setUser(userData);
    const handleLogout = () => setUser(null);

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
