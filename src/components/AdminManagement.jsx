import React, { useState, useEffect } from 'react';
import { getAuthHeaders } from '../services/authHelper';
import styles from './Dashboard.module.css'; // Reusing some table styles
import { Shield, Plus, Trash2, Mail, User as UserIcon, Edit2 } from 'lucide-react';

const AdminManagement = () => {
    const [admins, setAdmins] = useState([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingAdminId, setEditingAdminId] = useState(null);
    const [newAdmin, setNewAdmin] = useState({ name: '', email: '', role: 'Admin', password: '' });
    const [loading, setLoading] = useState(true);

    const fetchAdmins = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/admin/users', {
                headers: getAuthHeaders()
            });
            const data = await res.json();
            // Filter only admin-like roles
            const adminRoles = ['Admin', 'Legal', 'Finance', 'Compliance', 'Procurement', 'Manager', 'CEO'];
            setAdmins(data.filter(u => adminRoles.includes(u.role)));
        } catch (err) {
            console.error("Failed to fetch admins", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdmins();
    }, []);

    const handleAddAdmin = async (e) => {
        e.preventDefault();
        try {
            const url = isEditMode ? `/api/admin/users/${editingAdminId}` : '/api/admin/users';
            const method = isEditMode ? 'PUT' : 'POST';
            
            const res = await fetch(url, {
                method: method,
                headers: getAuthHeaders(),
                body: JSON.stringify(newAdmin)
            });
            if (res.ok) {
                setIsAddModalOpen(false);
                setIsEditMode(false);
                setEditingAdminId(null);
                setNewAdmin({ name: '', email: '', role: 'Admin', password: '' });
                fetchAdmins();
            } else {
                const error = await res.json();
                alert(error.detail || `Failed to ${isEditMode ? 'update' : 'add'} admin.`);
            }
        } catch (err) {
            console.error(`${isEditMode ? 'Update' : 'Add'} admin failed`, err);
        }
    };

    const handleEditClick = (admin) => {
        setIsEditMode(true);
        setEditingAdminId(admin.id);
        setNewAdmin({
            name: admin.name,
            email: admin.email,
            role: admin.role,
            password: '' // Don't pre-fill password for security, leave it empty unless they want to change it
        });
        setIsAddModalOpen(true);
    };

    const openCreateModal = () => {
        setIsEditMode(false);
        setEditingAdminId(null);
        setNewAdmin({ name: '', email: '', role: 'Admin', password: '' });
        setIsAddModalOpen(true);
    };

    const handleDeleteAdmin = async (id) => {
        if (!window.confirm("Are you sure you want to delete this admin account?")) return;
        try {
            const res = await fetch(`/api/admin/users/${id}`, { 
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            if (res.ok) fetchAdmins();
        } catch (err) {
            console.error("Delete admin failed", err);
        }
    };

    return (
        <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--accent-teal)' }}>Manage Administrators</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Configure system access for departmental leads and administrators.</p>
                </div>
                <button 
                    onClick={openCreateModal}
                    style={{ 
                        display: 'flex', alignItems: 'center', gap: '8px',
                        background: 'var(--accent-teal)', color: 'var(--bg-main)',
                        padding: '10px 20px', borderRadius: '8px', border: 'none',
                        fontWeight: '700', cursor: 'pointer'
                    }}
                >
                    <Plus size={18} /> Add New Admin
                </button>
            </div>

            <div className={styles.tableCard}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '48px' }}>Loading...</td></tr>
                        ) : admins.length > 0 ? admins.map(admin => (
                            <tr key={admin.id}>
                                <td className={styles.titleCell}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(0,201,177,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-teal)' }}>
                                            <Shield size={16} />
                                        </div>
                                        {admin.name}
                                    </div>
                                </td>
                                <td>{admin.email}</td>
                                <td><span className={styles.statusBadge} style={{ background: 'rgba(59,130,246,0.1)', color: '#3B82F6' }}>{admin.role}</span></td>
                                <td><span className={styles.statusBadge} style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981' }}>{admin.status}</span></td>
                                 <td>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button 
                                            onClick={() => handleEditClick(admin)}
                                            style={{ background: 'none', border: 'none', color: 'var(--accent-teal)', cursor: 'pointer', padding: '4px' }}
                                            title="Edit Admin"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteAdmin(admin.id)}
                                            style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '4px' }}
                                            title="Delete Admin"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>No admin accounts found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isAddModalOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: 'var(--bg-card)', padding: '32px', borderRadius: '16px', width: '450px', border: '1px solid var(--border-color)' }}>
                        <h3 style={{ marginBottom: '24px', fontSize: '20px', fontWeight: '700' }}>
                            {isEditMode ? 'Edit Administrative User' : 'Add New Administrative User'}
                        </h3>
                        <form onSubmit={handleAddAdmin}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>Full Name</label>
                                <input 
                                    type="text" required value={newAdmin.name}
                                    onChange={e => setNewAdmin({...newAdmin, name: e.target.value})}
                                    style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#fff' }}
                                />
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>Email Address</label>
                                <input 
                                    type="email" required value={newAdmin.email}
                                    onChange={e => setNewAdmin({...newAdmin, email: e.target.value})}
                                    style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#fff' }}
                                />
                            </div>
                             <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>
                                    Password {isEditMode && '(Leave blank to keep current)'}
                                </label>
                                <input 
                                    type="password" required={!isEditMode} value={newAdmin.password}
                                    onChange={e => setNewAdmin({...newAdmin, password: e.target.value})}
                                    style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#fff' }}
                                />
                            </div>
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>Role</label>
                                <select 
                                    value={newAdmin.role}
                                    onChange={e => setNewAdmin({...newAdmin, role: e.target.value})}
                                    style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#fff' }}
                                >
                                    <option value="Admin">General Admin</option>
                                    <option value="Legal">Legal Counsel</option>
                                    <option value="Finance">Finance Lead</option>
                                    <option value="Compliance">Compliance Officer</option>
                                    <option value="Procurement">Procurement Lead</option>
                                </select>
                            </div>
                             <div style={{ display: 'flex', gap: '12px' }}>
                                <button type="button" onClick={() => setIsAddModalOpen(false)} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: '#fff', cursor: 'pointer' }}>Cancel</button>
                                <button type="submit" style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: 'var(--accent-teal)', color: 'var(--bg-main)', fontWeight: '700', cursor: 'pointer' }}>
                                    {isEditMode ? 'Update Admin' : 'Create Admin'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminManagement;
