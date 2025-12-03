import { Router } from "express";
import US from "../users/user.service";
import { validation } from "../../middleware/validation";
import { Authentication } from "../../middleware/Authentication";
import { TokenType } from "../../utils/token";
import { changeRoleSchema, confirmEmailSchema, forgetPasswordSchema, logOutSchema, resetPasswordSchema, signInSchema, signInWithGoogleSchema, userSchema } from "./user.validation";
import { Authorization } from "../../middleware/Authorization";
import { Roles } from "../../DB/Models/user.model";
import { FilterImages } from "../posts/post.controller";
import { multerLocal } from "../../middleware/multer";
import chatRouter from "../chat/chat.controller";

const userRouter = Router({mergeParams:true});

userRouter.use("/:userId/chat",chatRouter)

userRouter.post("/signUp",validation(userSchema),US.signUp)
userRouter.post("/signIn",validation(signInSchema),US.signIn)
userRouter.patch("/confirmEmail",validation(confirmEmailSchema),US.confirmEmail)
userRouter.get("/profile",Authentication(),US.getProfile)
userRouter.post("/logOut",Authentication(),validation(logOutSchema),US.logOut)
userRouter.get("/refreshToken",Authentication(TokenType.refresh),US.refreshToken)
userRouter.post("/signInWithGoogle",validation(signInWithGoogleSchema),US.signInWithGoogle)
userRouter.patch("/forgetPassword",validation(forgetPasswordSchema),US.forgetPassword)
userRouter.patch("/resetPassword",validation(resetPasswordSchema),US.resetPassword)
userRouter.get("/dashBoard",Authentication(),Authorization({accessRole:[Roles.admin,Roles.superAdmin]}),US.dashBoard)
userRouter.patch("/changeRole/:userId",Authentication(),Authorization({accessRole:[Roles.admin,Roles.superAdmin]}),validation(changeRoleSchema),US.changeRole)
userRouter.post("/sendFriendRequest/:userId",Authentication(),US.sendFriendRequest)
userRouter.patch("/acceptFriendRequest/:requestId",Authentication(),US.acceptFriendRequest)
userRouter.patch("/profileImage", multerLocal({ destination: "uploads/profileImage", customFileFilter: FilterImages }).single("attachment"),Authentication(),US.profileImage)

export default userRouter