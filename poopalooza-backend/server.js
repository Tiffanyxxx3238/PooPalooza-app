// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ ok: true, app: 'poopalooza-backend', time: new Date().toISOString() });
});

// Poop records endpoints
app.get('/poop-records', (req, res) => {
  console.log('GET /poop-records called');
  // Return empty array for now
  res.json([]);
});

app.post('/poop-records', (req, res) => {
  console.log('POST /poop-records called');
  console.log('Body:', req.body);
  res.json({ success: true, message: 'Record saved', id: Date.now() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Backend running on port ${PORT}`);
});