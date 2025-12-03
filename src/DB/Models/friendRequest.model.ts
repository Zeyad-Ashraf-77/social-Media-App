import mongoose, { models, Schema, model } from "mongoose";

export interface IFriendRequest {
  sendFrom: Schema.Types.ObjectId;
  sendTo: Schema.Types.ObjectId;
  status: string;

  acceptedAt?: Date;
}
const friendRequestSchema = new mongoose.Schema<IFriendRequest>(
  {
    sendFrom: { type: Schema.Types.ObjectId, ref: "User", required: true },
    sendTo: { type: Schema.Types.ObjectId, ref: "User", required: true },
    acceptedAt: { type: Date },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

const friendRequestModel =
  models.friendRequest || model("friendRequest", friendRequestSchema);

export default friendRequestModel;
