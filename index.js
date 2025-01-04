const express = require('express');
const app = express();
const port = 3000;

app.use(express.json()); 

let devices = [
  { id: 1, name: 'Smart Bulb', status: 'off' },
  { id: 2, name: 'Smart Thermostat', status: 'on' }
];

app.get('/', (req, res) => {
  res.send('Witamy w Symulatorze Smart Home!');
});

app.get('/devices', (req, res) => {
  res.json(devices);
});

app.get('/devices/search', (req, res) => {
  const { query } = req.query;
  if (!query) {
    return res.status(400).json({ message: 'Brak parametru wyszukiwania.' });
  }

  const results = devices.filter(device =>
    device.name.toLowerCase().includes(query.toLowerCase()) || 
    device.status.toLowerCase().includes(query.toLowerCase())
  );

  res.json(results);
});


app.post('/devices', (req, res) => {
  const { name, status } = req.body;
  const newDevice = {
    id: devices.length + 1,
    name,
    status
  };
  devices.push(newDevice);
  res.status(201).json(newDevice);
});

app.put('/devices/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { name, status } = req.body;
  const device = devices.find(d => d.id === id);

  if (device) {
    device.name = name || device.name;
    device.status = status || device.status;
    res.json(device);
  } else {
    res.status(404).json({ message: 'Urządzenie nie znalezione.' });
  }
});

app.delete('/devices/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = devices.findIndex(d => d.id === id);

  if (index !== -1) {
    const removedDevice = devices.splice(index, 1);
    res.json(removedDevice);
  } else {
    res.status(404).json({ message: 'Urządzenie nie znalezione.' });
  }
});

app.listen(port, () => {
  console.log(`Serwer działa na http://localhost:${port}`);
});

const users = [
  { username: 'admin', password: 'admin123', role: 'admin' },
  { username: 'user', password: 'user123', role: 'user' }
];

app.post('/login', (req, res) => {
  const { username, password } = req.body;

  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    res.json({ message: 'Logowanie udane!', token: `${user.username}-token`, role: user.role });
  } else {
    res.status(401).json({ message: 'Nieprawidłowa nazwa użytkownika lub hasło.' });
  }
});
