import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env.js';
import fs from 'fs';
import path from 'path';

// Configure Cloudinary if credentials exist
const isCloudinaryConfigured = Boolean(
  env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });
}

/**
 * Universal storage dispatcher: Uploads to Cloudinary (if configured) or local /public/uploads
 * @param {Express.Multer.File} file - Multer uploaded file object
 * @param {string} [folder='hackathon_uploads'] - Optional Cloudinary folder
 * @returns {Promise<{ url: string, filename: string, originalname: string, size: number, mimetype: string, provider: string }>}
 */
export const uploadToStorage = async (file, folder = 'hackathon_uploads') => {
  if (!file) {
    throw new Error('No file provided for upload');
  }

  // 1. Cloudinary Upload Mode
  if (isCloudinaryConfigured) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'auto',
        },
        (error, result) => {
          if (error) return reject(error);

          // Clean up local temp file after uploading to Cloudinary
          if (file.path && fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }

          resolve({
            url: result.secure_url,
            filename: result.public_id,
            originalname: file.originalname,
            size: result.bytes || file.size,
            mimetype: file.mimetype,
            provider: 'cloudinary',
          });
        }
      );

      if (file.buffer) {
        uploadStream.end(file.buffer);
      } else if (file.path) {
        fs.createReadStream(file.path).pipe(uploadStream);
      } else {
        reject(new Error('File content not available'));
      }
    });
  }

  // 2. Local Disk Storage Fallback Mode
  const relativeUrl = `/uploads/${path.basename(file.path || file.filename)}`;
  return {
    url: relativeUrl,
    filename: path.basename(file.path || file.filename),
    originalname: file.originalname,
    size: file.size,
    mimetype: file.mimetype,
    provider: 'local',
  };
};
