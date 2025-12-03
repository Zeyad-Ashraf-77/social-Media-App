import { DBRepositories } from './db.repositories';
import { IRevokeToken } from '../Models/revokeToken.model';
import { Model } from "mongoose";



export class RevokeTokenRepositories extends DBRepositories<IRevokeToken>{
    constructor(revokeTokenModal: Model<IRevokeToken>){
        super(revokeTokenModal)
    }
 
}