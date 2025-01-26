import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles/Devices.css';

export default function Devices() {
    const navigate = useNavigate();
    const [devices, setDevices] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredDevices, setFilteredDevices] = useState([]);

    const fetchDevices = async () => {
        try {
            const response = await fetch('http://localhost:3000/devices');
            if (!response.ok) {
                throw new Error('We could not fetch the data for devices');
            }
            const data = await response.json();
            setDevices(data);
            setFilteredDevices(data);
        } catch (error) {
            console.log('Error when fetching devices:', error);
        }
    };

    const handleDeleteDevice = async (id) => {
        try {
            const response = await fetch(`http://localhost:3000/devices/${id}`, {
                method: 'DELETE',
            });
            if (response.ok) {
                setDevices((prevDevices) => prevDevices.filter((device) => device.id !== id));
                setFilteredDevices((prevDevices) => prevDevices.filter((device) => device.id !== id));
            } else {
                console.log('Error when deleting device');
            }
        } catch (error) {
            console.log('Error when deleting device:', error);
        }
    };

    const handleSearch = async (query) => {
        setSearchQuery(query);

        if (query.trim() === '') {
            setFilteredDevices(devices);
        } else {
            try {
                const response = await fetch(`http://localhost:3000/devices/search?query=${query}`);
                if (response.ok) {
                    const data = await response.json();
                    setFilteredDevices(data);
                } else {
                    console.log('Error when searching for devices');
                }
            } catch (error) {
                console.log('Error when searching for devices:', error);
            }
        }
    };

    const handleDeviceClick = (id) => {
        navigate(`/device/${id}`);
    };

    useEffect(() => {
        fetchDevices();
    }, []);

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
