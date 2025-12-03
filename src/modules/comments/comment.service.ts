import { NextFunction, Request, Response } from "express";
import { PostRepositories } from "../../DB/repositories/post.repositories";
import { UserRepositories } from "../../DB/repositories/user.repositories";
import { AppError } from "../../utils/classError";
import cloudinaryConfig from "../../utils/cloudneryConfig";
import { randomUUID } from "crypto";
import { CommentRepositories } from "../../DB/repositories/comment.repositories";
import { AllowComment, Availability, IPost } from "../../DB/Models/post.model";
import { HydratedDocument, ObjectId } from "mongoose";
import { IComment, onModelEnum } from "../../DB/Models/comment.model";
import commentModal from "../../DB/Models/comment.model";
import postModal from "../../DB/Models/post.model";
import userModal from "../../DB/Models/user.model";
class CommentService {
  private _postModel = new PostRepositories(postModal);
  private _userModel = new UserRepositories(userModal);
  private _commentModel = new CommentRepositories(commentModal);

  constructor() {}

  // ------------------createPost---------------------
  createComment = async (req: Request, res: Response, next: NextFunction) => {
    const { postId, commentId } = req.params;
    const { content, attachment, tags, onModel } = req.body;

    let doc: HydratedDocument<IPost | IComment> | null = null;

    if (commentId || onModel === onModelEnum.comment) {
      const comment = await this._commentModel.findOne({
        filter:{
          _id: commentId,
          postId,
        },  
        options:{
          populate:{
            path: "refId",
            match: {
              AllowComment: AllowComment.allow,
              $or: [
              { availability: Availability.public },
              { availability: Availability.friends, createdBy: req.user?._id },
              { availability: Availability.private, createdBy: req.user?._id },
            ],
          },
        }}
      }); 

      if (!comment || !comment?.refId) {
        throw new AppError("Comment or Post not found", 404);
      }
      doc = comment;
    } else if (onModel === onModelEnum.post) {
      const post = await this._postModel.findOne({
        filter:{
          _id: postId,
          allowComment: AllowComment.allow,
          $or: [
            { availability: Availability.public },
            { availability: Availability.friends, createdBy: req.user._id },
            { availability: Availability.private, createdBy: req.user._id },
        ],
        },
      });
      if (!post) {
        throw new AppError("Post not found", 404);
      }
      doc = post;
    }

    let validTags: any[] = [];
    if (tags?.length) {
      const existingUsers = await this._userModel.find({
        filter: { _id: { $in: tags }   },
      });
      if (existingUsers.length !== tags.length) {
        throw new AppError("Invalid tags - some users do not exist", 400);
      }
      validTags = req.body.tags;
    }

         let uploadedImageUrls: string[] = [];
   
         if (req.files && Array.isArray(req.files) && req.files.length > 0) {
           console.log(`Found ${req.files.length} files to upload to Cloudinary`);
           uploadedImageUrls = await cloudinaryConfig.uploadFiles(
             req.files as Express.Multer.File[],
             { folder: `social-media-posts/${doc?.assetFolder}/comments` }
           );
           console.log(
             "Images uploaded successfully to Cloudinary:",
             uploadedImageUrls
           );
         }
    const assetFolder = randomUUID();

    if (!req.user || !req.user._id) {
      throw new AppError("User not authenticated", 401);
    }

    const comment = await this._commentModel.create({
      content,
      attachments: uploadedImageUrls,
      assetFolder: assetFolder,
      createdBy: req.user._id as any,
      refId: doc?._id as unknown as ObjectId,
      onModel: (commentId || onModel === onModelEnum.comment)
        ? onModelEnum.comment
        : onModelEnum.post,
      tags: validTags,
    });

    if (!comment) {
      cloudinaryConfig.cleanupLocalFiles(req.files as Express.Multer.File[]);
      throw new AppError("Failed to create comment", 500);
    }
    res.status(200).json({ message: "success", comment });
  };
}

export default new CommentService();
