require("dotenv").config();

const express = require("express");
const app = express();
const path = require("path");
const server = require("http").createServer(app);
const io = require("socket.io")(server);

server.listen(process.env.PORT, () => {
  console.log(`Server listening at port http://localhost:${process.env.PORT}`);
});

let allUsersObj = {};

io.on("connection", (socket) => {
  let addedUser = false;
  socket.on("new message", ({ message, id }) => {
    io.to(id).emit("new message", {
      username: socket.username,
      message,
    });
  });

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

  socket.on("disconnect", () => {
    if (addedUser) {
      let indexOfUserThatLeft = allUsersObj[socket.roomID].indexOf(
        socket.username
      );
      allUsersObj[socket.roomID].splice(indexOfUserThatLeft, 1);

      io.to(socket.roomID).emit("user left", {
        username: socket.username,
        numUsers: allUsersObj[socket.roomID].length,
        usersLeft: allUsersObj[socket.roomID],
      });
    }
  });
});
