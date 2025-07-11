const mongoose = require('mongoose');

const operationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['merge', 'split'],
    required: true
  },
  inputFiles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PdfFile',
    required: true
  }],
  outputFiles: [{
    filename: String,
    originalName: String,
    path: String,
    size: Number,
    pages: Number
  }],
  options: {
    // For merge operations
    mergeOptions: {
      includeBookmarks: { type: Boolean, default: true },
      includeMetadata: { type: Boolean, default: true }
    },
    // For split operations
    splitOptions: {
      splitBy: { type: String, enum: ['pages', 'range'], default: 'pages' },
      pagesPerFile: { type: Number, default: 1 },
      ranges: [String] // e.g., ['1-5', '6-10']
    }
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  error: {
    message: String,
    stack: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },
  sessionId: {
    type: String,
    required: true
  }
});

// Index for efficient querying
operationSchema.index({ createdAt: -1 });
operationSchema.index({ status: 1 });
operationSchema.index({ sessionId: 1 });

module.exports = mongoose.model('Operation', operationSchema);
