import multer from "multer";
import fs from "fs";
import { Request } from "express";

interface MulterLocalOptions {
    destination?: string;
    customFileFilter?: string[];
}

export const multerLocal = ({destination = "uploads", customFileFilter = []}: MulterLocalOptions = {})=>{
     if (!fs.existsSync(destination)) {
        fs.mkdirSync(destination, {recursive:true});
     } 

    const storage = multer.diskStorage({
        destination: function (req:Request, file:Express.Multer.File, cb:Function) {
     
            cb(null, destination);
        },
        filename: function (req:Request, file:Express.Multer.File, cb:Function) {
            cb(null, Date.now() + '-' + file.originalname);
        }
    })
    function fileFilter(req:Request, file:Express.Multer.File, cb:Function) {
        if (!customFileFilter.length || customFileFilter.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Invalid file type"), false);
        }
    }
    const upload = multer({ storage, fileFilter })
    return upload
}
