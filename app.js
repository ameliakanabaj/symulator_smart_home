const apiUrl = 'http://localhost:3000/devices'; 
const socket = io('http://localhost:3001');

async function fetchDevices() {
  const response = await fetch(apiUrl);
  const devices = await response.json();

  const deviceList = document.getElementById('device-list');
  deviceList.innerHTML = '';

  devices.forEach(device => {
    let listItem = `ID: ${device.id}, Nazwa: ${device.name}, Typ: ${device.type}, Status: ${device.status}`;

    if (device.type === 'light') {
      listItem += `, Jasność: ${device.brightness}`;
    } else if (device.type === 'thermostat') {
      listItem += `, Temperatura: ${device.temperature}`;
    } else if (device.type === 'sound') {
      listItem += `, Głośność: ${device.volume}`;
    } else if (device.type === 'accessory') {
      listItem += `, Głośność: ${device.volume}, Kanał: ${device.channel}`;
    } else if (device.type === 'others') {
      listItem += `, Opis: ${device.description}`;
    } else if (device.type === 'fan') {
      listItem += `, Prędkość: ${device.speed}`;
    }

    const listItemElement = document.createElement('li');
    listItemElement.textContent = listItem;
    deviceList.appendChild(listItemElement);
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
document.getElementById('device-type').addEventListener('change', (event) => {
  const additionalFields = document.getElementById('additional-fields');
  additionalFields.innerHTML = ''; 

  switch (event.target.value) {
    case 'light':
      additionalFields.innerHTML = '<label for="brightness">Jasność:</label><input type="number" id="brightness" min="1" max="100">';
      break;
    case 'thermostat':
      additionalFields.innerHTML = '<label for="temperature">Temperatura:</label><input type="number" id="temperature">';
      break;
    case 'sound':
      additionalFields.innerHTML = '<label for="volume">Głośność:</label><input type="number" id="volume" min="1" max="100">';
      break;
    case 'accessory':
      additionalFields.innerHTML = `
        <label for="volume">Głośność:</label><input type="number" id="volume" min="1" max="100">
        <label for="channel">Kanał:</label><input type="number" id="channel">
      `;
      break;
    case 'fan':
      additionalFields.innerHTML = '<label for="speed">Prędkość:</label><input type="number" id="speed" min="1" max="5">';
      break;
    case 'others':
      additionalFields.innerHTML = '<label for="description">Opis:</label><input type="text" id="description">';
      break;
  }
});


socket.on('connect', () => {
  console.log('Połączono z WebSocket');
});

socket.on('device-update', (data) => {
  console.log('Aktualizacja urządzenia:', data);
  fetchDevices(); 
});

fetchDevices();
