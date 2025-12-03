import mongoose, { Types } from "mongoose";



export interface IRevokeToken {
    userId:Types.ObjectId,
    tokenId:string,
    expireAt:Date,
}

const userSchema = new mongoose.Schema<IRevokeToken>({
    userId:{type:mongoose.Schema.Types.ObjectId,required:true,ref:"User"},
    tokenId:{type:String,required:true},
    expireAt:{type:Date,required:true},
},{
   timestamps:true,
   toObject:{virtuals:true},
   toJSON:{virtuals:true}}
)

const RevokeTokenModal = mongoose.model<IRevokeToken>("RevokeToken",userSchema)

export default RevokeTokenModal
