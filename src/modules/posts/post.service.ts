import { NextFunction, Request, Response } from "express";
import { PostRepositories } from "../../DB/repositories/post.repositories";
import { UserRepositories } from "../../DB/repositories/user.repositories";
import { AppError } from "../../utils/classError";
import cloudinaryConfig from "../../utils/cloudneryConfig";
import { randomUUID } from "crypto";
import { ActionType } from "./post.validation";
import { Availability } from "../../DB/Models/post.model";
import postModal from "../../DB/Models/post.model";
import userModal from "../../DB/Models/user.model";
class PostService {
  private _postModel = new PostRepositories(postModal);
  private _userModel = new UserRepositories(userModal);

  constructor() {}

  // ------------------createPost---------------------
  createPost = async (req: Request, res: Response, next: NextFunction) => {
    try {
      let validTags: any[] = [];
      if (req?.body?.tags?.length) {
        const existingUsers = await this._userModel.find({
          filter: {_id: { $in: req.body.tags }},
        });
        if (existingUsers.length !== req.body.tags.length) {
          throw new AppError("Invalid tags - some users do not exist", 400);
        }
        validTags = req.body.tags;
      }

      let uploadedImageUrls: string[] = [];

      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        console.log(`Found ${req.files.length} files to upload to Cloudinary`);
        uploadedImageUrls = await cloudinaryConfig.uploadFiles(
          req.files as Express.Multer.File[],
          { folder: "social-media-posts" }
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

      const post = await this._postModel.create({
        content: req.body.content,
        attachments: uploadedImageUrls,
        assetFolder: assetFolder,
        createdBy: req.user._id as any,
        tags: validTags,
      });

      if (!post) {
        cloudinaryConfig.cleanupLocalFiles(req.files as Express.Multer.File[]);
        throw new AppError("Failed to create post", 500);
      }
      res.status(200).json({ message: "success", post });
    } catch (error) {
      if (req.files && Array.isArray(req.files)) {
        cloudinaryConfig.cleanupLocalFiles(req.files as Express.Multer.File[]);
      }
      next(error);
    }
  };
  // ------------------likePost---------------------
  likePost = async (req: Request, res: Response, next: NextFunction) => {
    const postId = req.params.postId;
    const action = req.query.action;
    if (!postId) {
      throw new AppError("Post ID is required", 400);
    }
    if (!req.user || !req.user._id) {
      throw new AppError("User not authenticated", 401);
    }
    if (action === ActionType.like) {
      const post = await this._postModel.findOneAndUpdate(
        {
          _id: postId,
          $or: [
            { availability: Availability.public },
            { availability: Availability.private, createdBy: req.user._id },
            {
              availability: Availability.friends,
              createdBy: { $in: [...(req.user?.friends || []), req.user._id] },
            },
          ],
        },
        { $addToSet: { likes: req.user._id } },
        { new: true }
      );
      if (!post) {
        throw new AppError(
          "Post not found or you don't have permission to like this post",
          404
        );
      }

      return res.status(200).json({ message: "success", post });
    } else if (action === ActionType.unlike) {
      const post = await this._postModel.findOneAndUpdate(
        {
          _id: postId,
          $or: [
            { availability: Availability.public },
            { availability: Availability.private, createdBy: req.user._id },
            {
              availability: Availability.friends,
              createdBy: { $in: [...(req.user?.friends || []), req.user._id] },
            },
          ],
        },
        { $pull: { likes: req.user._id } },
        { new: true }
      );
      if (!post) {
        throw new AppError(
          "Post not found or you don't have permission to unlike this post",
          404
        );
      }
      return res.status(200).json({ message: "success", post });
    }
    throw new AppError("Invalid action", 400);
  };
  updatePost = async (req: Request, res: Response, next: NextFunction) => {
    const postId = req.params.postId;

    const post = await this._postModel.findOne({
      filter:{
        _id: postId,
        createdBy: req.user?._id,
      }
    });
    if (!post) {
      throw new AppError(
        "Post not found or you don't have permission to update this post",
        404
      );
    }
    if (req?.body?.content) {
      post.content = req.body.content;
    }
    if (req?.body?.tags?.length) {
      if (req.body.tags.length !== post.tags?.length) {
        const existingUsers = await this._userModel.find({
        filter :{  _id: { $in: req.body.tags }},
        });
        if (existingUsers.length !== req.body.tags.length) {
          throw new AppError("Invalid tags - some users do not exist", 400);
        }
        post.tags = req.body.tags;
      } else {
        post.tags = req.body.tags;
      }
    }
    if (req?.body?.availability) {
      post.availability = req.body.availability;
    }
    if (req?.body?.allowComment) {
      post.allowComment = req.body.allowComment;
    }
    if (req?.body?.attachments) {
      await cloudinaryConfig.cleanupLocalFiles(
        req.files as Express.Multer.File[]
      );
      if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        console.log(`Found ${req.files.length} files to upload to Cloudinary`);
        const uploadedImageUrls = await cloudinaryConfig.uploadFiles(
          req.files as Express.Multer.File[],
          { folder: "social-media-posts" }
        );
        post.attachments = uploadedImageUrls || [];
      } else {
        post.attachments = post.attachments || [];
      }
    }

    await post.save();
    return res.status(200).json({ message: "success", post });
  };
  getPosts = async (req: Request, res: Response, next: NextFunction) => {
    let { page=1, limit=5 } = req.query as unknown as {page:number,limit:number}
   
    const {pageNumber,post,totalDocs , numberOfPages} = await this._postModel.paginate({filter:{},query:{page,limit}})

    return res.status(200).json({ message: "success",page:pageNumber, numberOfPages , totalDocs , post });
  };
}
export default new PostService();
