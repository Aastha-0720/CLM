import React, { useState, useEffect } from 'react';
import { 
    BrowserRouter as Router, 
    Routes, 
    Route, 
    Navigate, 
    useNavigate,
    useLocation
} from 'react-router-dom';
import OutlookPanel from './components/OutlookPanel';
import Login from './components/Login';

// Access Denied Component
const AccessDenied = ({ onBack }) => (
    <div style={{ 
        height: '100vh', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        padding: '20px',
        textAlign: 'center'
    }}>
        <div style={{ fontSize: '72px', marginBottom: '20px', color: '#EF4444' }}>403</div>
        <h1 style={{ marginBottom: '10px' }}>Access Denied</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '30px', maxWidth: '400px' }}>
            You do not have permission to view this page. Please contact your administrator if you believe this is an error.
        </p>
        <button 
            onClick={onBack}
            style={{ 
                padding: '12px 24px', 
                background: 'var(--primary-color)', 
                color: 'white', 
                border: 'none', 
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600'
            }}
        >
            Back to Dashboard
        </button>
    </div>
);

// Helper to protect routes
const ProtectedRoute = ({ user, allowedRoles, children }) => {
    if (!user) {
        return <Navigate to="/login" replace />;
    }
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Redirect to unauthorized page
        return <Navigate to="/unauthorized" replace />;
    }
    return children;
};

function AppContent() {
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('clm-user');
        return saved ? JSON.parse(saved) : null;
    });
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('clm-theme') || 'dark';
    });

    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('clm-theme', theme);
    }, [theme]);

    useEffect(() => {
        if (user) {
            localStorage.setItem('clm-user', JSON.stringify(user));
        } else {
            localStorage.removeItem('clm-user');
        }
    }, [user]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    const handleLogin = (userData) => {
        setUser(userData);
        const rolePath = userData.role.toLowerCase();
        navigate(`/${rolePath}/dashboard`);
    };

    const handleLogout = () => {
        setUser(null);
        navigate('/login');
    };

    return (
        <div className="app-container">
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
                {['Legal', 'Finance', 'Compliance', 'Procurement', 'Sales', 'Manager', 'CEO'].map(role => (
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
        </div>
    );
}

function App() {
    return (
        <Router>
            <AppContent />
        </Router>
    );
}

export default App;
