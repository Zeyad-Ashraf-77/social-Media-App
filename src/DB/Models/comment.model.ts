import mongoose, { models, Schema,model } from "mongoose";


export enum onModelEnum {
  post = "post",
  comment = "comment"
}



export interface IComment {
 content?:string,
 attachments?:string[],
 assetFolder?:string,
 createdBy:Schema.Types.ObjectId
 refId:Schema.Types.ObjectId,
 onModel:onModelEnum,
 tags?:Schema.Types.ObjectId[],
 likes?:Schema.Types.ObjectId[],
 deletedAt?:Date,
 deletedBy?:Schema.Types.ObjectId,
 restoredAt?:Date,
 restoredBy?:Schema.Types.ObjectId,
 
}

const commentSchema = new mongoose.Schema<IComment>({
 content:{type:String,minLength:5,maxLength:10000,trim:true,required:function(){return this.attachments?.length?false:true}},
 attachments:{type:[String],trim:true},
 assetFolder:{type:String,trim:true},
 createdBy:{type:Schema.Types.ObjectId,ref:"User",required:true},
 refId:{type:Schema.Types.ObjectId,refPath:"onModel",required:true},
 onModel:{type:String,required:true,enum:onModelEnum},
 tags:{type:[Schema.Types.ObjectId],ref:"User",default:[]},
 likes:{type:[Schema.Types.ObjectId],ref:"User",default:[]},
 deletedAt:{type:Date},

 deletedBy:{type:Schema.Types.ObjectId,ref:"User"},
 restoredAt:{type:Date},
 restoredBy:{type:Schema.Types.ObjectId,ref:"User"},
 
},{
   timestamps:true,
   strictQuery:true,
   toObject:{virtuals:true},
   toJSON:{virtuals:true}
   
})
commentSchema.pre(["findOne","find"],function(next){
    const query = this.getQuery();
    const {paranoid,...rest} = query;
    if(paranoid===false){
      this.setQuery({...rest})
    }else{
      this.setQuery({...rest,deletedAt:{$exists:false}})
    }
    next(); 
})

commentSchema.virtual("replies",{
  ref:"Comment",
  localField:"_id",
  foreignField:"commentId",
})

const commentModel = models.comment || model("comment"   ,  commentSchema )

export default commentModel
