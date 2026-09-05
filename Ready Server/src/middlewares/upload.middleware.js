import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { ApiError } from '../utils/ApiError.js';

// Ensure uploads directory exists
const uploadDir = path.resolve(process.cwd(), 'public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Disk Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const sanitizedBase = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 30);
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${sanitizedBase}-${uniqueSuffix}${ext}`);
  },
});

// File Filter for Common Hackathon Media Formats
const fileFilter = (req, file, cb) => {
  const allowedExtensions = /\.(jpg|jpeg|png|webp|gif|svg|pdf|csv|xlsx|xls|doc|docx|json|mp3|mp4|wav)$/i;
  const isExtensionValid = allowedExtensions.test(path.extname(file.originalname));

  if (isExtensionValid) {
    cb(null, true);
  } else {
    cb(new ApiError(400, `Unsupported file format '${path.extname(file.originalname)}'`));
  }
};

const baseUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB max file size for hackathons
  },
});

/**
 * Middleware for single file upload
 * @param {string} fieldName - Form field name (default: 'file')
 */
export const uploadSingle = (fieldName = 'file') => baseUpload.single(fieldName);

/**
 * Middleware for multiple files upload
 * @param {string} fieldName - Form field name (default: 'files')
 * @param {number} maxCount - Max files allowed (default: 5)
 */
export const uploadMultiple = (fieldName = 'files', maxCount = 5) =>
  baseUpload.array(fieldName, maxCount);

/**
 * Middleware for multi-field uploads (e.g. avatar + documents)
 * @param {Array<{ name: string, maxCount: number }>} fields
 */
export const uploadFields = (fields) => baseUpload.fields(fields);
