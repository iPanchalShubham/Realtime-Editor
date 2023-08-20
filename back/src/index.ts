import express, { Express, Request, Response, NextFunction } from "express";
import http from "http";
import path from "path";
import { Server, Socket } from "socket.io";

// Assuming ACTIONS is an object with string constants

const app: Express = express();
const server: http.Server = http.createServer(app);
const io: Server = new Server(server);

// Uncomment if needed
// app.use(express.static('build'));

// Uncomment if needed
// app.use((req: Request, res: Response, next: NextFunction) => {
//     res.sendFile(path.join(__dirname, 'build', 'index.html'));
// });

app.get("/", (_, res: Response) => {
  res.json({ message: "Up and running!!" });
});

interface UserSocketMap {
  [socketId: string]: string;
}

const userSocketMap: UserSocketMap = {};

interface ConnectedClient {
  socketId: string;
  username: string;
}

function getAllConnectedClients(roomId: string): ConnectedClient[] {
  return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
    (socketId: string): ConnectedClient => {
      return {
        socketId,
        username: userSocketMap[socketId],
      };
    }
  );
}

io.on("connection", (socket: Socket) => {
  console.log("socket connected", socket.id);

  socket.on(
    "join",
    ({ roomId, username }: { roomId: string; username: string }) => {
      userSocketMap[socket.id] = username;
      socket.join(roomId);
      const clients: ConnectedClient[] = getAllConnectedClients(roomId);
      // To every client
      clients.forEach(({ socketId }) => {
        io.to(socketId).emit("joined", {
          clients,
          username,
          socketId: socket.id,
        });
      });
    }
  );

  socket.on(
    "text_change",
    ({ roomId, text }: { roomId: string; text: string }) => {
      socket.in(roomId).emit("text_change", { text });
    }
  );

  socket.on(
    "sync_text",
    ({ socketId, text }: { socketId: string; text: string }) => {
      io.to(socketId).emit("text_change", { text });
    }
  );

  socket.on("disconnecting", () => {
    const rooms: string[] = [...socket.rooms];
    rooms.forEach((roomId: string) => {
      socket.in(roomId).emit("disconnected", {
        socketId: socket.id,
        username: userSocketMap[socket.id],
      });
      socket.leave(roomId);
    });
    delete userSocketMap[socket.id];
  });
});

const PORT: number = process.env.PORT ? parseInt(process.env.PORT) : 5000;
server.listen(PORT, () => console.log(`Listening on port ${PORT}`));
