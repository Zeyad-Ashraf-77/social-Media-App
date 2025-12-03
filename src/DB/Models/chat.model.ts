import mongoose, { model, Types } from "mongoose";
import { Schema } from "mongoose";

export interface IMessage{
    content:string,
    createdBy:Types.ObjectId,
    createdAt?:Date,
    updatedAt?:Date,
    
}


export interface IChat {
    messages:IMessage[]
    createdAt?:Date,
    updatedAt?:Date,
    createdBy:Types.ObjectId,
    participants:Types.ObjectId[]

    // ==============
    groupName?:string,
    groupImage?:string,
    roomId?:string,
    

}



const messageSchema = new Schema<IMessage>({
    content:{type:String,required:true},
    createdBy:{type:Schema.Types.ObjectId,ref:"User",required:true},
    createdAt:{type:Date},
    updatedAt:{type:Date}
},{
    timestamps:true
})

const chatSchema = new Schema<IChat>({
    messages:{type:[messageSchema],default:[],required:true},
    createdBy:{type:Schema.Types.ObjectId,ref:"User",required:true},
    createdAt:{type:Date},
    updatedAt:{type:Date},
    participants:{type:[mongoose.Schema.Types.ObjectId],ref:"User",required:true},
    // ==============
    groupName:{type:String},
    groupImage:{type:String},
    roomId:{type:String}
},{
    timestamps:true
})
const chatModal = model<IChat>("Chat",chatSchema)
export default chatModal
