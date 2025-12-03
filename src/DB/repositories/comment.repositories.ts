import { DBRepositories } from "./db.repositories";

import commentModel, { IComment } from "../Models/comment.model";
import { Model } from "mongoose";

export class CommentRepositories extends DBRepositories<IComment> {
  private _commentModal:Model<IComment> = commentModel
  constructor(commentModal: Model<IComment>) {
    super(commentModal);
  }
}
