const path = require('path');
const express = require('express');
const cors = require('cors');
const routs = require('./roust/routs.js');

const app = express();
const port = process.env.PORT || 1488;

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  }),
);

app.use(express.json({ limit: '5mb' }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/', routs);

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Эндпоинт не найден: ${req.method} ${req.originalUrl}` });
});

app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
});
