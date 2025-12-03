import { DBRepositories } from "./db.repositories";

import chatModal, { IChat } from "../Models/chat.model";
import { Model } from "mongoose";

export class ChatRepositories extends DBRepositories<IChat> {
  private _chatModal: Model<IChat> = chatModal;
  constructor(  chatModal: Model<IChat>) {
    super(chatModal);
  }
}
