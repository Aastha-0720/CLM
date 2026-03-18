import React, { useState } from 'react';
import OutlookPanel from './components/OutlookPanel';
import Login from './components/Login';

function App() {
    const [user, setUser] = useState(null);

    const handleLogin = (userData) => {
        setUser(userData);
    };

    const handleLogout = () => {
        setUser(null);
    };

    return (
        <div className="app-container">
            {user ? (
                <OutlookPanel user={user} onLogout={handleLogout} />
            ) : (
                <Login onLogin={handleLogin} />
            )}
        </div>
    );
}

export default App;
