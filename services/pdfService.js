const PdfFile = require('../models/PdfFile');
const Operation = require('../models/Operation');
const { getPDFInfo, validatePDF } = require('../utils/pdfProcessor');
const { getFileInfo } = require('../utils/fileSystem');
const path = require('path');

class PdfService {
  async savePdfFile(fileData) {
    try {
      // Validate PDF
      const validation = await validatePDF(fileData.path);
      if (!validation.isValid) {
        throw new Error(`Invalid PDF file: ${validation.error}`);
      }

      // Get PDF metadata
      const pdfInfo = await getPDFInfo(fileData.path);
      const fileInfo = await getFileInfo(fileData.path);

      // Create database record
      const pdfFile = new PdfFile({
        originalName: fileData.originalname,
        filename: fileData.filename,
        mimetype: fileData.mimetype,
        size: fileData.size,
        path: fileData.path,
        pages: pdfInfo.pages,
        metadata: {
          title: pdfInfo.title,
          author: pdfInfo.author,
          subject: pdfInfo.subject,
          creator: pdfInfo.creator,
          producer: pdfInfo.producer,
          creationDate: pdfInfo.creationDate,
          modificationDate: pdfInfo.modificationDate
        },
        status: 'completed'
      });

      await pdfFile.save();
      return pdfFile;
    } catch (error) {
      throw new Error(`Failed to save PDF file: ${error.message}`);
    }
  }

  async getPdfFile(id) {
    try {
      const pdfFile = await PdfFile.findById(id);
      if (!pdfFile) {
        throw new Error('PDF file not found');
      }
      return pdfFile;
    } catch (error) {
      throw new Error(`Failed to get PDF file: ${error.message}`);
    }
  }

  async getPdfFiles(query = {}) {
    try {
      const { page = 1, limit = 10, status, search } = query;
      
      const filter = {};
      if (status) filter.status = status;
      if (search) {
        filter.$or = [
          { originalName: { $regex: search, $options: 'i' } },
          { 'metadata.title': { $regex: search, $options: 'i' } }
        ];
      }

      const pdfFiles = await PdfFile.find(filter)
        .sort({ uploadedAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await PdfFile.countDocuments(filter);

      return {
        files: pdfFiles,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
      };
    } catch (error) {
      throw new Error(`Failed to get PDF files: ${error.message}`);
    }
  }

  async deletePdfFile(id) {
    try {
      const pdfFile = await PdfFile.findById(id);
      if (!pdfFile) {
        throw new Error('PDF file not found');
      }

      // Delete file from filesystem
      const fs = require('fs-extra');
      if (await fs.pathExists(pdfFile.path)) {
        await fs.remove(pdfFile.path);
      }

      // Delete from database
      await PdfFile.findByIdAndDelete(id);

      return { success: true, message: 'PDF file deleted successfully' };
    } catch (error) {
      throw new Error(`Failed to delete PDF file: ${error.message}`);
    }
  }

  async updatePdfFileStatus(id, status, processedAt = null) {
    try {
      const updateData = { status };
      if (processedAt) updateData.processedAt = processedAt;

      const pdfFile = await PdfFile.findByIdAndUpdate(id, updateData, { new: true });
      if (!pdfFile) {
        throw new Error('PDF file not found');
      }

      return pdfFile;
    } catch (error) {
      throw new Error(`Failed to update PDF file status: ${error.message}`);
    }
  }

  async getFileStats() {
    try {
      const totalFiles = await PdfFile.countDocuments();
      const totalSize = await PdfFile.aggregate([
        { $group: { _id: null, totalSize: { $sum: '$size' } } }
      ]);

      const statusCounts = await PdfFile.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);

      return {
        totalFiles,
        totalSize: totalSize[0]?.totalSize || 0,
        statusCounts: statusCounts.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      };
    } catch (error) {
      throw new Error(`Failed to get file stats: ${error.message}`);
    }
  }
}

module.exports = new PdfService();
