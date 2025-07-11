const { PDFDocument } = require('pdf-lib');
const fs = require('fs-extra');
const path = require('path');

class PDFProcessingError extends Error {
  constructor(message) {
    super(message);
    this.name = 'PDFProcessingError';
  }
}

const getPDFInfo = async (filePath) => {
  try {
    const pdfBuffer = await fs.readFile(filePath);
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    
    const pageCount = pdfDoc.getPageCount();
    const title = pdfDoc.getTitle() || '';
    const author = pdfDoc.getAuthor() || '';
    const subject = pdfDoc.getSubject() || '';
    const creator = pdfDoc.getCreator() || '';
    const producer = pdfDoc.getProducer() || '';
    const creationDate = pdfDoc.getCreationDate();
    const modificationDate = pdfDoc.getModificationDate();

    return {
      pages: pageCount,
      title,
      author,
      subject,
      creator,
      producer,
      creationDate,
      modificationDate
    };
  } catch (error) {
    throw new PDFProcessingError(`Failed to read PDF info: ${error.message}`);
  }
};

const mergePDFs = async (inputPaths, outputPath, options = {}) => {
  try {
    const mergedPdf = await PDFDocument.create();
    
    // Set metadata if provided
    if (options.includeMetadata) {
      mergedPdf.setTitle(options.title || 'Merged PDF');
      mergedPdf.setAuthor(options.author || 'PDF Merger Tool');
      mergedPdf.setSubject(options.subject || 'Merged PDF Document');
      mergedPdf.setCreator('PDF Merger Tool');
      mergedPdf.setProducer('PDF Merger Tool');
    }

    let totalPages = 0;

    for (const inputPath of inputPaths) {
      const pdfBuffer = await fs.readFile(inputPath);
      const pdf = await PDFDocument.load(pdfBuffer);
      const pageCount = pdf.getPageCount();
      
      // Copy pages
      const pageIndices = Array.from({ length: pageCount }, (_, i) => i);
      const copiedPages = await mergedPdf.copyPages(pdf, pageIndices);
      
      copiedPages.forEach(page => mergedPdf.addPage(page));
      totalPages += pageCount;
    }

    const pdfBytes = await mergedPdf.save();
    await fs.writeFile(outputPath, pdfBytes);

    return {
      success: true,
      outputPath,
      totalPages,
      fileSize: pdfBytes.length
    };
  } catch (error) {
    throw new PDFProcessingError(`Failed to merge PDFs: ${error.message}`);
  }
};

const splitPDF = async (inputPath, outputDir, options = {}) => {
  try {
    const pdfBuffer = await fs.readFile(inputPath);
    const pdf = await PDFDocument.load(pdfBuffer);
    const pageCount = pdf.getPageCount();
    
    const outputFiles = [];
    
    if (options.splitBy === 'pages') {
      const pagesPerFile = options.pagesPerFile || 1;
      
      for (let i = 0; i < pageCount; i += pagesPerFile) {
        const newPdf = await PDFDocument.create();
        const endPage = Math.min(i + pagesPerFile, pageCount);
        
        const pageIndices = Array.from({ length: endPage - i }, (_, idx) => i + idx);
        const copiedPages = await newPdf.copyPages(pdf, pageIndices);
        
        copiedPages.forEach(page => newPdf.addPage(page));
        
        const outputFileName = `split_${i + 1}_to_${endPage}.pdf`;
        const outputPath = path.join(outputDir, outputFileName);
        
        const pdfBytes = await newPdf.save();
        await fs.writeFile(outputPath, pdfBytes);
        
        outputFiles.push({
          filename: outputFileName,
          path: outputPath,
          pages: endPage - i,
          size: pdfBytes.length,
          range: `${i + 1}-${endPage}`
        });
      }
    } else if (options.splitBy === 'range' && options.ranges) {
      for (let i = 0; i < options.ranges.length; i++) {
        const range = options.ranges[i];
        const [start, end] = range.split('-').map(num => parseInt(num.trim()));
        
        if (start < 1 || end > pageCount || start > end) {
          throw new PDFProcessingError(`Invalid range: ${range}`);
        }
        
        const newPdf = await PDFDocument.create();
        const pageIndices = Array.from({ length: end - start + 1 }, (_, idx) => start - 1 + idx);
        const copiedPages = await newPdf.copyPages(pdf, pageIndices);
        
        copiedPages.forEach(page => newPdf.addPage(page));
        
        const outputFileName = `split_pages_${start}_to_${end}.pdf`;
        const outputPath = path.join(outputDir, outputFileName);
        
        const pdfBytes = await newPdf.save();
        await fs.writeFile(outputPath, pdfBytes);
        
        outputFiles.push({
          filename: outputFileName,
          path: outputPath,
          pages: end - start + 1,
          size: pdfBytes.length,
          range: `${start}-${end}`
        });
      }
    }

    return {
      success: true,
      outputFiles,
      totalOutputFiles: outputFiles.length
    };
  } catch (error) {
    throw new PDFProcessingError(`Failed to split PDF: ${error.message}`);
  }
};

const validatePDF = async (filePath) => {
  try {
    const pdfBuffer = await fs.readFile(filePath);
    const pdf = await PDFDocument.load(pdfBuffer);
    
    return {
      isValid: true,
      pageCount: pdf.getPageCount()
    };
  } catch (error) {
    return {
      isValid: false,
      error: error.message
    };
  }
};

module.exports = {
  getPDFInfo,
  mergePDFs,
  splitPDF,
  validatePDF,
  PDFProcessingError
};
