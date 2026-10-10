<script setup>
import * as XLSX from "xlsx";
import { ref, computed } from "vue";
import { provideGlobals } from "../globals.js";

const baseURL = provideGlobals.getBaseUrl();

// State management
const file = ref(null);
const loading = ref(false);
const uploadProgress = ref(0);
const uploadStatus = ref('');
const previewData = ref([]);
const showPreview = ref(false);
const notification = ref({ show: false, type: '', message: '', details: '' });
const dragOver = ref(false);
const processedCount = ref(0);
const totalCount = ref(0);
const errors = ref([]);

// Computed properties
const fileName = computed(() => file.value?.name || '');
const fileSize = computed(() => {
  if (!file.value) return '';
  const size = file.value.size;
  return size < 1024 * 1024 
    ? `${Math.round(size / 1024)} KB`
    : `${(size / (1024 * 1024)).toFixed(1)} MB`;
});

const progressPercentage = computed(() => {
  if (totalCount.value === 0) return 0;
  return Math.round((processedCount.value / totalCount.value) * 100);
});

// Notification system
const showNotification = (type, message, details = '') => {
  notification.value = { show: true, type, message, details };
  if (type === 'success') {
    setTimeout(() => {
      notification.value.show = false;
    }, 5000);
  }
};

const closeNotification = () => {
  notification.value.show = false;
};

// File validation
const validateFile = (selectedFile) => {
  const validTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 
                     'application/vnd.ms-excel', 'text/csv'];
  const validExtensions = ['.xlsx', '.xls', '.csv'];
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!selectedFile) {
    return { valid: false, error: 'Please select a file' };
  }

  if (!validTypes.includes(selectedFile.type) && 
      !validExtensions.some(ext => selectedFile.name.toLowerCase().endsWith(ext))) {
    return { valid: false, error: 'Please select a valid Excel or CSV file (.xlsx, .xls, .csv)' };
  }

  if (selectedFile.size > maxSize) {
    return { valid: false, error: 'File size must be less than 10MB' };
  }

  return { valid: true };
};

// Data validation
const validateExcelData = (rows) => {
  const requiredColumns = ['Circle', 'Pin', 'Status'];
  const validStatuses = [0 , 1];
  
  if (!rows || rows.length === 0) {
    return { valid: false, error: 'File appears to be empty or has no valid data' };
  }

  const headers = Object.keys(rows[0] || {});
  const missingColumns = requiredColumns.filter(col => !headers.includes(col));
  
  if (missingColumns.length > 0) {
    return { 
      valid: false, 
      error: `Missing required columns: ${missingColumns.join(', ')}`,
      details: `Required columns: ${requiredColumns.join(', ')}`
    };
  }

  const invalidRows = [];
  const statusErrors = [];

  rows.forEach((row, index) => {
    const rowNum = index + 2; // Excel row number (accounting for header)
    
    if (!row.Circle || !row.Pin) {
      invalidRows.push(`Row ${rowNum}: Missing Circle or Pin`);
    }
    
    if (row.Status !== undefined && !validStatuses.includes(Number(row.Status))) {
  statusErrors.push(`Row ${rowNum}: Invalid status "${row.Status}"`);
}

  });

  if (invalidRows.length > 0 || statusErrors.length > 0) {
    const allErrors = [...invalidRows, ...statusErrors];
    return {
      valid: false,
      error: `Found ${allErrors.length} validation errors`,
      details: allErrors.slice(0, 10).join('\n') + 
               (allErrors.length > 10 ? `\n...and ${allErrors.length - 10} more errors` : '')
    };
  }

  return { valid: true };
};

// File handling
const handleFileChange = (event) => {
  const selectedFile = event.target.files[0];
  handleFileSelection(selectedFile);
};

const handleDrop = (event) => {
  event.preventDefault();
  dragOver.value = false;
  const selectedFile = event.dataTransfer.files[0];
  handleFileSelection(selectedFile);
};

const handleFileSelection = (selectedFile) => {
  const validation = validateFile(selectedFile);
  
  if (!validation.valid) {
    showNotification('error', validation.error);
    return;
  }
  
  file.value = selectedFile;
  showPreview.value = false;
  previewData.value = [];
  errors.value = [];
  
  // Auto-preview for smaller files
  if (selectedFile.size < 1024 * 1024) { // 1MB
    generatePreview();
  }
};

const handleDragOver = (event) => {
  event.preventDefault();
  dragOver.value = true;
};

const handleDragLeave = () => {
  dragOver.value = false;
};

// Preview generation
const generatePreview = async () => {
  if (!file.value) return;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet);
      
      const validation = validateExcelData(rows);
      if (!validation.valid) {
        showNotification('error', validation.error, validation.details);
        return;
      }
      
      previewData.value = rows.slice(0, 10); // Show first 10 rows
      showPreview.value = true;
      totalCount.value = rows.length;
      
    } catch (error) {
      showNotification('error', 'Failed to read file', error.message);
    }
  };
  reader.readAsArrayBuffer(file.value);
};

// Upload handling
const handleUpload = async () => {
  if (!file.value) {
    showNotification('error', 'Please select a file first');
    return;
  }

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      loading.value = true;
      uploadStatus.value = 'Reading file...';
      uploadProgress.value = 10;

      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet);

      uploadStatus.value = 'Validating data...';
      uploadProgress.value = 25;

      const validation = validateExcelData(rows);
      if (!validation.valid) {
        showNotification('error', validation.error, validation.details);
        return;
      }

      uploadStatus.value = 'Processing records...';
      uploadProgress.value = 50;

      const pins = rows.map((row) => ({
        circle: row.Circle,
        pin: row.Pin,
        status: row.Status
      }));

      totalCount.value = pins.length;
      uploadStatus.value = 'Sending to server...';
      uploadProgress.value = 75;

      const res = await fetch(`${baseURL}/api/change-status-bulk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pins }),
      });

      const dataRes = await res.json();
      uploadProgress.value = 100;

      if (dataRes.success) {
        processedCount.value = pins.length;
        uploadStatus.value = 'Upload completed successfully!';
        showNotification('success', `Successfully processed ${pins.length} records`, dataRes.message);
      } else {
        showNotification('error', 'Upload failed', dataRes.message);
      }

    } catch (err) {
      console.error("Upload error:", err);
      showNotification('error', 'Upload failed', err.message);
    } finally {
      loading.value = false;
      setTimeout(() => {
        uploadProgress.value = 0;
        uploadStatus.value = '';
        processedCount.value = 0;
      }, 3000);
    }
  };
  reader.readAsArrayBuffer(file.value);
};

const resetUpload = () => {
  file.value = null;
  showPreview.value = false;
  previewData.value = [];
  errors.value = [];
  uploadProgress.value = 0;
  uploadStatus.value = '';
  processedCount.value = 0;
  totalCount.value = 0;
  closeNotification();
};
</script>
<template>
  <div class="status-container">

      <!-- Notification Toast -->
      <transition name="notification">
        <div v-if="notification.show" :class="[
          'notification-toast',
          `notification-${notification.type}`
        ]">
          <div class="notification-content">
            <div class="notification-icon">
              <svg v-if="notification.type === 'success'" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <svg v-else-if="notification.type === 'error'" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
              <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div class="notification-text">
              <div class="notification-title">{{ notification.message }}</div>
              <div v-if="notification.details" class="notification-details">{{ notification.details }}</div>
            </div>
            <button @click="closeNotification" class="notification-close">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>
      </transition>

      <!-- Main Upload Card -->
      <div class="upload-container">
        <div class="upload-header">
          <div class="upload-header-content">
            <div class="upload-icon">
              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
              </svg>
            </div>
            <div>
              <h1 class="upload-title">Bulk Pin Status Update</h1>
              <p class="upload-subtitle">Upload Excel files to update pin statuses in bulk</p>
            </div>
          </div>
          <button v-if="file" @click="resetUpload" class="reset-btn">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            Reset
          </button>
        </div>

        <!-- File Upload Area -->
        <div 
          :class="[
            'upload-dropzone',
            { 'upload-dropzone-active': dragOver },
            { 'upload-dropzone-filled': file }
          ]"
          @drop="handleDrop"
          @dragover="handleDragOver"
          @dragleave="handleDragLeave"
        >
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            @change="handleFileChange"
            class="upload-input"
            id="file-upload"
          />
          
          <div v-if="!file" class="upload-prompt">
            <svg class="upload-prompt-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
            </svg>
            <div class="upload-prompt-text">
              <p class="upload-prompt-title">Drop your Excel file here</p>
              <p class="upload-prompt-subtitle">or <label for="file-upload" class="upload-browse">browse files</label></p>
              <p class="upload-prompt-formats">Supports .xlsx, .xls, .csv files up to 10MB</p>
            </div>
          </div>

          <div v-else class="file-info">
            <div class="file-info-icon">
              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
            </div>
            <div class="file-info-details">
              <p class="file-info-name">{{ fileName }}</p>
              <p class="file-info-size">{{ fileSize }}</p>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="upload-actions">
          <button
            v-if="file && !showPreview"
            @click="generatePreview"
            class="preview-btn"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
            </svg>
            Preview Data
          </button>
          
          <button
            @click="handleUpload"
            :disabled="!file || loading"
            class="upload-btn"
          >
            <svg v-if="loading" class="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <svg v-else class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
            </svg>
            {{ loading ? 'Processing...' : 'Upload & Update' }}
          </button>
        </div>

        <!-- Progress Bar -->
        <div v-if="loading || uploadProgress > 0" class="progress-section">
          <div class="progress-info">
            <span class="progress-status">{{ uploadStatus }}</span>
            <span class="progress-percentage">{{ progressPercentage }}%</span>
          </div>
          <div class="progress-bar-container">
            <div class="progress-bar" :style="{ width: progressPercentage + '%' }"></div>
          </div>
          <div v-if="totalCount > 0" class="progress-counts">
            Processing {{ processedCount }} of {{ totalCount }} records
          </div>
        </div>

        <!-- Data Preview -->
        <div v-if="showPreview && previewData.length > 0" class="preview-section">
          <div class="preview-header">
            <h3 class="preview-title">Data Preview</h3>
            <span class="preview-count">Showing first {{ previewData.length }} of {{ totalCount }} records</span>
          </div>
          <div class="preview-table-container">
            <table class="preview-table">
              <thead>
                <tr>
                  <th>Circle</th>
                  <th>Pin</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, index) in previewData" :key="index">
                  <td>{{ row.Circle }}</td>
                  <td>{{ row.Pin }}</td>
                  <td>
                    <span :class="[
                      'status-badge',
                      `status-${(row.Status || '')}`
                    ]">
                      {{ row.Status }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Format Guide -->
        <div class="format-guide">
          <h3 class="format-guide-title">Required Format</h3>
          <div class="format-guide-content">
            <div class="format-guide-table">
              <div class="format-guide-header">
                <div>Circle</div>
                <div>Pin</div>
                <div>Status</div>
              </div>
              <div class="format-guide-row">
                <div>Circle A</div>
                <div>PIN001</div>
                <div>0</div>
              </div>
              <div class="format-guide-row">
                <div>Circle B</div>
                <div>PIN002</div>
                <div>0</div>
              </div>
            </div>
            <div class="format-guide-notes">
              <h4>Notes:</h4>
              <ul>
                <li>All three columns are required</li>
                <li>Valid statuses: Active, Inactive, Pending, Blocked</li>
                <li>Maximum file size: 10MB</li>
              </ul>
            </div>
          </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Container */
.upload-container {
  max-width: 56rem;
  margin-left: auto;
  margin-right: auto;
  background-color: white;
  border-radius: 1rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  overflow: hidden;
}

/* Header */
.upload-header {
  background: linear-gradient(to right, #2563eb, #4338ca);
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.upload-header-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.upload-icon {
  width: 3rem;
  height: 3rem;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.upload-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  margin: 0;
}

.upload-subtitle {
  color: #dbeafe;
  font-size: 0.875rem;
  margin: 0;
}

.reset-btn {
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem;
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  border-radius: 0.5rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
  font-weight: 500;
}

.reset-btn:hover {
  background-color: rgba(255, 255, 255, 0.3);
}

/* Dropzone */
.upload-dropzone {
  margin: 1.5rem;
  border: 2px dashed #d1d5db;
  border-radius: 0.75rem;
  padding: 3rem;
  text-align: center;
  transition: all 0.2s;
  position: relative;
  background-color: #f9fafb;
}

.upload-dropzone:hover {
  background-color: #f3f4f6;
}

.upload-dropzone-active {
  border-color: #60a5fa;
  background-color: #eff6ff;
}

.upload-dropzone-filled {
  border-color: #86efac;
  background-color: #f0fdf4;
}

.upload-input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.upload-prompt {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.upload-prompt-icon {
  width: 4rem;
  height: 4rem;
  margin: 0 auto;
  color: #9ca3af;
}

.upload-prompt-title {
  font-size: 1.125rem;
  font-weight: 500;
  color: #374151;
  margin: 0;
}

.upload-prompt-subtitle {
  color: #6b7280;
  margin: 0;
}

.upload-browse {
  color: #2563eb;
  cursor: pointer;
  font-weight: 500;
  text-decoration: none;
}

.upload-browse:hover {
  color: #1d4ed8;
}

.upload-prompt-formats {
  font-size: 0.875rem;
  color: #9ca3af;
  margin: 0;
}

/* File Info */
.file-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.file-info-icon {
  color: #059669;
}

.file-info-name {
  font-weight: 500;
  color: #111827;
  margin: 0;
}

.file-info-size {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

/* Actions */
.upload-actions {
  padding: 0 1.5rem 1.5rem;
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.preview-btn {
  display: flex;
  align-items: center;
  padding: 0.75rem 1.5rem;
  background-color: #f3f4f6;
  color: #374151;
  border-radius: 0.5rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.preview-btn:hover {
  background-color: #e5e7eb;
}

.upload-btn {
  display: flex;
  align-items: center;
  padding: 0.75rem 2rem;
  background: linear-gradient(to right, #2563eb, #4338ca);
  color: white;
  border-radius: 0.5rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.upload-btn:hover {
  background: linear-gradient(to right, #1d4ed8, #3730a3);
}

.upload-btn:focus {
  outline: none;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.3);
}

.upload-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Progress */
.progress-section {
  padding: 0 1.5rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
}

.progress-status {
  color: #4b5563;
  font-weight: 500;
}

.progress-percentage {
  color: #2563eb;
  font-weight: 600;
}

.progress-bar-container {
  width: 100%;
  background-color: #e5e7eb;
  border-radius: 9999px;
  height: 0.75rem;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(to right, #3b82f6, #4f46e5);
  border-radius: 9999px;
  transition: all 0.3s ease-out;
}

.progress-counts {
  text-align: center;
  font-size: 0.875rem;
  color: #6b7280;
}

/* Preview */
.preview-section {
  border-top: 1px solid #e5e7eb;
  padding: 1.5rem;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.preview-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.preview-count {
  font-size: 0.875rem;
  color: #6b7280;
}

.preview-table-container {
  overflow-x: auto;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
}

.preview-table {
  width: 100%;
  border-collapse: collapse;
}

.preview-table th {
  background-color: #f9fafb;
  padding: 0.75rem 1rem;
  text-align: left;
  font-size: 0.75rem;
  font-weight: 500;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.preview-table td {
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  color: #111827;
  border-top: 1px solid #e5e7eb;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.625rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-active {
  background-color: #dcfce7;
  color: #166534;
}

.status-inactive {
  background-color: #fee2e2;
  color: #991b1b;
}

.status-pending {
  background-color: #fef3c7;
  color: #92400e;
}

.status-blocked {
  background-color: #f3f4f6;
  color: #374151;
}

/* Format Guide */
.format-guide {
  border-top: 1px solid #e5e7eb;
  background-color: #f9fafb;
  padding: 1.5rem;
}

.format-guide-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 1rem 0;
}

.format-guide-content {
  display: grid;
  gap: 1.5rem;
}

@media (min-width: 768px) {
  .format-guide-content {
    grid-template-columns: repeat(2, 1fr);
  }
}

.format-guide-table {
  background-color: white;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.format-guide-header {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  background-color: #f3f4f6;
  font-weight: 500;
  font-size: 0.875rem;
  color: #374151;
}

.format-guide-header > div {
  padding: 0.5rem 1rem;
  border-right: 1px solid #e5e7eb;
}

.format-guide-header > div:last-child {
  border-right: none;
}

.format-guide-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  font-size: 0.875rem;
  border-top: 1px solid #e5e7eb;
}

.format-guide-row > div {
  padding: 0.5rem 1rem;
  border-right: 1px solid #e5e7eb;
}

.format-guide-row > div:last-child {
  border-right: none;
}

.format-guide-notes h4 {
  font-weight: 500;
  color: #111827;
  margin: 0 0 0.5rem 0;
}

.format-guide-notes ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.875rem;
  color: #4b5563;
}

.format-guide-notes li {
  display: flex;
  align-items: flex-start;
}

.format-guide-notes li::before {
  content: '•';
  color: #2563eb;
  font-weight: 700;
  margin-right: 0.5rem;
}

/* Notification */
.notification-toast {
  position: fixed;
  top: 1rem;
  right: 1rem;
  max-width: 28rem;
  width: 100%;
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  border-left: 4px solid;
  z-index: 50;
}

.notification-success {
  border-left-color: #10b981;
}

.notification-error {
  border-left-color: #ef4444;
}

.notification-content {
  display: flex;
  align-items: flex-start;
  padding: 1rem;
}

.notification-icon {
  flex-shrink: 0;
  margin-right: 0.75rem;
  margin-top: 0.125rem;
}

.notification-success .notification-icon {
  color: #10b981;
}

.notification-error .notification-icon {
  color: #ef4444;
}

.notification-text {
  flex: 1;
}

.notification-title {
  font-weight: 500;
  color: #111827;
  margin: 0;
}

.notification-details {
  margin-top: 0.25rem;
  font-size: 0.875rem;
  color: #4b5563;
  white-space: pre-line;
}

.notification-close {
  margin-left: 1rem;
  flex-shrink: 0;
  color: #9ca3af;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}

.notification-close:hover {
  color: #4b5563;
}

.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s;
}

.notification-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.notification-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

/* Animations */
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>