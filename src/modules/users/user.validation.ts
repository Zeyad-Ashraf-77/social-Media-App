import z from "zod";
import { Genders, Roles } from "../../DB/Models/user.model";
import { generalRules } from "../../utils/generalRoules";

export enum FlagType {
    all = "all",
    current = "current"
}

export const userSchema = {
    body:z.object({
        fullName:z.string().min(3, "Name must be at least 3 characters long").max(30, "Name must be at most 30 characters long"),
        email:z.string().email("Invalid email address"),
        password:z.string().min(8, "Password must be at least 8 characters long").max(30, "Password must be at most 30 characters long").regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, "Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character"),
        cPassword:z.string().min(8, "Confirm password must be at least 8 characters long").max(30, "Confirm password must be at most 30 characters long").regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, "Confirm password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character"),
        age:z.number().min(18, "Age must be at least 18 years old").max(90, "Age must be at most 90 years old"),
        gender:z.enum([Genders.male, Genders.female]),
        phone:z.string().optional(),
        address:z.string().optional()
    }).required().refine((data)=>data.password === data.cPassword,{
        message:"Password does not match",
        path:["cPassword"]
    })
}

export const signInSchema = {
    body:z.object({
        email:z.string().email("Invalid email address"),
        password:z.string().min(8, "Password must be at least 8 characters long").max(30, "Password must be at most 30 characters long")
    }).required()
}

export const confirmEmailSchema = {
    body:z.strictObject({
        otp:z.string(),
        email:z.string().email("Invalid email address")
    }).required()
}

export const logOutSchema = {
    body:z.object({
        flag:z.enum(FlagType)
    }).required()
}

export const signInWithGoogleSchema = {
    body:z.object({
        idToken:z.string()
    }).required()
}

export const forgetPasswordSchema = {
    body:z.object({
        email:z.string().email("Invalid email address")
    }).required()
}

export const resetPasswordSchema = {
    body:confirmEmailSchema.body.extend({
        password:z.string().min(8, "Password must be at least 8 characters long").max(30, "Password must be at most 30 characters long").regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/),
        cPassword:z.string().min(8, "Confirm password must be at least 8 characters long").max(30, "Confirm password must be at most 30 characters long").regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    }).required().superRefine((data,set)=>{
        if (data.password !== data.cPassword) {
            set.addIssue({
                code: "custom",
                path: ["cPassword"],
                message: "Password does not match",
            })  
        }
    })

}

export const sendFriendRequestSchema = {
    params:z.object({
        userId:generalRules.id
    }).required()
}
export const acceptFriendRequestSchema = {
    params:z.object({
        requestId:generalRules.id
    }).required()
}
    
export const changeRoleSchema = {
    body:z.object({
        role:z.enum(Roles)
    }).required()
}

export type ConfirmEmailSchema = z.infer<typeof confirmEmailSchema.body>
export type UserSchema = z.infer<typeof userSchema.body>
export type SignInSchema = z.infer<typeof signInSchema.body>
export type LogOutSchema = z.infer<typeof logOutSchema.body>
export type SignInWithGoogleSchema = z.infer<typeof signInWithGoogleSchema.body>
export type ForgetPasswordSchema = z.infer<typeof forgetPasswordSchema.body>
export type ResetPasswordSchema = z.infer<typeof resetPasswordSchema.body>
export type SendFriendRequestSchema = z.infer<typeof sendFriendRequestSchema.params>
export type AcceptFriendRequestSchema = z.infer<typeof acceptFriendRequestSchema.params>
