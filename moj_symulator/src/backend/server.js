import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import WebSocket from 'ws';
import { createServer } from "http";
import { WebSocketServer } from "ws";
import https from 'https';
import fs from 'fs';
import cookieParser from 'cookie-parser';
import winston from 'winston';
import Loki from 'lokijs';


const logger = winston.createLogger({
    level: 'info',  
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => {
            return `${timestamp} ${level}: ${message}`;
        })
    ),
    transports: [
        new winston.transports.Console(),   
        new winston.transports.File({ filename: 'app.log' }) 
    ],
});

const db = new Loki('smart_home.db', {
    autoload: true,
    autoloadCallback: () => {
        usersCollection = db.getCollection('users') || db.addCollection('users');
        devicesCollection = db.getCollection('devices') || db.addCollection('devices');
        reportsCollection = db.getCollection('reports') || db.addCollection('reports'); 
    },
    autosave: true,
    autosaveInterval: 4000,
    serializationMethod: "pretty"
});

let usersCollection, devicesCollection, reportsCollection;

function ensureCollections() {
    if (!usersCollection || !devicesCollection) {
        usersCollection = db.getCollection('users') || db.addCollection('users');
        devicesCollection = db.getCollection('devices') || db.addCollection('devices');
    }
}

ensureCollections();



const app = express();
const HTTPS_PORT = 3000;

app.use(cookieParser());

const options = {
    key: fs.readFileSync('privkey.pem'),
    cert: fs.readFileSync('cert.pem')
};

const server = https.createServer(options, app);
const wss = new WebSocketServer({ server });

let clients = [];

wss.on('connection', (ws) => {
    logger.info('New connection to WebSocket');

    ws.on('message', (message) => {
        logger.info("New message:", message);
        
        try {
            const data = JSON.parse(message);
            logger.info("Parsed data:", data);

            if (data.type === 'subscribe') {
                clients.push({ ws, deviceId: data.deviceId });
                logger.info(`Added new subscriber for the device: ${data.deviceId}`);
            }
        } catch (error) {
            logger.error('Error parsing JSON:', error);
        }
    });

    ws.on('close', () => {
        clients = clients.filter(client => client.ws !== ws);
        logger.info('WebSocket connection closed');
    });

    ws.on('error', (err) => {
        logger.error('WebSocket error:', err);
    });
});

function sendDeviceStatusUpdate(deviceId, status) {
    logger.info(`Próba wysłania statusu ${status} dla urządzenia ${deviceId}`);

    clients.forEach(client => {
        if (parseInt(client.deviceId) === parseInt(deviceId) && client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(JSON.stringify({ deviceId, status }));
            logger.info(`Wysłano status ${status} do urządzenia ${deviceId}`);
        }
    });
}

function detectDeviceProblem(deviceId) {
    
    setTimeout(() => {
        const errorNotification = {
            type: 'deviceError',
            deviceId: deviceId,
            message: `There is a problem with the device number ${deviceId}: it needs fixing now!`
        };

        clients.forEach(client => {
            if (parseInt(client.deviceId) === parseInt(deviceId) && client.ws.readyState === WebSocket.OPEN) {
                client.ws.send(JSON.stringify(errorNotification));
            }
        });
    }, 2000); 
}

setInterval(() => {
    detectDeviceProblem('1');
}, 2000); 


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
    logger.info("Otrzymane dane w body:", req.body);

    const id = parseInt(req.params.id);
    const userId = parseInt(req.params.userId);

    if (!userDevices || !userDevices[userId]) {
        logger.error("Błąd: userDevices nie istnieje lub brak urządzeń dla userId:", userId);
        return res.status(404).send('User or devices not found.');
    }

    const device = userDevices[userId].find(d => d.id === id);
    if (!device) {
        logger.error("Błąd: Nie znaleziono urządzenia o ID:", id);
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
        logger.info(`WebSocket wysyła status: ${device.status} dla urządzenia ID: ${device.id}`);
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

    logger.info("Urządzenie po aktualizacji:", device);
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


app.post('/api/register', async (req, res) => {
    const { email, password, firstName, lastName, confirmPassword, role = 'user' } = req.body;

    if (password !== confirmPassword) {
        return res.status(400).send('Passwords do not match.');
    }

    if (usersCollection.findOne({ email })) {
        return res.status(400).send('There already exists an account linked to that email.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = Date.now(); 
    
    const newUser = usersCollection.insert({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        userId,
        role,
    });

    db.saveDatabase(); 

    res.status(201).send({
        message: 'Successfully registered',
        user: {
            email: newUser.email,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            userId: newUser.userId, 
            role: newUser.role, 
        }
    });
});


function ensureUsersCollection() {
    if (!usersCollection) {
        usersCollection = db.getCollection('users') || db.addCollection('users');
    }
}


app.post('/login', (req, res) => {
    ensureUsersCollection();

    const { email, password } = req.body;
    const user = usersCollection.findOne({ email });

    if (!user) {
        return res.status(401).json({ message: "Wrong email or password" });
    }

    const isValidPassword = bcrypt.compareSync(password, user.password);
    if (!isValidPassword) {
        return res.status(401).json({ message: "Wrong email or password" });
    }

    res.status(200).json({
        id: user.userId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role, 
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

app.delete('/schedules/:userId/:id', (req, res) => {
    const { userId, id } = req.params;

    if (!schedules[userId] || !schedules[userId][id]) {
        return res.status(404).json({ message: "No schedule found for this device." });
    }

    delete schedules[userId][id]; 

    res.json({ message: 'Schedule deleted successfully.' });
});

app.get('/admins', (req, res) => {
    const admins = usersCollection.find({ role: 'admin' });
    res.json(admins);
});

app.post('/admins', (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    const user = usersCollection.findOne({ email });
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    if (user.role === 'admin') {
        return res.status(400).json({ error: 'User is already an admin' });
    }

    user.role = 'admin';
    db.saveDatabase(); 

    const admins = usersCollection.find({ role: 'admin' });

    res.status(201).json({ message: 'User is now an admin', admins });
});


app.put('/admins/:email', (req, res) => {
    const { email } = req.params;
    const { newEmail } = req.body;

    if (!newEmail) {
        return res.status(400).json({ error: 'New email is required' });
    }

    const user = usersCollection.findOne({ email });

    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    user.email = newEmail;
    db.saveDatabase();

    res.json({ message: 'Admin email updated', user });
});

app.delete('/admins/:email', (req, res) => {
    const { email } = req.params;
    const user = usersCollection.findOne({ email });

    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    if (user.role !== 'admin') {
        return res.status(400).json({ error: 'User is not an admin' });
    }

    user.role = 'user'; 
    db.saveDatabase();

    res.json({ message: 'Admin rights removed', user });
});

app.get('/api/users', (req, res) => {
    const usersInfo = usersCollection.find();
    console.log(usersInfo);
    if (usersInfo.length === 0) {
        return res.status(404).send('No users found');
    }

    res.status(200).json(usersInfo);
});

app.post('/api/users', async (req, res) => {
    const { userId, email, firstName, lastName, password } = req.body;

    if (!userId || !email || !firstName || !lastName || !password) {
        return res.status(400).json({ error: 'All fields (id, email, firstName, lastName, password) are required' });
    }

    const userExists = usersCollection.findOne({ userId }) || usersCollection.findOne({ email });
    if (userExists) {
        return res.status(400).json({ error: 'User with this ID or email already exists' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10); 

        const newUser = { userId, email, firstName, lastName, password: hashedPassword };
        usersCollection.insert(newUser);
        db.saveDatabase();

        res.status(201).json({ message: 'User added successfully', user: { userId, email, firstName, lastName } });
    } catch (error) {
        res.status(500).json({ error: 'Error while hashing password' });
    }
});


app.put('/api/users/:id', (req, res) => {
    const { id } = req.params;
    const userId = parseInt(id, 10);
    const { email, firstName, lastName } = req.body;

    if (!email && !firstName && !lastName) {
        return res.status(400).json({ error: 'At least one field (email, firstName, or lastName) is required to update' });
    }

    const user = usersCollection.findOne({ userId });
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    if (email) user.email = email;
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;

    db.saveDatabase();

    res.json({ message: 'User updated successfully', user });
});


app.delete('/api/users/:id', (req, res) => {
    const { id } = req.params;

    const userId = parseInt(id, 10);
    
    const user = usersCollection.findOne({ userId });
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    usersCollection.remove(user);
    db.saveDatabase();

    res.json({ message: 'User deleted successfully', user });
});

app.get('/reports', (req, res) => {
    res.json(reportsCollection.find());
});

app.post('/reports', (req, res) => {
    const { content, deviceId, userId } = req.body;
    if (!content || !deviceId || !userId) {
        return res.status(400).json({ error: 'All fields (content, deviceId, userId) are required' });
    }
    const newReport = { id: Date.now().toString(), content, deviceId, userId };
    reportsCollection.insert(newReport);
    db.saveDatabase();
    res.status(201).json(newReport);
});

app.put('/reports/:id', (req, res) => {
    const { content, deviceId, userId } = req.body;
    const report = reportsCollection.findOne({ id: req.params.id });
    if (!report) {
        return res.status(404).json({ error: 'Report not found' });
    }
    report.content = content || report.content;
    report.deviceId = deviceId || report.deviceId;
    report.userId = userId || report.userId;
    reportsCollection.update(report);
    db.saveDatabase();
    res.json(report);
});

app.delete('/reports/:id', (req, res) => {
    const report = reportsCollection.findOne({ id: req.params.id });
    if (!report) {
        return res.status(404).json({ error: 'Report not found' });
    }
    reportsCollection.remove(report);
    db.saveDatabase();
    res.json({ message: 'Report deleted successfully' });
});

app.post('/set-last-device', (req, res) => {
    const { device } = req.body;  

    if (!device) {
        return res.status(400).send('Brak nazwy urządzenia');
    }

    res.cookie('lastDevice', device, { maxAge: 86400000, httpOnly: false });
    res.send(`Zapisano urządzenie: ${device}`);
});

app.get('/get-last-device', (req, res) => {
    const lastDevice = req.cookies.lastDevice;  

    if (!lastDevice) {
        return res.status(404).send('Brak ostatniego urządzenia w ciasteczkach');
    }

    res.json({ lastDevice });
});



server.listen(HTTPS_PORT, () => {
    logger.info(`Serwer HTTPS i WebSocket działa na https://localhost:${HTTPS_PORT}`);
});