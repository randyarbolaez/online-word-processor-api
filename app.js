var express = require("express");
var app = express();
var path = require("path");
var server = require("http").createServer(app);
var io = require("socket.io")(server, { origins: "*:*" });
var port = process.env.PORT || 3000;

server.listen(port, () => {
  console.log(`Server listening at port http://localhost:${port}`);
});

// Chatroom

var numUsers = 0;
let allUsers = [];

io.on("connection", (socket) => {
  var addedUser = false;
  // when the client emits 'new message', this listens and executes
  socket.on("new message", (data) => {
    // console.log(data, "data");
    // we tell the client to execute 'new message'
    socket.broadcast.emit("new message", {
      username: socket.username,
      message: data,
    });
  });

  // when the client emits 'add user', this listens and executes
  socket.on("add user", (username) => {
    if (addedUser) return;
    console.log("added user!!!!", username);
    // we store the username in the socket session for this client
    socket.username = username;
    ++numUsers;
    addedUser = true;
    allUsers.push(username);
    socket.emit("login", {
      numUsers: numUsers,
      allUsers,
    });
    // echo globally (all clients) that a person has connected
    socket.broadcast.emit("user joined", {
      username: socket.username,
      numUsers: numUsers,
      allUsers,
    });
  });

  // when the client emits 'typing', we broadcast it to others
  socket.on("typing", () => {
    socket.broadcast.emit("typing", {
      username: socket.username,
    });
  });

  // when the client emits 'stop typing', we broadcast it to others
  socket.on("stop typing", () => {
    socket.broadcast.emit("stop typing", {
      username: socket.username,
    });
  });

  // when the user disconnects.. perform this
  socket.on("disconnect", () => {
    if (addedUser) {
      --numUsers;

      let indexOfUserThatLeft = allUsers.indexOf(socket.username);
      allUsers.splice(indexOfUserThatLeft, 1);
      // echo globally that this client has left
      console.log("user left!!!!", socket.username);
      socket.broadcast.emit("user left", {
        username: socket.username,
        numUsers: numUsers,
        usersLeft: allUsers,
      });
    }
  });
});
