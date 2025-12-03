
import { NextFunction, Request, Response } from "express";
import z, { ZodType } from "zod";
import { AppError } from "../utils/classError";

type ReqType = keyof Request;
type SchemaType = Partial<Record<ReqType, ZodType>>;

export const validation = (schema: SchemaType) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const validationErrors: any[] = [];

    // Initialize undefined req properties as empty objects for validation
    if (!req.body) req.body = {};
    if (!req.query) req.query = {};
    if (!req.params) req.params = {};

    for (const key of Object.keys(schema) as ReqType[]) {
      if (!schema[key]) continue;

      const result = schema[key]!.safeParse(req[key]);
      if (!result.success) {
        validationErrors.push(...result.error.issues);
      }
    }
    if (req?.files) {
      req.body.attachments = req.files  
    }
    if (req?.file) {
      req.body.attachments = req.file  
    }
    if (validationErrors.length) {
      const formattedErrors = validationErrors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
        code: err.code,
      }));
      throw new AppError(
        JSON.stringify({ errors: formattedErrors }),
        400
      );
    }

    next();
  };
};



// -------------------------------------------------------------------------
// import { NextFunction, Request, Response } from "express";
// import z, { ZodType } from "zod";
// import { AppError } from '../utils/classError';

// type ReqType = keyof Request
// type SchemaType = Partial<Record<ReqType, ZodType>>

// export const validation = (schema:SchemaType) => {
//     return async (req:Request,res:Response,next:NextFunction) => {

//         const validationErrors = [];
//         for (const key of Object.keys(schema) as ReqType[]) {
//               if(!schema[key])continue;
            
//               const result = schema[key].safeParse(req[key]);
//               if(!result.success){
//                   validationErrors.push(...result.error.issues)
//               }
//         }
//         if(validationErrors.length){
//             throw new AppError(JSON.stringify(validationErrors as unknown as string) , 400);
//         }
//         next()
//     }
// }