import mongoose from "mongoose";
import z from "zod";

export const generalRules = {
 id:z.string().refine((value)=>{return mongoose.Types.ObjectId.isValid(value)},"Invalid id"),    
 email:z.string().email("Invalid email"),
 password:z.string().min(6,"Password must be at least 6 characters long").max(30,"Password must be at most 30 characters long"),
 otp:z.string().regex(/^[0-9]{6}$/,"Invalid otp"),
 file:z.object({
   fieldName :z.string(),
   originalName:z.string(),
   size:z.number(),
   encoding:z.string(),
   tempFilePath:z.string(),
   createReadStream:z.function().optional(),
   destination:z.string(),
   filename:z.string(),
   path:z.string(),
   buffer:z.instanceof(Buffer).optional(),
   mimetype:z.string().optional()
 })
}