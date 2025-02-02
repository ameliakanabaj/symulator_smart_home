import React, { useEffect, useState } from 'react';
import './styles/Login.css';  
import { useNavigate } from 'react-router-dom';

export default function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [admins, setAdmins] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    
    const fetchAdmins = async () => {
        try {
            const response = await fetch('https://localhost:3000/admins');
            const data = await response.json();

            if (response.ok) {
                console.log('Fetched admins:', data); 
                setAdmins(data); 
            } else {
                setError(data.message || 'Failed to fetch admins');
            }
        } catch (error) {
            console.log('Error during fetching admins:', error);
            setError('An error occurred. Please try again.');
        }
    }

    useEffect(() => {
        fetchAdmins();
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        const payload = { email, password };

        try {
            const response = await fetch('https://localhost:3000/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (response.ok) {
                console.log('Logged in successfully:', data);
                if (admins.some(admin => admin.email === data.email)) {
                    console.log('Redirecting to admin panel...');
                    navigate("/admin-panel");
                } else {
                    navigate(`/devices/${data.id}`);
                }
            } else {
                setError(data.message || 'Login failed');
            }
        } catch (error) {
            console.log('Error during login:', error);
            setError('An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClick = () => {
        navigate('/registry');
    }

    return (
        <div className="auth-container">
            <button className='register' onClick={handleClick}>I don't have an account</button>
            <h2>Login</h2>
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleLogin}>
                <div>
                    <label>Email:</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Password:</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit" disabled={isLoading}>
                    {isLoading ? 'Logging in...' : 'Login'}
                </button>
            </form>
        </div>
    );
}
