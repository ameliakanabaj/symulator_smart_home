const apiUrl = 'http://localhost:3000/devices';
const socket = io('http://localhost:3001');

async function fetchDevices() {
  const response = await fetch(apiUrl);
  const devices = await response.json();

  const deviceList = document.getElementById('device-list');
  deviceList.innerHTML = '';

  devices.forEach(device => {
    const listItem = document.createElement('li');
    listItem.textContent = device.name;

    const details = document.createElement('div');
    details.className = 'device-details';
    details.innerHTML = `
      <p>ID: ${device.id}</p>
      <p>Status: ${device.status}</p>
      <button onclick="updateDevice(${device.id}, 'on')">Włącz</button>
      <button onclick="updateDevice(${device.id}, 'off')">Wyłącz</button>
    `;
    listItem.appendChild(details);

    listItem.addEventListener('click', () => {
      details.style.display = details.style.display === 'block' ? 'none' : 'block';
    });

    deviceList.appendChild(listItem);
  });
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
    closeModal();
  } else {
    alert('Błąd podczas dodawania urządzenia.');
  }
}

async function updateDevice(id, status) {
  const response = await fetch(`${apiUrl}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });

  if (response.ok) {
    alert('Status urządzenia został zmieniony!');
    fetchDevices();
  } else {
    alert('Błąd podczas zmiany statusu urządzenia.');
  }
}

function openModal() {
  document.getElementById('add-device-modal').classList.add('active');
  document.getElementById('modal-backdrop').classList.add('active');
}

function closeModal() {
  document.getElementById('add-device-modal').classList.remove('active');
  document.getElementById('modal-backdrop').classList.remove('active');
}

document.getElementById('add-device-button').addEventListener('click', openModal);
document.getElementById('close-modal').addEventListener('click', closeModal);
document.getElementById('modal-backdrop').addEventListener('click', closeModal);
document.getElementById('add-device-form').addEventListener('submit', addDevice);

fetchDevices();

socket.on('connect', () => {
  console.log('Połączono z WebSocket');
});

socket.on('device-update', (data) => {
  console.log('Aktualizacja urządzenia:', data);
  fetchDevices();
});
