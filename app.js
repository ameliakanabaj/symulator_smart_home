const apiUrl = 'http://localhost:3000/devices'; 
const socket = io('http://localhost:3001');

async function fetchDevices() {
  const response = await fetch(apiUrl);
  const devices = await response.json(); 

  const deviceList = document.getElementById('device-list');
  deviceList.innerHTML = '';

  devices.forEach(device => {
    const listItem = document.createElement('li');
    listItem.innerHTML = `
      <p>ID: ${device.id}, Nazwa: ${device.name}, Typ: ${device.type}, Status: ${device.status}</p>
      ${device.type === 'light' ? `
        <label>Jasność: ${device.brightness}</label>
        <input type="range" min="0" max="100" value="${device.brightness}" 
               oninput="updateDeviceBrightness(${device.id}, this.value)">
      ` : ''}
      ${device.type === 'thermostat' ? `
        <label>Temperatura: ${device.temperature}°C</label>
        <input type="number" min="10" max="30" value="${device.temperature}" 
               onchange="updateDeviceTemperature(${device.id}, this.value)">
      ` : ''}
      <button onclick="toggleDeviceStatus(${device.id}, '${device.status === 'on' ? 'off' : 'on'}')">
        ${device.status === 'on' ? 'Wyłącz' : 'Włącz'}
      </button>
    `;
    deviceList.appendChild(listItem);
  });
}

async function addDevice(event) {
  event.preventDefault();

  const name = document.getElementById('device-name').value;
  const type = document.getElementById('device-type').value;
  const status = document.getElementById('device-status').value;

  const deviceAttributes = {
    light: { brightness: 50 },
    thermostat: { temperature: 22 },
    generic: {}
  };

  const newDevice = {
    name,
    type,
    status,
    ...deviceAttributes[type]
  };
  console.log('Dodawanie urządzenia:', {
    name,
    type,
    status,
    ...deviceAttributes[type]
  });

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newDevice)
  });

  if (response.ok) {
    alert('Urządzenie zostało dodane!');
    fetchDevices();
  } else {
    alert('Błąd podczas dodawania urządzenia.');
  }
}

async function toggleDeviceStatus(id, newStatus) {
  const response = await fetch(`${apiUrl}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: newStatus })
  });

  if (response.ok) {
    fetchDevices();
  } else {
    alert('Błąd podczas zmiany statusu urządzenia.');
  }
}

async function updateDeviceBrightness(id, brightness) {
  const response = await fetch(`${apiUrl}/${id}/brightness`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ brightness })
  });

  if (!response.ok) {
    console.error('Błąd podczas aktualizacji jasności urządzenia.');
  }
}

async function updateDeviceTemperature(id, temperature) {
  const response = await fetch(`${apiUrl}/${id}/temperature`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ temperature })
  });

  if (!response.ok) {
    console.error('Błąd podczas aktualizacji temperatury urządzenia.');
  }
}

document.getElementById('add-device-form').addEventListener('submit', addDevice);

socket.on('connect', () => {
  console.log('Połączono z WebSocket');
});

socket.on('device-update', (data) => {
  console.log('Aktualizacja urządzenia:', data);
  fetchDevices(); 
});

fetchDevices();
