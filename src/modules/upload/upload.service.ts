import { Injectable } from '@nestjs/common';
import { v2 as cloudinary, UploadApiErrorResponse } from 'cloudinary';
import { UploadApiResponse } from 'cloudinary';
import * as streamifier from 'streamifier';

type UploadResult = UploadApiResponse | UploadApiErrorResponse;

@Injectable()
export class UploadService {
  async uploadImage(
    file: Express.Multer.File,
    folder: string,
  ): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: folder },
        (error, result) => {
          if (error) return reject(error);
          resolve(result as UploadResult);
        },
      );
      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }

  async deleteImage(publicId: string) {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error) return reject(error);
        resolve(result);
      });
    });
  }
}
