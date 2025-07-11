const mongoose = require('mongoose');

const pdfFileSchema = new mongoose.Schema({
  originalName: {
    type: String,
    required: true
  },
  filename: {
    type: String,
    required: true,
    unique: true
  },
  mimetype: {
    type: String,
    required: true,
    default: 'application/pdf'
  },
  size: {
    type: Number,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  pages: {
    type: Number,
    default: 0
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  processedAt: {
    type: Date
  },
  status: {
    type: String,
    enum: ['uploaded', 'processing', 'completed', 'failed'],
    default: 'uploaded'
  },
  metadata: {
    title: String,
    author: String,
    subject: String,
    creator: String,
    producer: String,
    creationDate: Date,
    modificationDate: Date
  }
});

// Index for efficient querying
pdfFileSchema.index({ uploadedAt: -1 });
pdfFileSchema.index({ status: 1 });

module.exports = mongoose.model('PdfFile', pdfFileSchema);
