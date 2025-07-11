const fs = require('fs-extra');
const path = require('path');

const createDirectories = async () => {
  const directories = [
    path.join(__dirname, '..', 'uploads'),
    path.join(__dirname, '..', 'output'),
    path.join(__dirname, '..', 'temp')
  ];

  for (const dir of directories) {
    try {
      await fs.ensureDir(dir);
      console.log(`📁 Directory ensured: ${dir}`);
    } catch (error) {
      console.error(`❌ Error creating directory ${dir}:`, error.message);
    }
  }
};

const cleanupTempFiles = async (filePaths) => {
  if (!Array.isArray(filePaths)) {
    filePaths = [filePaths];
  }

  for (const filePath of filePaths) {
    try {
      if (await fs.pathExists(filePath)) {
        await fs.remove(filePath);
        console.log(`🗑️ Cleaned up temp file: ${filePath}`);
      }
    } catch (error) {
      console.error(`❌ Error cleaning up temp file ${filePath}:`, error.message);
    }
  }
};

const getFileInfo = async (filePath) => {
  try {
    const stats = await fs.stat(filePath);
    return {
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      exists: true
    };
  } catch (error) {
    return {
      exists: false,
      error: error.message
    };
  }
};

const generateUniqueFilename = (originalName, extension = '.pdf') => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const baseName = path.parse(originalName).name;
  return `${baseName}_${timestamp}_${random}${extension}`;
};

module.exports = {
  createDirectories,
  cleanupTempFiles,
  getFileInfo,
  generateUniqueFilename
};
