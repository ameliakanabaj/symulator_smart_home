const apiUrl = 'http://localhost:3000/devices'; 
const socket = io('http://localhost:3001');

async function fetchDevices() {
  
  const response = await fetch(apiUrl);
  const devices = await response.json(); 

  const deviceList = document.getElementById('device-list');
  deviceList.innerHTML = '';

  devices.forEach(device => {
    const listItem = document.createElement('li');
    listItem.textContent = `ID: ${device.id}, Nazwa: ${device.name}, Status: ${device.status}`;
    deviceList.appendChild(listItem);
  });
}

async function publishMqttMessage(topic, message) {
  const response = await fetch('http://localhost:3000/mqtt/publish', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic, message }),
  });

  if (!response.ok) {
    console.error('Błąd podczas publikacji wiadomości MQTT');
  }
}

async function addDevice(event) {
  event.preventDefault();

  const name = document.getElementById('device-name').value;
  const status = document.getElementById('device-status').value;

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, status })
  });

  if (response.ok) {
    alert('Urządzenie zostało dodane!');
    fetchDevices(); 
  } else {
    alert('Błąd podczas dodawania urządzenia.');
  }
}

async function updateDevice(event) {
  event.preventDefault();

  const id = document.getElementById('update-device-id').value;
  const status = document.getElementById('update-device-status').value;

  const response = await fetch(`${apiUrl}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });

  if (response.ok) {
    alert('Status urządzenia został zmieniony!');

    publishMqttMessage('smarthome/devices', JSON.stringify({ id: parseInt(id), status }));
    fetchDevices();
  } else {
    alert('Błąd podczas zmiany statusu urządzenia.');
  }
}


document.getElementById('add-device-form').addEventListener('submit', addDevice);
document.getElementById('update-device-form').addEventListener('submit', updateDevice);

fetchDevices();

socket.on('connect', () => {
  console.log('Połączono z WebSocket');
});

socket.on('device-update', (data) => {
  console.log('Aktualizacja urządzenia:', data);
  fetchDevices(); 
});



