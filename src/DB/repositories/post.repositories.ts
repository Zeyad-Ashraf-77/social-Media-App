import { DBRepositories } from "./db.repositories";

import postModel, { IPost } from "../Models/post.model";
import { Model } from "mongoose";

export class PostRepositories extends DBRepositories<IPost> {
  constructor(  postModal: Model<IPost>) {
    super(postModal);
  }
}
