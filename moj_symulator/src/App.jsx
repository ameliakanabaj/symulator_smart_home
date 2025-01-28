import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Devices from './components/Devices';
import Device from './components/Device';
import LoginPage from './components/LoginPage';
import RegistryPage from './components/RegistryPage';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import AdminPanel from './components/AdminPanel';

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/registry" element={<RegistryPage/>} />
          <Route path="/devices/:userId" element={<Devices />} />
          <Route path="/device/:userId/:id" element={<Device />} />
          <Route path="/admin-panel" element={<AdminPanel />} />
        </Routes>
      </Router>
    </>
  )
}

export default App
