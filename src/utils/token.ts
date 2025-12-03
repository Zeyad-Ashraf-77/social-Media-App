import { JwtPayload } from './../../node_modules/@types/jsonwebtoken/index.d';
import jwt from "jsonwebtoken";
import { AppError } from './classError';
import { DBRepositories } from '../DB/repositories/db.repositories';
import userModal from '../DB/Models/user.model';
import { RevokeTokenRepositories } from '../DB/repositories/revokeToken.repositories';
import RevokeTokenModal from '../DB/Models/revokeToken.model';

 export const generateToken = async({payload,signature,option}:{payload:any,signature:string,option:jwt.SignOptions}):Promise<string>=>{
    return jwt.sign(payload,signature,option)
 }

 export const verifyToken = async({token,signature}:{token:string,signature:string}):Promise<JwtPayload>=>{
    return jwt.verify(token,signature)as JwtPayload
 }


 export enum TokenType {
    access = "access",
    refresh = "refresh"
}

 const _userModel = new DBRepositories(userModal)
 const _revokeToken = new RevokeTokenRepositories(RevokeTokenModal)







 export const GitSignature = (tokenType:TokenType,prefix:string)=>{
    if(tokenType === TokenType.access){
        if(prefix === process.env.JWT_SECRET_ACCESS_USER_prefix){
            return process.env.JWT_SECRET_ACCESS_USER
        }else if(prefix === process.env.JWT_SECRET_ACCESS_ADMIN_prefix){
            return process.env.JWT_SECRET_ACCESS_ADMIN
        }else{
            return null;
        }
    }
       if(tokenType === TokenType.refresh){
        if(prefix === process.env.JWT_SECRET_REFRESH_USER_prefix){
            return process.env.JWT_SECRET_REFRESH_USER
        }else if(prefix === process.env.JWT_SECRET_REFRESH_ADMIN_prefix){
            return process.env.JWT_SECRET_REFRESH_ADMIN
        }else{
            return null;
        }
    }
    return null
}

export const decodedToken = async (token:string,signature:string)=>{
    const decoded = await verifyToken({token,signature})
    if (!decoded) {
        throw new AppError("Unauthorized",401)
    }
    const user = await _userModel.findOne({filter:{email:decoded.email}})
    if (!user) {
        throw new AppError("User not found",404)
    }
    if(!user.confirmEmail){
        throw new AppError("Please confirm your email",401)
    }
 
    const revokeToken = await _revokeToken.findOne({filter:{userId:user?._id,tokenId:decoded?.jti!}})
    if (revokeToken) {
        throw new AppError("Token is revoked",401)
    }
    if(user?.changeCredential?.getTime()! > decoded.iat! *1000 ){
        throw new AppError("Token is revoked",401)
    }
    return {decoded,user}
}