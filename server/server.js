const express = require("express");
const cors = require("cors");
const routs = require("./roust/routs.js");

const app = express();
const port = 1488;

// ✅ ПРАВИЛЬНЫЙ ПОРЯДОК:
// 1. Сначала CORS
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));

// 2. ОБЯЗАТЕЛЬНО: парсинг JSON — ДО роутов!
app.use(express.json());

// 3. Только потом роуты
app.use("/", routs);

app.listen(port, () => {
  console.log(`✅ Сервер запущен на http://localhost:${port}`);
});