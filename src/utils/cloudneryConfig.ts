import cloudinary from "./cloudnery";
import fs from "fs";

interface UploadOptions {
    folder?: string;
    resource_type?: 'auto' | 'image' | 'video' | 'raw';
    transformation?: any;
    public_id?: string;
}

interface DeleteOptions {
    resource_type?: 'image' | 'video' | 'raw';
    invalidate?: boolean;
}

class CloudinaryConfig {
    
    /**
     * رفع ملف واحد أو عدة ملفات على Cloudinary
     * @param files - الملفات المراد رفعها
     * @param options - خيارات الرفع
     * @returns URLs الملفات المرفوعة
     */
    async uploadFiles(files: Express.Multer.File[], options: UploadOptions = {}): Promise<string[]> {
        const uploadedUrls: string[] = [];
        
        for (const file of files) {
            try {
                const uploadOptions: any = {
                    folder: options.folder || 'uploads',
                    resource_type: options.resource_type || 'auto',
                    transformation: options.transformation
                };

                if (options.public_id) {
                    uploadOptions.public_id = options.public_id;
                }

                const result = await cloudinary.uploader.upload(file.path, uploadOptions);
                uploadedUrls.push(result.secure_url);
                
                // حذف الملف المحلي بعد الرفع الناجح
                this.deleteLocalFile(file.path);
                
            } catch (error) {
                console.error('Error uploading to Cloudinary:', error);
                throw new Error(`Failed to upload ${file.originalname} to cloud storage`);
            }
        }
        
        return uploadedUrls;
    }

    /**
     * رفع ملف واحد على Cloudinary
     * @param file - الملف المراد رفعه
     * @param options - خيارات الرفع
     * @returns URL الملف المرفوع
     */
    async uploadSingleFile(file: Express.Multer.File, options: UploadOptions = {}): Promise<string> {
        try {
            const uploadOptions: any = {
                folder: options.folder || 'uploads',
                resource_type: options.resource_type || 'auto',
                transformation: options.transformation
            };

            if (options.public_id) {
                uploadOptions.public_id = options.public_id;
            }

            const result = await cloudinary.uploader.upload(file.path, uploadOptions);
            
            // حذف الملف المحلي بعد الرفع الناجح
            this.deleteLocalFile(file.path);
            
            return result.secure_url;
            
        } catch (error) {
            console.error('Error uploading to Cloudinary:', error);
            throw new Error(`Failed to upload ${file.originalname} to cloud storage`);
        }
    }

    /**
     * حذف صورة من Cloudinary باستخدام URL
     * @param imageUrl - URL الصورة المراد حذفها
     * @param options - خيارات الحذف
     * @returns نتيجة الحذف
     */
    async deleteImageByUrl(imageUrl: string, options: DeleteOptions = {}): Promise<any> {
        try {
            // استخراج public_id من URL
            const publicId = this.extractPublicIdFromUrl(imageUrl);
            
            if (!publicId) {
                throw new Error('Invalid Cloudinary URL');
            }

            const deleteOptions = {
                resource_type: options.resource_type || 'image',
                invalidate: options.invalidate || true
            };

            const result = await cloudinary.uploader.destroy(publicId, deleteOptions);
            return result;
            
        } catch (error) {
            console.error('Error deleting from Cloudinary:', error);
            throw new Error('Failed to delete image from cloud storage');
        }
    }

    /**
     * حذف عدة صور من Cloudinary باستخدام URLs
     * @param imageUrls - URLs الصور المراد حذفها
     * @param options - خيارات الحذف
     * @returns نتائج الحذف
     */
    async deleteMultipleImages(imageUrls: string[], options: DeleteOptions = {}): Promise<any[]> {
        const results: any[] = [];
        
        for (const url of imageUrls) {
            try {
                const result = await this.deleteImageByUrl(url, options);
                results.push(result);
            } catch (error) {
                console.error(`Failed to delete image: ${url}`, error);
                results.push({ error: (error as Error).message });
            }
        }
        
        return results;
    }

    /**
     * حذف صورة من Cloudinary باستخدام public_id مباشرة
     * @param publicId - معرف الصورة في Cloudinary
     * @param options - خيارات الحذف
     * @returns نتيجة الحذف
     */
    async deleteImageByPublicId(publicId: string, options: DeleteOptions = {}): Promise<any> {
        try {
            const deleteOptions = {
                resource_type: options.resource_type || 'image',
                invalidate: options.invalidate || true
            };

            const result = await cloudinary.uploader.destroy(publicId, deleteOptions);
            return result;
            
        } catch (error) {
            console.error('Error deleting from Cloudinary:', error);
            throw new Error('Failed to delete image from cloud storage');
        }
    }

    /**
     * حذف مجلد كامل من Cloudinary
     * @param folderPath - مسار المجلد المراد حذفه
     * @param options - خيارات الحذف
     * @returns نتيجة الحذف
     */
    async deleteFolder(folderPath: string, options: DeleteOptions = {}): Promise<any> {
        try {
            const deleteOptions = {
                resource_type: options.resource_type || 'image',
                invalidate: options.invalidate || true
            };

            const result = await cloudinary.api.delete_folder(folderPath, deleteOptions);
            return result;
            
        } catch (error) {
            console.error('Error deleting folder from Cloudinary:', error);
            throw new Error('Failed to delete folder from cloud storage');
        }
    }

    /**
     * حذف ملف محلي من النظام
     * @param filePath - مسار الملف المراد حذفه
     */
    private deleteLocalFile(filePath: string): void {
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`Local file deleted: ${filePath}`);
            }
        } catch (error) {
            console.error(`Error deleting local file ${filePath}:`, error);
        }
    }

    /**
     * استخراج public_id من URL Cloudinary
     * @param url - URL الصورة
     * @returns public_id أو null إذا لم يتم العثور عليه
     */
    private extractPublicIdFromUrl(url: string): string | null {
        try {
            const urlParts = url.split('/');
            const lastPart = urlParts[urlParts.length - 1];
            if (!lastPart) return null;
            const publicId = lastPart.split('.')[0];
            return publicId || null;
        } catch (error) {
            console.error('Error extracting public_id from URL:', error);
            return null;
        }
    }

    /**
     * تنظيف الملفات المحلية في حالة حدوث خطأ
     * @param files - الملفات المراد حذفها
     */
    cleanupLocalFiles(files: Express.Multer.File[]): void {
        files.forEach((file: Express.Multer.File) => {
            this.deleteLocalFile(file.path);
        });
    }
}

export default new CloudinaryConfig();
