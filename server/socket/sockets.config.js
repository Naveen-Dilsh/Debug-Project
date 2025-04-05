const {Server} = require('socket.io');
const Message = require("../models/message.model");

const initializeSocket=(server) => {
  const io = new Server(server,{
    cors:{
      origin: "*",
      methods: ["GET","POST"],
    }
  });

  io.on("connection", (socket) => {
    console.log("A new user has connected", socket.id);

    socket.on("message", (message) => {
      console.log("Message recieved",  message);
      const newMessage = new Message({})
      newMessage.save();
      io.emit("message", message);
    });

    socket.on("disconnect", async () => {
      try {
        const userId = socket.userId;
        await Accounts.updateOne({ _id: userId }, { isOnline: false });
        io.emit("user-status", { userId, isOnline: false });
      } catch (error) {
        console.error("Error updating user status to offline on disconnect:", error);
      }
    });
  });

}

  module.exports = initializeSocket;