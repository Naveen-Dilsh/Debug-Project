const { Server } = require("socket.io");

const PORT = 4000;

const io = new Server(PORT, {
    cors: {
        origin: "*",
    },
});

const users = new Map();

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Handle user joining
    socket.on("join", (username) => {
        users.set(socket.id, username);
        console.log(`${username} joined the chat`);

        // Broadcast join message
        socket.broadcast.emit("message", {
            sender: "System",
            text: `${username} joined the chat`,
            time: new Date().toLocaleTimeString(),
        });
    });

    // Handle incoming chat messages
    socket.on("message", (message) => {
        const username = users.get(socket.id);
        const messagePayload = {
            sender: username || "Anonymous",
            text: message.text,
            time: new Date().toLocaleTimeString(),
        };

        io.emit("message", messagePayload); // Broadcast the message
    });

    // Handle file sharing
    socket.on("file", (fileData) => {
        const username = users.get(socket.id);
        const filePayload = {
            sender: username || "Anonymous",
            fileName: fileData.name,
            fileURL: fileData.url,
            time: new Date().toLocaleTimeString(),
        };

        io.emit("file", filePayload); // Broadcast file data
    });

    // Handle disconnection
    socket.on("disconnect", () => {
        const username = users.get(socket.id);
        if (username) {
            console.log(`${username} disconnected`);
            socket.broadcast.emit("message", {
                sender: "System",
                text: `${username} left the chat`,
                time: new Date().toLocaleTimeString(),
            });
            users.delete(socket.id);
        }
    });
});

console.log(`Socket.IO server is running on ws://localhost:${PORT}`);
