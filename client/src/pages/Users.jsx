import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Users() {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [newUser, setNewUser] = useState({ username: '', password: '', role: 'user' });
    const [editUser, setEditUser] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        if (user?.role === 'admin') {
            fetchUsers();
        }
    }, [user]);

    const fetchUsers = async () => {
        const token = localStorage.getItem('token');
        const hostname = window.location.hostname;
        const response = await fetch(`http://${hostname}:3001/api/users`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const result = await response.json();
            setUsers(result);
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setError('');

        const userData = editUser ? editUser : newUser;

        if (!userData.username || (!editUser && !userData.password)) {
            setError('Username and password are required');
            return;
        }

        const token = localStorage.getItem('token');
        const hostname = window.location.hostname;

        if (editUser) {
            // Update existing user
            const response = await fetch(`http://${hostname}:3001/api/users/${editUser.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    username: editUser.username,
                    role: editUser.role,
                    ...(editUser.password && { password: editUser.password })
                })
            });

            if (response.ok) {
                setShowModal(false);
                setEditUser(null);
                fetchUsers();
            } else {
                const data = await response.json();
                setError(data.error || 'Failed to update user');
            }
        } else {
            // Create new user
            const response = await fetch(`http://${hostname}:3001/api/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newUser)
            });

            if (response.ok) {
                setShowModal(false);
                setNewUser({ username: '', password: '', role: 'user' });
                fetchUsers();
            } else {
                const data = await response.json();
                setError(data.error || 'Failed to create user');
            }
        }
    };

    const openEditModal = (user) => {
        setEditUser({ ...user, password: '' });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditUser(null);
        setNewUser({ username: '', password: '', role: 'user' });
        setError('');
    };

    if (user?.role !== 'admin') {
        return <div style={{ padding: '2rem', color: '#ff4757' }}>Access Denied: Admin only</div>;
    }

    return (
        <div style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ color: 'var(--accent-color)', margin: 0 }}>User Management</h1>
                <button
                    className="pos-action-btn"
                    onClick={() => setShowModal(true)}
                    style={{ width: 'auto', padding: '0.75rem 1.5rem' }}
                >
                    + New User
                </button>
            </div>

            <div style={{ background: 'var(--bg-secondary)', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '2px solid var(--border-color)' }}>
                            <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--accent-color)', fontWeight: '600' }}>ID</th>
                            <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--accent-color)', fontWeight: '600' }}>USERNAME</th>
                            <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--accent-color)', fontWeight: '600' }}>ROLE</th>
                            <th style={{ padding: '1rem', textAlign: 'center', color: 'var(--accent-color)', fontWeight: '600' }}>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((u) => (
                            <tr
                                key={u.id}
                                style={{
                                    borderBottom: '1px solid var(--border-color)',
                                    transition: 'background 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                                <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>#{u.id}</td>
                                <td style={{ padding: '1rem', color: 'var(--text-primary)', fontWeight: '500' }}>{u.username}</td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{
                                        display: 'inline-block',
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '12px',
                                        fontSize: '0.85rem',
                                        fontWeight: '600',
                                        background: u.role === 'admin' ? 'rgba(255, 107, 107, 0.2)' : 'rgba(87, 242, 135, 0.2)',
                                        color: u.role === 'admin' ? '#ff6b6b' : '#57f287'
                                    }}>
                                        {u.role.toUpperCase()}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'center' }}>
                                    <button
                                        onClick={() => openEditModal(u)}
                                        title="Edit User"
                                        style={{
                                            background: 'var(--accent-color)',
                                            color: 'var(--bg-primary)',
                                            border: 'none',
                                            padding: '0.5rem 1rem',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontWeight: '600',
                                            fontSize: '0.9rem',
                                            transition: 'opacity 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                                        onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                                    >
                                        ✎ Edit
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="overlay" onClick={closeModal}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                        <h2 style={{ marginTop: 0, color: 'var(--accent-color)' }}>
                            {editUser ? 'Edit User' : 'Create New User'}
                        </h2>

                        {error && <div className="error">{error}</div>}

                        <form onSubmit={handleCreateUser}>
                            <div className="form-group">
                                <label>Username</label>
                                <input
                                    type="text"
                                    value={editUser ? editUser.username : newUser.username}
                                    onChange={(e) => editUser
                                        ? setEditUser({ ...editUser, username: e.target.value })
                                        : setNewUser({ ...newUser, username: e.target.value })
                                    }
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Password {editUser && '(leave blank to keep current)'}</label>
                                <input
                                    type="password"
                                    value={editUser ? editUser.password : newUser.password}
                                    onChange={(e) => editUser
                                        ? setEditUser({ ...editUser, password: e.target.value })
                                        : setNewUser({ ...newUser, password: e.target.value })
                                    }
                                    required={!editUser}
                                />
                            </div>

                            <div className="form-group">
                                <label>Role</label>
                                <select
                                    className="pos-input"
                                    value={editUser ? editUser.role : newUser.role}
                                    onChange={(e) => editUser
                                        ? setEditUser({ ...editUser, role: e.target.value })
                                        : setNewUser({ ...newUser, role: e.target.value })
                                    }
                                    style={{ width: '100%', padding: '1rem' }}
                                >
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    style={{ flex: 1, padding: '0.75rem', background: '#555', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="pos-action-btn"
                                    style={{ flex: 1, padding: '0.75rem', width: 'auto' }}
                                >
                                    {editUser ? 'Update User' : 'Create User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
