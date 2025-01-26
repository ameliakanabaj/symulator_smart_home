import React, { useEffect } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles/Devices.css';

export default function Devices() {
    const navigate = useNavigate();
    const [devices, setDevices] = useState([]);

    
    const fetchDevices = async () => {
        try {
            const response = await fetch('http://localhost:3000/devices');
            if (!response.ok) {
                throw new Error('We could not fetch the data for devices');
            }
            const data = await response.json();
            console.log(data[0].name);//debug
            setDevices(data);
        } catch (error) {
            console.log('Error when fetching devices:', error);
        }
    };

    const handleDeviceClick = (id) => {
        console.log(id);//debug
        navigate(`/device/${id}`)
    }

    useEffect(() => {
        fetchDevices();
    }, []);

    return (
        <div className='devices'>
            <ul>
                {devices.map((device, index) => (
                    <li key={index} onClick={() => handleDeviceClick(device.id)}>
                        <div>
                            <b>Name:</b> {device.name}, <b>Status: </b>{device.status}
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    )
}