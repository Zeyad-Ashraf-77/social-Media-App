import { NextFunction, Request, Response } from "express";
import { Server, Socket } from "socket.io";
import { UserRepositories } from "../../DB/repositories/user.repositories";
import { ChatRepositories } from "../../DB/repositories/chat.repo";
import { AppError } from "../../utils/classError";
import chatModal, { IChat } from "../../DB/Models/chat.model";
import userModal, { IUser } from "../../DB/Models/user.model";
import path from "path";
import { connectionSockets } from "../gateway/gateway";
import { Types } from "mongoose";
import cloudinaryConfig from "../../utils/cloudneryConfig";
import { randomUUID } from "crypto";

export class ChatService {
  constructor() {}
  private _userModal = new UserRepositories(userModal);
  private _chatModal = new ChatRepositories(chatModal);

  // ======================== Rest api =========================================
  getChat = async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.params;
    const user = await this._userModal.findOne({ filter: { _id: userId } });
    if (!user) {
      throw new AppError("User not found", 404);
    }
    const chat = await this._chatModal.findOne({
      filter: { participants: { $all: [userId, req.user._id] } },
      options: { populate: { path: "participants" } },
    });
    if (!chat) {
      throw new AppError("Chat not found", 404);
    }
    res.status(200).json({ message: "success", chat });
  };
  createGroupChat = async (req: Request, res: Response, next: NextFunction) => {
    let { groupName, groupImage, participants } = req.body;

    const createdBy = req.user._id as Types.ObjectId;

    const dpParticipants = participants.map((participant: string) =>
      Types.ObjectId.createFromHexString(participant)
    );

    const users = await this._userModal.find({
      filter: { _id: { $in: dpParticipants } },
    });

    if (users.length !== dpParticipants.length) {
      throw new AppError("Some users not found", 404);
    }
    if (req?.file) {
      groupImage = await cloudinaryConfig.uploadSingleFile(
        req.file as Express.Multer.File,
        { folder: "groupChat" }
      );
    } else {
      groupImage = users.find(
        (user: IUser) => user._id.toString() === createdBy.toString()
      )?.profileImage as string;
    }
    const chat = await this._chatModal.create({
      createdBy,
      groupName,
      groupImage,
      roomId: randomUUID().toString(),
      messages: [],
      participants: [...dpParticipants, createdBy],
    });
    if (chat.groupImage) {
      await cloudinaryConfig.deleteImageByPublicId(chat.groupImage);
    }
    res.status(200).json({ message: "success", chat });
  };
  getGroupChats = async (req: Request, res: Response, next: NextFunction) => {
    const groupId = req.params.groupId as string;
    const chat = await this._chatModal.findOne({
      filter: { _id:groupId },
    });
    if (!chat) {
      throw new AppError("Chat not found", 404);
    }
    res.status(200).json({ message: "success", chat });
  };
  // ======================== Socket events =========================================
  welcome = (socket: Socket, io: Server, data: any) => {
    console.log(data);
  };
  sendMessage = async (socket: Socket, io: Server, data: any) => {
    const { content, sendTo } = data;
    const createdBy = socket.data.user._id as Types.ObjectId;
    const chat = await this._chatModal.findOneAndUpdate(
      {
        $and: [
          { participants: { $all: [sendTo, createdBy] } },
          { participants: { $size: 2 } },
          { groupName: { $exists: false } },
        ],
      },
      {
        $push: { messages: { content, createdBy } },
      }
    );
    if (!chat) {
      await this._chatModal.create({
        createdBy,
        participants: [createdBy, sendTo],
        messages: [{ content, createdBy }],
      });
    }
    io.to(connectionSockets.get(createdBy.toString())!).emit("successMessage", {
      content,
    });
    io.to(connectionSockets.get(sendTo.toString())!).emit("newMessage", {
      content,
      from: socket.data.user,
    });
  };
  join_room = async (socket: Socket, io: Server, data: any) => {
    const { roomId } = data;
    const chat = await this._chatModal.findOne({
      filter: {
        roomId,
        participants: { $in: [socket.data.user._id] },
        groupName: { $exists: true },
      },
    });
    if (!chat) {
      throw new AppError("Chat not found", 404);
    }
    socket.join(chat?.roomId!);
    io.to(chat?.roomId!).emit("join_room", { message: "joined room" });
  };
  sendGroupChat = async (req: Request, res: Response, next: NextFunction) => {
    const { groupId } = req.params;
    const { content } = req.body;
    if (!groupId) {
      throw new AppError("Group ID is required", 400);
    }
    const createdBy = req.user._id as Types.ObjectId;
    const chatId = Types.ObjectId.createFromHexString(groupId);
    const chat = await this._chatModal.findOne({
      filter: {
        _id: chatId,
        participants: { $in: [createdBy] },
        groupName: { $exists: true },
      },
      options: { populate: { path: "messages.createdBy"} },
    });
    if (!chat) {
      throw new AppError("Chat not found", 404);
    }
    await this._chatModal.updateOne(
      { _id: chatId },
      { $push: { messages: { content, createdBy } } }
    );
    res.status(200).json({ message: "success", chat });
  };
  sendGroupMessage = async (socket: Socket, io: Server, data: any) => {
    const { content, groupId } = data;
    console.log(data);
    if (!groupId) {
      throw new AppError("Group ID is required", 400);
    }
    const createdBy = socket.data.user._id as Types.ObjectId;
    const chatId = Types.ObjectId.createFromHexString(groupId);
    const chat = await this._chatModal.findOneAndUpdate(
      {
        _id: chatId,
        participants: { $in: [createdBy] },
        groupName: { $exists: true },
      },
      { $push: { messages: { content, createdBy } } }
    );
    if (!chat) {
      throw new AppError("Chat not found", 404);
    }
    io.to(connectionSockets.get(createdBy.toString())!).emit("successMessage", {
      content,
    });
    io.to(chat?.roomId!).emit("newMessage", {
      content,
      from: socket.data.user,
      groupId,
    });
  };
}
