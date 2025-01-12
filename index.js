const express = require('express');
const mqtt = require('mqtt');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const app = express();
const HTTP_PORT = 3000;

app.use(cors({
  origin: 'http://127.0.0.1:5500', 
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type'],
}));

app.use(express.json()); 

let devices = [
  { id: 1, name: 'Smart Bulb', type: 'light', status: 'off', brightness: 50 },
  { id: 2, name: 'Smart Thermostat', type: 'thermostat', status: 'on', temperature: 22 },
  { id: 3, name: 'Smart Speaker', type: 'sound', status: 'on', volume: 30 },
  { id: 4, name: 'Smart TV', type: 'accessory', status: 'on', volume: 50, channel: 5 },
  { id: 5, name: 'Custom Device', type: 'others', status: 'off', description: 'Custom behavior' },
  { id: 6, name: 'Smart Fan', type: 'fan', status: 'on', speed: 3 }
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
  const { name, type, status, brightness, temperature, volume, channel, description, speed } = req.body;
  const newDevice = { id: devices.length + 1, name, type, status };

  // Dodaj właściwości specyficzne dla danego typu
  if (type === 'light') {
    newDevice.brightness = brightness || 50;
  } else if (type === 'thermostat') {
    newDevice.temperature = temperature || 20;
  } else if (type === 'sound') {
    newDevice.volume = volume || 30;
  } else if (type === 'accessory') {
    newDevice.volume = volume || 30;
    newDevice.channel = channel || 1;
  } else if (type === 'others') {
    newDevice.description = description || 'No description provided';
  } else if (type === 'fan') {
    newDevice.speed = speed || 1;
  }

  devices.push(newDevice);

  io.emit('device-update', { action: 'create', device: newDevice });

  mqttClient.publish('smarthome/devices', JSON.stringify(newDevice));

  res.status(201).json(newDevice);
});

app.put('/devices/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { name, status } = req.body;
  const device = devices.find(d => d.id === id);

  if (device) {
    device.name = name || device.name;
    device.status = status || device.status;

    io.emit('device-update', { action: 'update', device });

    mqttClient.publish('smarthome/devices', JSON.stringify(device));

    res.json(device);
  } else {
    res.status(404).json({ message: 'Urządzenie nie znalezione.' });
  }
});

app.put('/devices/:id/brightness', (req, res) => {
  const id = parseInt(req.params.id);
  const { brightness } = req.body;
  const device = devices.find(d => d.id === id);

  if (device && device.type === 'light') {
    device.brightness = brightness;
    res.json(device);
  } else {
    res.status(400).json({ message: 'Urządzenie nie obsługuje jasności.' });
  }
});

app.put('/devices/:id/temperature', (req, res) => {
  const id = parseInt(req.params.id);
  const { temperature } = req.body;
  const device = devices.find(d => d.id === id);

  if (device && device.type === 'thermostat') {
    device.temperature = temperature;
    res.json(device);
  } else {
    res.status(400).json({ message: 'Urządzenie nie obsługuje temperatury.' });
  }
});




app.delete('/devices/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = devices.findIndex(d => d.id === id);

  if (index !== -1) {
    const removedDevice = devices.splice(index, 1);

    io.emit('device-update', { action: 'delete', device: removedDevice[0] });

    res.json(removedDevice);
  } else {
    res.status(404).json({ message: 'Urządzenie nie znalezione.' });
  }
});


app.listen(HTTP_PORT, () => {
  console.log(`Serwer działa na http://localhost:${HTTP_PORT}`);
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

const mqttClient = mqtt.connect('mqtt://localhost:1883');

mqttClient.on('connect', () => {
  console.log('Połączono z brokerem MQTT');
  
  mqttClient.subscribe('smarthome/devices', (err) => {
    if (!err) {
      console.log('Subskrybowano temat: smarthome/devices');
    }
  });
});

mqttClient.on('message', (topic, message) => {
  if (topic === 'smarthome/devices') {
    const data = JSON.parse(message.toString());
    const device = devices.find(d => d.id === data.id);
    if (device) {
      device.status = data.status;

      io.emit('device-update', { action: 'update', device });
    }
  }
});


app.post('/mqtt/publish', (req, res) => {
  const { topic, message } = req.body;

  if (!topic || !message) {
    return res.status(400).json({ message: 'Podaj temat i wiadomość.' });
  }

  mqttClient.publish(topic, message, (err) => {
    if (err) {
      return res.status(500).json({ message: 'Nie udało się opublikować wiadomości.' });
    }

    io.emit('device-update', { topic, message });

    res.json({ message: 'Wiadomość opublikowana!' });
  });
});

const wsServer = http.createServer(app);
const io = new Server(wsServer, {
  cors: {
    origin: 'http://127.0.0.1:5500',
    methods: ['GET', 'POST'],
  }
});

io.on('connection', (socket) => {
  console.log('Nowe połączenie WebSocket');
  socket.on('device-update', (data) => {
    console.log('Otrzymano dane:', data);
    socket.broadcast.emit('device-update', data);
  });

  socket.on('disconnect', () => {
    console.log('Rozłączono WebSocket');
  });
});

const WS_PORT = 3001;
wsServer.listen(WS_PORT, () => {
  console.log(`Serwer WebSocket działa na porcie ${WS_PORT}`);
});