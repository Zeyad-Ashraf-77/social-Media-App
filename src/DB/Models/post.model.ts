import mongoose, { models, Schema,model } from "mongoose";


export enum AllowComment {
   allow="allow",
   deny="deny"
   
}

export enum Availability {
   public="public",
   private="private",
   friends="friends"
   
}

export interface IPost {
 content?:string,
 attachments?:string[],
 assetFolder?:string,
 createdBy:Schema.Types.ObjectId
 tags?:Schema.Types.ObjectId[],
 likes?:Schema.Types.ObjectId[],
 allowComment?:AllowComment,
 availability?:Availability,
 
 deletedAt?:Date,
 deletedBy?:Schema.Types.ObjectId,
 restoredAt?:Date,
 restoredBy?:Schema.Types.ObjectId,
 
}

const postSchema = new mongoose.Schema<IPost>({
 content:{type:String,minLength:5,maxLength:10000,trim:true,required:function(){return this.attachments?.length?false:true}},
 attachments:{type:[String],trim:true},
 assetFolder:{type:String,trim:true},
 createdBy:{type:Schema.Types.ObjectId,ref:"User",required:true},
 tags:{type:[Schema.Types.ObjectId],ref:"User",default:[]},
 likes:{type:[Schema.Types.ObjectId],ref:"User",default:[]},
 allowComment:{type:String,enum:AllowComment,default:AllowComment.allow},
 availability:{type:String,enum:Availability,default:Availability.public},
 deletedAt:{type:Date},

 deletedBy:{type:Schema.Types.ObjectId,ref:"User"},
 restoredAt:{type:Date},
 restoredBy:{type:Schema.Types.ObjectId,ref:"User"},
 
},{
   timestamps:true,
   toObject:{virtuals:true},
   toJSON:{virtuals:true}}
)
postSchema.pre(["findOne","find"],function(next){
    const query = this.getQuery();
    const {paranoid,...rest} = query;
    if(paranoid===false){
      this.setQuery({...rest})
    }else{
      this.setQuery({...rest,deletedAt:{$exists:false}})
    }
    next(); 
})
const postModel = models.post || model("post",postSchema )

export default postModel
