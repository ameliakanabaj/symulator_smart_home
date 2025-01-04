const express = require('express');
const app = express();
const port = 3000;

app.use(express.json()); 

let devices = [
  { id: 1, name: 'Smart Bulb', status: 'off' },
  { id: 2, name: 'Smart Thermostat', status: 'on' }
];

app.get('/devices', (req, res) => {
  res.json(devices);
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
