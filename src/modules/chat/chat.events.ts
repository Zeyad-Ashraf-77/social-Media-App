import { Server, Socket } from "socket.io";
import { ChatService } from "./chat.service";

export class ChatEvents {
  private _chatService: ChatService = new ChatService();
  constructor() {}

  welcome = (socket: Socket, io: Server) => {
    return socket.on("welcome", (data: any) => {
      this._chatService.welcome(socket, io, data);
    });
  };
  sendMessage = (socket: Socket, io: Server) => {
    return socket.on("sendMessage", (data: any) => {
      this._chatService.sendMessage(socket, io, data);
    });
  };
  join_room = (socket: Socket, io: Server) => {
    return socket.on("join_room", (data: any) => {
      this._chatService.join_room(socket, io, data);
    });
  };
  sendGroupMessage = (socket: Socket, io: Server) => {
    return socket.on("sendGroupMessage", (data: any) => {
      this._chatService.sendGroupMessage(socket, io, data);
    });
  };
}
