import React, { useState, useEffect, useCallback } from 'react';
import styles from './UserManagement.module.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState(null); // For editing
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: 'Sales',
        department: '',
        status: 'Active'
    });
    const [validationError, setValidationError] = useState(null);
    const [isValidatingDomain, setIsValidatingDomain] = useState(false);

    // Mock API functions
    const mockAPI = {
        getUsers: async () => {
            await new Promise(resolve => setTimeout(resolve, 500));
            return [
                { id: 1, name: 'Aastha Sharma', email: 'aastha@clm.com', role: 'Admin', department: 'IT', status: 'Active' },
                { id: 2, name: 'John Doe', email: 'john@clm.com', role: 'Manager', department: 'Sales', status: 'Active' },
                { id: 3, name: 'Jane Smith', email: 'jane@clm.com', role: 'Sales', department: 'Marketing', status: 'Inactive' },
                { id: 4, name: 'Mike Johnson', email: 'mike@clm.com', role: 'Sales', department: 'Operations', status: 'Active' },
                { id: 5, name: 'Sarah Chen', email: 'sarah@clm.com', role: 'Manager', department: 'Finance', status: 'Active' }
            ];
        },
        
        createUser: async (userData) => {
            await new Promise(resolve => setTimeout(resolve, 800));
            return { id: Date.now(), ...userData };
        },
        
        updateUser: async (id, userData) => {
            await new Promise(resolve => setTimeout(resolve, 600));
            return { id, ...userData };
        },
        
        deleteUser: async (id) => {
            await new Promise(resolve => setTimeout(resolve, 400));
            return { success: true };
        }
    };

    const fetchUsers = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await mockAPI.getUsers();
            setUsers(data);
            setError(null);
        } catch (err) {
            console.error('Fetch users error:', err);
            setError('Could not load users. Using demo data.');
            // Fallback demo data
            setUsers([
                { id: 1, name: 'Aastha Sharma', email: 'aastha@clm.com', role: 'Admin', department: 'IT', status: 'Active' },
                { id: 2, name: 'John Doe', email: 'john@clm.com', role: 'Manager', department: 'Sales', status: 'Active' },
                { id: 3, name: 'Jane Smith', email: 'jane@clm.com', role: 'Sales', department: 'Marketing', status: 'Inactive' },
            ]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const verifyEmailDomain = useCallback(async (email) => {
        if (!email || !email.includes('@')) {
            setValidationError(null);
            return;
        }

        try {
            setIsValidatingDomain(true);
            const response = await fetch('/api/auth/verify-email-domain', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            if (!response.ok) {
                const data = await response.json();
                setValidationError(data.detail || 'Invalid email domain');
            } else {
                setValidationError(null);
            }
        } catch (err) {
            console.error('Domain verification error:', err);
            // If API fails, we might want to allow it or show a warning
            setValidationError(null); 
        } finally {
            setIsValidatingDomain(false);
        }
    }, []);

    // Debounced domain check
    useEffect(() => {
        if (!isModalOpen || currentUser) return; // Only validate for new users

        const timer = setTimeout(() => {
            if (formData.email) {
                verifyEmailDomain(formData.email);
            }
        }, 800);

        return () => clearTimeout(timer);
    }, [formData.email, verifyEmailDomain, isModalOpen, currentUser]);

    const handleOpenModal = (user = null) => {
        if (user) {
            setCurrentUser(user);
            setFormData({
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department || '',
                status: user.status
            });
        } else {
            setCurrentUser(null);
            setFormData({
                name: '',
                email: '',
                role: 'Sales',
                department: '',
                status: 'Active'
            });
        }
        setValidationError(null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentUser(null);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Basic validation
        if (!formData.name.trim()) {
            toast.error('Please enter a name');
            return;
        }
        if (!formData.email.trim()) {
            toast.error('Please enter an email address');
            return;
        }
        if (validationError) {
            toast.error('Please fix validation errors');
            return;
        }
        
        try {
            if (currentUser) {
                const updatedUser = await mockAPI.updateUser(currentUser.id, formData);
                setUsers(users.map(u => u.id === currentUser.id ? updatedUser : u));
                toast.success('User updated successfully!');
            } else {
                const newUser = await mockAPI.createUser(formData);
                setUsers([...users, newUser]);
                toast.success('User created successfully!');
            }
            
            handleCloseModal();
        } catch (err) {
            console.error('Save user error:', err);
            toast.error('Failed to save user. Please try again.');
            // Fallback to local state update
            if (currentUser) {
                setUsers(users.map(u => u.id === currentUser.id ? { ...u, ...formData } : u));
            } else {
                setUsers([...users, { id: Date.now(), ...formData }]);
            }
            handleCloseModal();
        }
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;
        
        try {
            await mockAPI.deleteUser(id);
            setUsers(users.filter(u => u.id !== id));
            toast.success('User deleted successfully!');
        } catch (err) {
            console.error('Delete user error:', err);
            toast.error('Failed to delete user. Please try again.');
            // Fallback to local state update
            setUsers(users.filter(u => u.id !== id));
        }
    };

    const filteredUsers = users.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isLoading) return (
        <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Loading users...</p>
        </div>
    );

    return (
        <div className={styles.container}>
            <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
            />
            <div className={styles.header}>
                <h2>User Management</h2>
                <div className={styles.controls}>
                    <div className={styles.searchWrapper}>
                        <span className={styles.searchIcon}>🔍</span>
                        <input 
                            type="text" 
                            className={styles.searchInput} 
                            placeholder="Search users..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className={styles.addUserBtn} onClick={() => handleOpenModal()}>
                        <span>+</span> Add User
                    </button>
                </div>
            </div>

            {error && <div className={styles.errorContainer}>{error}</div>}

            <div className={styles.tableCard}>
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Name & Email</th>
                                <th>Role</th>
                                <th>Department</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map(user => (
                                <tr key={user.id}>
                                    <td>
                                        <div className={styles.userInfo}>
                                            <span className={styles.userName}>{user.name}</span>
                                            <span className={styles.userEmail}>{user.email}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`${styles.roleBadge} ${styles[`role_${user.role.toLowerCase()}`]}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td>{user.department || 'N/A'}</td>
                                    <td>
                                        <div className={`${styles.statusBadge} ${styles[user.status.toLowerCase()]}`}>
                                            <span className={styles.statusDot}></span>
                                            {user.status}
                                        </div>
                                    </td>
                                    <td>
                                        <div className={styles.actions}>
                                            <button className={`${styles.actionBtn} ${styles.editBtn}`} onClick={() => handleOpenModal(user)}>✎</button>
                                            <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => handleDeleteUser(user.id)}>🗑</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <h3>{currentUser ? 'Edit User' : 'Add New User'}</h3>
                            <button className={styles.closeBtn} onClick={handleCloseModal}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className={styles.modalBody}>
                                <div className={styles.formGroup}>
                                    <label>Full Name</label>
                                    <input 
                                        name="name"
                                        className={styles.input} 
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        placeholder="Enter name"
                                        required 
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Email Address</label>
                                    <input 
                                        name="email"
                                        type="email"
                                        className={styles.input} 
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        placeholder="user@clm.com"
                                        required 
                                    />
                                    {isValidatingDomain && <span className={styles.validatingText}>Checking domain...</span>}
                                    {validationError && <span className={styles.validationError}>{validationError}</span>}
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Role</label>
                                    <select 
                                        name="role"
                                        className={styles.select}
                                        value={formData.role}
                                        onChange={handleInputChange}
                                    >
                                        <option value="Sales">Sales</option>
                                        <option value="Manager">Manager</option>
                                        <option value="Admin">Admin</option>
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Department</label>
                                    <input 
                                        name="department"
                                        className={styles.input} 
                                        value={formData.department}
                                        onChange={handleInputChange}
                                        placeholder="e.g. Sales, IT, Finance" 
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Status</label>
                                    <select 
                                        name="status"
                                        className={styles.select}
                                        value={formData.status}
                                        onChange={handleInputChange}
                                    >
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>
                            <div className={styles.modalFooter}>
                                <button type="button" className={styles.cancelBtn} onClick={handleCloseModal}>Cancel</button>
                                <button 
                                    type="submit" 
                                    className={styles.submitBtn}
                                    disabled={validationError || isValidatingDomain}
                                >
                                    {currentUser ? 'Save Changes' : 'Create User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
