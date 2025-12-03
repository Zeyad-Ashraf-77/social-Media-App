import { Router } from "express";
import PS from "./post.service";
import { validation } from "../../middleware/validation";
import { likePostSchema, postSchema, updatePostSchema } from "./post.validation";
import { multerLocal } from "../../middleware/multer";
import { Authentication } from "../../middleware/Authentication";
import commentRouter from "../comments/comment.controller";

const postRouter = Router({mergeParams:true});    

postRouter.use("/:postId/comment{/:commentId/reply}",commentRouter)
export const FilterImages = [
    "image/jpeg", "image/png","image/jpg","image/gif","image/webp"
 ]

postRouter.post("/",
    multerLocal({ destination: "uploads/image", customFileFilter: FilterImages }).array("attachments", 10),validation(postSchema),
    Authentication(),
    PS.createPost)

 postRouter.patch("/:postId",Authentication(),validation(likePostSchema),PS.likePost)   
 postRouter.patch("/update/:postId",
   multerLocal({ destination: "uploads/image", customFileFilter: FilterImages }).array("attachments", 10),
   Authentication(),validation(updatePostSchema),PS.updatePost)

postRouter.get("/",PS.getPosts)


export default postRouter


