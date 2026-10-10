<script setup>
import { ref } from 'vue';
import * as XLSX from 'xlsx';
import axios from 'axios';
import { useRoute } from 'vue-router';
import Sidebar from '@/components/Sidebar.vue';
import { db } from '../firebase/init.js/init';
import { doc, setDoc } from 'firebase/firestore';
import { useRouter } from 'vue-router';
import SuccessDialogue from '@/components/SuccessDialogue.vue';

const fileData = ref([]);
const fileName = ref('');
const selectedImage = ref(null);
const uploadMessage = ref('');
const showData = ref(false);
const route = useRoute();
const uid = route.params.uid;
const Message = ref('');

const loading = ref(false);
const router = useRouter();
const showDialog = ref(false);

// Store complete row data grouped by circle
const groupedData = ref({});

const readExcel = (event) => {
  const file = event.target.files[0];
  fileName.value = file.name;

  if (file) {
    const reader = new FileReader();

    reader.onload = (e) => {
      let data = e.target.result;
      let jsonData = [];

      if (file.name.endsWith('.csv')) {
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        jsonData = XLSX.utils.sheet_to_json(sheet);
      } else {
        const arrayBuffer = new Uint8Array(e.target.result);
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        jsonData = XLSX.utils.sheet_to_json(sheet);
      }

      // Group complete row data by circle
      groupedData.value = jsonData.reduce((acc, row) => {
        const circle = row.circle || '';
        
        if (!acc[circle]) {
          acc[circle] = [];
        }
        
        // Store the complete row object
        acc[circle].push({
          pin: row.pin || '',
          ...row // Include all other properties
        });
        
        return acc;
      }, {});

      showData.value = false;
    };

    if (file.name.endsWith('.csv')) {
      reader.readAsBinaryString(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  }
};

const uploadFile = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await axios.post('http://127.0.0.1:8000/api/upload', formData);
    uploadMessage.value = response.data.message;
  } catch (error) {
    uploadMessage.value = error.response?.data?.message || 'File upload failed.';
  }
};

const openModal = (imageUrl) => {
  selectedImage.value = imageUrl;
};

const displayData = () => {
  if (Object.keys(groupedData.value).length) {
    showData.value = true;
  }
};

const handleButtonClick = async (circle) => {
  if (groupedData.value[circle] && groupedData.value[circle].length > 0) {
    loading.value = true;
    try {
       //Create an object to store all pin data for this circle
      const circleData = {};
      
       //Add each pin's complete data to the circleData object
      groupedData.value[circle].forEach((pinData, index) => {
        circleData[`pin_${index}`] = {
          pin: pinData.pin,
          ...pinData // Include all other properties
        };
      });

      //Store the complete circle data in Firestore
      await setDoc(doc(db, "uploads",uid,"circles",circle), circleData);


      //for (const pinData of groupedData.value[circle]) {
      //const pinId = pinData.pin; // Use the actual pin value as document ID

      //await setDoc(doc(db, "uploads", uid,"circles" ,circle,"Pins" ,pinId), {
        //pin: pinData.pin,
        //...pinData
      //});}



      showDialog.value = true;
      Message.value = `🎉 All ${groupedData.value[circle].length} pins for circle "${circle}" have been successfully uploaded!`;
      
      console.log(`All pins for circle "${circle}" uploaded successfully!`);
    } catch (error) {
      console.error('Error uploading data:', error);
      Message.value = `Error uploading data: ${error.message}`;
      showDialog.value = true;
    } finally {
      loading.value = false;
    }
  }
};

const handleDialogClose = () => {
  showDialog.value = false;
  router.push('/ProfileData');
};
</script>

<template>
  <div class="d-flex">
    <Sidebar/>
    <div class="main-content p-5">
      <!-- Header -->
      <div class="d-flex justify-content-between">
        <div class="pageHeading pt-2 mb-md-4 mb-3">
          <p>Uploaded File Data</p>
        </div>

        <div class="d-flex gap-3 align-items-end mb-3">
          <!-- File Upload -->
          <div>
            <label for="fileUpload" class="form-label">Upload File</label>
            <input
              type="file"
              id="fileUpload"
              class="form-control p-2 px-3 rounded-3 bg-transparent border border-black"
              @change="readExcel"
              accept=".xlsx,.xls,.csv"
            />
            <span v-if="fileName" class="text-secondary mt-2">{{ fileName }}</span>
          </div>

          <!-- Show Data Button -->
          <div>
            <button 
              class="p-2 px-3 rounded-3 bg-primary text-white" 
              @click="displayData"
              :disabled="!Object.keys(groupedData).length"
            >
              Show Data
            </button>
          </div>
        </div>
      </div>

      <SuccessDialogue 
        :show="showDialog" 
        :message='Message' 
        @close="handleDialogClose" 
      />

      <!-- Table -->
      <div v-if="showData" class="table-wrapper">
        <div class="table-scroll">
          <table class="w-100 reportTable">
            <thead>
              <tr>
                <th>Circle</th>
                <th>Pin</th>
                <th>Data Preview</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="(pins, circle) in groupedData" :key="circle">
                <tr v-for="(pinData, index) in pins" :key="index">
                  <!-- Circle Column (only show for first row of each circle) -->
                  <td v-if="index === 0" :rowspan="pins.length">{{ circle }}</td>
                  
                  <!-- Pin Column -->
                  <td>{{ pinData.pin }}</td>
                  
                  <!-- Data Preview Column -->
                  <td>
                    <details>
                      <summary>View Details</summary>
                      <pre class="data-preview">{{ JSON.stringify(pinData, null, 2) }}</pre>
                    </details>
                  </td>
                  
                  <!-- Action Button (only show for first row of each circle) -->
                  <td v-if="index === 0" :rowspan="pins.length">
                    <button 
                      class="p-2 px-3 rounded-3 bg-success text-white" 
                      @click="handleButtonClick(circle)" 
                      :disabled="loading"
                    >
                      <span v-if="!loading">Upload All Data</span>
                      <span v-else>
                        <div class="spinner-border spinner-border-sm" role="status">
                          <span class="visually-hidden">Loading...</span>
                        </div>
                      </span>
                    </button>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>

  <!-- Modal for Image -->
  <div class="modal fade" id="imageModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-body reportImage">
          <img :src="selectedImage" class="img-fluid" v-if="selectedImage">
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pointer {
  cursor: pointer;
}

button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.reportTable {
  border-collapse: collapse;
  width: 100%;
  margin-top: 10px;
}

.reportTable th, .reportTable td {
  border: 1px solid #ccc;
  padding: 10px;
  text-align: left;
}

.reportTable th {
  background-color: #f0f0f0;
  font-weight: bold;
}

/* Data preview styling */
.data-preview {
  background: #f8f9fa;
  padding: 10px;
  border-radius: 4px;
  max-height: 200px;
  overflow-y: auto;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-all;
}

/* Wrapper for horizontal scroll */
.table-wrapper {
  width: 100%;
  overflow-x: auto;
}

.table-scroll {
  width: max-content;
}

/* Prevent content wrapping */
.reportTable th,
.reportTable td {
  white-space: nowrap;
}

/* Details/summary styling */
details {
  cursor: pointer;
}
details summary {
  outline: none;
}
</style>