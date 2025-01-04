const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Witamy w Symulatorze Smart Home!');
});

app.listen(port, () => {
  console.log(`Serwer działa na http://localhost:${port}`);
});
