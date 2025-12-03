import { Router } from "express";
import { Authentication } from "../../middleware/Authentication";
import { ChatService } from "./chat.service";
import multer from "multer";
import { multerLocal } from "../../middleware/multer";
import { FilterImages } from "../posts/post.controller";

const chatRouter = Router({mergeParams:true})

const CS = new ChatService()

chatRouter.get("/",Authentication(),CS.getChat)
chatRouter.post("/groupChat",
    multerLocal({destination:"uploads/image/groupChat",customFileFilter:FilterImages}).single("attachment"),
    Authentication(),CS.createGroupChat)
 chatRouter.post("/group/:groupId",Authentication(),CS.sendGroupChat)   
 chatRouter.get("/groupChats/:groupId",Authentication(),CS.getGroupChats)
export default chatRouter   