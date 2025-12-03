import { Router } from "express";
import CS from "./comment.service";
import { validation } from "../../middleware/validation";

import { multerLocal } from "../../middleware/multer";
import { Authentication } from "../../middleware/Authentication";
import * as CV from "./comment.validation";

const commentRouter = Router({mergeParams:true});    


 const FilterImages = [
    "image/jpeg", "image/png","image/jpg","image/gif","image/webp"
 ]

commentRouter.post("/",
    multerLocal({ destination: "uploads/image/comment", customFileFilter: FilterImages }).array("attachments", 10),validation(CV.commentSchema),
    Authentication(),
    CS.createComment)


export default commentRouter


