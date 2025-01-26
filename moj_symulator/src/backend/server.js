import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';

const app = express();
const HTTP_PORT = 3000;

app.use(express.json());
app.use(cors());

const devices = [
    { id: 1, name: 'Smart Bulb', type: 'light', status: 'off', brightness: 50 },
    { id: 2, name: 'Smart Thermostat', type: 'thermostat', status: 'on', temperature: 22 },
    { id: 3, name: 'Smart Speaker', type: 'sound', status: 'on', volume: 30 },
    { id: 4, name: 'Smart TV', type: 'accessory', status: 'on', volume: 50, channel: 5 },
    { id: 5, name: 'Custom Device', type: 'others', status: 'off', description: 'Custom behavior' },
    { id: 6, name: 'Smart Fan', type: 'fan', status: 'on', speed: 3 }
  ];

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
  
  app.get('/devices/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const device = devices.find(d => d.id === id);
    if (device) {
      res.json(device);
    } else {
      res.status(404).json({ message: 'Urządzenie nie znalezione.' });
    }
  });

  app.post('/devices', (req, res) => {
    const { name, type, status, brightness, temperature, volume, channel, description, speed } = req.body;
    const newDevice = { id: devices.length + 1, name, type, status };
  
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
  
    res.status(201).json(newDevice);
  });
  
app.put('/devices/:id', (req, res) => {
  const id = parseInt(req.params.id); 
  const { name, status, brightness, temperature, volume, channel, speed } = req.body;
  const device = devices.find(d => d.id === id); 

  if (device) {
    device.name = name || device.name;
    device.status = status || device.status;

    if (device.type === 'light' && brightness !== undefined) {
      if (brightness >= 1 && brightness <= 100) {
        device.brightness = brightness;
      } else {
        return res.status(400).json({ message: 'Brightness musi być liczbą od 1 do 100.' });
      }
    }

    if (device.type === 'thermostat' && temperature !== undefined) {
      device.temperature = temperature;
    }

    if (device.type === 'sound' && volume !== undefined) {
      device.volume = volume;
    }

    if (device.type === 'accessory') {
      if (volume !== undefined) device.volume = volume;
      if (channel !== undefined) device.channel = channel;
    }

    if (device.type === 'fan' && speed !== undefined) {
      if ([1, 2, 3].includes(speed)) {
        device.speed = speed;
      } else {
        return res.status(400).json({ message: 'Speed musi być liczbą 1, 2 lub 3.' });
      }
    }

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


  const users = [];

  app.post('/api/register', async (req, res) => {
    console.log('Dane odebrane na backendzie:', req.body);
    const { email, password, firstName, lastName, confirmPassword } = req.body;

    // Sprawdzenie, czy hasła się zgadzają
    if (password !== confirmPassword) {
        return res.status(400).send('Hasła się nie zgadzają.');
    }

    // Sprawdzamy, czy użytkownik o tym emailu już istnieje
    const userExists = users.find(user => user.email === email);
    if (userExists) {
        return res.status(400).send('Użytkownik o takim emailu już istnieje.');
    }

    // Haszowanie hasła
    const hashedPassword = await bcrypt.hash(password, 10);

    // Tworzenie nowego użytkownika
    const newUser = {
        id: users.length + 1,
        email,
        password: hashedPassword,
        firstName,
        lastName,
    };

    users.push(newUser);
    console.log('Nowy użytkownik:', newUser);

    // Wysyłanie odpowiedzi do klienta
    res.status(201).send({
        message: 'Zarejestrowano pomyślnie',
        user: {
            email: newUser.email,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
        }
    });
});

  app.get('/api/users', (req, res) => {
    console.log(users);
    console.log('Żądanie do /api/users');
    if (users.length === 0) {
        return res.status(404).send('Brak użytkowników');
    }
  
    const usersInfo = users.map(user => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
    }));
  
    res.status(200).json(usersInfo);
  });

  app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
  
    const user = users.find(user => user.email === email);
    console.log('Znaleziony użytkownik:', user);
    if (!user) {
      return res.status(404).send('Nie znaleziono użytkownika');
    }
  
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).send('Nieprawidłowe hasło');
    }
  
    res.status(200).json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    });
  });

  
app.listen(HTTP_PORT, () => {
    console.log(`Serwer działa na http://localhost:${HTTP_PORT}`);
  });
  