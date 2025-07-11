# PDF Merger & Splitter

A versatile PDF merger and splitter tool that allows users to combine multiple PDF files into a single document or divide a single PDF into multiple documents. The platform provides a user-friendly interface with robust features for both casual users and professionals.

## Features

### Core Features
- **PDF Merging**: Combine multiple PDF files into a single document
- **PDF Splitting**: Split a single PDF into multiple files by pages or custom ranges
- **File Upload**: Support for multiple file uploads with drag-and-drop functionality
- **Real-time Processing**: Asynchronous processing with progress tracking
- **Download Management**: Easy download of processed files
- **File Management**: View, organize, and delete uploaded files

### Technical Features
- **Modular Architecture**: Clean separation of concerns with service-oriented design
- **MongoDB Integration**: Persistent storage for files and operations
- **RESTful API**: Well-structured API endpoints for all operations
- **Error Handling**: Comprehensive error handling and validation
- **Security**: Input validation, file type restrictions, and rate limiting
- **Responsive Design**: Mobile-friendly interface

## Technology Stack

- **Backend**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **PDF Processing**: pdf-lib for PDF manipulation
- **File Upload**: Multer for handling multipart/form-data
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **UI Framework**: Bootstrap 5 with custom styling
- **Icons**: Font Awesome

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd PdfMerger
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   - Copy `.env.example` to `.env` (already configured)
   - Update the MongoDB connection string if needed

4. **Create required directories**
   ```bash
   mkdir uploads output temp
   ```

5. **Start the application**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

6. **Access the application**
   - Open your browser and navigate to `http://localhost:3000`

## Project Structure

```
PdfMerger/
├── config/
│   └── database.js          # MongoDB connection configuration
├── middleware/
│   ├── errorHandler.js      # Global error handling middleware
│   ├── upload.js            # File upload configuration
│   └── validation.js        # Request validation middleware
├── models/
│   ├── PdfFile.js           # PDF file schema
│   └── Operation.js         # Operation schema
├── routes/
│   ├── authRoutes.js        # Authentication routes
│   ├── pdfRoutes.js         # PDF processing routes
│   └── uploadRoutes.js      # File upload routes
├── services/
│   ├── operationService.js  # Operation management service
│   └── pdfService.js        # PDF file management service
├── utils/
│   ├── fileSystem.js        # File system utilities
│   └── pdfProcessor.js      # PDF processing utilities
├── public/
│   ├── css/
│   │   └── style.css        # Custom styles
│   ├── js/
│   │   └── app.js           # Frontend JavaScript
│   └── index.html           # Main HTML file
├── uploads/                 # Uploaded files directory
├── output/                  # Processed files directory
├── temp/                    # Temporary files directory
├── .env                     # Environment variables
├── .gitignore              # Git ignore file
├── package.json            # Node.js dependencies
└── server.js               # Main application entry point
```

## API Endpoints

### File Upload
- `POST /api/upload/single` - Upload a single PDF file
- `POST /api/upload/multiple` - Upload multiple PDF files

### PDF Operations
- `GET /api/pdf/files` - Get all uploaded files
- `GET /api/pdf/files/:id` - Get specific file details
- `DELETE /api/pdf/files/:id` - Delete a file
- `POST /api/pdf/merge` - Merge multiple PDF files
- `POST /api/pdf/split` - Split a PDF file
- `GET /api/pdf/operations` - Get all operations
- `GET /api/pdf/operations/:id` - Get specific operation details
- `GET /api/pdf/download/:operationId/:fileIndex` - Download processed file

### Authentication
- `POST /api/auth/session` - Generate session ID
- `GET /api/auth/session/:sessionId` - Validate session

## Usage

### Uploading Files
1. Drag and drop PDF files onto the upload area, or click to browse
2. Files are automatically validated and processed
3. Uploaded files appear in the "Uploaded Files" panel

### Merging PDFs
1. Select multiple files from the uploaded files list
2. Click the "Merge Files" button
3. Configure merge options in the modal
4. Click "Merge Files" to start processing
5. Download the merged file when complete

### Splitting PDFs
1. Select a single file from the uploaded files list
2. Click the "Split File" button
3. Choose split method:
   - **By Pages**: Specify pages per file
   - **By Range**: Specify custom page ranges (e.g., "1-5, 6-10")
4. Click "Split File" to start processing
5. Download individual split files when complete

## Configuration

### Environment Variables
- `NODE_ENV`: Application environment (development/production)
- `PORT`: Server port (default: 3000)
- `MONGODB_URI`: MongoDB connection string
- `MAX_FILE_SIZE`: Maximum file size in bytes (default: 10MB)
- `UPLOAD_DIR`: Upload directory path

### File Limits
- Maximum file size: 10MB per file
- Maximum files per upload: 10 files
- Supported format: PDF only

## Error Handling

The application includes comprehensive error handling:
- File validation errors
- PDF processing errors
- Database connection errors
- Request validation errors
- Rate limiting errors

## Security Features

- Input validation and sanitization
- File type restrictions
- File size limits
- Rate limiting to prevent abuse
- Secure file storage
- Error message sanitization

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and support, please create an issue in the repository or contact the development team.

## Roadmap

- [ ] User authentication and authorization
- [ ] Batch processing for large files
- [ ] PDF password protection/removal
- [ ] OCR text extraction
- [ ] Watermark addition
- [ ] WebSocket support for real-time updates
- [ ] API rate limiting per user
- [ ] File expiration and cleanup
- [ ] Advanced PDF metadata editing
