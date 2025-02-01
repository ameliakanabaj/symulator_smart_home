import React, { useState, useEffect } from 'react';
import './styles/AdminPanel.css';
import Header from './Header';

export default function AdminPanel() {
    const [admins, setAdmins] = useState([]);
    const [newAdminEmail, setNewAdminEmail] = useState('');
    const [editAdminEmail, setEditAdminEmail] = useState('');
    const [adminToEdit, setAdminToEdit] = useState(null);

    const [users, setUsers] = useState([]);
    const [newUser, setNewUser] = useState({ id: '', email: '', firstName: '', lastName: '' });
    const [editUser, setEditUser] = useState(null);

    const fetchAdmins = async () => {
        try {
            const response = await fetch('https://localhost:3000/admins');
            const data = await response.json();

            if (response.ok) {
                setAdmins(data);
            } else {
                console.log('Failed to fetch admins');
            }
        } catch (error) {
            console.log('Error during fetching admins:', error);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await fetch('https://localhost:3000/api/users');
            const data = await response.json();

            if (response.ok) {
                setUsers(data);
            } else {
                console.log('Failed to fetch users');
            }
        } catch (error) {
            console.log('Error during fetching users:', error);
        }
    };

    const handleDeleteAdmin = async (email) => {
        try {
            const response = await fetch(`https://localhost:3000/admins/${email}`, { method: 'DELETE' });
            if (response.ok) {
                setAdmins((prevAdmins) => prevAdmins.filter((admin) => admin !== email));
            }
        } catch (error) {
            console.log('Error while deleting admin:', error);
        }
    };

    const handleAddAdmin = async () => {
        try {
            const response = await fetch('https://localhost:3000/admins', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: newAdminEmail }),
            });
            if (response.ok) {
                const data = await response.json();
                setAdmins(data.admins);
                setNewAdminEmail('');
            }
        } catch (error) {
            console.log('Error while adding admin:', error);
        }
    };

    const handleEditAdmin = async () => {
        try {
            const response = await fetch(`https://localhost:3000/admins/${adminToEdit}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newEmail: editAdminEmail }),
            });
            if (response.ok) {
                const data = await response.json();
                setAdmins(data.admins);
                setAdminToEdit(null);
                setEditAdminEmail('');
            }
        } catch (error) {
            console.log('Error while editing admin:', error);
        }
    };

    const handleDeleteUser = async (id) => {
        try {
            const response = await fetch(`https://localhost:3000/api/users/${id}`, { method: 'DELETE' });
            if (response.ok) {
                setUsers((prevUsers) => prevUsers.filter((user) => user.id !== id));
            }
        } catch (error) {
            console.log('Error while deleting user:', error);
        }
    };

    const handleAddUser = async () => {
        try {
            const response = await fetch('https://localhost:3000/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUser),
            });
            if (response.ok) {
                const data = await response.json();
                setUsers((prevUsers) => [...prevUsers, data.user]);
                setNewUser({ id: '', email: '', firstName: '', lastName: '' });
            }
        } catch (error) {
            console.log('Error while adding user:', error);
        }
    };

    const handleEditUser = async () => {
        try {
            const response = await fetch(`https://localhost:3000/api/users/${editUser.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editUser),
            });
            if (response.ok) {
                const data = await response.json();
                setUsers((prevUsers) =>
                    prevUsers.map((user) => (user.id === editUser.id ? data.user : user))
                );
                setEditUser(null);
            }
        } catch (error) {
            console.log('Error while editing user:', error);
        }
    };

    useEffect(() => {
        fetchAdmins();
        fetchUsers();
    }, []);

    return (
        <div className="admin-panel">
            <Header/>
            <div className="section">
                <h2>Administrators</h2>
                <ul>
                    {admins.map((admin, index) => (
                        <li key={index}>
                            {admin}
                            <button onClick={() => handleDeleteAdmin(admin)}>Delete</button>
                            <button onClick={() => setAdminToEdit(admin)}>Edit</button>
                        </li>
                    ))}
                </ul>
                <input
                    type="email"
                    placeholder="New admin email"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                />
                <button onClick={handleAddAdmin}>Add Admin</button>

                {adminToEdit && (
                    <div>
                        <input
                            type="email"
                            value={editAdminEmail}
                            placeholder='Set new email'
                            onChange={(e) => setEditAdminEmail(e.target.value)}
                        />
                        <button onClick={handleEditAdmin}>Save</button>
                        <button onClick={() => setAdminToEdit(null)}>Cancel</button>
                    </div>
                )}
            </div>

            <div className="section">
                <h2>Users</h2>
                <ul>
                    {users.map((user) => (
                        <li key={user.id}>
                            {user.email} - {user.firstName} {user.lastName}
                            <button onClick={() => handleDeleteUser(user.id)}>Delete</button>
                            <button onClick={() => setEditUser(user)}>Edit</button>
                        </li>
                    ))}
                </ul>
                <div>
                    <input
                        type="text"
                        placeholder="ID"
                        value={newUser.id}
                        onChange={(e) => setNewUser({ ...newUser, id: e.target.value })}
                    />
                    <input
                        type="email"
                        placeholder="Email"
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    />
                    <input
                        type="text"
                        placeholder="First Name"
                        value={newUser.firstName}
                        onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                    />
                    <input
                        type="text"
                        placeholder="Last Name"
                        value={newUser.lastName}
                        onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                    />
                    <button onClick={handleAddUser}>Add User</button>
                </div>

                {editUser && (
                    <form onSubmit={(e) => { e.preventDefault(); handleEditUser(); }}>
                        <h3>Edit User</h3>
                        <div className="form-group">
                            <label>Email:</label>
                            <input
                                type="email"
                                value={editUser.email}
                                onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>First Name:</label>
                            <input
                                type="text"
                                value={editUser.firstName}
                                onChange={(e) => setEditUser({ ...editUser, firstName: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Last Name:</label>
                            <input
                                type="text"
                                value={editUser.lastName}
                                onChange={(e) => setEditUser({ ...editUser, lastName: e.target.value })}
                            />
                        </div>
                        <div className="form-actions">
                            <button type="submit" className="btn-save">Save</button>
                            <button type="button" className="btn-cancel" onClick={() => setEditUser(null)}>Cancel</button>
                        </div>
                    </form>
                )}

            </div>
        </div>
    );
}
