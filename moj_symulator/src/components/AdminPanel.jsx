import React, { useState, useEffect } from 'react';

export default function AdminPanel() {
    const [admins, setAdmins] = useState([]);
    const [newAdminEmail, setNewAdminEmail] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [emailToEdit, setEmailToEdit] = useState(null);

    const fetchAdmins = async () => {
        try {
            const response = await fetch('http://localhost:3000/admins');
            const data = await response.json();

            if (response.ok) {
                console.log('Fetched admins:', data); // debug
                setAdmins(data);
            } else {
                console.log('Failed to fetch admins');
            }
        } catch (error) {
            console.log('Error during fetching admins:', error);
        }
    };

    const handleDeleteClick = async (email) => {
        try {
            const response = await fetch(`http://localhost:3000/admins/${email}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setAdmins((prevAdmins) => prevAdmins.filter((admin) => admin !== email));
            } else {
                console.log('Failed to delete the admin');
            }
        } catch (error) {
            console.log('Error while deleting the admin:', error);
        }
    };

    const handlePostClick = async () => {
        try {
            const response = await fetch('http://localhost:3000/admins', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: newAdminEmail }),
            });

            if (response.ok) {
                const data = await response.json();
                setAdmins(data.admins);
                setNewAdminEmail(''); 
            } else {
                console.log('Failed to add the admin');
            }
        } catch (error) {
            console.log('Error while adding an admin:', error);
        }
    };

    const handleEditClick = (email) => {
        setEmailToEdit(email);
        setEditEmail(email)
    };

    const handleUpdateClick = async () => {
        try {
            const response = await fetch(`http://localhost:3000/admins/${emailToEdit}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ newEmail: editEmail }),
            });

            if (response.ok) {
                const data = await response.json();
                setAdmins(data.admins);
                setEmailToEdit(null); 
                setEditEmail('');
            } else {
                console.log('Failed to update the admin');
            }
        } catch (error) {
            console.log('Error while updating the admin:', error);
        }
    };

    useEffect(() => {
        fetchAdmins();
    }, []);

    return (
        <div className="admin-panel">
            <div className="admins">
                <h2>Administrators:</h2>
                <ul>
                    {admins.map((admin, index) => (
                        <li key={index}>
                            <b>Email:</b> {admin}
                            <button onClick={() => handleDeleteClick(admin)}>Delete</button>
                            <button onClick={() => handleEditClick(admin)}>Edit</button>
                        </li>
                    ))}
                </ul>

                <div>
                    <h3>Add a New Administrator</h3>
                    <input
                        type="email"
                        placeholder="New admin email"
                        value={newAdminEmail}
                        onChange={(e) => setNewAdminEmail(e.target.value)}
                    />
                    <button onClick={handlePostClick}>Add</button>
                </div>

                {emailToEdit && (
                    <div>
                        <h3>Edit Administrator</h3>
                        <input
                            type="email"
                            placeholder="New email"
                            value={editEmail}
                            onChange={(e) => setEditEmail(e.target.value)}
                        />
                        <button onClick={handleUpdateClick}>Update</button>
                        <button onClick={() => setEmailToEdit(null)}>Cancel</button>
                    </div>
                )}
            </div>
        </div>
    );
}
