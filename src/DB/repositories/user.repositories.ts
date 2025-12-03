import { DBRepositories } from './db.repositories';
import { IUser } from "../Models/user.model";
import { HydratedDocument } from 'mongoose';
import { Model } from "mongoose";





export class UserRepositories extends DBRepositories<IUser>{
    constructor(userModal: Model<IUser>){
        super(userModal)
    }

    createOneUser = async (data:Partial<IUser>):Promise<HydratedDocument<IUser>> => {
            const user = await this.model.create(data as unknown as IUser)
            if(!user){
                throw new Error("User not created")
            }
            return user
        }
         create = async (data:Partial<IUser>):Promise<HydratedDocument<IUser>> => {
     return await this.model.create(data as IUser)
    }


 
}