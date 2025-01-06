const socket = io('http://localhost:3001');

socket.on('connect', () => {
  console.log('Połączono z serwerem WebSocket');
});

socket.on('device-update', (data) => {
  console.log('Otrzymano dane:', data);
});

function updateDevice(deviceId, status) {
  const device = { id: deviceId, status: status };
  socket.emit('device-update', device); 
}

