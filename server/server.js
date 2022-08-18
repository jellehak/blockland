const express = require("express");
const app = express();
const http = require("http").Server(app);
const { instrument } = require("@socket.io/admin-ui");

const io = require("socket.io")(http, {
  serveClient: false,
  cors: {
    origin: [
      "https://admin.socket.io",
      "http://localhost:5173",
      "http://localhost:3000",
    ],
    credentials: true,
  },
});

// Expose
global.io = io

const state = {}

// instrument(io, {
//   auth: false,
// });

app.get('/', (req, res) => {
  res.json({
    links: {
      nodes: "http://localhost:2002/nodes",
      sockets: "http://localhost:2002/sockets"
    }
  })
})
app.get('/nodes', (req, res) => {
  const resp = [...io.sockets.sockets]
  .map(([key,socket]) => ({
    id: key, 
    ...socket.userData,
  }))
  res.json(resp)
})
app.get('/sockets', (req, res) => {
  const resp = [...io.sockets.sockets]
  .map(([key,socket]) => ({
    id: key, 
    userData: socket.userData,
    headers: socket.handshake
  }))
  res.json(resp)
})

io.on("connection", function (socket) {
  socket.userData = { x: 0, y: 0, z: 0, heading: 0 }; //Default values;

  console.log(`${socket.id} connected`);
  // DEPRECATE
  socket.emit("setId", { id: socket.id });

  socket.on("disconnect", function () {
    console.log(`Player ${socket.userData.model} ${socket.id} disconnected`);
    socket.broadcast.emit("deletePlayer", { id: socket.id });
  });

  socket.on("init", function (data) {
    console.log(`socket.init ${data.model}`);
    socket.userData.model = data.model;
    socket.userData.colour = data.colour;
    socket.userData.x = data.x;
    socket.userData.y = data.y;
    socket.userData.z = data.z;
    socket.userData.heading = data.h;
    socket.userData.pb = data.pb
    socket.userData.action = "Idle"
  });

  socket.on("update", function (data) {
    socket.userData.x = data.x;
    socket.userData.y = data.y;
    socket.userData.z = data.z;
    socket.userData.heading = data.h;
    socket.userData.pb = data.pb
    socket.userData.action = data.action
  });

  socket.on("chat message", function (data) {
    console.log(`chat message:${data.id} ${data.message}`);
    io.to(data.id).emit("chat message", {
      id: socket.id,
      message: data.message,
    });
  });
});

http.listen(process.env.PORT || 2002, function () {
  console.log("listening on http://localhost:2002");
});

function doUpdate() {
  const resp = [...io.sockets.sockets]
  .map(([key,socket]) => ({
    id: key, 
    ...socket.userData,
  }))
  
  // Emit to all
  io.emit("remoteData", resp);
}

// setInterval(doUpdate, 40);
setInterval(doUpdate, 400);
