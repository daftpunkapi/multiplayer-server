const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const bodyParser = require("body-parser");
const app = express();

app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 3001;

// Accepting incoming connection requests from specified origin
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true
  },
});
server.listen(PORT, () => {
  console.log(`Server is Live 👽 at port ${PORT}`);
});

// Initializing empty array for storing user details 
let allFirebaseUsers = [];

// Initializing server-side connection through web sockets
// Listening to event for joining room & adding user to the room
io.on("connection", (socket) => {
  console.log(`A client has connected... ${socket.id}`);
  socket.on("firebaseUser", (data) => {
    socket.join(data.room);
    data.x = null;
    data.y = null;
    // Checking and adding if client socket exists and has not been initialized before
    if (
      data.hasOwnProperty("socketId") &&
      !allFirebaseUsers.some((user) => user.socketId === data.socketId)
    ) {
      allFirebaseUsers.push(data);
      console.log(allFirebaseUsers);
    }
    io.to(data.room).emit("allRoomUsers", allFirebaseUsers);
  });

  // Listening to mouse movement and updating cursor positions
  socket.on("mouseMove", (data) => {
    allFirebaseUsers.forEach(function (obj) {
      if (obj.socketId === data.socketId) {
        obj.x = data.x;
        obj.y = data.y;
      }
    });
    // Emitting cursors back to the room
    let room = Array.from(socket.rooms)[1];
    io.to(room).emit("cursorUpdate", allFirebaseUsers);
  });

  // Disconnecting from the Room and emitting updates to the room
  socket.on("disconnecting", () => {
    console.log(`user ${socket.id} disconnected`);
    let room = Array.from(socket.rooms)[1];
    socket.leave(room);
    allFirebaseUsers = allFirebaseUsers.filter(
      (user) => user.socketId !== socket.id
    );
    io.to(room).emit("allRoomUsers", allFirebaseUsers);
    io.to(room).emit("cursorUpdate", allFirebaseUsers);
  });

  // Listening to browser back event and emitting updates to the room
  socket.on("backrefresh", () => {
    console.log(`user ${socket.id} disconnected`);
    let room = Array.from(socket.rooms)[1];
    socket.leave(room);
    allFirebaseUsers = allFirebaseUsers.filter(
      (user) => user.socketId !== socket.id
    );
    io.to(room).emit("allRoomUsers", allFirebaseUsers);
    io.to(room).emit("cursorUpdate", allFirebaseUsers);
  });
});
