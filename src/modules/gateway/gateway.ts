import { ChatGateway } from "./../chat/chat.gateway";
import { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { AppError } from "../../utils/classError";
import { decodedToken, GitSignature, TokenType } from "../../utils/token";
import { Socket } from "socket.io";

export const connectionSockets = new Map<string, string[]>();
let io: Server | undefined = undefined;

export const gateway = (httpServer: HttpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  io.use(async (socket, next) => {
    try {
      const { authorization } = socket.handshake.auth as {
        authorization: string;
      };
      const [prefix, token] = authorization?.split(" ") || [];
      if (!prefix || !token) {
        throw new AppError("Invalid token", 401);
      }
      const signature = await GitSignature(TokenType.access, prefix);
      if (!signature) {
        throw new AppError("Unauthorized", 401);
      }

      const { user, decoded } = await decodedToken(token, signature);

      const socketsIds = connectionSockets.get(user._id.toString()) || [];
      socketsIds?.push(socket.id);
      connectionSockets.set(user._id.toString(), socketsIds);
      console.log(connectionSockets);

      socket.data.user = user;
      next();
    } catch (error) {
      next(error as AppError);
    }
  });

  const chatGateway: ChatGateway = new ChatGateway();

  io.on("connection", (socket) => {
    console.log("a user connected ❤️ ", socket.id);
    socket.on("welcome", (data: string) => {
      console.log(data);
    });
    chatGateway.register(socket, getIo());

    function removeSocket(socket: Socket<Server>) {
      const remainingSocketsIds = connectionSockets
        .get(socket.data.user._id.toString())
        ?.filter((socketId) => socketId !== socket.id);

      if (remainingSocketsIds?.length) {
        connectionSockets.set(
          socket.data.user._id.toString(),
          remainingSocketsIds
        );
      } else {
        connectionSockets.delete(socket.data.user._id.toString());

        getIo().emit("offline_user", socket.data.user._id.toString());
        console.log({ after: connectionSockets });
      }
    }
    socket.on("disconnect", () => {
      console.log("user disconnected ❤️ ", socket.id);
      removeSocket(socket);
    });
  });
};

const getIo = () => {
  if (!io) {
    throw new AppError("Server not found", 404);
  }

  return io;
};
