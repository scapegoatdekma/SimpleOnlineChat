const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

const port = process.env.PORT || 4200;

// Динамическая настройка CORS
const whitelist = [
  "http://localhost:4200",
  "https://simpleonlinechat.onrender.com",
]; // Добавьте свои домены
const corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1 || !origin) {
      // Разрешить запросы без origin (например, curl)
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST"], // Укажите разрешенные методы
};

app.use(cors(corsOptions));

// Middleware
app.use(express.json());
app.use(bodyParser.json());
app.use("/assets", express.static(path.join(__dirname, "assets")));

// Обслуживаем index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Socket.IO
io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("chat message", (data) => {
    io.emit("chat message", { message: data.message, name: data.name });
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

// Запускаем сервер
http.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
