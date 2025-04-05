const mongoSanitize = require("express-mongo-sanitize");
const createError = require("http-errors");
const bodyParser = require("body-parser");
const path = require("path");
const helmet = require("helmet");
const cors = require("cors");
const express = require("express");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const routes = require("./routes");
const getSecrets = require("./helper/getSecrets");
const { rateLimit } = require("express-rate-limit");
var fs = require("fs");
var http = require("http");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
const Message = require("./models/message.model");

require("dotenv").config();
var debug = require("debug")("wren-re:server");
let app = express();

getSecrets().then((res) => {
  if (res) {
    app.use(express.static(path.join(__dirname, "public")));
    app.set("view engine", "ejs");
    app.use(cors());
    app.use(function (req, res, next) {
      res.setHeader("Access-Control-Allow-Origin", "*"); //Enable CORS
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization"
      );
      res.setHeader("Access-Control-Allow-Methods", "GET, POST");
      next();
    });

    app.use(logger(process.env.LOGGER));

    // create a write stream (in append mode)
    var accessLogStream = fs.createWriteStream(
      path.join(__dirname, "access.log"),
      { flags: "a" }
    );

    var logFormat =
      ':remote-addr - :remote-user [:date[iso]] ":method :url HTTP/:http-version" :status :res[content-length] - :response-time ms';

    // setup the logger
    app.use(logger(logFormat, { stream: accessLogStream }));

    app.use(express.json({ limit: process.env.EXPRESS_LIMIT }));
    app.use(express.urlencoded({ extended: false }));
    app.use(cookieParser());

    app.use(bodyParser.json());

    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      limit: 500, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
      standardHeaders: "draft-7", // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
      legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
      // store: ... , // Redis, Memcached, etc. See below.
    });

    app.use(limiter);
    app.use(mongoSanitize());
    app.use(helmet());

    routes(app);

    app.get("/", (req, res) => {
      res.header("Cache-Control", "no-cache");
      res.render("index", { currentTime: new Date() });
    });
    // catch 404 and forward to error handler
    app.use(function (req, res, next) {
      next(createError(404));
    });
    // error handler
    app.use(function (err, req, res, next) {
      // set locals, only providing error in development
      res.locals.message = err.message;
      res.locals.error = req.app.get("env") === "development" ? err : {};
      // render the error page
      res.status(err.status || 500);
      res.render("error");
    });

    var port = normalizePort(process.env.PORT || "8000");
    app.set("port", port);

    var mongodbUrl = process.env.DATABASE_URL; // process.env.DATABASE_URL;
    mongoose.set("strictQuery", true);

    try {
      if (mongodbUrl) {
        const options = {
          keepAlive: true,
          keepAliveInitialDelay: 300000,
          maxPoolSize: 1000, // Maintain up to 10 socket connections
          serverSelectionTimeoutMS: 45000, // Keep trying to send operations for 5 seconds
          socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
          family: 4, // Use IPv4, skip trying IPv6
        };
        // console.log("Establishing Connection with : ", mongodbUrl);
        mongoose.connect(mongodbUrl, options);

        var localThis = this;
        mongoose.connection.on("connected", function () {
          console.log("Connected to mongodb");
          // Do something
        });
        mongoose.connection.on("error", function (err) {
          console.log("Error : ", err);
          // Do something
        });
      } else {
        console.error("No Connection Details to connect with a database");
        process.exit(1);
      }
    } catch (err) {
      console.log(err);
      process.exit(1);
    }

    //////////// SOCKET IMPLEMENTATION FOR GROUP CHAT /////////////
    const server = http.createServer(app);
    const io = require("socket.io")(server, {
      cors: {
        origin: process.env.CLIENT_URL,
        methods: ["GET", "POST"],
      },
    });
    const groups = {}; // In-memory storage for group members
    io.on("connection", (socket) => {
      console.log(`User connected: ${socket.id}`);

      // Join room
      socket.on("join-room", (groupId) => {
        socket.join(groupId);
        console.log(`User joined group: ${groupId}`);
        groups[groupId] = groups[groupId] || [];
        groups[groupId].push(socket.id);
      });

      // Send message to group
      socket.on("send-group-msg", (data) => {
        console.log(data,"1234567890")
        const { text, groupId, sender } = data;
        const message = {
          text,
          sender,
          time: new Date().toISOString(),
          socketId: socket.id,
          groupId: data.groupId,
          senderName: data.senderName,
          attachment:data.attachment,
        };

        // Broadcast message to the group
        io.to(groupId).emit("group-msg-recieve", message);

        // Optionally, save to database
        console.log(`Message sent to group ${groupId}:`, message);
      });

      // Disconnect
      socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);
        // Clean up group membership (optional)
        Object.keys(groups).forEach((groupId) => {
          groups[groupId] = groups[groupId].filter((id) => id !== socket.id);
        });
      });
    });
    server.listen(process.env.PORT, () =>
      console.log(`Server started on ${process.env.PORT}`)
    );
    /////////// OTHER SOCKET IMPLEMENTION (OLD) //////////
    // var server = http.createServer(app);
    // const io = socket(server, {
    //   cors: {
    //     origin: "*", // Adjust your CORS settings as needed
    //     methods: ["GET", "POST"],
    //   },
    // });
    // Make `io` globally accessible
    // server.listen(port);
    //////////////////////////////////////////////////////////

    global.io = io;
    server.on("error", onError);
    server.on("listening", onListening);

    function normalizePort(val) {
      var port = parseInt(val, 10);

      if (isNaN(port)) {
        // named pipe
        return val;
      }

      if (port >= 0) {
        // port number
        return port;
      }

      return false;
    }

    function onError(error) {
      if (error.syscall !== "listen") {
        throw error;
      }

      var bind = typeof port === "string" ? "Pipe " + port : "Port " + port;

      // handle specific listen errors with friendly messages
      switch (error.code) {
        case "EACCES":
          console.error(bind + " requires elevated privileges");
          process.exit(1);
          break;
        case "EADDRINUSE":
          console.error(bind + " is already in use");
          process.exit(1);
          break;
        default:
          throw error;
      }
    }

    function onListening() {
      var addr = server.address();
      var bind =
        typeof addr === "string" ? "pipe " + addr : "port " + addr.port;
      debug("Listening on " + bind);
    }
  } else {
    console.log("Error: Fetch secrets values.");
  }

  //////////// SOCKET IMPLEMENTATION FOR SINGLE CHAT /////////////
  // handle messeges
  global.onlineUsers = new Map();
  io.on("connection", (socket) => {
    global.chatSocket = socket;
    socket.on("add-user", (userId) => {
      console.log("User added", userId);
      onlineUsers.set(userId, socket.id);
    });

    socket.on("send-msg", (data) => {
      console.log("Message recieved", data);
      const newMessage = new Message({
        text: data.text,
        senderChatID: data.sender,
        receiverChatID: data.receiver,
        attachment:data.attachment
      });
      newMessage.save();
      console.log("Online users:", Array.from(onlineUsers.entries()));
      const sendUserSocket = onlineUsers.get(data.receiver);
      if (sendUserSocket) {
        console.log("Message sent to", sendUserSocket);

        const messagePayload = {
          text: data.text,
          sender: data.sender,
          receiver: data.receiver,
          receiverName: data.receiverName,
          attachment:data.attachment

        };

        socket.to(sendUserSocket).emit("msg-recieve", messagePayload);
      } else {
        console.log("Messege failed!", sendUserSocket);
      }
    });
  });
});
//////////////////////////////////////////////////////////

module.exports = app;