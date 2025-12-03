import { NextFunction, Request, Response } from "express"
import { AppError } from "../utils/classError"
import { Roles } from "../DB/Models/user.model"

export const Authorization = ({accessRole=[]}:{accessRole:Roles[]})=>{
    return (req:Request,res:Response,next:NextFunction)=>{
        if (!accessRole.includes(req.user!.role)) {
            throw new AppError("Unauthorized",401)
        }
        next()
    }
}