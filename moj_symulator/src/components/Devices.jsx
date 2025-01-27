import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './styles/Devices.css';

export default function Devices() {
    const navigate = useNavigate();
    const { userId } = useParams();
    const [devices, setDevices] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredDevices, setFilteredDevices] = useState([]);
    const [newDevice, setNewDevice] = useState({
        name: '',
        type: 'light',
        status: 'off',
    });

    const fetchDevices = async () => {
        try {2  
            const response = await fetch(`http://localhost:3000/devices/${userId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch devices');
            }
            const data = await response.json();
            setDevices(data);
            setFilteredDevices(data);
        } catch (error) {
            console.log('Error while fetching devices:', error);
        }
    };

    const handleDeleteDevice = async (id) => {
        try {
            const response = await fetch(`http://localhost:3000/devices/${userId}/${id}`, {
                method: 'DELETE',
            });
            if (response.ok) {
                setDevices((prevDevices) => prevDevices.filter((device) => device.id !== id));
                setFilteredDevices((prevDevices) => prevDevices.filter((device) => device.id !== id));
            } else {
                console.log('Failed to delete the device');
            }
        } catch (error) {
            console.log('Error while deleting device:', error);
        }
    };

    const handleSearch = async (query) => {
        console.log(userId); // debug
    
        setSearchQuery(query);
        if (query.trim() === '') {
            setFilteredDevices(devices);
        } else {
            try {
                const response = await fetch(`http://localhost:3000/devices/search/${userId}?query=${encodeURIComponent(query)}`);
                if (response.ok) {
                    const data = await response.json();
                    setFilteredDevices(data);
                } else {
                    console.log('Failed to search for devices');
                }
            } catch (error) {
                console.log('Error while searching for devices:', error);
            }
        }
    };
    
    const handleDeviceClick = (id) => {
        navigate(`/device/${userId}/${id}`); 
    };
    

    const handleAddDevice = async () => {
        try {
            const response = await fetch(`http://localhost:3000/devices`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ ...newDevice, userId }),
            });

            if (response.ok) {
                const addedDevice = await response.json();
                setDevices((prevDevices) => [...prevDevices, addedDevice]);
                setFilteredDevices((prevDevices) => [...prevDevices, addedDevice]);
                setNewDevice({ name: '', type: 'light', status: 'off' });
            } else {
                console.log('Failed to add the device');
            }
        } catch (error) {
            console.log('Error while adding a device:', error);
        }
    };

    useEffect(() => {
        if (userId) {
            fetchDevices();
        } else {
            console.log('User not logged in');
            navigate('/login');
        }
    }, [userId]);

    return (
        <div className="devices">
            <div className="search-bar">
                <input
                    type="text"
                    placeholder="Search devices by name or status..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                />
            </div>

            <div className="add-device-form">
                <h3>Add a New Device</h3>
                <input
                    type="text"
                    placeholder="Device name"
                    value={newDevice.name}
                    onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })}
                />
                <select
                    value={newDevice.type}
                    onChange={(e) => setNewDevice({ ...newDevice, type: e.target.value })}
                >
                    <option value="light">Light</option>
                    <option value="thermostat">Thermostat</option>
                    <option value="sound">Sound</option>
                    <option value="accessory">Accessory</option>
                    <option value="fan">Fan</option>
                    <option value="others">Others</option>
                </select>
                <select
                    value={newDevice.status}
                    onChange={(e) => setNewDevice({ ...newDevice, status: e.target.value })}
                >
                    <option value="on">On</option>
                    <option value="off">Off</option>
                </select>
                <button onClick={handleAddDevice}>Add Device</button>
            </div>

            <ul>
                {filteredDevices.map((device, index) => (
                    <li key={index} className="device-item" onClick={() => handleDeviceClick(device.id)}>
                        <div>
                            <b>Name:</b> {device.name}, <b>Status:</b> {device.status}
                        </div>
                        <button
                            className="delete-button"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteDevice(device.id);
                            }}
                        >
                            Delete
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}
