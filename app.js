const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const http = require("http").createServer(app);

const port = process.env.PORT || 4200;

// Динамическая настройка CORS
const whitelist = [
  "http://localhost:4200",
  "https://simpleonlinechat.onrender.com",
];

const corsOptions = {
  origin: function (origin, callback) {
    console.log("CORS Origin (Function):", origin); // Add this line
    if (whitelist.indexOf(origin) !== -1 || !origin) {
      console.log("CORS Allowed (Function):", origin); // Add this line
      callback(null, true);
    } else {
      console.log("CORS Blocked (Function):", origin); // Add this line
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST"],
};

app.use(cors(corsOptions)); // Express CORS
console.log("CORS Middleware applied for Express"); // Add this line

const io = require("socket.io")(http, {
  cors: {
    origin: function (origin, callback) {
      console.log("Socket.IO Origin (Function):", origin); // Add this line
      if (whitelist.indexOf(origin) !== -1 || !origin) {
        console.log("Socket.IO Allowed (Function):", origin); // Add this line
        callback(null, true);
      } else {
        console.log("Socket.IO Blocked (Function):", origin); // Add this line
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST"],
  },
  maxHttpBufferSize: 1e8,
});
console.log("Socket.IO configured with CORS"); // Add this line

app.use(express.json());
app.use(bodyParser.json());
app.use("/assets", express.static(path.join(__dirname, "assets")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

//  Подключение к базе данных SQLite
const db = new sqlite3.Database("chat.db", (err) => {
  if (err) {
    console.error("Ошибка подключения к базе данных:", err.message);
  } else {
    console.log("Подключено к базе данных SQLite.");
    //  Создание таблицы, если она не существует
    db.run(
      `
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        message TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `,
      (err) => {
        if (err) {
          console.error("Ошибка создания таблицы:", err.message);
        }
      }
    );
  }
});

const messagesPerPage = 5;

//  Секретный API-ключ (ЗАМЕНИТЕ ЭТО!)
const API_KEY = "YOUR_SUPER_SECRET_API_KEY";

// API-эндпоинт для очистки БД
app.post("/clear_db", (req, res) => {
  const apiKey = req.headers["x-api-key"];

  if (apiKey !== API_KEY) {
    return res.status(403).send("Forbidden");
  }

  const sql = "DELETE FROM messages"; //  SQL-запрос для удаления всех сообщений

  db.run(sql, function (err) {
    if (err) {
      console.error(err.message);
      return res.status(500).send("Internal Server Error");
    }
    console.log("База данных очищена.");
    res.send("База данных очищена.");
  });
});

// Socket.IO
io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("chat message", (data) => {
    //  Сохранение сообщения в базе данных
    console.log("Received message:", data);
    db.run(
      `
      INSERT INTO messages (name, message)
      VALUES (?, ?)
    `,
      [data.name, data.message],
      (err) => {
        if (err) {
          console.error("Ошибка сохранения сообщения:", err.message);
        } else {
          console.log("Сообщение сохранено в базе данных.");
          //  Отправка сообщения всем клиентам
          io.emit("chat message", {
            message: data.message,
            name: data.name,
          });
        }
      }
    );
  });

  //  Обработчик запроса истории сообщений
  socket.on("get history", (lastMessageId) => {
    //  Принимаем lastMessageId
    console.log(
      "Запрос истории сообщений от:",
      socket.id,
      "lastMessageId:",
      lastMessageId
    );

    let query = `
      SELECT id, name, message, timestamp
      FROM messages
    `;
    let params = [];

    if (lastMessageId) {
      query += ` WHERE id < ?`; //  Добавляем условие WHERE, выбираем сообщения с id меньше lastMessageId
      params.push(lastMessageId);
    }

    query += `
      ORDER BY timestamp DESC -- Сортируем по убыванию (от новых к старым)
      LIMIT ?
    `;
    params.push(messagesPerPage);

    db.all(query, params, (err, rows) => {
      if (err) {
        console.error("Ошибка получения истории сообщений:", err.message);
      } else {
        console.log("Отправка истории сообщений:", rows);
        socket.emit("history", rows);
      }
    });
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

// Запускаем сервер
http.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
