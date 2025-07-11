// PDF Merger & Splitter - Frontend JavaScript

class PDFMergerApp {
    constructor() {
        this.sessionId = null;
        this.uploadedFiles = [];
        this.operations = [];
        this.selectedFiles = [];
        
        this.initializeApp();
    }

    async initializeApp() {
        try {
            console.log('Initializing PDF Merger App...');
            
            // Generate session ID
            await this.generateSessionId();
            console.log('Session ID generated:', this.sessionId);
            
            // Initialize event listeners
            this.initializeEventListeners();
            console.log('Event listeners initialized');
            
            // Load initial data
            await this.loadUploadedFiles();
            await this.loadOperations();
            
            console.log('PDF Merger App initialized successfully');
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showAlert('Failed to initialize application', 'danger');
        }
    }

    async generateSessionId() {
        try {
            const response = await fetch('/api/auth/session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            if (data.success) {
                this.sessionId = data.data.sessionId;
                console.log('Session ID generated:', this.sessionId);
            } else {
                throw new Error('Failed to generate session ID');
            }
        } catch (error) {
            console.error('Error generating session ID:', error);
            // Generate a fallback session ID
            this.sessionId = 'fallback-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        }
    }

    initializeEventListeners() {
        // File upload listeners
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const browseBtn = document.getElementById('browseBtn');

        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const files = Array.from(e.dataTransfer.files).filter(file => file.type === 'application/pdf');
            if (files.length > 0) {
                this.handleFileUpload(files);
            }
        });

        // Click to upload
        uploadArea.addEventListener('click', () => {
            fileInput.click();
        });

        browseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            fileInput.click();
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFileUpload(Array.from(e.target.files));
            }
        });

        // Operation buttons
        const mergeBtn = document.getElementById('mergeBtn');
        const splitBtn = document.getElementById('splitBtn');
        
        if (mergeBtn) {
            mergeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Merge button clicked');
                this.showMergeModal();
            });
            console.log('Merge button event listener added');
        } else {
            console.error('Merge button not found');
        }

        if (splitBtn) {
            splitBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Split button clicked');
                this.showSplitModal();
            });
            console.log('Split button event listener added');
        } else {
            console.error('Split button not found');
        }

        // Clear selection button
        const clearSelectionBtn = document.getElementById('clearSelectionBtn');
        if (clearSelectionBtn) {
            clearSelectionBtn.addEventListener('click', () => {
                this.clearAllSelections();
            });
            console.log('Clear selection button event listener added');
        }

        // Modal event listeners
        document.getElementById('confirmMerge').addEventListener('click', () => {
            this.performMerge();
        });

        document.getElementById('confirmSplit').addEventListener('click', () => {
            this.performSplit();
        });

        // Split method radio buttons
        document.querySelectorAll('input[name="splitMethod"]').forEach(radio => {
            radio.addEventListener('change', () => {
                this.toggleSplitOptions();
            });
        });
    }

    async handleFileUpload(files) {
        const formData = new FormData();
        files.forEach(file => {
            formData.append('pdfs', file);
        });

        try {
            this.showUploadProgress(true);
            
            const response = await fetch('/api/upload/multiple', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            
            if (data.success) {
                this.showAlert(`${data.data.uploadedFiles.length} files uploaded successfully!`, 'success');
                await this.loadUploadedFiles();
                this.updateOperationButtons();
            } else {
                throw new Error(data.message || 'Upload failed');
            }
        } catch (error) {
            console.error('Upload error:', error);
            this.showAlert('Upload failed: ' + error.message, 'danger');
        } finally {
            this.showUploadProgress(false);
        }
    }

    showUploadProgress(show) {
        const progressElement = document.getElementById('uploadProgress');
        if (show) {
            progressElement.classList.remove('d-none');
            progressElement.querySelector('.progress-bar').style.width = '100%';
        } else {
            setTimeout(() => {
                progressElement.classList.add('d-none');
                progressElement.querySelector('.progress-bar').style.width = '0%';
            }, 1000);
        }
    }

    async loadUploadedFiles() {
        try {
            console.log('Loading uploaded files...');
            const response = await fetch('/api/pdf/files');
            const data = await response.json();
            
            if (data.success) {
                this.uploadedFiles = data.data.files;
                console.log('Loaded files:', this.uploadedFiles.length);
                this.renderFilesList();
                this.updateOperationButtons();
            } else {
                console.error('Failed to load files:', data.message);
            }
        } catch (error) {
            console.error('Error loading files:', error);
        }
    }

    renderFilesList() {
        const filesList = document.getElementById('filesList');
        
        if (this.uploadedFiles.length === 0) {
            filesList.innerHTML = `
                <div class="text-center text-muted py-3">
                    <i class="fas fa-file-upload fa-2x mb-2"></i>
                    <p>No files uploaded yet</p>
                </div>
            `;
            // Clear selected files if no files are available
            this.selectedFiles = [];
            return;
        }

        filesList.innerHTML = this.uploadedFiles.map(file => `
            <div class="file-item fade-in ${this.selectedFiles.includes(file.id) ? 'selected' : ''}" data-file-id="${file.id}">
                <div class="file-icon">
                    <i class="fas fa-file-pdf"></i>
                </div>
                <div class="file-info">
                    <div class="file-name">${file.originalName}</div>
                    <div class="file-details">
                        ${this.formatFileSize(file.size)} • ${file.pages} pages
                    </div>
                </div>
                <div class="file-actions">
                    <button class="btn btn-sm ${this.selectedFiles.includes(file.id) ? 'btn-primary' : 'btn-outline-primary'} select-file-btn" data-file-id="${file.id}">
                        <i class="fas fa-${this.selectedFiles.includes(file.id) ? 'check-circle' : 'check'}"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger delete-file-btn" data-file-id="${file.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
        
        // Add event listeners to the new buttons
        this.attachFileEventListeners();
        
        console.log('Files list rendered, selected files:', this.selectedFiles);
    }

    attachFileEventListeners() {
        // Remove existing event listeners to prevent duplicates
        document.querySelectorAll('.select-file-btn').forEach(btn => {
            btn.removeEventListener('click', this.handleFileSelect);
        });
        document.querySelectorAll('.delete-file-btn').forEach(btn => {
            btn.removeEventListener('click', this.handleFileDelete);
        });

        // Add event listeners to select buttons
        document.querySelectorAll('.select-file-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const fileId = btn.getAttribute('data-file-id');
                this.selectFile(fileId);
            });
        });

        // Add event listeners to delete buttons
        document.querySelectorAll('.delete-file-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const fileId = btn.getAttribute('data-file-id');
                this.deleteFile(fileId);
            });
        });
    }

    selectFile(fileId) {
        const fileItem = document.querySelector(`[data-file-id="${fileId}"]`);
        const selectBtn = fileItem.querySelector('.select-file-btn');
        
        if (!fileItem || !selectBtn) {
            console.error('File item or select button not found for ID:', fileId);
            return;
        }
        
        if (fileItem.classList.contains('selected')) {
            // Deselect file
            fileItem.classList.remove('selected');
            selectBtn.classList.remove('btn-primary');
            selectBtn.classList.add('btn-outline-primary');
            selectBtn.innerHTML = '<i class="fas fa-check"></i>';
            this.selectedFiles = this.selectedFiles.filter(id => id !== fileId);
            console.log('File deselected:', fileId);
        } else {
            // Select file
            fileItem.classList.add('selected');
            selectBtn.classList.remove('btn-outline-primary');
            selectBtn.classList.add('btn-primary');
            selectBtn.innerHTML = '<i class="fas fa-check-circle"></i>';
            
            // Make sure we don't have duplicates
            if (!this.selectedFiles.includes(fileId)) {
                this.selectedFiles.push(fileId);
            }
            console.log('File selected:', fileId);
        }
        
        console.log('Total selected files:', this.selectedFiles.length, 'IDs:', this.selectedFiles);
        this.updateOperationButtons();
    }

    clearAllSelections() {
        console.log('Clearing all selections');
        this.selectedFiles = [];
        
        // Update visual state
        document.querySelectorAll('.file-item').forEach(item => {
            item.classList.remove('selected');
        });
        
        document.querySelectorAll('.select-file-btn').forEach(btn => {
            btn.classList.remove('btn-primary');
            btn.classList.add('btn-outline-primary');
            btn.innerHTML = '<i class="fas fa-check"></i>';
        });
        
        this.updateOperationButtons();
        console.log('All selections cleared');
    }

    async deleteFile(fileId) {
        if (!confirm('Are you sure you want to delete this file?')) {
            return;
        }

        try {
            const response = await fetch(`/api/pdf/files/${fileId}`, {
                method: 'DELETE'
            });

            const data = await response.json();
            
            if (data.success) {
                this.showAlert('File deleted successfully', 'success');
                await this.loadUploadedFiles();
                this.selectedFiles = this.selectedFiles.filter(id => id !== fileId);
                this.updateOperationButtons();
            } else {
                throw new Error(data.message || 'Delete failed');
            }
        } catch (error) {
            console.error('Delete error:', error);
            this.showAlert('Delete failed: ' + error.message, 'danger');
        }
    }

    updateOperationButtons() {
        const mergeBtn = document.getElementById('mergeBtn');
        const splitBtn = document.getElementById('splitBtn');
        
        console.log('Updating operation buttons. Selected files count:', this.selectedFiles.length);
        console.log('Selected file IDs:', this.selectedFiles);
        
        if (mergeBtn) {
            const shouldEnableMerge = this.selectedFiles.length >= 2;
            mergeBtn.disabled = !shouldEnableMerge;
            
            if (shouldEnableMerge) {
                mergeBtn.classList.remove('disabled');
                mergeBtn.style.opacity = '1';
                mergeBtn.style.cursor = 'pointer';
            } else {
                mergeBtn.classList.add('disabled');
                mergeBtn.style.opacity = '0.6';
                mergeBtn.style.cursor = 'not-allowed';
            }
            
            console.log('Merge button enabled:', shouldEnableMerge);
        }
        
        if (splitBtn) {
            const shouldEnableSplit = this.selectedFiles.length === 1;
            splitBtn.disabled = !shouldEnableSplit;
            
            if (shouldEnableSplit) {
                splitBtn.classList.remove('disabled');
                splitBtn.style.opacity = '1';
                splitBtn.style.cursor = 'pointer';
            } else {
                splitBtn.classList.add('disabled');
                splitBtn.style.opacity = '0.6';
                splitBtn.style.cursor = 'not-allowed';
            }
            
            console.log('Split button enabled:', shouldEnableSplit);
        }
    }

    showMergeModal() {
        console.log('showMergeModal called, selected files:', this.selectedFiles);
        console.log('Selected files length:', this.selectedFiles.length);
        console.log('Available files:', this.uploadedFiles.map(f => f.id));
        
        if (this.selectedFiles.length < 2) {
            console.log('Not enough files selected for merge');
            this.showAlert('Please select at least 2 files to merge', 'warning');
            return;
        }

        try {
            const modalElement = document.getElementById('mergeModal');
            if (!modalElement) {
                console.error('Merge modal element not found');
                this.showAlert('Merge modal not found', 'danger');
                return;
            }

            console.log('Merge modal element found, creating modal...');
            
            // First populate the files list before showing modal
            this.populateMergeFilesList();
            
            // Check if Bootstrap is available
            if (typeof bootstrap === 'undefined') {
                console.error('Bootstrap is not loaded');
                this.showAlert('Bootstrap library not loaded', 'danger');
                return;
            }
            
            const modal = new bootstrap.Modal(modalElement);
            modal.show();
            console.log('Merge modal shown successfully');
            
        } catch (error) {
            console.error('Error showing merge modal:', error);
            this.showAlert('Error opening merge dialog: ' + error.message, 'danger');
        }
    }

    populateMergeFilesList() {
        const mergeFilesList = document.getElementById('mergeFilesList');
        const selectedFilesData = this.uploadedFiles.filter(file => 
            this.selectedFiles.includes(file.id)
        );

        mergeFilesList.innerHTML = selectedFilesData.map((file, index) => `
            <div class="merge-file-item" data-file-id="${file.id}">
                <div class="merge-file-handle">
                    <i class="fas fa-grip-vertical"></i>
                </div>
                <div class="merge-file-info">
                    <div class="merge-file-name">${file.originalName}</div>
                    <div class="merge-file-pages">${file.pages} pages</div>
                </div>
            </div>
        `).join('');
    }

    async performMerge() {
        try {
            const outputName = document.getElementById('mergeOutputName').value;
            const includeBookmarks = document.getElementById('includeBookmarks').checked;
            const includeMetadata = document.getElementById('includeMetadata').checked;

            const requestBody = {
                fileIds: this.selectedFiles,
                outputName: outputName || undefined,
                options: {
                    includeBookmarks,
                    includeMetadata
                }
            };

            this.showProcessingModal('Merging PDF files...');

            const response = await fetch('/api/pdf/merge', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'session-id': this.sessionId
                },
                body: JSON.stringify(requestBody)
            });

            const data = await response.json();
            
            if (data.success) {
                bootstrap.Modal.getInstance(document.getElementById('mergeModal')).hide();
                this.monitorOperation(data.data.operationId, 'merge');
            } else {
                throw new Error(data.message || 'Merge failed');
            }
        } catch (error) {
            console.error('Merge error:', error);
            this.hideProcessingModal();
            this.showAlert('Merge failed: ' + error.message, 'danger');
        }
    }

    showSplitModal() {
        console.log('showSplitModal called, selected files:', this.selectedFiles);
        console.log('Selected files length:', this.selectedFiles.length);
        console.log('Available files:', this.uploadedFiles.map(f => f.id));
        
        if (this.selectedFiles.length !== 1) {
            console.log('Wrong number of files selected for split');
            this.showAlert('Please select exactly one file to split', 'warning');
            return;
        }

        try {
            const modalElement = document.getElementById('splitModal');
            if (!modalElement) {
                console.error('Split modal element not found');
                this.showAlert('Split modal not found', 'danger');
                return;
            }

            console.log('Split modal element found, creating modal...');
            
            // First populate the file select before showing modal
            this.populateSplitFileSelect();
            
            // Check if Bootstrap is available
            if (typeof bootstrap === 'undefined') {
                console.error('Bootstrap is not loaded');
                this.showAlert('Bootstrap library not loaded', 'danger');
                return;
            }
            
            const modal = new bootstrap.Modal(modalElement);
            modal.show();
            console.log('Split modal shown successfully');
            
        } catch (error) {
            console.error('Error showing split modal:', error);
            this.showAlert('Error opening split dialog: ' + error.message, 'danger');
        }
    }

    populateSplitFileSelect() {
        const splitFileSelect = document.getElementById('splitFileSelect');
        const selectedFile = this.uploadedFiles.find(file => 
            this.selectedFiles.includes(file.id)
        );

        if (!selectedFile) {
            console.error('No selected file found for split operation');
            this.showAlert('Selected file not found', 'danger');
            return;
        }

        console.log('Populating split file select with:', selectedFile);
        
        splitFileSelect.innerHTML = `
            <option value="${selectedFile.id}">${selectedFile.originalName} (${selectedFile.pages} pages)</option>
        `;
    }

    toggleSplitOptions() {
        const splitByPages = document.getElementById('splitByPages').checked;
        const pagesPerFileContainer = document.getElementById('pagesPerFileContainer');
        const rangesContainer = document.getElementById('rangesContainer');

        if (splitByPages) {
            pagesPerFileContainer.classList.remove('d-none');
            rangesContainer.classList.add('d-none');
        } else {
            pagesPerFileContainer.classList.add('d-none');
            rangesContainer.classList.remove('d-none');
        }
    }

    async performSplit() {
        try {
            const fileId = document.getElementById('splitFileSelect').value;
            const splitByPages = document.getElementById('splitByPages').checked;
            const pagesPerFile = parseInt(document.getElementById('pagesPerFile').value);
            const pageRanges = document.getElementById('pageRanges').value;

            const requestBody = {
                fileId,
                splitBy: splitByPages ? 'pages' : 'range',
                pagesPerFile: splitByPages ? pagesPerFile : undefined,
                ranges: !splitByPages ? pageRanges.split(',').map(r => r.trim()) : undefined
            };

            this.showProcessingModal('Splitting PDF file...');

            const response = await fetch('/api/pdf/split', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'session-id': this.sessionId
                },
                body: JSON.stringify(requestBody)
            });

            const data = await response.json();
            
            if (data.success) {
                bootstrap.Modal.getInstance(document.getElementById('splitModal')).hide();
                this.monitorOperation(data.data.operationId, 'split');
            } else {
                throw new Error(data.message || 'Split failed');
            }
        } catch (error) {
            console.error('Split error:', error);
            this.hideProcessingModal();
            this.showAlert('Split failed: ' + error.message, 'danger');
        }
    }

    async monitorOperation(operationId, type) {
        const maxAttempts = 30;
        let attempts = 0;

        const checkStatus = async () => {
            try {
                const response = await fetch(`/api/pdf/operations/${operationId}`);
                const data = await response.json();

                if (data.success) {
                    const operation = data.data;
                    this.updateProcessingProgress(operation.progress, operation.status);

                    if (operation.status === 'completed') {
                        this.hideProcessingModal();
                        this.showAlert(`${type} operation completed successfully!`, 'success');
                        this.showDownloadLinks(operation);
                        await this.loadOperations();
                    } else if (operation.status === 'failed') {
                        this.hideProcessingModal();
                        this.showAlert(`${type} operation failed: ${operation.error?.message || 'Unknown error'}`, 'danger');
                    } else if (attempts < maxAttempts) {
                        attempts++;
                        setTimeout(checkStatus, 2000);
                    } else {
                        this.hideProcessingModal();
                        this.showAlert('Operation timeout - please check the operations list', 'warning');
                    }
                } else {
                    throw new Error(data.message);
                }
            } catch (error) {
                console.error('Error checking operation status:', error);
                this.hideProcessingModal();
                this.showAlert('Error checking operation status', 'danger');
            }
        };

        checkStatus();
    }

    showProcessingModal(text) {
        const modal = new bootstrap.Modal(document.getElementById('processingModal'));
        document.getElementById('processingText').textContent = text;
        document.getElementById('processingProgress').style.width = '0%';
        modal.show();
    }

    updateProcessingProgress(progress, status) {
        document.getElementById('processingProgress').style.width = `${progress}%`;
        document.getElementById('processingText').textContent = `Processing... ${status}`;
    }

    hideProcessingModal() {
        const modal = bootstrap.Modal.getInstance(document.getElementById('processingModal'));
        if (modal) {
            modal.hide();
        }
    }

    showDownloadLinks(operation) {
        const downloadLinks = operation.outputFiles.map((file, index) => 
            `<a href="/api/pdf/download/${operation._id}/${index}" class="btn btn-sm btn-primary me-2" download="${file.originalName}">
                <i class="fas fa-download me-1"></i>
                Download ${file.originalName}
            </a>`
        ).join('');

        this.showAlert(`
            <div>
                <strong>Operation completed!</strong><br>
                ${downloadLinks}
            </div>
        `, 'success', false);
    }

    async loadOperations() {
        try {
            const response = await fetch(`/api/pdf/operations?sessionId=${this.sessionId}`);
            const data = await response.json();
            
            if (data.success) {
                this.operations = data.data.operations;
                this.renderOperationsList();
            }
        } catch (error) {
            console.error('Error loading operations:', error);
        }
    }

    renderOperationsList() {
        const operationsList = document.getElementById('operationsList');
        
        if (this.operations.length === 0) {
            operationsList.innerHTML = `
                <div class="text-center text-muted py-3">
                    <i class="fas fa-clock fa-2x mb-2"></i>
                    <p>No operations yet</p>
                </div>
            `;
            return;
        }

        operationsList.innerHTML = this.operations.slice(0, 5).map(operation => `
            <div class="operation-item fade-in">
                <div class="operation-icon ${operation.type}">
                    <i class="fas fa-${operation.type === 'merge' ? 'compress-alt' : 'expand-alt'}"></i>
                </div>
                <div class="operation-info">
                    <div class="operation-type">${operation.type.charAt(0).toUpperCase() + operation.type.slice(1)}</div>
                    <div class="operation-status">
                        <span class="status-badge status-${operation.status}">${operation.status}</span>
                    </div>
                    <div class="operation-time">${this.formatDateTime(operation.createdAt)}</div>
                    ${operation.status === 'processing' || operation.status === 'pending' ? `
                        <div class="operation-progress">
                            <div class="operation-progress-bar" style="width: ${operation.progress}%"></div>
                        </div>
                    ` : ''}
                </div>
                ${operation.status === 'completed' ? `
                    <button class="btn btn-sm btn-primary download-operation-btn" data-operation-id="${operation._id}">
                        <i class="fas fa-download"></i>
                    </button>
                ` : ''}
            </div>
        `).join('');
        
        // Add event listeners to download buttons
        document.querySelectorAll('.download-operation-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const operationId = btn.getAttribute('data-operation-id');
                this.downloadOperation(operationId);
            });
        });
    }

    async downloadOperation(operationId) {
        try {
            const response = await fetch(`/api/pdf/operations/${operationId}`);
            const data = await response.json();
            
            if (data.success && data.data.status === 'completed') {
                const operation = data.data;
                if (operation.outputFiles && operation.outputFiles.length > 0) {
                    // Download first file, or show multiple download options
                    if (operation.outputFiles.length === 1) {
                        window.open(`/api/pdf/download/${operationId}/0`, '_blank');
                    } else {
                        this.showDownloadLinks(operation);
                    }
                }
            }
        } catch (error) {
            console.error('Download error:', error);
            this.showAlert('Download failed: ' + error.message, 'danger');
        }
    }

    showAlert(message, type = 'info', autoHide = true) {
        const alertContainer = document.getElementById('alertContainer');
        const alertId = 'alert-' + Date.now();
        
        const alertHtml = `
            <div class="alert alert-${type} alert-dismissible fade show" role="alert" id="${alertId}">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        alertContainer.insertAdjacentHTML('beforeend', alertHtml);
        
        if (autoHide) {
            setTimeout(() => {
                const alertElement = document.getElementById(alertId);
                if (alertElement) {
                    const alert = bootstrap.Alert.getOrCreateInstance(alertElement);
                    alert.close();
                }
            }, 5000);
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    formatDateTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString();
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing PDF Merger App...');
    window.app = new PDFMergerApp();
    
    // Also expose it globally for debugging
    window.pdfApp = window.app;
});
