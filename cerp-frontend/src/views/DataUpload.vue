02:41
user5978022300538

file changed back to orignal check thid frontend code also

<script setup>

import { ref, reactive, computed } from 'vue';

import { read, utils } from 'xlsx';

import { provideGlobals } from "../globals.js";

let baseURL = provideGlobals.getBaseUrl();

const fileData = ref([]);

const fileInput = ref(null);

const loading = ref(false);

const uploadProgress = ref(0);

const showPreview = ref(false);

const uploadSuccess = ref(false);

const handleFileUpload = (event) => {

const file = event.target.files[0];

if (!file) return;

uploadSuccess.value = false;

showPreview.value = false;

if (!file.name.match(/ \. (xlsx|xls)$/i)) {

alert('Please upload an Excel file (.xlsx or .xls)');

return;

}

const reader = new FileReader();

reader.onload = (e) => {

try {

const data = new Uint8Array(e.target.result);

const workbook = read(data, { type: 'array' });

const firstSheetName = workbook.SheetNames[0];

const worksheet = workbook.Sheets[firstSheetName];

fileData.value = utils.sheet_to_json(worksheet);

showPreview.value = true;

} catch (error) {

console.error('Error parsing file:', error);

alert('Error parsing Excel file. Please check the format.');

}

};

reader.readAsArrayBuffer(file);

};

const uploadToDatabase = async () => {

if (fileData.value.length === 0) {

alert('No data to upload');

return;

}

try {

loading.value = true;

uploadProgress.value = 0;

// Simulate progress (replace with actual upload progress)

const interval = setInterval(() => {

uploadProgress.value = Math.min(uploadProgress.value + 10, 90);

}, 300);

// Replace with your actual API endpoint

const response = await fetch(baseURL+'/api/store-records', {

method: 'POST',

headers: { 'Content-Type': 'application/json' },

body: JSON.stringify({ records: fileData.value }),

});

clearInterval(interval);

uploadProgress.value = 100;

if (!response.ok) throw new Error('Upload failed');

uploadSuccess.value = true;

setTimeout(() => {

fileData.value = [];

showPreview.value = false;

uploadProgress.value = 0;

if (fileInput.value) fileInput.value.value = '';

}, 2000);

} catch (error) {

console.error('Upload error:', error);

alert('Upload failed: ' + error.message);

} finally {

loading.value = false;

}

};

// Pagination

const itemsPerPage = 20;

const currentPage = ref(1);

const paginatedData = computed(() => {

const start = (currentPage.value - 1) * itemsPerPage;

return fileData.value.slice(start, start + itemsPerPage);

});

const totalPages = computed(() => Math.ceil(fileData.value.length / itemsPerPage));

const previousPage = () => currentPage.value > 1 && currentPage.value--;

const nextPage = () => currentPage.value < totalPages.value && currentPage.value++;

const setCurrentPage = (page) => { currentPage.value = page; };

</script>

<template>

<div class="upload-container">

<div class="d-flex justify-content-between">

<div class="pageHeading pt-2 mb-md-4 mb-3">

<p>Excel Data Upload</p>

</div>

</div>

<div class="upload-container mb-4">

<div class="card p-4 border rounded-3">

<h5 class="mb-3">Upload Excel File</h5>

<div class="d-flex gap-3 align-items-center">

<input

type="file"

ref="fileInput"

class="form-control"

accept=".xlsx,.xls"

@change="handleFileUpload"

:disabled="loading"

>

<button

class="btn btn-primary px-4"

@click="uploadToDatabase"

:disabled="!showPreview || loading"

>

<span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>

{{ loading ? 'Uploading...' : 'Upload Data' }}

</button>

</div>

<div v-if="uploadProgress > 0" class="mt-3">

<div class="progress">

<div

class="progress-bar"

:style="{ width: uploadProgress + '%' }"

:class="{ 'bg-success': uploadSuccess }"

>

{{ uploadProgress }}%

</div>

</div>

<div v-if="uploadSuccess" class="text-success mt-2">

<i class="bx bx-check-circle"></i> Upload successful!

</div>

</div>

</div>

</div>

<div v-if="showPreview">

<div class="d-flex justify-content-between align-items-center mb-3">

<h5>Preview ({{ fileData.length }} records)</h5>

<div class="text-muted">

Page {{ currentPage }} of {{ totalPages }}

</div>

</div>

<div class="table-responsive">

<table class="w-100 reportTable">

<thead>

<tr>

<th v-for="(header, i) in Object.keys(fileData[0] || {})" :key="i">

{{ header }}

</th>

</tr>

</thead>

<tbody>

<tr v-for="(row, i) in paginatedData" :key="i">

<td v-for="(value, key) in row" :key="key">

{{ value }}

</td>

</tr>

</tbody>

</table>

</div>

<div class="d-flex justify-content-end mt-3">

<div class="reportTablePagination">

<i

class='bx bx-chevron-left font-26'

@click="previousPage"

:class="{ 'disabled': currentPage === 1 }"

></i>

<div class="reportTablePaginationNumber d-flex gap-1">

<span

v-for="page in totalPages"

:key="page"

@click="setCurrentPage(page)"

:class="{ 'active': currentPage === page }"

>

{{ page }}

</span>

</div>

<i

class='bx bx-chevron-right font-26'

@click="nextPage"

:class="{ 'disabled': currentPage === totalPages }"

></i>

</div>

</div>

</div>

</div>

</template>

<style scoped>

.upload-container {

max-width: 800px;

}

.card {

background: #fff;

box-shadow: 0 2px 8px rgba(0,0,0,0.1);

}

.progress {

height: 24px;

}

.reportTable {

border-collapse: collapse;

}

.reportTable th, .reportTable td {

border: 1px solid #ddd;

padding: 12px;

}

.reportTable th {

background: #f2f2f2;

position: sticky;

top: 0;

}

.reportTablePagination {

display: flex;

align-items: center;

gap: 10px;

}

.reportTablePaginationNumber span {

padding: 5px 10px;

cursor: pointer;

}

.reportTablePaginationNumber span.active {

background: #007bff;

color: white;

border-radius: 4px;

}

.table-responsive {

max-height: 500px;

overflow-y: auto;

}

</style>