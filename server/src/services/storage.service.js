const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
const config = require('../config/environment');

const isCloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME && 
  process.env.CLOUDINARY_API_KEY && 
  process.env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

/**
 * Universal storage dispatcher: Uploads to Cloudinary (if configured) or local uploads directory
 */
async function uploadToStorage(file, folder = 'dealflow360_uploads') {
  if (!file) {
    throw new Error('No file provided for upload');
  }

  // 1. Cloudinary Mode
  if (isCloudinaryConfigured) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder, resource_type: 'auto' },
        (error, result) => {
          if (error) return reject(error);

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

  // 2. Local Fallback Mode
  const relativeUrl = `/uploads/${path.basename(file.path || file.filename)}`;
  return {
    url: relativeUrl,
    filename: path.basename(file.path || file.filename),
    originalname: file.originalname,
    size: file.size,
    mimetype: file.mimetype,
    provider: 'local',
  };
}

module.exports = {
  uploadToStorage,
  isCloudinaryConfigured
};
