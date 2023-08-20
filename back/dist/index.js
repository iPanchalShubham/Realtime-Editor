"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
// Assuming ACTIONS is an object with string constants
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server);
// Uncomment if needed
// app.use(express.static('build'));
// Uncomment if needed
// app.use((req: Request, res: Response, next: NextFunction) => {
//     res.sendFile(path.join(__dirname, 'build', 'index.html'));
// });
app.get("/", (_, res) => {
    res.json({ message: "Up and running!!" });
});
const userSocketMap = {};
function getAllConnectedClients(roomId) {
    return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map((socketId) => {
        return {
            socketId,
            username: userSocketMap[socketId],
        };
    });
}
io.on("connection", (socket) => {
    console.log("socket connected", socket.id);
    socket.on("join", ({ roomId, username }) => {
        userSocketMap[socket.id] = username;
        socket.join(roomId);
        const clients = getAllConnectedClients(roomId);
        // To every client
        clients.forEach(({ socketId }) => {
            io.to(socketId).emit("joined", {
                clients,
                username,
                socketId: socket.id,
            });
        });
    });
    socket.on("text_change", ({ roomId, text }) => {
        console.log(`text_change : ${text}`);
        socket.in(roomId).emit("text_change", { text });
    });
    socket.on("sync_text", ({ socketId, text }) => {
        console.log(`sync_text : ${text}`);
        io.to(socketId).emit("text_change", { text });
    });
    socket.on("disconnecting", () => {
        const rooms = [...socket.rooms];
        rooms.forEach((roomId) => {
            socket.in(roomId).emit("disconnected", {
                socketId: socket.id,
                username: userSocketMap[socket.id],
            });
            socket.leave(roomId);
        });
        delete userSocketMap[socket.id];
    });
});
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 5000;
server.listen(PORT, () => console.log(`Listening on port ${PORT}`));
//# sourceMappingURL=index.js.map