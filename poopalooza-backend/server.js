// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// 健康檢查路由
app.get('/', (req, res) => {
  res.json({ ok: true, app: 'poopalooza-backend', time: new Date().toISOString() });
});

// 你可以在這裡加更多 API 路由
// app.use('/api/something', require('./routes/something'))

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Backend running on port ${PORT}`);
});
