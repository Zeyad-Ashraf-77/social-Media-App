

import z from "zod";
import { AllowComment, Availability } from "../../DB/Models/post.model";
import { generalRules } from "../../utils/generalRoules";
import { onModelEnum } from "../../DB/Models/comment.model";

export enum ActionType {
    like="like",
    unlike="unlike"
}

export const commentSchema={
    params:z.strictObject({
        postId:generalRules.id,
        commentId:generalRules.id.optional()
    }),
    body:z.strictObject({
        content:z.string().min(3, "Name must be at least 3 characters long").max(30, "Name must be at most 30 characters long").optional(),
        attachments:z.array(generalRules.file).optional(),
        assetFolder:z.string().optional(),
        onModel:z.enum(onModelEnum).default(onModelEnum.comment),
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


export const likeCommentSchema={
    params:z.strictObject({
        commentId:generalRules.id.optional()
    }),
    query:z.strictObject({
        action:z.enum(ActionType).default(ActionType.like)
    })

}

export type commentSchemaType = z.infer<typeof commentSchema>
export type likeCommentSchemaType = z.infer<typeof likeCommentSchema>