var express = require("express");
var app = express();
var path = require("path");
var server = require("http").createServer(app);
var io = require("socket.io")(server);
var port = process.env.PORT || 3000;

server.listen(port, () => {
  console.log(`Server listening at port http://localhost:${port}`);
});

// Chatroom

let allUsersObj = {};

io.on("connection", (socket) => {
  var addedUser = false;
  socket.on("new message", ({ message, id }) => {
    io.to(id).emit("new message", {
      username: socket.username,
      message,
    });
  });

  // when the client emits 'add user', this listens and executes
  socket.on("add user", (data) => {
    if (addedUser) return;
    let { username } = data;
    let id = data.urlID || data.generatedID;
    if (allUsersObj[id] == undefined) {
      allUsersObj[id] = [username];
    } else {
      allUsersObj[id] = [...allUsersObj[id], username];
    }
    socket.join(id);
    socket.username = username;
    socket.roomID = id;

    addedUser = true;

    console.log(allUsersObj[id].length, " allUsersObj[id].length");
    socket.emit("login", {
      numUsers: allUsersObj[id].length,
      allUsers: allUsersObj[id],
    });

    io.to(id).emit("user joined", {
      username: socket.username,
      numUsers: allUsersObj[id].length,
      allUsers: allUsersObj[id],
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
      let indexOfUserThatLeft = allUsersObj[socket.roomID].indexOf(
        socket.username
      );
      allUsersObj[socket.roomID].splice(indexOfUserThatLeft, 1);
      console.log(allUsersObj[socket.roomID]);
      // socket.broadcast.emit("user left", {
      //   username: socket.username,
      //   numUsers: numUsers,
      //   usersLeft: allUsers,
      // });

      io.to(socket.roomID).emit("user left", {
        username: socket.username,
        numUsers: allUsersObj[socket.roomID].length,
        usersLeft: allUsersObj[socket.roomID],
      });
    }
  });
});
