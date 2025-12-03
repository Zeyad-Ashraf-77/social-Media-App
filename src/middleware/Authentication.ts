import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/classError";
import { decodedToken, GitSignature, TokenType } from "../utils/token";



export const Authentication = (tokenType:TokenType=TokenType.access)=>{
    return async (req:Request,res:Response,next:NextFunction)=>{
    const {authorization} = req.headers
    const [prefix,token] = authorization?.split(" ")||[]
    if (!prefix || !token) {
        throw new AppError("Invalid token",401)        
    }
    const signature = await GitSignature(tokenType,prefix)
    if (!signature) {
        throw new AppError("Unauthorized",401) 
    }
    const {decoded,user} = await decodedToken(token,signature)
    req.user = user
    req.decoded = decoded
    next()  
}
} 