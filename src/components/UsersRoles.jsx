import React, { useState, useEffect } from 'react';
import styles from './UsersRoles.module.css';
import { getAuthHeaders } from '../services/authHelper';

const UsersRoles = ({ user, embedded = false }) => {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newUser, setNewUser] = useState({ name: '', email: '', role: 'Sales', password: '' });

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deletingUser, setDeletingUser] = useState(null);

    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const fetchUsers = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/admin/users', {
                headers: getAuthHeaders()
            });
            if (response.ok) {
                const data = await response.json();
                setUsers(data);
            } else {
                throw new Error('Failed to fetch');
            }
        } catch (err) {
            console.error(err);
            setError('Failed to load users. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
    };

    const handleAddUser = async () => {
        if (!newUser.name || !newUser.email || !newUser.password) {
            alert('Please fill all required fields');
            return;
        }
        try {
            const resp = await fetch('/api/admin/users', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(newUser)
            });
            if (resp.ok) {
                setIsAddModalOpen(false);
                setNewUser({ name: '', email: '', role: 'Sales', password: '' });
                fetchUsers();
                showToast('User added successfully');
            } else {
                const err = await resp.json();
                if (err.detail === 'User already exists') {
                    showToast('A user with this email already exists', 'error');
                } else {
                    showToast(err.detail || 'Failed to add user', 'error');
                }
            }
        } catch (err) {
            console.error(err);
            showToast('Network error while adding user', 'error');
        }
    };

    const handleEditSave = async () => {
        if (!editingUser) return;
        try {
            const resp = await fetch(`/api/admin/users/${editingUser.id}/role`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ role: editingUser.role })
            });
            if (resp.ok) {
                setIsEditModalOpen(false);
                setUsers(users.map(u => u.id === editingUser.id ? { ...u, role: editingUser.role } : u));
                showToast('Role updated successfully');
            } else {
                showToast('Failed to update role', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('Network error while updating role', 'error');
        }
    };

    const handleDeleteConfirm = async () => {
        if (!deletingUser) return;
        try {
            const resp = await fetch(`/api/admin/users/${deletingUser.id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            if (resp.ok) {
                setIsDeleteModalOpen(false);
                setUsers(users.filter(u => u.id !== deletingUser.id));
                showToast('User removed successfully');
            } else {
                showToast('Failed to delete user', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('Network error while deleting user', 'error');
        }
    };

    const getRoleColor = (role) => {
        const colors = {
            'Admin': '#00C9A7',
            'Legal': '#3B82F6',
            'Finance': '#F59E0B',
            'Compliance': '#8B5CF6',
            'Procurement': '#10B981',
            'Manager': '#F97316',
            'CEO': '#EF4444',
            'Sales': '#EC4899'
        };
        return colors[role] || '#94A3B8';
    };

    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.status === 'Active').length;
    const uniqueRolesCount = new Set(users.map(u => u.role)).size;

    return (
        <div className={styles.container}>
            {!embedded && (
                <div className={styles.header}>
                    <div className={styles.headerLeft}>
                        <div className={styles.headerIcon}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className={styles.title}>Users & Roles</h1>
                            <p className={styles.subtitle}>Manage system users and their access permissions</p>
                        </div>
                    </div>
                    <button className={styles.btnTeal} onClick={() => setIsAddModalOpen(true)}>
                        + Add New User
                    </button>
                </div>
            )}

            {!embedded && (
                <div className={styles.statsRow}>
                    <div className={styles.statCard}>
                        <span className={styles.statLabel}>Total Users</span>
                        <span className={styles.statValue}>{totalUsers}</span>
                    </div>
                    <div className={styles.statCard}>
                        <span className={styles.statLabel}>Active Users</span>
                        <span className={styles.statValue}>{activeUsers}</span>
                    </div>
                    <div className={styles.statCard}>
                        <span className={styles.statLabel}>Total Unique Roles</span>
                        <span className={styles.statValue}>{uniqueRolesCount}</span>
                    </div>
                </div>
            )}

            {embedded && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
                    <button className={styles.btnTeal} onClick={() => setIsAddModalOpen(true)}>
                        + Add New User
                    </button>
                </div>
            )}

            {isLoading ? (
                <div className={styles.stateContainer}>
                    <div className={styles.spinner}></div>
                    <p>Loading users...</p>
                </div>
            ) : error ? (
                <div className={styles.stateContainer}>
                    <p style={{ color: '#EF4444' }}>{error}</p>
                    <button className={styles.btnOutline} onClick={fetchUsers}>Retry</button>
                </div>
            ) : users.length === 0 ? (
                <div className={styles.stateContainer}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor" style={{ opacity: 0.5 }}>
                        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                    </svg>
                    <p>No users found. Add your first user to get started.</p>
                </div>
            ) : (
                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th className={styles.nameCol}>Name</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.id}>
                                    <td>
                                        <div className={styles.userInfo}>
                                            <span className={styles.userName}>{u.name}</span>
                                            <span className={styles.userEmailStacked}>{u.email}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={styles.roleBadge} style={{ color: getRoleColor(u.role), backgroundColor: `${getRoleColor(u.role)}26` }}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td>
                                        <div className={styles.statusWrapper}>
                                            <div className={styles.statusIndicator} style={{ backgroundColor: u.status === 'Active' ? '#10B981' : '#94A3B8' }}></div>
                                            <span className={u.status === 'Active' ? styles.activeStatus : styles.inactiveStatus}>
                                                {u.status}
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className={styles.actions}>
                                            <button 
                                                className={styles.iconBtnEdit} 
                                                onClick={() => { setEditingUser({...u}); setIsEditModalOpen(true); }}
                                                title="Edit Role"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                                                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                                </svg>
                                            </button>
                                            <button 
                                                className={styles.iconBtnDelete} 
                                                onClick={() => { setDeletingUser(u); setIsDeleteModalOpen(true); }}
                                                title="Delete User"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="3 6 5 6 21 6"/>
                                                    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                                                    <path d="M10 11v6"/>
                                                    <path d="M14 11v6"/>
                                                    <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Add User Modal */}
            {isAddModalOpen && (
                <div className={styles.modalOverlay} onClick={() => setIsAddModalOpen(false)}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <button className={styles.closeBtn} onClick={() => setIsAddModalOpen(false)}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                        <h3 className={styles.modalTitle}>Add New User</h3>
                        
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Full Name</label>
                            <input 
                                type="text" 
                                className={styles.input} 
                                value={newUser.name}
                                onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                                placeholder="e.g. John Doe"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Email Address</label>
                            <input 
                                type="email" 
                                className={styles.input} 
                                value={newUser.email}
                                onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                                placeholder="john@apeiro.digital"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Role</label>
                            <select 
                                className={styles.input}
                                value={newUser.role}
                                onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                            >
                                <option value="Admin">Admin</option>
                                <option value="Legal">Legal</option>
                                <option value="Finance">Finance</option>
                                <option value="Compliance">Compliance</option>
                                <option value="Procurement">Procurement</option>
                                <option value="Sales">Sales</option>
                                <option value="Manager">Manager</option>
                                <option value="CEO">CEO</option>
                            </select>
                        </div>
                        
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Password</label>
                            <input 
                                type="password" 
                                className={styles.input} 
                                value={newUser.password}
                                onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                                placeholder="Temporary password"
                            />
                        </div>

                        <div className={styles.modalActions} style={{ marginTop: '32px' }}>
                            <button className={styles.btnTealFull} onClick={handleAddUser}>Save</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {isEditModalOpen && editingUser && (
                <div className={styles.modalOverlay} onClick={() => setIsEditModalOpen(false)}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <button className={styles.closeBtn} onClick={() => setIsEditModalOpen(false)}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                        <h3 className={styles.modalTitle}>Edit User Role</h3>
                        
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Full Name</label>
                            <input type="text" className={styles.input} value={editingUser.name} readOnly disabled />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Email Address</label>
                            <input type="email" className={styles.input} value={editingUser.email} readOnly disabled />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Role</label>
                            <select 
                                className={styles.input}
                                value={editingUser.role}
                                onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}
                            >
                                <option value="Admin">Admin</option>
                                <option value="Legal">Legal</option>
                                <option value="Finance">Finance</option>
                                <option value="Compliance">Compliance</option>
                                <option value="Procurement">Procurement</option>
                                <option value="Sales">Sales</option>
                                <option value="Manager">Manager</option>
                                <option value="CEO">CEO</option>
                            </select>
                        </div>
                        
                        <div className={styles.modalActions} style={{ marginTop: '32px' }}>
                            <button className={styles.btnCancel} onClick={() => setIsEditModalOpen(false)}>Cancel</button>
                            <button className={styles.btnTeal} onClick={handleEditSave}>Save</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {isDeleteModalOpen && deletingUser && (
                <div className={styles.modalOverlay} onClick={() => setIsDeleteModalOpen(false)}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <h3 className={styles.modalTitle}>Delete User</h3>
                        <p className={styles.modalText}>
                            Are you sure you want to remove {deletingUser.name}? This action cannot be undone.
                        </p>
                        <div className={styles.modalActions}>
                            <button className={styles.btnCancel} onClick={() => setIsDeleteModalOpen(false)}>Cancel</button>
                            <button className={styles.btnDanger} onClick={handleDeleteConfirm}>Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {toast.show && <div className={`${styles.toast} ${toast.type === 'error' ? styles.toastError : ''}`}>{toast.message}</div>}
        </div>
    );
};

export default UsersRoles;
