import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Devices from './components/Devices';
import Device from './components/Device';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Devices />} />
          <Route path="/device/:id" element={<Device />} />
        </Routes>
      </Router>
    </>
  )
}

export default App
