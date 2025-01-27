import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './styles/Device.css';

export default function Device() {
    const navigate = useNavigate();
    const { id } = useParams(); 
    const { userId } = useParams(); 
    const [device, setDevice] = useState(null); 
    const [loading, setLoading] = useState(true); 
    const [error, setError] = useState(null); 

    useEffect(() => {
        fetch(`http://localhost:3000/devices/${userId}/${id}`)
        .then((response) => response.json())
        .then((data) => {
            setDevice(data); 
            setLoading(false); 
        })
        .catch((err) => {
            setError('Could not fetch device');
            setLoading(false);
        });
    }, [id]); 

    const handleChange = (field, value) => {
        setDevice({
        ...device,
        [field]: value,
        });
    };

    const handleSave = () => {
        fetch(`http://localhost:3000/devices/${userId}/${id}`, { 
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ...device, userId }),
        })
        .then((response) => response.json())
        .then((updatedDevice) => {
            setDevice(updatedDevice);
            alert('Device successfully updated');
            navigate(`/devices/${userId}`);
        })
        .catch((err) => {
            setError('Could not update device');
        });
    };
    

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <div className='device-details'>
            <h1>{device.name}</h1>
            <p>Type: {device.type}</p>
            <p>Status: {device.status}</p>

            {device.type === 'light' && (
                <>
                <p>Brightness: {device.brightness}</p>
                <input
                    type="number"
                    value={device.brightness}
                    min="1"
                    max="100"
                    onChange={(e) => handleChange('brightness', e.target.value)}
                />
                </>
            )}

            {device.type === 'thermostat' && (
                <>
                <p>Temperature: {device.temperature}°C</p>
                <input
                    type="number"
                    value={device.temperature}
                    onChange={(e) => handleChange('temperature', e.target.value)}
                />
                </>
            )}

            {device.type === 'sound' && (
                <>
                <p>Volume: {device.volume}</p>
                <input
                    type="number"
                    value={device.volume}
                    min="1"
                    max="100"
                    onChange={(e) => handleChange('volume', e.target.value)}
                />
                </>
            )}

            {device.type === 'accessory' && (
                <>
                <p>Voulume: {device.volume}</p>
                <input
                    type="number"
                    value={device.volume}
                    min="1"
                    max="100"
                    onChange={(e) => handleChange('volume', e.target.value)}
                />
                <p>Channel: {device.channel}</p>
                <input
                    type="number"
                    value={device.channel}
                    onChange={(e) => handleChange('channel', e.target.value)}
                />
                </>
            )}

            {device.type === 'fan' && (
                <>
                <p>Speed: {device.speed}</p>
                <input
                    type="number"
                    value={device.speed}
                    min="1"
                    max="3"
                    onChange={(e) => handleChange('speed', e.target.value)}
                />
                </>
            )}

            <button onClick={handleSave}>Save changes</button>
        </div>
    );
}
