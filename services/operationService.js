const Operation = require('../models/Operation');
const PdfFile = require('../models/PdfFile');
const { mergePDFs, splitPDF } = require('../utils/pdfProcessor');
const { generateUniqueFilename, cleanupTempFiles } = require('../utils/fileSystem');
const path = require('path');

class OperationService {
  async createOperation(type, inputFiles, options, sessionId) {
    try {
      const operation = new Operation({
        type,
        inputFiles,
        options,
        sessionId,
        status: 'pending'
      });

      await operation.save();
      return operation;
    } catch (error) {
      throw new Error(`Failed to create operation: ${error.message}`);
    }
  }

  async processMergeOperation(operationId) {
    try {
      const operation = await Operation.findById(operationId).populate('inputFiles');
      if (!operation) {
        throw new Error('Operation not found');
      }

      // Update status to processing
      operation.status = 'processing';
      operation.progress = 10;
      await operation.save();

      // Prepare input files
      const inputPaths = operation.inputFiles.map(file => file.path);
      const outputDir = path.join(__dirname, '..', 'output');
      const outputFilename = generateUniqueFilename('merged_document');
      const outputPath = path.join(outputDir, outputFilename);

      // Update progress
      operation.progress = 30;
      await operation.save();

      // Merge PDFs
      const result = await mergePDFs(inputPaths, outputPath, operation.options.mergeOptions);

      // Update progress
      operation.progress = 80;
      await operation.save();

      // Update operation with results
      operation.outputFiles = [{
        filename: outputFilename,
        originalName: 'merged_document.pdf',
        path: outputPath,
        size: result.fileSize,
        pages: result.totalPages
      }];

      operation.status = 'completed';
      operation.progress = 100;
      operation.completedAt = new Date();
      await operation.save();

      return operation;
    } catch (error) {
      // Update operation status to failed
      await Operation.findByIdAndUpdate(operationId, {
        status: 'failed',
        error: {
          message: error.message,
          stack: error.stack
        }
      });

      throw new Error(`Failed to process merge operation: ${error.message}`);
    }
  }

  async processSplitOperation(operationId) {
    try {
      const operation = await Operation.findById(operationId).populate('inputFiles');
      if (!operation) {
        throw new Error('Operation not found');
      }

      // Update status to processing
      operation.status = 'processing';
      operation.progress = 10;
      await operation.save();

      // Get input file
      const inputFile = operation.inputFiles[0];
      const outputDir = path.join(__dirname, '..', 'output');

      // Update progress
      operation.progress = 30;
      await operation.save();

      // Split PDF
      const result = await splitPDF(inputFile.path, outputDir, operation.options.splitOptions);

      // Update progress
      operation.progress = 80;
      await operation.save();

      // Update operation with results
      operation.outputFiles = result.outputFiles.map(file => ({
        filename: file.filename,
        originalName: file.filename,
        path: file.path,
        size: file.size,
        pages: file.pages
      }));

      operation.status = 'completed';
      operation.progress = 100;
      operation.completedAt = new Date();
      await operation.save();

      return operation;
    } catch (error) {
      // Update operation status to failed
      await Operation.findByIdAndUpdate(operationId, {
        status: 'failed',
        error: {
          message: error.message,
          stack: error.stack
        }
      });

      throw new Error(`Failed to process split operation: ${error.message}`);
    }
  }

  async getOperation(id) {
    try {
      const operation = await Operation.findById(id).populate('inputFiles');
      if (!operation) {
        throw new Error('Operation not found');
      }
      return operation;
    } catch (error) {
      throw new Error(`Failed to get operation: ${error.message}`);
    }
  }

  async getOperations(query = {}) {
    try {
      const { page = 1, limit = 10, status, type, sessionId } = query;
      
      const filter = {};
      if (status) filter.status = status;
      if (type) filter.type = type;
      if (sessionId) filter.sessionId = sessionId;

      const operations = await Operation.find(filter)
        .populate('inputFiles')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Operation.countDocuments(filter);

      return {
        operations,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
      };
    } catch (error) {
      throw new Error(`Failed to get operations: ${error.message}`);
    }
  }

  async deleteOperation(id) {
    try {
      const operation = await Operation.findById(id);
      if (!operation) {
        throw new Error('Operation not found');
      }

      // Clean up output files
      if (operation.outputFiles && operation.outputFiles.length > 0) {
        const outputPaths = operation.outputFiles.map(file => file.path);
        await cleanupTempFiles(outputPaths);
      }

      // Delete operation from database
      await Operation.findByIdAndDelete(id);

      return { success: true, message: 'Operation deleted successfully' };
    } catch (error) {
      throw new Error(`Failed to delete operation: ${error.message}`);
    }
  }

  async getOperationStats() {
    try {
      const totalOperations = await Operation.countDocuments();
      
      const statusCounts = await Operation.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);

      const typeCounts = await Operation.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ]);

      const recentOperations = await Operation.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('inputFiles');

      return {
        totalOperations,
        statusCounts: statusCounts.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        typeCounts: typeCounts.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        recentOperations
      };
    } catch (error) {
      throw new Error(`Failed to get operation stats: ${error.message}`);
    }
  }
}

module.exports = new OperationService();
