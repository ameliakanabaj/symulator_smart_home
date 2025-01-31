import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './styles/Device.css';

export default function Device() {
    const navigate = useNavigate();
    const { id, userId } = useParams();
    const [device, setDevice] = useState(null);
    const [schedule, setSchedule] = useState({ timeOn: '', timeOff: '' });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [ws, setWs] = useState(null);  
    const [deviceError, setDeviceError] = useState(null); 

    const updateDevice = (updatedData) => {
        fetch(`http://localhost:3000/devices/${userId}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatedData),
        })
        .then((response) => response.json())
        .then((updatedDevice) => {
            setDevice(updatedDevice);
            navigate(`/devices/${userId}`);
        })
        .catch(() => {
            setError('Could not update device');
        });
    };

    const connectWebSocket = () => {
        const socket = new WebSocket(`ws://localhost:3000`); 
        socket.onopen = () => {
            console.log("Connected to WebSocket");
            socket.send(JSON.stringify({ type: "subscribe", deviceId: id }));
        };

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.deviceId === id) {
                    if (data.status) {
                        setDevice((prev) => ({ ...prev, status: data.status }));
                    }

                    if (data.type === 'deviceError') {
                        setDeviceError(data.message); 
                    }
                }
            } catch (error) {
                console.error("Błąd parsowania wiadomości WebSocket:", error);
            }
        };

        socket.onerror = (error) => {
            console.error("Błąd WebSocket:", error);
        };

        socket.onclose = () => {
            console.log("Rozłączono z WebSocket");
        };

        setWs(socket);
    };

    useEffect(() => {
        connectWebSocket();  
        return () => {
            if (ws) {
                ws.close();  
            }
        };
    }, [id]);

    useEffect(() => {
        fetch(`http://localhost:3000/devices/${userId}/${id}`)
            .then((response) => response.json())
            .then((data) => {
                setDevice(data);
                setLoading(false);
            })
            .catch(() => {
                setError('Could not fetch device');
                setLoading(false);
            });
    }, [id, userId]);

    const toggleStatus = () => {
        const newStatus = device.status === 'on' ? 'off' : 'on';

        setDevice({ ...device, status: newStatus });
        updateDevice({ ...device, status: newStatus });

        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "updateStatus", deviceId: id, status: newStatus }));
        }

        alert(`Device successfully updated: ${newStatus}`);
    };

    const handleChange = (field, value) => {
        setDevice({
            ...device,
            [field]: value,
        });
    };

    const handleSave = () => {
        updateDevice({ ...device, userId });
    };

    const handleSaveSchedule = () => {
        if (!schedule.timeOn || !schedule.timeOff) {
            alert('Please provide both Time On and Time Off');
            return;
        }

        fetch(`http://localhost:3000/schedules/${userId}/${id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(schedule),
        })
            .then((response) => response.json())
            .then((data) => {
                setSchedule(data.schedule);
                alert('Schedule saved successfully');
            })
            .catch(() => console.error('Could not save schedule'));
    };

    const handleDeleteSchedule = () => {
        fetch(`http://localhost:3000/schedules/${userId}/${id}`, {
            method: 'DELETE',
        })
            .then(() => {
                setSchedule({ timeOn: '', timeOff: '' });
                alert('Schedule deleted successfully');
            })
            .catch(() => console.error('Could not delete schedule'));
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <div className='device-details'>
             {deviceError && <div className="error-message">{deviceError}</div>}
            <h1>{device.name}</h1>
            <p>Type: {device.type}</p>
            <p>Status: {device.status}</p>
            
            {device.type === 'light' && (
                <>
                    <p>Brightness: {device.brightness}</p>
                    <input
                        type="number"
                        value={device.brightness ?? 50}
                        min="1"
                        max="100"
                        onChange={(e) => handleChange('brightness', e.target.value)}
                    />
                    <button onClick={toggleStatus}>
                        {device.status === 'on' ? 'Turn Off' : 'Turn On'}
                    </button>
                </>
            )}

            {device.type === 'thermostat' && (
                <>
                    <p>Temperature: {device.temperature}°C</p>
                    <input
                        type="number"
                        value={device.temperature ?? 21}
                        onChange={(e) => handleChange('temperature', e.target.value)}
                    />
                    <button onClick={toggleStatus}>
                        {device.status === 'on' ? 'Turn Off' : 'Turn On'}
                    </button>
                </>
            )}

            {device.type === 'sound' && (
                <>
                    <p>Volume: {device.volume}</p>
                    <input
                        type="number"
                        value={device.volume ?? 50}
                        min="1"
                        max="100"
                        onChange={(e) => handleChange('volume', e.target.value)}
                    />
                    <button onClick={toggleStatus}>
                        {device.status === 'on' ? 'Turn Off' : 'Turn On'}
                    </button>
                </>
            )}

            {device.type === 'accessory' && (
                <>
                    <p>Voulume: {device.volume}</p>
                    <input
                        type="number"
                        value={device.volume ?? 50}
                        min="1"
                        max="100"
                        onChange={(e) => handleChange('volume', e.target.value)}
                    />
                    <p>Channel: {device.channel}</p>
                    <input
                        type="number"
                        value={device.channel ?? 1}
                        onChange={(e) => handleChange('channel', e.target.value)}
                    />
                    <button onClick={toggleStatus}>
                        {device.status === 'on' ? 'Turn Off' : 'Turn On'}
                    </button>
                </>
            )}

            {device.type === 'fan' && (
                <>
                    <p>Speed: {device.speed}</p>
                    <input
                        type="number"
                        value={device.speed ?? 1}
                        min="1"
                        max="3"
                        onChange={(e) => handleChange('speed', Number(e.target.value))}
                    />
                    <button onClick={toggleStatus}>
                        {device.status === 'on' ? 'Turn Off' : 'Turn On'}
                    </button>
                </>
            )}

            <button onClick={handleSave}>Save changes</button>

            <h2>Schedule</h2>
            <div>
                <label>Turning on time:</label>
                <input
                    type="time"
                    value={schedule.timeOn ?? ""} 
                    onChange={(e) => setSchedule({ ...schedule, timeOn: e.target.value })}
                />
            </div>
            <div>
                <label>Turning off time:</label>
                <input
                    type="time"
                    value={schedule.timeOff ?? ""}
                    onChange={(e) => setSchedule({ ...schedule, timeOff: e.target.value })}
                />
            </div>
            <button className='save' onClick={handleSaveSchedule}>Save Schedule</button>
            <button  className='save' onClick={handleDeleteSchedule} disabled={!schedule.timeOn && !schedule.timeOff}>
                Delete Schedule
            </button>

        </div>
    );
}
