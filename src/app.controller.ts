import express from "express";
import dotenv from "dotenv";
import path from "path";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { AppError } from "./utils/classError";

import connectionDB from "./DB/connectionDB";
import postRouter from "./modules/posts/post.controller";
import userRouter from "./modules/users/user.controller";
import { gateway } from "./modules/gateway/gateway";
import chatRouter from "./modules/chat/chat.controller";
import { createHandler } from "graphql-http/lib/use/express";
import { schemaGql } from "./modules/graphql/schema.gql";

  dotenv.config(
    {path: path.resolve("./src/config/.env")
});
const app: express.Application = express();
const limiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 100,
    message: "Too many requests from this IP, please try again after 5 minutes",
    statusCode: 429,
    legacyHeaders: false,
});
const whitelist = ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174','http://127.0.0.1:5500'];

const corsOptions = {
  origin: function (origin:string, callback:Function) {
    if (!origin || whitelist.includes(origin)) {
      callback(null, true); // السماح لما يكون origin undefined أو ضمن الليست
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};

 const bootstrap = async () => {
 const port:string|number = process.env.PORT || 5000;
  app.use(cors(corsOptions as cors.CorsOptions));


 app.use(express.json());
 app.use(helmet());
 app.use(limiter);
  await connectionDB();

 app.use("/users",userRouter)
 app.use("/posts",postRouter)
 app.use("/chat",chatRouter)


app.use('/graphql', createHandler({ schema: schemaGql }));
 app.get("", (req:express.Request, res:express.Response) => {
    res.status(200).json("Hello in my social media app ...❤️✌️ ");
 })
 app.use("{/*demo}", (req:express.Request, res:express.Response) => {
  throw new AppError(`Page not found or invalid url ${req.originalUrl} `, 404);
 })
  app.use((err:AppError,req:express.Request, res:express.Response,next:express.NextFunction) => {
    res.status(err.cause as number || 500).json({message:err.message,stack:err.stack});
 })   
const httpServer = app.listen(port, () => {
    console.log(`Server is running on port ${port}...❤️✌️`);
 });

 gateway(httpServer)
}


export default bootstrap;