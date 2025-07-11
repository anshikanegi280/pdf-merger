const express = require('express');
const pdfService = require('../services/pdfService');
const operationService = require('../services/operationService');
const { validateMergeRequest, validateSplitRequest } = require('../middleware/validation');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Get all PDF files
router.get('/files', async (req, res) => {
  try {
    const result = await pdfService.getPdfFiles(req.query);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get single PDF file
router.get('/files/:id', async (req, res) => {
  try {
    const pdfFile = await pdfService.getPdfFile(req.params.id);
    res.json({
      success: true,
      data: pdfFile
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
});

// Delete PDF file
router.delete('/files/:id', async (req, res) => {
  try {
    const result = await pdfService.deletePdfFile(req.params.id);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Merge PDF files
router.post('/merge', validateMergeRequest, async (req, res) => {
  try {
    const { fileIds, outputName, options } = req.body;
    const sessionId = req.headers['session-id'] || uuidv4();

    // Validate that all file IDs exist
    const files = await Promise.all(
      fileIds.map(id => pdfService.getPdfFile(id))
    );

    // Create operation record
    const operation = await operationService.createOperation(
      'merge',
      fileIds,
      { mergeOptions: options },
      sessionId
    );

    // Process merge operation asynchronously
    setImmediate(() => {
      operationService.processMergeOperation(operation._id);
    });

    res.status(202).json({
      success: true,
      message: 'Merge operation started',
      data: {
        operationId: operation._id,
        sessionId,
        status: 'processing'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Split PDF file
router.post('/split', validateSplitRequest, async (req, res) => {
  try {
    const { fileId, splitBy, pagesPerFile, ranges } = req.body;
    const sessionId = req.headers['session-id'] || uuidv4();

    // Validate that file exists
    const file = await pdfService.getPdfFile(fileId);

    // Create operation record
    const operation = await operationService.createOperation(
      'split',
      [fileId],
      { splitOptions: { splitBy, pagesPerFile, ranges } },
      sessionId
    );

    // Process split operation asynchronously
    setImmediate(() => {
      operationService.processSplitOperation(operation._id);
    });

    res.status(202).json({
      success: true,
      message: 'Split operation started',
      data: {
        operationId: operation._id,
        sessionId,
        status: 'processing'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get operation status
router.get('/operations/:id', async (req, res) => {
  try {
    const operation = await operationService.getOperation(req.params.id);
    res.json({
      success: true,
      data: operation
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
});

// Get all operations
router.get('/operations', async (req, res) => {
  try {
    const result = await operationService.getOperations(req.query);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Delete operation
router.delete('/operations/:id', async (req, res) => {
  try {
    const result = await operationService.deleteOperation(req.params.id);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Download merged/split file
router.get('/download/:operationId/:fileIndex?', async (req, res) => {
  try {
    const { operationId, fileIndex = 0 } = req.params;
    const operation = await operationService.getOperation(operationId);

    if (operation.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Operation not completed yet'
      });
    }

    if (!operation.outputFiles || operation.outputFiles.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No output files found'
      });
    }

    const fileIndexNum = parseInt(fileIndex);
    if (fileIndexNum >= operation.outputFiles.length) {
      return res.status(404).json({
        success: false,
        message: 'File index out of range'
      });
    }

    const outputFile = operation.outputFiles[fileIndexNum];
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${outputFile.originalName}"`);
    res.sendFile(outputFile.path);

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get PDF processing stats
router.get('/stats', async (req, res) => {
  try {
    const fileStats = await pdfService.getFileStats();
    const operationStats = await operationService.getOperationStats();

    res.json({
      success: true,
      data: {
        files: fileStats,
        operations: operationStats
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
