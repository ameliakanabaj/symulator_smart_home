import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';

const app = express();
const HTTP_PORT = 3000;

app.use(express.json());
app.use(cors());

// const devices = [
//     { id: 1, name: 'Smart Bulb', type: 'light', status: 'off', brightness: 50 },
//     { id: 2, name: 'Smart Thermostat', type: 'thermostat', status: 'on', temperature: 22 },
//     { id: 3, name: 'Smart Speaker', type: 'sound', status: 'on', volume: 30 },
//     { id: 4, name: 'Smart TV', type: 'accessory', status: 'on', volume: 50, channel: 5 },
//     { id: 5, name: 'Custom Device', type: 'others', status: 'off', description: 'Custom behavior' },
//     { id: 6, name: 'Smart Fan', type: 'fan', status: 'on', speed: 3 }
//   ];
  
const userDevices = {};

  app.get('/devices/:userId', (req, res) => {
    const userId = parseInt(req.params.userId);
    if (!userId) {
      return res.status(400).send('Lacking userId.');
    }

    const result = userDevices[userId];
    if (!result) {
        return res.status(404).send('No devices for this user.');
    }

    res.json(result);
  });

  app.get('/devices/search/:userId', (req, res) => {
    const { query } = req.query; 
    const { userId } = req.params; 

    if (!userId) {
        return res.status(400).send('Lacking userId.');
    }

    if (!query) {
        return res.status(400).json({ message: 'Lacking query' });
    }

    const userSpecificDevices = userDevices[userId];

    if (!userSpecificDevices) {
        return res.status(404).send('No devices found for this user.');
    }

    const results = userSpecificDevices.filter(device =>
        device.name.toLowerCase().includes(query.toLowerCase()) || 
        device.status.toLowerCase().includes(query.toLowerCase())
    );

    res.json(results);
});


  
app.get('/devices/:userId/:id', (req, res) => {
  const userId = parseInt(req.params.userId);
  const id = parseInt(req.params.id);
  if (!userDevices[userId]) {
      return res.status(404).send('No devices for this user.');
  }
  const device = userDevices[userId].find(d => d.id === id);
  if (device) {
      res.json(device);
  } else {
      res.status(404).json({ message: 'Device not found' });
  }
});


  app.post('/devices', (req, res) => {
    const { userId, name, type, status, brightness, temperature, volume, channel, description, speed } = req.body;

    if (!userId) {
        return res.status(400).send('Lacking userId.');
    }

    const newDevice = { id: (userDevices[userId]?.length || 0) + 1, name, type, status };

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

    if (!userDevices[userId]) {
        userDevices[userId] = [];
    }

    userDevices[userId].push(newDevice);
    res.status(201).json(newDevice);
});

app.put('/devices/:userId/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const userId = parseInt(req.params.userId);
  const { name, status, brightness, temperature, volume, channel, speed } = req.body;

  if (!userId || !userDevices[userId]) {
      return res.status(404).send('User or devices not found.');
  }

  const device = userDevices[userId].find(d => d.id === id);
  if (!device) {
      return res.status(404).send('Device not found.');
  }

  device.name = name || device.name;
  device.status = status || device.status;

  if (device.type === 'light' && brightness !== undefined) {
      if (brightness >= 1 && brightness <= 100) {
          device.brightness = brightness;
      } else {
          return res.status(400).send('Brightness must be a number from 1 to 100.');
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
          return res.status(400).send('Speed must be a number: 1, 2 or 3.');
      }
  }

  res.json(device);
});


  
  
app.delete('/devices/:userId/:id', (req, res) => {
  const userId = parseInt(req.params.userId);
  const id = parseInt(req.params.id);

  if (!userId || !userDevices[userId]) {
      return res.status(404).send('User or devices not found');
  }

  const index = userDevices[userId].findIndex(d => d.id === id);
  if (index === -1) {
      return res.status(404).send('Device not found');
  }

  const removedDevice = userDevices[userId].splice(index, 1);
  res.json(removedDevice);
});


  const users = [];

  app.post('/api/register', async (req, res) => {
    console.log('Dane odebrane na backendzie:', req.body);//debug
    const { email, password, firstName, lastName, confirmPassword } = req.body;

    if (password !== confirmPassword) {
        return res.status(400).send('Passwords do not match.');
    }

    const userExists = users.find(user => user.email === email);
    if (userExists) {
        return res.status(400).send('There already exists an account linked to that email adress');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
        id: users.length + 1,
        email,
        password: hashedPassword,
        firstName,
        lastName,
    };

    users.push(newUser);
    userDevices[newUser.id] = []; 
    console.log('New user:', newUser);//debug

    res.status(201).send({
        message: 'Successfully registered',
        user: {
            email: newUser.email,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
        }
    });
});

  app.get('/api/users', (req, res) => {
    console.log(users);
    console.log('Żądanie do /api/users');//debug
    if (users.length === 0) {
        return res.status(404).send('No users found');
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
    console.log('Znaleziony użytkownik:', user);//debug
    if (!user) {
      return res.status(404).send('Could not find user');
    }
  
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).send('Wrong password');
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
  