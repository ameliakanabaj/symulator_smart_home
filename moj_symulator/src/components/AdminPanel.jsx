import React, { useState, useEffect } from 'react';
import './styles/AdminPanel.css';
import Header from './Header';

export default function AdminPanel() {
    const [admins, setAdmins] = useState([]);
    const [newAdminEmail, setNewAdminEmail] = useState('');
    const [editAdminEmail, setEditAdminEmail] = useState('');
    const [adminToEdit, setAdminToEdit] = useState(null);
    const [users, setUsers] = useState([]);
    const [newUser, setNewUser] = useState({ userId: '', email: '', firstName: '', lastName: '' });
    const [editUser, setEditUser] = useState(null);
    const [reports, setReports] = useState([]);
    const [editReport, setEditReport] = useState(null);
    const [error, setError] = useState("");

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

    const fetchReports = async () => {
        try {
            const response = await fetch('https://localhost:3000/reports');
            const data = await response.json();
            if (response.ok) {
                setReports(data);
            } else {
                console.log('Failed to fetch reports');
            }
        } catch (error) {
            console.log('Error during fetching reports:', error);
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

    const handleDeleteAdmin = async (admin) => {
        try {
            const response = await fetch(`https://localhost:3000/admins/${admin.email}`, { method: 'DELETE' });
            if (response.ok) {
                setAdmins((prevAdmins) => prevAdmins.filter((a) => a.email !== admin.email));
                setUsers([...users, admin]);
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
                setUsers((prevUsers) => prevUsers.filter((u) => u.email !== newAdminEmail));
                setNewAdminEmail('');
            } else {
                setError("No user with this email");
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
                setAdmins((prevAdmins) =>
                    prevAdmins.map((admin) =>
                        admin.email === adminToEdit ? { ...admin, email: editAdminEmail } : admin
                    )
                );
                setAdminToEdit(null);
                setEditAdminEmail('');
            }
        } catch (error) {
            console.log('Error while editing admin:', error);
        }
    };

    const handleDeleteUser = async (id) => {
        try {
            if (isNaN(id)) {
                console.error('Invalid user ID');
                return;
            }
    
            const response = await fetch(`https://localhost:3000/api/users/${id}`, { method: 'DELETE' });
    
            if (!response.ok) {
                const errorData = await response.json();
                console.log('Error while deleting user:', errorData);
                return;
            }
    
            const data = await response.json();
            setUsers((prevUsers) => prevUsers.filter((user) => user.userId !== id));
    
        } catch (error) {
            console.log('Error while deleting user:', error);
        }
    };
    

    const handleAddUser = async () => {
        const userId = parseInt(newUser.userId, 10); 

        if (isNaN(userId)) {
            console.error('User ID must be an integer');
            return;
        }

        try {
            const response = await fetch('https://localhost:3000/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...newUser, userId: userId }),
            });
    
            if (response.ok) {
                const data = await response.json();
                setUsers((prevUsers) => [...prevUsers, data.user]); 
                setNewUser({ userId: '', email: '', firstName: '', lastName: '', password: '' });
            } else {
                const errorData = await response.json();
                console.error('Error adding user:', errorData.error);
            }
        } catch (error) {
            console.log('Error while adding user:', error);
        }
    };    

    const handleEditUser = async () => {
        try {
            const updatedUserData = {};
    
            if (editUser.email) updatedUserData.email = editUser.email;
            if (editUser.firstName) updatedUserData.firstName = editUser.firstName;
            if (editUser.lastName) updatedUserData.lastName = editUser.lastName;
    
            const response = await fetch(`https://localhost:3000/api/users/${editUser.userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedUserData),
            });
    
            if (response.ok) {
                const data = await response.json();
                setUsers((prevUsers) =>
                    prevUsers.map((user) => (user.userId === editUser.userId ? data.user : user))
                );
                setEditUser(null); 
            } else {
                const errorData = await response.json();
                console.log('Error while editing user:', errorData);
            }
        } catch (error) {
            console.log('Error while editing user:', error);
        }
    };

    const handleDeleteReport = async (id) => {
        try {
            const response = await fetch(`https://localhost:3000/reports/${id}`, { method: 'DELETE' });
            if (response.ok) {
                setReports((prevReports) => prevReports.filter((report) => report.id !== id));
            }
        } catch (error) {
            console.log('Error while deleting report:', error);
        }
    };

    const handleEditReport = async () => {
        try {
            const response = await fetch(`https://localhost:3000/reports/${editReport.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: editReport.content }),
            });
            if (response.ok) {
                setReports((prevReports) =>
                    prevReports.map((report) =>
                        report.id === editReport.id ? { ...report, content: editReport.content } : report
                    )
                );
                setEditReport(null);
            }
        } catch (error) {
            console.log('Error while editing report:', error);
        }
    };
    

    useEffect(() => {
        fetchAdmins();
        fetchUsers();
        fetchReports();
    }, []);

    return (
        <div className="admin-panel">
            <Header/>
            <div className="section">
                <h2>Administrators</h2>
                <ul>
                    {admins.map((admin, index) => (
                        <li key={index}>
                            {admin.email}
                            <button onClick={() => handleDeleteAdmin(admin)}>Delete</button>
                            <button onClick={() => setAdminToEdit(admin.email)}>Edit</button>
                        </li>
                    ))}
                </ul>
                {error && (<div className='error'>{error}</div>)}
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
                    {users.map((user, index) => (
                        <li key={index}>

                            {user.email} - {user.firstName} {user.lastName}
                            <button onClick={() => handleDeleteUser(user.userId)}>Delete</button>
                            <button onClick={() => setEditUser(user)}>Edit</button>
                        </li>
                    ))}
                </ul>
                <div>
                    <input
                        type="text"
                        placeholder="ID"
                        value={newUser.userId}
                        onChange={(e) => setNewUser({ ...newUser, userId: e.target.value })}
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
                    <input
                        type="password"
                        placeholder="Password"
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
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

            <div className='reports'>
                <h2>Reports</h2>
                {editReport && (
                    <div>
                        <textarea
                            value={editReport.content}
                            onChange={(e) => setEditReport({ ...editReport, content: e.target.value })}
                        />
                        <button onClick={handleEditReport}>Save</button>
                        <button onClick={() => setEditReport(null)}>Cancel</button>
                    </div>
                )}
                <ul>
                    {reports.map((report) => (
                        <li key={report.id}>
                            <b>User ID:</b> <div className='report'>{report.userId}</div>
                            <b>Device ID:</b> <div className='report'>{report.id}</div>
                            <b>Report message:</b> <div className='report'>{report.content}</div>
                            <button onClick={() => handleDeleteReport(report.id)}>Delete</button>
                            <button onClick={() => setEditReport(report)}>Edit</button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
