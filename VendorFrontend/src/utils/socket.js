// socket.js solves a circular dependency problem.
// If we created io directly in server.js and then required server.js
// inside chatController to access io, Node.js would get confused
// because server.js already requires chatController.
// 
// Instead we store io in this separate file.
// server.js calls initSocket() to create it.
// chatController calls getIO() to use it.
// No circular dependency.

let io;

const initSocket = (httpServer) => {
    const { Server } = require("socket.io");

    io = new Server(httpServer, {
        cors: {
            origin: process.env.FRONTEND_URL,
            methods: ["GET", "POST"],
        },
    });

    io.on("connection", (socket) => {
        console.log("Socket connected:", socket.id);

        // buyer or seller joins a conversation room using conversationId
        // once inside the room, they receive all messages emitted to that room
        socket.on("join_conversation", (conversationId) => {
            socket.join(conversationId);
            console.log(`Socket ${socket.id} joined conversation: ${conversationId}`);
        });

        // seller joins their own personal room using their sellerId
        // used to notify them when a new conversation starts
        socket.on("join_seller_room", (sellerId) => {
            socket.join(sellerId);
            console.log(`Seller ${sellerId} joined their room`);
        });

        socket.on("disconnect", () => {
            console.log("Socket disconnected:", socket.id);
        });
    });

    return io;
};

// getIO is called from chatController whenever we need to emit an event
// throws an error if called before initSocket — prevents silent failures
const getIO = () => {
    if (!io) {
        throw new Error("Socket.IO has not been initialized. Call initSocket first.");
    }
    return io;
};

module.exports = { initSocket, getIO };