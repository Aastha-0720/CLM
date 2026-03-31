import React, { useState, useEffect } from 'react';
import { getAuthHeaders } from '../services/authHelper';
import styles from './Dashboard.module.css';
import { Users, Plus, Trash2, Mail, UserPlus, Edit2 } from 'lucide-react';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingUserId, setEditingUserId] = useState(null);
    const [newUser, setNewUser] = useState({ name: '', email: '', role: 'User', password: '' });
    const [loading, setLoading] = useState(true);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/admin/users', {
                headers: getAuthHeaders()
            });
            const data = await res.json();
            setUsers(data.filter(u => u.role === 'User'));
        } catch (err) {
            console.error("Failed to fetch users", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleAddUser = async (e) => {
        e.preventDefault();
        try {
            const url = isEditMode ? `/api/admin/users/${editingUserId}` : '/api/admin/users';
            const method = isEditMode ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method: method,
                headers: getAuthHeaders(),
                body: JSON.stringify(newUser)
            });
            if (res.ok) {
                setIsAddModalOpen(false);
                setIsEditMode(false);
                setEditingUserId(null);
                setNewUser({ name: '', email: '', role: 'User', password: '' });
                fetchUsers();
            } else {
                const error = await res.json();
                alert(error.detail || `Failed to ${isEditMode ? 'update' : 'add'} user.`);
            }
        } catch (err) {
            console.error(`${isEditMode ? 'Update' : 'Add'} user failed`, err);
        }
    };

    const handleEditClick = (user) => {
        setIsEditMode(true);
        setEditingUserId(user.id);
        setNewUser({
            name: user.name,
            email: user.email,
            role: user.role,
            password: '' 
        });
        setIsAddModalOpen(true);
    };

    const openCreateModal = () => {
        setIsEditMode(false);
        setEditingUserId(null);
        setNewUser({ name: '', email: '', role: 'User', password: '' });
        setIsAddModalOpen(true);
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm("Are you sure you want to delete this user account?")) return;
        try {
            const res = await fetch(`/api/admin/users/${id}`, { 
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            if (res.ok) fetchUsers();
        } catch (err) {
            console.error("Delete user failed", err);
        }
    };

    return (
        <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#3B82F6' }}>Manage Standard Users</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Oversee all standard contract users and their system access.</p>
                </div>
                <button 
                    onClick={openCreateModal}
                    style={{ 
                        display: 'flex', alignItems: 'center', gap: '8px',
                        background: '#3B82F6', color: '#fff',
                        padding: '10px 20px', borderRadius: '8px', border: 'none',
                        fontWeight: '700', cursor: 'pointer'
                    }}
                >
                    <UserPlus size={18} /> Add New User
                </button>
            </div>

            <div className={styles.tableCard}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Department</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '48px' }}>Loading...</td></tr>
                        ) : users.length > 0 ? users.map(user => (
                            <tr key={user.id}>
                                <td className={styles.titleCell}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3B82F6' }}>
                                            <Users size={16} />
                                        </div>
                                        {user.name}
                                    </div>
                                </td>
                                <td>{user.email}</td>
                                <td>General</td>
                                <td><span className={styles.statusBadge} style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981' }}>{user.status}</span></td>
                                 <td>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button 
                                            onClick={() => handleEditClick(user)}
                                            style={{ background: 'none', border: 'none', color: '#3B82F6', cursor: 'pointer', padding: '4px' }}
                                            title="Edit User"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteUser(user.id)}
                                            style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '4px' }}
                                            title="Delete User"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>No standard users found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isAddModalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: 'var(--bg-card)', padding: '32px', borderRadius: '16px', width: '450px', border: '1px solid var(--border-color)' }}>
                        <h3 style={{ marginBottom: '24px', fontSize: '20px', fontWeight: '700' }}>
                            {isEditMode ? 'Edit Standard User' : 'Add New Standard User'}
                        </h3>
                        <form onSubmit={handleAddUser}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>Full Name</label>
                                <input 
                                    type="text" required value={newUser.name}
                                    onChange={e => setNewUser({...newUser, name: e.target.value})}
                                    style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#fff' }}
                                />
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>Email Address</label>
                                <input 
                                    type="email" required value={newUser.email}
                                    onChange={e => setNewUser({...newUser, email: e.target.value})}
                                    style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#fff' }}
                                />
                            </div>
                             <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>
                                    Password {isEditMode && '(Leave blank to keep current)'}
                                </label>
                                <input 
                                    type="password" required={!isEditMode} value={newUser.password}
                                    onChange={e => setNewUser({...newUser, password: e.target.value})}
                                    style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#fff' }}
                                />
                            </div>
                             <div style={{ display: 'flex', gap: '12px' }}>
                                <button type="button" onClick={() => setIsAddModalOpen(false)} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: '#fff', cursor: 'pointer' }}>Cancel</button>
                                <button type="submit" style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: '#3B82F6', color: '#fff', fontWeight: '700', cursor: 'pointer' }}>
                                    {isEditMode ? 'Update User' : 'Create User'}
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
