const express = require("express");
const app = express();
const http = require("http").Server(app);
const { instrument } = require("@socket.io/admin-ui");

const io = require("socket.io")(http, {
  cors: {
    origin: [
      "https://admin.socket.io",
      "http://localhost:5173",
      "http://localhost:3000",
    ],
    credentials: true,
  },
});

instrument(io, {
  auth: false,
});

// app.use(express.static("public_html/"));
// app.get("/", function (req, res) {
//   res.sendFile(__dirname + "/public_html/index.html");
// });

io.sockets.on("connection", function (socket) {
  socket.userData = { x: 0, y: 0, z: 0, heading: 0 }; //Default values;

  console.log(`${socket.id} connected`);
  socket.emit("setId", { id: socket.id });

  socket.on("disconnect", function () {
    console.log(`Player ${socket.id} disconnected`);
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
    (socket.userData.pb = data.pb), (socket.userData.action = "Idle");
  });

  socket.on("update", function (data) {
    socket.userData.x = data.x;
    socket.userData.y = data.y;
    socket.userData.z = data.z;
    socket.userData.heading = data.h;
    (socket.userData.pb = data.pb), (socket.userData.action = data.action);
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
  console.log("listening on http://localhost:2002 - origin set");
});

function doUpdate() {
  const nsp = io.of("/");
  let pack = [];

  for (let id in io.sockets.sockets) {
    const socket = nsp.connected[id];
    //Only push sockets that have been initialised
    if (!socket.userData.model) {
      return;
    }
    pack.push({
      id: socket.id,
      model: socket.userData.model,
      colour: socket.userData.colour,
      x: socket.userData.x,
      y: socket.userData.y,
      z: socket.userData.z,
      heading: socket.userData.heading,
      pb: socket.userData.pb,
      action: socket.userData.action,
    });
  }
  if (pack.length > 0) io.emit("remoteData", pack);
}

setInterval(doUpdate, 40);
