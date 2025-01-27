import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './styles/Header.css';

export default function Header() {
    const navigate = useNavigate();

    const handleLogoutClick = () => {
        navigate('/');
    }

    return (
        <header>
            <h2>Your Smart Home</h2>
            <button onClick={handleLogoutClick}>Log out</button>
        </header>
    )
}