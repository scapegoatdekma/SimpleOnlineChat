const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");

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
