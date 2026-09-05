const { uploadToStorage } = require('../services/storage.service');

class UploadController {
  async handleFileUpload(req, res) {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const result = await uploadToStorage(req.file, 'dealflow360');
    return res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: result
    });
  }
}

module.exports = new UploadController();
