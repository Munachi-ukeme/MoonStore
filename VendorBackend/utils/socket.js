// socket.js solves a circular dependency problem.
// server.js calls initSocket() to create io; chatController calls getIO() to use it.
const jwt = require("jsonwebtoken");
const Conversation = require("../models/Conversation");

let io;

const OBJECT_ID_PATTERN = /^[a-f0-9]{24}$/;

// keep this list the same as the CORS list in server.js
const ALLOWED_ORIGINS = [
    "https://moonstore.ng",
    "https://www.moonstore.ng",
    process.env.FRONTEND_URL,
].filter(Boolean);

// returns the seller id inside a valid login token, or null
const getSellerIdFromToken = (token) => {
    if (typeof token !== "string" || !token) return null;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded && decoded.id ? String(decoded.id) : null;
    } catch (err) {
        return null;
    }
};

const initSocket = (httpServer) => {
    const { Server } = require("socket.io");

    io = new Server(httpServer, {
        cors: {
            origin: ALLOWED_ORIGINS,
            methods: ["GET", "POST"],
        },
    });

    io.on("connection", (socket) => {
        // a conversation room is only joined by its own seller (valid login)
        // or by the buyer's browser session that started it
        socket.on("join_conversation", async (payload) => {
            try {
                const { conversationId, sessionId, token } = payload || {};

                if (typeof conversationId !== "string" || !OBJECT_ID_PATTERN.test(conversationId)) return;

                const conversation = await Conversation.findById(conversationId)
                    .select("sellerId buyerSessionId")
                    .lean();
                if (!conversation) return;

                const sellerId = getSellerIdFromToken(token);
                const isSeller = !!sellerId && String(conversation.sellerId) === sellerId;
                const isBuyer =
                    typeof sessionId === "string" &&
                    sessionId.length > 0 &&
                    conversation.buyerSessionId === sessionId;

                if (!isSeller && !isBuyer) return;

                socket.join(conversationId);
            } catch (err) {
                console.error("join_conversation error:", err.message);
            }
        });

       
    });

    return io;
};

// throws an error if called before initSocket — prevents silent failures
const getIO = () => {
    if (!io) {
        throw new Error("Socket.IO has not been initialized. Call initSocket first.");
    }
    return io;
};

module.exports = { initSocket, getIO };