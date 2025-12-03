import { TokenPayload } from 'google-auth-library/build/src/auth/loginticket';
import { RevokeTokenRepositories } from '../../DB/repositories/revokeToken.repositories';
import { NextFunction, Request, Response } from "express";
import { Genders, IUser, ProviderUser, Roles } from "../../DB/Models/user.model";
import { Hash, Compare } from "../../utils/hash";
import { otpEmail } from "../../service/sendEmail";
import eventEmitter from "../../utils/events";
import { AppError } from "../../utils/classError";
import { generateToken } from '../../utils/token';
import { v4 as uuidv4 } from 'uuid';
import { UserRepositories } from '../../DB/repositories/user.repositories';
import { OAuth2Client } from 'google-auth-library';
import { AcceptFriendRequestSchema, FlagType, ForgetPasswordSchema, LogOutSchema, ResetPasswordSchema, SendFriendRequestSchema, SignInSchema } from './user.validation';
import { PostRepositories } from '../../DB/repositories/post.repositories';
import { FriendRequestRepositories } from '../../DB/repositories/friendRequest.reposatry';
import cloudinaryConfig from '../../utils/cloudneryConfig';
import userModal from '../../DB/Models/user.model';
import postModal from '../../DB/Models/post.model';
import friendRequestModal from '../../DB/Models/friendRequest.model';
import revokeTokenModal from '../../DB/Models/revokeToken.model';
import chatModal from '../../DB/Models/chat.model';
import { ChatRepositories } from '../../DB/repositories/chat.repo';
const { ObjectId } = require('mongoose').Types;

interface ISignUp {
    fullName:string,
    email:string,
    password:string,
    cPassword:string,
    age:number,
    gender:Genders, 
    phone?:string,
    address?:string
}
 
class UserService {

    // private _userModal:Model<IUser> = userModal
    private _userModel= new UserRepositories(userModal)
    private _postModel = new PostRepositories(postModal)
    private _revokeToken = new RevokeTokenRepositories(revokeTokenModal)
    private _friendRequest = new FriendRequestRepositories(friendRequestModal)
    private _chatModal = new ChatRepositories(chatModal)

    constructor(){
     
    }
    // ------------------signUp---------------------
  signUp = async(req:Request,res:Response,next:NextFunction)=>{
   let {fullName ,email,password,cPassword,age,gender,phone,address}:ISignUp = req.body

   if (await this._userModel.findOne({filter:{email}}) !== null) {
    return res.status(400).json({message:"User already exists"})
   }
   if (password !== cPassword) {
     return res.status(400).json({message:"Password not match"})
    }
    
    const hashedPassword = await Hash(password)
    const otp = otpEmail()
    const hssOtp = await Hash(String(otp))
    
    eventEmitter.emit("confirmEmail", otp,email)
    const user = await this._userModel.createOneUser({  fullName, email,  password:hashedPassword, age,  gender,  otp:hssOtp,  ...(phone && { phone }), ...(address && { address }) })
    res.status(200).json({message:"success", user:user})
}  
// ------------------confirmEmail---------------------
  confirmEmail = async(req:Request,res:Response,next:NextFunction)=>{
    const {otp,email} = req.body
    const user = await this._userModel.findOne({filter:{email, confirmEmail: false}})
    if (!await Compare(otp,user?.otp!)) {
     throw new AppError("Otp not match",400)
     }
  
    await this._userModel.updateOne({filter:{email}}, {confirmEmail: true, otp: ""})
    res.status(200).json({message:"success"})
}
// ------------------signIn---------------------
  signIn = async(req:Request,res:Response,next:NextFunction)=>{
    const {email,password}:SignInSchema = req.body

   const user = await this._userModel.findOne({filter:{email}})
   if (!user) { 
    throw new AppError("User not found",404)
   }
   if (!await Compare(password,user.password)) {
    throw new AppError("Password not match",400)           
   }
   const jwtid = uuidv4()
   const accessToken = await generateToken({
    payload:{id:user._id,email:user.email},
    signature:user.role == Roles.user ? process.env.JWT_SECRET_ACCESS_USER! : process.env.JWT_SECRET_ACCESS_ADMIN!,
    option:{expiresIn:"1h",jwtid:jwtid}
  })
   const refreshToken = await generateToken({
    payload:{id:user._id,email:user.email},
    signature:user.role == Roles.user ? process.env.JWT_SECRET_REFRESH_USER!: process.env.JWT_SECRET_REFRESH_ADMIN!,
    option:{expiresIn:"7d",jwtid:jwtid}
  })

  await this._revokeToken.create({userId:user._id,tokenId:refreshToken,expireAt:new Date(Date.now() + 7*24*60*60*1000)})
  res.status(200).json({message:"success",accessToken,refreshToken})
}
  signInWithGoogle = async(req:Request,res:Response,next:NextFunction)=>{
     
     const { idToken } = req.body;

    const client = new OAuth2Client();
    async function verify() {
      const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.WEB_CLIENT_ID!,
      });
      const payload = ticket.getPayload();
      return payload;
    }
    const {email, name, picture,email_verified} = await verify() as TokenPayload;
    if(!email_verified){
      throw new AppError("Email not verified",400)
    }
    let user = await this._userModel.findOne({filter:{email :email!}});
    if (!user) {
      user = await this._userModel.createOneUser({
        fullName:name!,
        email:email!,
        profileImage:picture!,
        confirmEmail: email_verified!,
        provider:ProviderUser.google,
      });
    }
    if (user.provider !== ProviderUser.google) {
      throw new AppError("please sign in with google",404)
    }

   const jwtid = uuidv4()
   const accessToken = await generateToken({
    payload:{id:user._id,email:user.email},
    signature:user.role == Roles.user ? process.env.JWT_SECRET_ACCESS_USER! : process.env.JWT_SECRET_ACCESS_ADMIN!,
    option:{expiresIn:"1h",jwtid:jwtid}
  })
   const refreshToken = await generateToken({
    payload:{id:user._id,email:user.email},
    signature:user.role == Roles.user ? process.env.JWT_SECRET_REFRESH_USER!: process.env.JWT_SECRET_REFRESH_ADMIN!,
    option:{expiresIn:"7d",jwtid:jwtid}
  })

  res.status(200).json({message:"success",accessToken,refreshToken})
}
profileImage = async(req:Request,res:Response,next:NextFunction)=>{
   const user = await this._userModel.findOne({filter:{_id:req.user._id}}) 
    if (!user) {
        throw new AppError("User not found",404)
    }
    if (!req.file) { 
        throw new AppError("File not found",404)
    }
    const uploadedImageUrls = await cloudinaryConfig.uploadSingleFile(req.file as Express.Multer.File , { folder: "profile-images" })
    user.profileImage = uploadedImageUrls
    await user.save()
    res.status(200).json({message:"success",user:user})
}
// ------------------getProfile---------------------
  getProfile = async(req:Request,res:Response,next:NextFunction)=>{

    const user = await this._userModel.findOne({ filter:{email:req.user.email},options:{populate:{path:"friends"}}})
    if (!user) {
      throw new AppError("User not found",404)
    }
    const groups = await this._chatModal.find({filter:{participants:{$in:[req.user._id]},groupName:{$exists:true}}})
    res.status(200).json({message:"success",user:user,groups})
}
// ------------------logOut---------------------
  logOut = async(req:Request,res:Response,next:NextFunction)=>{
    const{flag}:LogOutSchema = req.body

    if (flag === FlagType.all) {
      await this._userModel.updateOne({_id:req.user?._id},{changeCredential:new Date()})
      return res.status(200).json({message:"success logout all sessions"})
    }
    await this._revokeToken.create({
      userId:req.user?._id,
      tokenId:req.decoded?.jti!,
      expireAt:new Date(req.decoded?.exp!*1000

      )})
    

    return res.status(200).json({message:"success logout current session"})
}

// ------------------refreshToken---------------------
  refreshToken = async(req:Request,res:Response,next:NextFunction)=>{

    const jwtid = uuidv4()
    const accessToken = await generateToken({
      payload:{id:req.user._id,email:req.user.email},
      signature:req.user.role == Roles.user ? process.env.JWT_SECRET_ACCESS_USER! : process.env.JWT_SECRET_ACCESS_ADMIN!,
      option:{expiresIn:"1h",jwtid}
    })
    const refreshToken = await generateToken({
      payload:{id:req.user._id,email:req.user.email},
      signature:req.user.role == Roles.user ? process.env.JWT_SECRET_REFRESH_USER!: process.env.JWT_SECRET_REFRESH_ADMIN!,
      option:{expiresIn:"7d",jwtid}
    })
      await this._revokeToken.create({
      userId:req.user?._id,
      tokenId:req.decoded?.jti!,
      expireAt:new Date(req.decoded?.exp!*1000
      )})

    res.status(200).json({message:"success",accessToken,refreshToken})
}

// ------------------forgetPassword---------------------
  forgetPassword = async(req:Request,res:Response,next:NextFunction)=>{
   const {email}:ForgetPasswordSchema = req.body
   const user = await this._userModel.findOne({ filter:{email}})
   if (!user) {
     throw new AppError("User not found",404)
   }
   const otp = otpEmail()
   const hssOtp = await Hash(String(otp))
   eventEmitter.emit("forgetPassword", otp,email)
   await this._userModel.updateOne({email:user?.email}, {otp:hssOtp})
    res.status(200).json({message:"success send otp to your email"})
}
// ------------------resetPassword---------------------
  resetPassword = async(req:Request,res:Response,next:NextFunction)=>{
    const {email,password,cPassword,otp}:ResetPasswordSchema = req.body
    const user = await this._userModel.findOne({filter:{email}})
    if (!user) {
      throw new AppError("User not found",404)
    }
    if (!await Compare(otp,user?.otp!)) {
      throw new AppError("Otp not match",400)           
    }
    const hashedPassword = await Hash(password)
    await this._userModel.updateOne({email:user?.email}, {password:hashedPassword,otp:""})
    res.status(200).json({message:"success"})
}

dashBoard = async(req:Request,res:Response,next:NextFunction)=>{
  const result = await Promise.allSettled([
    this._userModel.find({filter:{}}),
    this._postModel.find({filter:{}}),
  ])
  res.status(200).json({message:"success", result })
}
changeRole = async(req:Request,res:Response,next:NextFunction)=>{
  const {userId} = req.params
  const {role:newRole}= req.body
  let denyRoles = [newRole, Roles.superAdmin]
  if (req.user?.role === Roles.admin) {
    denyRoles.push(Roles.admin)
    if (newRole === Roles.superAdmin) {
      throw new AppError("You can't change role to super admin",400)
    }
  }
  const user = await this._userModel.findOneAndUpdate({_id:userId,
    role: {$nin: denyRoles}
  },{role:newRole},{new:true})
  if (!user) {
    throw new AppError("User not found",404)
  }
  res.status(200).json({message:"success",user})
}

// ------------------sendFriendRequest---------------------
sendFriendRequest = async(req:Request,res:Response,next:NextFunction)=>{
  const {userId}:SendFriendRequestSchema = req.params as unknown as SendFriendRequestSchema
  const user = await this._userModel.findOne({filter:{_id:userId}})
  if (!user) {
    throw new AppError("User not found",404)
  }
  if (new ObjectId(req.user._id) === (new ObjectId(userId))) {
    throw new AppError("You can't send friend request to yourself", 400);
  }

  const checkRequest = await this._friendRequest.findOne({
    filter:{
    sendFrom: {$in:[new ObjectId(req.user._id),new ObjectId(userId)]},
    sendTo: {$in:[new ObjectId(req.user._id),new ObjectId(userId)]},
    acceptedAt: {$exists:false}
  }}
    )
  if (checkRequest) {
    throw new AppError("You already sent a friend request", 400);
  }

  const friendRequest = await this._friendRequest.create({
    sendFrom: new ObjectId(req.user._id),
    sendTo: new ObjectId(userId),
    status: "pending"
  });
  res.status(200).json({ message: "success", friendRequest });

}

// ------------------acceptFriendRequest---------------------
acceptFriendRequest = async(req:Request,res:Response,next:NextFunction)=>{
  const {requestId}:AcceptFriendRequestSchema = req.params as unknown as AcceptFriendRequestSchema
  const friendRequest = await this._friendRequest.findOne({filter:{_id:requestId,
    sendTo:new ObjectId(req.user._id),
    acceptedAt: {$exists:false}
  }})
  if (!friendRequest) {
    throw new AppError("Friend request not found",404)
  } 
  await this._friendRequest.updateOne({_id:requestId},{status:"accepted",acceptedAt:new Date()})
  await Promise.all([
    this._userModel.updateOne({_id:friendRequest.sendFrom},{$push:{friends:friendRequest.sendTo}}),
    this._userModel.updateOne({_id:friendRequest.sendTo},{$push:{friends:friendRequest.sendFrom}})
  ])

  res.status(200).json({message:"success",friendRequest})
}

// ------------------rejectFriendRequest---------------------
rejectFriendRequest = async(req:Request,res:Response,next:NextFunction)=>{
  const {requestId}:AcceptFriendRequestSchema = req.params as unknown as AcceptFriendRequestSchema
  const friendRequest = await this._friendRequest.findOne({filter:{_id:requestId,
    status:"pending",
    sendTo:new ObjectId(req.user._id),
    acceptedAt: {$exists:false}
  }})
  if (!friendRequest) {
    throw new AppError("Friend request not found",404)
  } 
 await Promise.all([
  this._userModel.updateOne({_id:friendRequest.sendFrom},{$pull:{friends:friendRequest.sendTo}}),
  this._userModel.updateOne({_id:friendRequest.sendTo},{$pull:{friends:friendRequest.sendFrom}})
 ])

  res.status(200).json({message:"success",friendRequest})
}
// ================================== graphql ==================================
 getOneUser = async(parent:any,args:any)=>{
  const {id} = args
 }


}

export default new UserService() 
