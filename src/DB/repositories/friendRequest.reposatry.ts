import friendRequestModel, { IFriendRequest } from "../Models/friendRequest.model";
import { DBRepositories } from "./db.repositories";
import { Model } from "mongoose";



export class FriendRequestRepositories extends DBRepositories<IFriendRequest> {
  constructor(friendRequestModal: Model<IFriendRequest>) {
    super(friendRequestModal);
  }
}
