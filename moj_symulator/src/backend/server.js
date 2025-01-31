import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import WebSocket from 'ws';
import { createServer } from "http";
import { WebSocketServer } from "ws";

const app = express();
const HTTP_PORT = 3000;
const server = createServer(app);
const wss = new WebSocketServer({ server });

let clients = [];

wss.on('connection', (ws) => {
    console.log('New connection to WebSocket');

    ws.on('message', (message) => {
        console.log("New message:", message);

        try {
            const data = JSON.parse(message);
            console.log("Parsed data:", data);

            if (data.type === 'subscribe') {
                clients.push({ ws, deviceId: data.deviceId });
                console.log(`Added new subscriber for the device: ${data.deviceId}`);
            }
        } catch (error) {
            console.error('Error parsing JSON:', error);
        }
    });

    ws.on('close', () => {
        clients = clients.filter(client => client.ws !== ws);
        console.log('WebSocket connection closed');
    });

    ws.on('error', (err) => {
        console.error('WebSocket error:', err);
    });
});

function sendDeviceStatusUpdate(deviceId, status) {
    console.log(`Próba wysłania statusu ${status} dla urządzenia ${deviceId}`);//debug

    clients.forEach(client => {
        if (parseInt(client.deviceId) === parseInt(deviceId) && client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(JSON.stringify({ deviceId, status }));
            console.log(`Wysłano status ${status} do urządzenia ${deviceId}`);//debug
        }
    });
}

function detectDeviceProblem(deviceId) {
    console.log(`Checking device's techical condition${deviceId}`);
    
    setTimeout(() => {
        const errorNotification = {
            type: 'deviceError',
            deviceId: deviceId,
            message: `There is a problem with the device number ${deviceId}: it needs fixing now!`
        };

        clients.forEach(client => {
            if (parseInt(client.deviceId) === parseInt(deviceId) && client.ws.readyState === WebSocket.OPEN) {
                client.ws.send(JSON.stringify(errorNotification));
                console.log(`Wysłano powiadomienie o problemie dla urządzenia ${deviceId}`);//debug
            }
        });
    }, 10000); 
}

setInterval(() => {
    detectDeviceProblem('1');
}, 90000); 


app.use(express.json());
app.use(cors());

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
    console.log("Otrzymane dane w body:", req.body);

    const id = parseInt(req.params.id);
    const userId = parseInt(req.params.userId);

    if (!userDevices || !userDevices[userId]) {
        console.error("Błąd: userDevices nie istnieje lub brak urządzeń dla userId:", userId);
        return res.status(404).send('User or devices not found.');
    }

    const device = userDevices[userId].find(d => d.id === id);
    if (!device) {
        console.error("Błąd: Nie znaleziono urządzenia o ID:", id);
        return res.status(404).send('Device not found.');
    }

    const brightnessNum = req.body.brightness !== undefined ? parseInt(req.body.brightness) : undefined;
    const temperatureNum = req.body.temperature !== undefined ? parseFloat(req.body.temperature) : undefined;
    const volumeNum = req.body.volume !== undefined ? parseInt(req.body.volume) : undefined;
    const channelNum = req.body.channel !== undefined ? parseInt(req.body.channel) : undefined;
    const speedNum = req.body.speed !== undefined ? parseInt(req.body.speed) : undefined;

    if (req.body.name !== undefined) {
        device.name = req.body.name;
    }

    if (req.body.status !== undefined) {
        device.status = req.body.status;
        sendDeviceStatusUpdate(device.id, device.status);
        console.log(`WebSocket wysyła status: ${device.status} dla urządzenia ID: ${device.id}`);
    }

    if (device.type === 'light' && brightnessNum !== undefined) {
        if (brightnessNum >= 1 && brightnessNum <= 100) {
            device.brightness = brightnessNum;
        } else {
            return res.status(400).send('Brightness must be a number from 1 to 100.');
        }
    }

    if (device.type === 'thermostat' && temperatureNum !== undefined) {
        device.temperature = temperatureNum;
    }

    if (device.type === 'sound' && volumeNum !== undefined) {
        device.volume = volumeNum;
    }

    if (device.type === 'accessory') {
        if (volumeNum !== undefined) device.volume = volumeNum;
        if (channelNum !== undefined) device.channel = channelNum;
    }

    if (device.type === 'fan' && speedNum !== undefined) {
        if ([1, 2, 3].includes(speedNum)) {
            device.speed = speedNum;
        } else {
            return res.status(400).send('Speed must be a number: 1, 2 or 3.');
        }
    }

    console.log("Urządzenie po aktualizacji:", device);
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
  const schedules = {};

  app.get('/schedules/:userId/:id', (req, res) => {
      const userId = req.params.userId;
      const id = req.params.id;
  
      if (!schedules[userId] || !schedules[userId][id]) {
          return res.status(404).json({ message: "No schedule found for this device." });
      }
  
      res.json(schedules[userId][id]);
  });
  
  app.post('/schedules/:userId/:id', (req, res) => {
      const { userId, id } = req.params;
      const { timeOn, timeOff } = req.body;
  
      if (!timeOn || !timeOff) {
          return res.status(400).json({ message: 'Missing timeOn or timeOff.' });
      }
  
      if (!schedules[userId]) {
          schedules[userId] = {};
      }
  
      schedules[userId][id] = { timeOn, timeOff };
  
      res.status(201).json({
          message: 'Schedule created or updated successfully.',
          schedule: schedules[userId][id],
      });
  });
  
  // app.put('/schedules/:userId/:id', (req, res) => {
  //     const { userId, id } = req.params;
  //     const { timeOn, timeOff } = req.body;
  
  //     if (!schedules[userId] || !schedules[userId][id]) {
  //         return res.status(404).json({ message: "No schedule found for this device." });
  //     }
  
  //     schedules[userId][id] = {
  //         timeOn: timeOn || schedules[userId][id].timeOn,
  //         timeOff: timeOff || schedules[userId][id].timeOff,
  //     };
  
  //     res.json({
  //         message: 'Schedule updated successfully.',
  //         schedule: schedules[userId][id],
  //     });
  // });
  
app.delete('/schedules/:userId/:id', (req, res) => {
    const { userId, id } = req.params;

    if (!schedules[userId] || !schedules[userId][id]) {
        return res.status(404).json({ message: "No schedule found for this device." });
    }

    delete schedules[userId][id]; 

    res.json({ message: 'Schedule deleted successfully.' });
  });
  

  const admins = ['admin@smarthome.com'];

  app.get('/admins', (req, res) => {
    res.json(admins);
});

app.post('/admins', (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    if (admins.includes(email)) {
        return res.status(400).json({ error: 'Admin already exists' });
    }

    admins.push(email);
    res.status(201).json({ message: 'Admin added', admins });
});

app.put('/admins/:oldEmail', (req, res) => {
    const { oldEmail } = req.params;
    const { newEmail } = req.body;

    if (!newEmail) {
        return res.status(400).json({ error: 'New email is required' });
    }

    const index = admins.indexOf(oldEmail);

    if (index === -1) {
        return res.status(404).json({ error: 'Admin not found' });
    }

    admins[index] = newEmail;
    res.json({ message: 'Admin updated', admins });
});

app.delete('/admins/:email', (req, res) => {
    const { email } = req.params;

    const index = admins.indexOf(email);

    if (index === -1) {
        return res.status(404).json({ error: 'Admin not found' });
    }

    admins.splice(index, 1);
    res.json({ message: 'Admin deleted', admins });
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

app.post('/api/users', (req, res) => {
    const { id, email, firstName, lastName } = req.body;

    if (!id || !email || !firstName || !lastName) {
        return res.status(400).json({ error: 'All fields (id, email, firstName, lastName) are required' });
    }

    const userExists = users.some(user => user.id === id || user.email === email);
    if (userExists) {
        return res.status(400).json({ error: 'User with this ID or email already exists' });
    }

    const newUser = { id, email, firstName, lastName };
    users.push(newUser);

    res.status(201).json({ message: 'User added successfully', user: newUser });
});

app.put('/api/users/:id', (req, res) => {
    const { id } = req.params;
    const { email, firstName, lastName } = req.body;

    if (!email && !firstName && !lastName) {
        return res.status(400).json({ error: 'At least one field (email, firstName, or lastName) is required to update' });
    }

    const userIndex = users.findIndex(user => user.id === id);
    if (userIndex === -1) {
        return res.status(404).json({ error: 'User not found' });
    }

    if (email) users[userIndex].email = email;
    if (firstName) users[userIndex].firstName = firstName;
    if (lastName) users[userIndex].lastName = lastName;

    res.json({ message: 'User updated successfully', user: users[userIndex] });
});

app.delete('/api/users/:id', (req, res) => {
    const { id } = req.params;

    const userIndex = users.findIndex(user => user.id === id);
    if (userIndex === -1) {
        return res.status(404).json({ error: 'User not found' });
    }

    const deletedUser = users.splice(userIndex, 1);

    res.json({ message: 'User deleted successfully', user: deletedUser[0] });
});




// app.listen(HTTP_PORT, () => {
//     console.log(`Serwer działa na http://localhost:${HTTP_PORT}`);
// });

server.listen(HTTP_PORT, () => {
    console.log(`Serwer HTTP i WebSocket działa na http://localhost:${HTTP_PORT}`);
});
