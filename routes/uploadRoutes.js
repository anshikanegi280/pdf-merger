const express = require('express');
const upload = require('../middleware/upload');
const pdfService = require('../services/pdfService');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Upload single PDF file
router.post('/single', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const pdfFile = await pdfService.savePdfFile(req.file);

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        id: pdfFile._id,
        originalName: pdfFile.originalName,
        filename: pdfFile.filename,
        size: pdfFile.size,
        pages: pdfFile.pages,
        uploadedAt: pdfFile.uploadedAt,
        metadata: pdfFile.metadata
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Upload multiple PDF files
router.post('/multiple', upload.array('pdfs', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const uploadedFiles = [];
    const errors = [];

    for (const file of req.files) {
      try {
        const pdfFile = await pdfService.savePdfFile(file);
        uploadedFiles.push({
          id: pdfFile._id,
          originalName: pdfFile.originalName,
          filename: pdfFile.filename,
          size: pdfFile.size,
          pages: pdfFile.pages,
          uploadedAt: pdfFile.uploadedAt,
          metadata: pdfFile.metadata
        });
      } catch (error) {
        errors.push({
          filename: file.originalname,
          error: error.message
        });
      }
    }

    res.status(201).json({
      success: true,
      message: `${uploadedFiles.length} files uploaded successfully`,
      data: {
        uploadedFiles,
        errors: errors.length > 0 ? errors : undefined
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get upload progress (for future websocket implementation)
router.get('/progress/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // This is a placeholder for progress tracking
    // In a real implementation, you might store progress in Redis or memory
    res.json({
      success: true,
      data: {
        sessionId,
        progress: 100,
        status: 'completed'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
