const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path"); // Добавляем модуль path

const app = express();
const http = require("http").createServer(app); // Изменяем создание сервера
const io = require("socket.io")(http);

const port = process.env.PORT || 4200; // Используем PORT, предоставленный Heroku

app.use(cors());
app.use(express.json()); // Заменяем express.json() на bodyParser.json()
app.use(bodyParser.json());
app.use("/assets", express.static(path.join(__dirname, "assets"))); // Добавляем /assets для статики

// Обслуживаем статические файлы из корневой директории
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

io.on("connection", (socket) => {
  socket.on("chat message", (data) => {
    io.emit("chat message", { message: data.message, name: data.name });
  });
});

http.listen(port, () => {
  // Слушаем на http сервере
  console.log(`Server started on port ${port}`);
});
