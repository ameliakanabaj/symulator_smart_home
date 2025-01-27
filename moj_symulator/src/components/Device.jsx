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

    useEffect(() => {
        fetch(`http://localhost:3000/schedules/${userId}/${id}`)
            .then((response) => {
                if (!response.ok) {
                    if (response.status === 404) {
                        console.log('No schedules found for this device.');
                        return [];
                    }
                    throw new Error('Failed to fetch schedules');
                }
                return response.json();
            })
            .then((data) => {
                setSchedule(data || []);
            })
            .catch(() => {
                console.error('Could not fetch schedules');
            });
    }, [id, userId]);

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
            .catch(() => {
                setError('Could not update device');
            });
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

            <button onClick={handleSave}>Save changes</button>

            <h2>Schedule</h2>
            <div>
                <label>Turning on time:</label>
                <input
                    type="time"
                    value={schedule.timeOn}
                    onChange={(e) => setSchedule({ ...schedule, timeOn: e.target.value })}
                />
            </div>
            <div>
                <label>Turning off time:</label>
                <input
                    type="time"
                    value={schedule.timeOff}
                    onChange={(e) => setSchedule({ ...schedule, timeOff: e.target.value })}
                />
            </div>
            <button className='save' onClick={handleSaveSchedule}>Save Schedule</button>
            <button  className='save'onClick={handleDeleteSchedule} disabled={!schedule.timeOn && !schedule.timeOff}>
                Delete Schedule
            </button>
        </div>
    );
}
