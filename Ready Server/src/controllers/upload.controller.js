import { catchAsync } from '../utils/catchAsync.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { uploadToStorage } from '../services/storage.service.js';

/**
 * Upload single media or document file
 */
export const uploadSingleFile = catchAsync(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'No file attached to request (Use form field name "file")');
  }

  const result = await uploadToStorage(req.file);

  return ApiResponse.send(res, 200, result, 'File uploaded successfully');
});

/**
 * Upload multiple media files
 */
export const uploadMultipleFiles = catchAsync(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    throw new ApiError(400, 'No files attached to request (Use form field name "files")');
  }

  const uploadPromises = req.files.map((file) => uploadToStorage(file));
  const results = await Promise.all(uploadPromises);

  return ApiResponse.send(res, 200, { files: results, count: results.length }, 'Files uploaded successfully');
});
