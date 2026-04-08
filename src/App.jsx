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
<<<<<<< Updated upstream
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
=======
            <Routes>
                <Route path="/login" element={
                    user ? <Navigate to={`/${user.role.toLowerCase()}/dashboard`} /> : <Login onLogin={handleLogin} />
                } />
                
                {/* Role Specific Routes */}
                <Route path="/user/*" element={
                    <ProtectedRoute user={user} allowedRoles={['User']}>
                        <OutlookPanel user={user} onLogout={handleLogout} theme={theme} onToggleTheme={toggleTheme} />
                    </ProtectedRoute>
                } />
                
                <Route path="/admin/*" element={
                    <ProtectedRoute user={user} allowedRoles={['Admin']}>
                        <OutlookPanel user={user} onLogout={handleLogout} theme={theme} onToggleTheme={toggleTheme} />
                    </ProtectedRoute>
                } />

                <Route path="/superadmin/*" element={
                    <ProtectedRoute user={user} allowedRoles={['Superadmin']}>
                        <OutlookPanel user={user} onLogout={handleLogout} theme={theme} onToggleTheme={toggleTheme} />
                    </ProtectedRoute>
                } />

                {/* Other Internal Roles */}
                {['Legal', 'Finance', 'Compliance', 'Procurement', 'Sales', 'Manager', 'CEO', 'CLO'].map(role => (
                    <Route key={role} path={`/${role.toLowerCase()}/*`} element={
                        <ProtectedRoute user={user} allowedRoles={[role]}>
                            <OutlookPanel user={user} onLogout={handleLogout} theme={theme} onToggleTheme={toggleTheme} />
                        </ProtectedRoute>
                    } />
                ))}

                <Route path="/unauthorized" element={
                    <AccessDenied onBack={() => navigate('/')} />
                } />

                {/* Default Redirects */}
                <Route path="/" element={
                    user ? <Navigate to={`/${user.role.toLowerCase()}/dashboard`} /> : <Navigate to="/login" />
                } />
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
>>>>>>> Stashed changes
        </div>
    );
}

export default App;
