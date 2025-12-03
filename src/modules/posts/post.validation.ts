

import z, { object } from "zod";
import { AllowComment, Availability } from "../../DB/Models/post.model";
import { generalRules } from "../../utils/generalRoules";

export enum ActionType {
    like="like",
    unlike="unlike"
}

export const postSchema={
    body:z.object({
        content:z.string().min(3, "Name must be at least 3 characters long").max(30, "Name must be at most 30 characters long").optional(),
        attachments:z.array(generalRules.file).optional(),
        assetFolder:z.string().optional(),
        allowComment:z.enum(AllowComment).default(AllowComment.allow),
        availability:z.enum(Availability).default(Availability.public),
        tags:z.array(generalRules.id).refine((value)=>{
            return new Set(value).size === value.length
        },{
            message:"Duplicate tags"
        }).optional(),
    }).superRefine((data,ctx)=>{
        if(!data.content && !data.attachments){
            ctx.addIssue({
                code:"custom",
                path:["attachments"],
                message:"At least one of content or attachments is required"
            })
        }
    })
}
export const updatePostSchema={
    body:z.strictObject({
        content:z.string().min(3, "Name must be at least 3 characters long").max(30, "Name must be at most 30 characters long").optional(),
        attachments:z.array(generalRules.file).optional(),
        assetFolder:z.string().optional(),
        allowComment:z.enum(AllowComment).default(AllowComment.allow).optional(),
        availability:z.enum(Availability).default(Availability.public).optional(),
        tags:z.array(generalRules.id).refine((value)=>{
            return new Set(value).size === value.length
        },{
            message:"Duplicate tags"
        }).optional(),
    }).superRefine((data,ctx)=>{
        if(!Object.values(data).length){
            ctx.addIssue({
                code:"custom",
                message:"At least one field is required"
            })
        }
    })
}

export const likePostSchema={
    params:z.object({
        postId:generalRules.id
    }),
    query:z.object({
        action:z.enum(ActionType).default(ActionType.like)
    })

}

export type postSchemaType = z.infer<typeof postSchema>
export type likePostSchemaType = z.infer<typeof likePostSchema>
export type updatePostSchemaType = z.infer<typeof updatePostSchema>