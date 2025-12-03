import mongoose, { Schema, Types } from "mongoose";


export enum Roles {
    user = "user",
    admin = "admin",
    superAdmin = "superAdmin"
   
}

export enum Genders {
    male = "male",
    female = "female", 
}

export enum ProviderUser {
    google = "google",
    system = "system"
}
export interface IUser {
    _id:Types.ObjectId,
    fName:string,
    lName:string,
    fullName: string;
    email:string,
    password:string,
    age:number,
    role:Roles,
    gender:Genders,
    phone?:string,
    address?:string,
    profileImage?:string,
    friends?:Schema.Types.ObjectId[]
    otp?:string,
    confirmEmail?:boolean,    
    changeCredential?:Date,
    provider:ProviderUser,
    createdAt:Date,
    updatedAt:Date,
    deletedAt:Date,
}

const userSchema = new mongoose.Schema<IUser>({
    fName:{type:String,required:true,minLength:3,maxLength:30,trim:true},
    lName:{type:String,required:true,minLength:3,maxLength:30,trim:true},
    email:{type:String,required:true,unique:true,trim:true},
    password:{type:String,required:function(this: IUser){
        return this.provider == ProviderUser.system?true:false
    },trim:true},
    age:{type:Number,required:function(this: IUser){
        return this.provider == ProviderUser.system?true:false
    },min:18,max:90},
    role:{type:String,enum:Roles,required:true,default:Roles.user},
    gender:{type:String,enum:Genders,required:function(this: IUser){
        return this.provider == ProviderUser.system?true:false
    },default:Genders.male},
    phone:{type:String,trim:true},
    address:{type:String,trim:true},
    profileImage:{type:String,trim:true},
    friends:{type:[Schema.Types.ObjectId],ref:"User"}, 
    otp:{type:String,trim:true},
    confirmEmail:{type:Boolean,default:false},
    changeCredential:{type:Date},
    provider:{type:String,enum:ProviderUser,required:true,default:ProviderUser.system},
},{
   timestamps:true,
   toObject:{virtuals:true},
   toJSON:{virtuals:true}}
)
userSchema.virtual("fullName").set(function(value){
    const [fName,lName]= value.split(" ")
    this.set({fName,lName})
}).get(function(){
    return `${this.fName} ${this.lName}`
})
const userModal = mongoose.model<IUser>("User",userSchema)

export default userModal
