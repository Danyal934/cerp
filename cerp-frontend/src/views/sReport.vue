<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue';
import { provideGlobals } from "../globals.js";

const baseURL = provideGlobals.getBaseUrl();
const properties = ref([]);
const loading = ref(false);
const selectedDate = ref(null);
const userNames = ref([]);
const selectedUserName = ref('');
const selectedProperty = ref(null);
const tableContainer = ref(null);
let isDragging = false;
let startX;
let startScrollLeft;
const showFilters = ref(false);
const error = ref(null);

// Add these new reactive properties
const pinSearchInput = ref('');
const pinSearchResults = ref([]);
const showPinResults = ref(false);
const dateRange = reactive({
  from: null,
  to: null
});

const filterOptions = reactive({
  land: [],
  name: [],
  pin: [],
  circle: [],
  floors: [],
  landArea: [],
  coveredArea: []
});

const activeFilters = reactive({
  land: [],
  name: [],
  pin: [],
  circle: [],
  basement: [],
  floors: [],
  landArea: [],
  coveredArea: []
});

// Backend pagination variables
const itemsPerPage = 20;
const currentPage = ref(1);
const totalItems = ref(0);
const totalPages = ref(0);

// Fetch property data from API with pagination
const fetchData = async (page = 1) => {
  try {
    loading.value = true;
    error.value = null;
    
    // Build query parameters for filters
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: itemsPerPage.toString()
    });
    
    // Add filter parameters
    if (selectedDate.value) {
      const [year, month, day] = selectedDate.value.split('-');
      const filterDate = `${day}/${month}/${year}`;
      params.append('date', filterDate);
    }
    
    if (dateRange.from) {
      params.append('date_from', dateRange.from);
    }
    
    if (dateRange.to) {
      params.append('date_to', dateRange.to);
    }
    
    if (selectedUserName.value) {
      params.append('username', selectedUserName.value);
    }
    
    // Add active filters
    if (activeFilters.land.length) {
      params.append('land', activeFilters.land.join(','));
    }
    
    if (activeFilters.name.length) {
      params.append('name', activeFilters.name.join(','));
    }
    
    if (activeFilters.pin.length) {
      params.append('pin', activeFilters.pin.join(','));
    }
    
    if (activeFilters.circle.length) {
      params.append('circle', activeFilters.circle.join(','));
    }
    
    if (activeFilters.basement.length) {
      params.append('basement', activeFilters.basement.join(','));
    }
    
    if (activeFilters.floors.length) {
      params.append('floors', activeFilters.floors.join(','));
    }
    
    if (activeFilters.landArea.length) {
      params.append('land_area', activeFilters.landArea.join(','));
    }
    
    if (activeFilters.coveredArea.length) {
      params.append('covered_area', activeFilters.coveredArea.join(','));
    }
    
    const response = await fetch(`${baseURL}/api/all-reports?${params}`);
    const data = await response.json();
    
    properties.value = data.data || [];
    totalItems.value = data.total || 0;
    totalPages.value = data.last_page || 0;
    currentPage.value = data.current_page || 1;
    
    // Process dates for display
    properties.value.forEach(prop => {
      if (prop.submission_time) {
        const [datePart] = prop.submission_time.split(' ');
        const [day, month, year] = datePart.split('/');
        prop.submissionDate = new Date(`${year}-${month}-${day}`);
      }
    });
    
  } catch (err) {
    console.error('Error fetching data:', err);
    error.value = 'Failed to load property data. Please check your connection.';
  } finally {
    loading.value = false;
  }
};

// Fetch all properties for filter options and export (without pagination)
const fetchAllPropertiesForFilters = async () => {
  try {
    const response = await fetch(`${baseURL}/api/all-reports-no-pagination`);
    if (!response.ok) {
      throw new Error(`Filter options request failed (${response.status})`);
    }
    const data = await response.json();
    
    filterOptions.land = data.land || [];
    filterOptions.name = data.name || [];
    filterOptions.pin = data.pin || [];
    filterOptions.circle = data.circle || [];
    filterOptions.floors = data.floors || [];
     userNames.value = data.usernames || [];
     
     // Create range options using max values from backend
     filterOptions.landArea = createRangesFromMax(data.max_land_area || 0);
     filterOptions.coveredArea = createRangesFromMax(data.max_covered_area || 0);
     
   } catch (error) {
    console.error('Error fetching filter data:', error);
    error.value = 'Failed to load user filter data. Some filters may be unavailable.';
  }
};

// Create range options for numerical filters using max value
function createRangesFromMax(max) {
  if (!max) return [];
  
  const numMax = parseInt(max);
  const rangeSize = Math.ceil(numMax / 5);
  const ranges = [];
  
  for (let i = 0; i < 5; i++) {
    const min = i * rangeSize;
    const currentMax = (i + 1) * rangeSize;
    ranges.push(`${min}-${currentMax}`);
  }
  
  return ranges;
}

// Check if value falls within range
function isInRange(value, range) {
  const [min, max] = range.split('-').map(Number);
  const numValue = parseInt(value);
  return numValue >= min && numValue < max;
}

// Add PIN search functionality
const searchPins = () => {
  if (pinSearchInput.value.length < 2) {
    pinSearchResults.value = [];
    showPinResults.value = false;
    return;
  }
  
  const searchTerm = pinSearchInput.value.toLowerCase();
  pinSearchResults.value = filterOptions.pin.filter(pin => 
    pin.toLowerCase().includes(searchTerm)
  ).slice(0, 10); // Limit to 10 results
  
  showPinResults.value = pinSearchResults.value.length > 0;
};

// PIN filter methods
const addPinFilter = (pin = null) => {
  const pinToAdd = pin || pinSearchInput.value.trim();
  if (pinToAdd && !activeFilters.pin.includes(pinToAdd)) {
    activeFilters.pin.push(pinToAdd);
    pinSearchInput.value = '';
    pinSearchResults.value = [];
    showPinResults.value = false;
    currentPage.value = 1;
    fetchData(1);
  }
};

const removePinFilter = (pin) => {
  const index = activeFilters.pin.indexOf(pin);
  if (index !== -1) {
    activeFilters.pin.splice(index, 1);
    currentPage.value = 1;
    fetchData(1);
  }
};

// Add function to clear date range
const clearDateRange = () => {
  dateRange.from = null;
  dateRange.to = null;
  currentPage.value = 1;
  fetchData(1);
};

// Export data - now uses allProperties or makes a separate API call for all data
const exportData = async () => {
  try {
    loading.value = true;
    
    // Fetch all filtered data for export
    const params = new URLSearchParams();
    
    // Add filter parameters (same as fetchData but without pagination)
    if (selectedDate.value) {
      const [year, month, day] = selectedDate.value.split('-');
      const filterDate = `${day}/${month}/${year}`;
      params.append('date', filterDate);
    }
    
    if (dateRange.from) {
      params.append('date_from', dateRange.from);
    }
    
    if (dateRange.to) {
      params.append('date_to', dateRange.to);
    }
    
    if (selectedUserName.value) {
      params.append('username', selectedUserName.value);
    }
    
    if (activeFilters.land.length) {
      params.append('land', activeFilters.land.join(','));
    }
    
    if (activeFilters.name.length) {
      params.append('name', activeFilters.name.join(','));
    }
    
    if (activeFilters.pin.length) {
      params.append('pin', activeFilters.pin.join(','));
    }
    
    if (activeFilters.circle.length) {
      params.append('circle', activeFilters.circle.join(','));
    }
    
    if (activeFilters.basement.length) {
      params.append('basement', activeFilters.basement.join(','));
    }
    
    if (activeFilters.floors.length) {
      params.append('floors', activeFilters.floors.join(','));
    }
    
    if (activeFilters.landArea.length) {
      params.append('land_area', activeFilters.landArea.join(','));
    }
    
    if (activeFilters.coveredArea.length) {
      params.append('covered_area', activeFilters.coveredArea.join(','));
    }
    
    const response = await fetch(`${baseURL}/api/all-reports-export?${params}`);
    const data = await response.json();
    const allFilteredProperties = data.data || [];
    
    const headers = [
      'ID', 'Username', 'Name', 'Phone', 'Circle', 'PIN', 
      'Info', 'Floors', 'Basement','Store Front', 'Land Area', 'Covered Area', 
      'Land Type', 'Other Info', 'Comments', 'Latitude', 'Longitude',
      'Capture Time', 'Submission Time','Resubmission', 'Image Path'
    ];
    
    const csvRows = [
      headers.join(','),
      ...allFilteredProperties.map(prop => {
        return [
          `"${prop.id}"`,
          `"${prop.username}"`,
          `"${prop.user_name}"`,
          `"${prop.user_phone}"`,
          `"${prop.circle}"`,
          `"${prop.pin}"`,
          `"${prop.info}"`,
          `"${prop.floors_num}"`,
          `"${prop.basement ? '1' : '0'}"`,
          `"${prop.Store_front ? '1' : '0'}"`,
          `"${prop.land_area}"`,
          `"${prop.covered_area}"`,
          `"${prop.land}"`,
          `"${prop.other || ''}"`,
          `"${prop.comments || ''}"`,
          `"${prop.latitude}"`,
          `"${prop.longitude}"`,
          `"${prop.capture_time}"`,
          `"${prop.submission_time}"`,
          `"${prop.resubmission || 'No'}"`,
          `"${prop.picture_path ? baseURL + '/storage/' + prop.picture_path : ''}"`
        ].join(',');
      })
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'property_report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error('Error exporting data:', error);
    alert('Failed to export data: ' + error.message);
  } finally {
    loading.value = false;
  }
};

// Filter properties based on selected filters
const filteredProperties = computed(() => {
  let result = properties.value;
  
  // Date filter (single date)
  if (selectedDate.value) {
    const [year, month, day] = selectedDate.value.split('-');
    const filterDate = `${day}/${month}/${year}`;
    
    result = result.filter(prop => {
      if (!prop.submission_time) return false;
      const propDate = prop.submission_time.split(' ')[0];
      return propDate === filterDate;
    });
  }
  
  // Date range filter
  if (dateRange.from || dateRange.to) {
    result = result.filter(prop => {
      if (!prop.submissionDate) return false;
      
      const propDate = prop.submissionDate;
      let fromCondition = true;
      let toCondition = true;
      
      if (dateRange.from) {
        const fromDate = new Date(dateRange.from);
        fromCondition = propDate >= fromDate;
      }
      
      if (dateRange.to) {
        const toDate = new Date(dateRange.to);
        toDate.setHours(23, 59, 59, 999); // Include the entire end day
        toCondition = propDate <= toDate;
      }
      
      return fromCondition && toCondition;
    });
  }
  
  // Username filter
  if (selectedUserName.value) {
    result = result.filter(prop => prop.username === selectedUserName.value);
  }
  
  // Column filters
  if (activeFilters.land.length) {
    result = result.filter(prop => activeFilters.land.includes(prop.land));
  }
  
  if (activeFilters.name.length) {
    result = result.filter(prop => activeFilters.name.includes(prop.user_name));
  }
  
  if (activeFilters.pin.length) {
    result = result.filter(prop => activeFilters.pin.includes(prop.pin));
  }
  
  if (activeFilters.circle.length) {
    result = result.filter(prop => activeFilters.circle.includes(prop.circle));
  }
  
  if (activeFilters.basement.length) {
    result = result.filter(prop => {
      const basementValue = prop.basement ? 'Yes' : 'No';
      return activeFilters.basement.includes(basementValue);
    });
  }
  
  if (activeFilters.floors.length) {
    result = result.filter(prop => activeFilters.floors.includes(prop.floors_num));
  }
  
  if (activeFilters.landArea.length) {
    result = result.filter(prop => 
      activeFilters.landArea.some(range => isInRange(prop.land_area, range))
    );
  }
  
  if (activeFilters.coveredArea.length) {
      result = result.filter(prop => 
        activeFilters.coveredArea.some(range => isInRange(prop.covered_area, range))
      );
    }
    
    if (activeFilters.multiUnit.length) {
      result = result.filter(prop => {
        const multiUnitValue = prop.picture2_path ? 'Yes' : 'No';
        return activeFilters.multiUnit.includes(multiUnitValue);
      });
    }
    
    return result;
});

// Format date for display
function extractDate(timestamp) {
  const [datePart] = timestamp.split(' ');
  return datePart;
}

// Pagination
const paginatedProperties = computed(() => properties.value);

const previousPage = () => {
  if (currentPage.value > 1) {
    fetchData(currentPage.value - 1);
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    fetchData(currentPage.value + 1);
  }
};

const setCurrentPage = (page) => {
  fetchData(page);
};

// Helper function for pagination range when there are many pages
const getPaginationRange = () => {
  const range = [];
  const start = Math.max(2, currentPage.value - 2);
  const end = Math.min(totalPages.value - 1, currentPage.value + 2);
  
  for (let i = start; i <= end; i++) {
    range.push(i);
  }
  
  return range;
};

// Filter management
const toggleFilter = (category, value) => {
  const index = activeFilters[category].indexOf(value);
  if (index === -1) {
    activeFilters[category].push(value);
  } else {
    activeFilters[category].splice(index, 1);
  }
  currentPage.value = 1;
  fetchData(1);
};

const clearFilters = () => {
  Object.keys(activeFilters).forEach(key => {
    activeFilters[key] = [];
  });
  selectedDate.value = null;
  selectedUserName.value = '';
  dateRange.from = null;
  dateRange.to = null;
  currentPage.value = 1;
  fetchData(1);
};

watch([selectedDate, selectedUserName, dateRange], () => {
  currentPage.value = 1;
  fetchData(1);
}, { deep: true });

// Horizontal scrolling functions
const scrollLeft = () => {
  tableContainer.value.scrollBy({ left: -200, behavior: 'smooth' });
};

const scrollRight = () => {
  tableContainer.value.scrollBy({ left: 200, behavior: 'smooth' });
};

// Mouse drag handlers
let dragThreshold = 10;
let moveX = 0;

const startDrag = (e) => {
  // Only handle left mouse button
  if (e.button !== 0) return;
  
  isDragging = false; // Don't start dragging yet
  moveX = 0;
  startX = e.pageX - tableContainer.value.offsetLeft;
  startScrollLeft = tableContainer.value.scrollLeft;
  tableContainer.value.style.cursor = 'grab';
};

const duringDrag = (e) => {
  if (startX === undefined) return;
  
  const x = e.pageX - tableContainer.value.offsetLeft;
  const walk = (x - startX);
  
  if (!isDragging && Math.abs(walk) > dragThreshold) {
    isDragging = true;
    tableContainer.value.style.cursor = 'grabbing';
    tableContainer.value.style.userSelect = 'none';
  }
  
  if (isDragging) {
    e.preventDefault();
    tableContainer.value.scrollLeft = startScrollLeft - walk * 2;
  }
};

const endDrag = () => {
  isDragging = false;
  startX = undefined;
  tableContainer.value.style.cursor = 'grab';
  tableContainer.value.style.removeProperty('user-select');
};

// Keyboard navigation
const handleKeyDown = (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
  
  switch(e.key) {
    case 'ArrowLeft':
      scrollLeft();
      break;
    case 'ArrowRight':
      scrollRight();
      break;
  }
};

const openGoogleMaps = (latitude, longitude) => {
  const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
  window.open(url, '_blank');
};

// Download single image
const downloadImage = (imageUrl, pin, suffix = '') => {
  const link = document.createElement('a');
  link.href = imageUrl;
  link.download = `${pin}${suffix}.jpg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};


const renewImage = async (username, circle, pin) => {
  try {
    const response = await fetch(`${baseURL}/api/change-pin-status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        circle,
        pin,
        status: 0, // or toggle if you want
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to update pin status");
    }

    console.log("Pin status updated:", data);
    alert(data.message);
  } catch (err) {
    console.error("Error updating pin:", err);
    alert("Error updating pin");
  }
};

// Bulk download all images
const downloadAllImages = async () => {
  if (!properties.value.length) return;
  
  try {
    loading.value = true;
    alert('Preparing download... This might take a moment for multiple images.');
    
    const propertiesWithImages = properties.value.filter(prop => prop.picture_path);
    
    for (const prop of propertiesWithImages) {
      try {
        const imageUrl = baseURL + '/storage/' + prop.picture_path;
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        downloadImage(url, prop.pin);
        window.URL.revokeObjectURL(url);
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`Failed to download image for PIN ${prop.pin}:`, error);
      }
    }
    
    alert('Bulk download initiated! Check your downloads folder.');
  } catch (error) {
    console.error('Error in bulk download:', error);
    alert('Failed to initiate bulk download');
  } finally {
    loading.value = false;
  }
};

// Initialize
onMounted(() => {
  fetchData(1);
  // Fetch filters in the background after initial data is loaded
  setTimeout(() => {
    fetchAllPropertiesForFilters();
  }, 500);
  window.addEventListener('keydown', handleKeyDown);
});

// Cleanup
onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
});
</script>

<template>
  <div class="container-fluid px-0">
      <div class="pageHeading pt-2 mb-md-4 mb-3">
        <p>Survey Report</p>
      </div>

      <div v-if="error" class="alert alert-danger mb-4 d-flex justify-content-between align-items-center">
        <span><i class='bx bx-error-circle me-2'></i>{{ error }}</span>
        <button class="btn btn-sm btn-outline-danger" @click="fetchData(currentPage)">Retry</button>
      </div>

      <div class="bg-white rounded-3 shadow-sm p-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div class="d-flex gap-3">
          <button 
            class="btn btn-primary"
            @click="downloadAllImages"
            :disabled="loading || !properties.length"
          >
            <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
            Download All Images
          </button>
          <button 
            class="btn btn-secondary" 
            @click="exportData"
            :disabled="loading"
          >
            <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
            Export as CSV
          </button>
        </div>
      </div>
      
      <!-- Filter Controls -->
      <div class="filter-controls mb-4">
        <div class="row g-3">
          <!-- Date Range Filter -->
          <div class="col-md-3">
            <label class="form-label">Date Range (From)</label>
            <input 
              type="date" 
              class="form-control" 
              v-model="dateRange.from"
              @change="currentPage = 1"
            >
          </div>
          <div class="col-md-3">
            <label class="form-label">Date Range (To)</label>
            <div class="input-group">
              <input 
                type="date" 
                class="form-control" 
                v-model="dateRange.to"
                @change="currentPage = 1"
              >
              <button 
                v-if="dateRange.from || dateRange.to"
                class="btn btn-outline-secondary" 
                type="button"
                @click="clearDateRange"
              >
                <i class='bx bx-x'></i>
              </button>
            </div>
          </div>
          <!-- PIN Search Filter -->
           <div class="col-md-3">
            <label class="form-label">PIN Search</label>
            <div class="position-relative">
              <div class="input-group mb-2">
                <input 
                  type="text" 
                  class="form-control" 
                  placeholder="Start typing to search PINs"
                  v-model="pinSearchInput"
                  @input="searchPins"
                  @keyup.enter="addPinFilter()"
                >
                <button 
                  class="btn btn-outline-secondary" 
                  type="button"
                  @click="addPinFilter()"
                >
                  <i class="bx bx-search"></i>
                </button>
              </div>
              
              <!-- PIN Search Results Dropdown -->
              <div 
                v-if="showPinResults" 
                class="pin-search-results bg-white border rounded shadow-sm position-absolute w-100"
                style="z-index: 1000; max-height: 200px; overflow-y: auto;"
              >
                <div 
                  v-for="pin in pinSearchResults" 
                  :key="'result-' + pin"
                  class="p-2 border-bottom cursor-pointer hover-bg"
                  @click="addPinFilter(pin)"
                >
                  {{ pin }}
                </div>
                <div 
                  v-if="pinSearchResults.length === 0 && pinSearchInput.length >= 2" 
                  class="p-2 text-muted"
                >
                  No matching PINs found
                </div>
              </div>
            </div>
            
            <div v-if="activeFilters.pin.length" class="d-flex flex-wrap gap-2 mt-2">
              <span 
                v-for="pin in activeFilters.pin" 
                :key="'active-pin-' + pin"
                class="badge bg-primary d-flex align-items-center"
              >
                {{ pin }}
                <button 
                  class="btn-close btn-close-white ms-2" 
                  style="font-size: 0.5rem;"
                  @click="removePinFilter(pin)"
                ></button>
              </span>
            </div>
          </div>
          
          <div class="col-md-3">
            <label for="filterByUser" class="form-label">Filter by User</label>
            <select 
              id="filterByUser" 
              v-model="selectedUserName"
              class="form-select" 
              @change="currentPage = 1"
            >
              <option selected value="">All Users</option>
              <option v-for="(userName, index) in userNames" :key="'user-' + index" :value="userName">
                {{ userName }}
              </option>
            </select>
          </div>
        </div>

        <button class="btn btn-outline-primary mb-3 mt-2" @click="showFilters = !showFilters">
          <i :class="showFilters ? 'bx bx-chevron-up' : 'bx bx-filter'"></i>
          {{ showFilters ? 'Hide Filters' : 'Show Filters' }}
        </button>
      </div>
      
      <!-- Column Filters Panel -->
      <div v-if="showFilters" class="filter-panel mb-4 p-3 bg-light rounded">
        <div class="row g-3">
          <!-- Land Type Filter -->
          <div class="col-md-3">
            <label class="form-label">Land Type</label>
            <div class="filter-options">
              <div v-for="land in filterOptions.land" :key="'land-' + land" class="form-check">
                <input 
                  class="form-check-input" 
                  type="checkbox" 
                  :id="'land-' + land"
                  :checked="activeFilters.land.includes(land)"
                  @change="toggleFilter('land', land)"
                >
                <label class="form-check-label" :for="'land-' + land">
                  {{ land }}
                </label>
              </div>
            </div>
          </div>
          
          <!-- Name Filter -->
          <div class="col-md-3">
            <label class="form-label">Name</label>
            <div class="filter-options">
              <div v-for="name in filterOptions.name" :key="'name-' + name" class="form-check">
                <input 
                  class="form-check-input" 
                  type="checkbox" 
                  :id="'name-' + name"
                  :checked="activeFilters.name.includes(name)"
                  @change="toggleFilter('name', name)"
                >
                <label class="form-check-label" :for="'name-' + name">
                  {{ name }}
                </label>
              </div>
            </div>
          </div>
          
          <!-- Enhanced PIN Filter -->
          
          
          <!-- Circle Filter -->
          <div class="col-md-3">
            <label class="form-label">Circle</label>
            <div class="filter-options">
              <div v-for="circle in filterOptions.circle" :key="'circle-' + circle" class="form-check">
                <input 
                  class="form-check-input" 
                  type="checkbox" 
                  :id="'circle-' + circle"
                  :checked="activeFilters.circle.includes(circle)"
                  @change="toggleFilter('circle', circle)"
                >
                <label class="form-check-label" :for="'circle-' + circle">
                  {{ circle }}
                </label>
              </div>
            </div>
          </div>
          
          <!-- Filter Actions -->
          <div class="col-12 mt-2">
            <button class="btn btn-sm btn-outline-secondary" @click="clearFilters">
              <i class="bx bx-x"></i> Clear All Filters
            </button>
            <span class="ms-2 text-muted">
              Showing {{ filteredProperties.length }} of {{ properties.length }} properties
            </span>
          </div>
        </div>
      </div>
      
      <!-- Table with Horizontal Scrolling -->
      <div class="position-relative">
        <button 
          class="scroll-button left" 
          @click="scrollLeft"
          :disabled="loading"
        >
          <i class="bx bx-chevron-left"></i>
        </button>
        
        <div 
          class="table-container" 
          ref="tableContainer"
          @mousedown="startDrag"
          @mousemove="duringDrag"
          @mouseup="endDrag"
          @mouseleave="endDrag"
        >
          <table class="reportTable">
            <thead>
              <tr>
                <th>Date</th>
                <th>Username</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Circle</th>
                <th>PIN</th>
                <th>Info</th>
                <th>Floors</th>
                <th>Basement</th>
                <th>Store Front</th>
                <th>Land Area</th>
                <th>Covered Area</th>
                <th>Land Type</th>
                <th>Other Info</th>
                <th>Comments</th>
                <th>Location</th>
                <th>Capture Time</th>
                <th>Submit Time</th>
                <th>Re Submission</th>
                <th>Image</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="property in paginatedProperties" :key="property.id">
                <td>{{ extractDate(property.submission_time) }}</td>
                <td>{{ property.username }}</td>
                <td>{{ property.user_name }}</td>
                <td>{{ property.user_phone }}</td>
                <td>{{ property.circle }}</td>
                <td>{{ property.pin }}</td>
                <td>{{ property.info }}</td>
                <td>{{ property.floors_num }}</td>
                <td>{{ property.basement ? 'Yes' : 'No' }}</td>
                <td>{{ property.Store_front ? 'Yes' : 'No' }}</td>
                <td>{{ property.picture2_path ? 'Yes' : 'No' }}</td>
                <td>{{ property.land_area }}</td>
                <td>{{ property.covered_area }}</td>
                <td>{{ property.land }}</td>
                <td>{{ property.other || 'None' }}</td>
                <td>{{ property.comments || 'None' }}</td>
                <td class="coordinates-cell" @click="openGoogleMaps(property.latitude, property.longitude)">
                  {{ property.latitude }}, {{ property.longitude }}
                </td>
                <td>{{ property.capture_time || 'None' }}</td>
                <td>{{ property.submission_time || 'None' }}</td>
                <td>{{ property.resubmission || 'No' }}</td>
                <td>
                  <div v-if="property.picture_path || property.picture2_path" class="d-flex flex-column gap-1">
                    <img 
                      v-if="property.picture_path" 
                      :src="baseURL + '/storage/' + property.picture_path" 
                      class="property-thumbnail pointer"
                      @click="selectedProperty = property"
                      data-bs-toggle="modal" 
                      data-bs-target="#propertyImageModal"
                    >
                    <img 
                      v-if="property.picture2_path" 
                      :src="baseURL + '/storage/' + property.picture2_path" 
                      class="property-thumbnail pointer"
                      @click="selectedProperty = property"
                      data-bs-toggle="modal" 
                      data-bs-target="#propertyImageModal"
                    >
                  </div>
                  <span v-else>No Image</span>
                </td>
                <td class="d-flex justify-content-center gap-2">
  <!-- Download Button -->
  <button 
    v-if="property.picture_path"
    class="btn btn-sm btn-outline-primary"
    @click="downloadImage(baseURL + '/storage/' + property.picture_path, property.pin)"
  >
    <i class="bx bx-download"></i>
  </button>
  <button 
    v-if="property.picture2_path"
    class="btn btn-sm btn-outline-primary"
    @click="downloadImage(baseURL + '/storage/' + property.picture2_path, property.pin, '_2')"
  >
    <i class="bx bx-download"></i>
  </button>

  <!-- Renew Button -->
  <button 
    v-if="property.picture_path"
    class="btn btn-sm btn-outline-success"
    @click="renewImage(property.username, property.circle, property.pin)" 
  >
    <i class="bx bx-refresh"></i>
  </button>
</td>

              </tr>
              <tr v-if="paginatedProperties.length === 0">
                <td colspan="19" class="text-center py-4 text-muted">
                  No properties found matching your filters
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <button 
          class="scroll-button right" 
          @click="scrollRight"
          :disabled="loading"
        >
          <i class="bx bx-chevron-right"></i>
        </button>
      </div>
      
      <!-- Pagination controls -->
      <div class="d-flex justify-content-between align-items-center mt-3">
        <div class="text-muted">
          Showing {{ ((currentPage - 1) * itemsPerPage) + 1 }} to 
          {{ Math.min(currentPage * itemsPerPage, totalItems) }} of 
          {{ totalItems }} properties
        </div>
        <nav aria-label="Page navigation" style="overflow-x: auto; max-width: 100%;">
          <ul class="pagination mb-0" style="flex-wrap: nowrap; white-space: nowrap;">
            <li class="page-item" :class="{ 'disabled': currentPage === 1 }">
              <a class="page-link" href="#" @click.prevent="previousPage">
                <i class="bx bx-chevron-left"></i>
              </a>
            </li>
            
            <!-- Show page numbers with ellipsis for large page counts -->
            <template v-if="totalPages <= 7">
              <li class="page-item" v-for="pageNumber in totalPages" :key="pageNumber" 
                  :class="{ 'active': currentPage === pageNumber }">
                <a class="page-link" href="#" @click.prevent="setCurrentPage(pageNumber)">
                  {{ pageNumber }}
                </a>
              </li>
            </template>
            
            <template v-else>
              <!-- First page -->
              <li class="page-item" :class="{ 'active': currentPage === 1 }">
                <a class="page-link" href="#" @click.prevent="setCurrentPage(1)">1</a>
              </li>
              
              <!-- Ellipsis if current page is far from start -->
              <li v-if="currentPage > 4" class="page-item disabled">
                <span class="page-link">...</span>
              </li>
              
              <!-- Pages around current page -->
              <li v-for="pageNumber in getPaginationRange()" :key="pageNumber"
                  class="page-item" :class="{ 'active': currentPage === pageNumber }">
                <a class="page-link" href="#" @click.prevent="setCurrentPage(pageNumber)">
                  {{ pageNumber }}
                </a>
              </li>
              
              <!-- Ellipsis if current page is far from end -->
              <li v-if="currentPage < totalPages - 3" class="page-item disabled">
                <span class="page-link">...</span>
              </li>
              
              <!-- Last page -->
              <li class="page-item" :class="{ 'active': currentPage === totalPages }">
                <a class="page-link" href="#" @click.prevent="setCurrentPage(totalPages)">{{ totalPages }}</a>
              </li>
            </template>
            
            <li class="page-item" :class="{ 'disabled': currentPage === totalPages }">
              <a class="page-link" href="#" @click.prevent="nextPage">
                <i class="bx bx-chevron-right"></i>
              </a>
            </li>
          </ul>
        </nav>
    </div>
  </div>
  </div>

  <!-- Property Image Modal -->
  <div class="modal fade" id="propertyImageModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Property Image - {{ selectedProperty?.pin }}</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body text-center">
          <div v-if="selectedProperty?.picture_path || selectedProperty?.picture2_path" class="d-flex flex-column gap-3">
            <img 
              v-if="selectedProperty?.picture_path" 
              :src="baseURL + '/storage/' + selectedProperty.picture_path" 
              class="img-fluid modal-image"
            >
            <img 
              v-if="selectedProperty?.picture2_path" 
              :src="baseURL + '/storage/' + selectedProperty.picture2_path" 
              class="img-fluid modal-image"
            >
          </div>
          <div v-else class="text-center py-5">
            No Image Available
          </div>
        </div>
        <div class="modal-footer">
          <button 
            v-if="selectedProperty?.picture_path"
            class="btn btn-primary"
            @click="downloadImage(baseURL + '/storage/' + selectedProperty.picture_path, selectedProperty.pin, '_1')"
          >
            <i class='bx bx-download me-2'></i>Download Image
          </button>
          <button 
            v-if="selectedProperty?.picture2_path"
            class="btn btn-primary"
            @click="downloadImage(baseURL + '/storage/' + selectedProperty.picture2_path, selectedProperty.pin, '_2')"
          >
            <i class='bx bx-download me-2'></i>Download Image 2
          </button>
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  transition: margin-left 0.3s;
}

.pageHeading p {
  font-size: 1.5rem;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 0;
}

.filter-controls {
  background-color: white;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
}

.filter-panel {
  border: 1px solid #dee2e6;
  max-height: 300px;
  overflow-y: auto;
}

.filter-options {
  max-height: 200px;
  overflow-y: auto;
  padding: 5px;
  border: 1px solid #eee;
  border-radius: 4px;
  background: white;
}

.form-check {
  margin-bottom: 0.3rem;
  padding-left: 1.5em;
}

.form-check-input {
  margin-top: 0.2em;
}

.form-check-label {
  font-size: 0.9rem;
}

.table-container {
  width: 100%;
  overflow-x: auto;
  white-space: nowrap;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
  margin: 0 10px;
  cursor: default;
  scrollbar-width: thin;
}

.table-container::-webkit-scrollbar {
  display: block;
  height: 8px;
}

.table-container::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 4px;
}

.table-container::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.reportTable {
  width: 100%;
  border-collapse: collapse;
  min-width: 1200px;
}

.reportTable th, .reportTable td {
  padding: 12px;
  border: 1px solid #dee2e6;
  vertical-align: middle;
  white-space: nowrap;
}

.reportTable th {
  background-color: #f8f9fa;
  font-weight: 600;
  position: sticky;
  top: 0;
}

.property-thumbnail {
  width: 80px;
  height: 60px;
  object-fit: cover;
  border-radius: 4px;
  cursor: pointer;
}

.property-thumbnail:hover {
  opacity: 0.8;
}

.scroll-button {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: white;
  border: 1px solid #dee2e6;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}

.scroll-button:hover {
  background: #f8f9fa;
}

.scroll-button.left {
  left: 0;
}

.scroll-button.right {
  right: 0;
}

.scroll-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.modal-image {
  max-height: 70vh;
  max-width: 100%;
  object-fit: contain;
}

.coordinates-cell {
  cursor: pointer;
  color: #007bff;
  text-decoration: underline;
}

.coordinates-cell:hover {
  color: #000000;
  text-decoration: none;
}

.btn-outline-primary {
  padding: 0.25rem 0.5rem;
}

.pagination .page-item.active .page-link {
  background-color: #0d6efd;
  border-color: #030303;
}

.pagination .page-link {
  color: #090909;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
}

/* Add these styles to your existing CSS */
.pin-search-results {
  z-index: 1050; /* Higher than other elements */
}

.hover-bg:hover {
  background-color: #f8f9fa;
}

.cursor-pointer {
  cursor: pointer;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .main-content {
    padding: 1rem;
  }
  
  .filter-panel .col-md-3 {
    margin-bottom: 1rem;
  }
  
  .filter-options {
    max-height: 150px;
  }
  
  .d-flex.justify-content-between {
    flex-direction: column;
    gap: 1rem;
  }
  
  .table-container {
    margin: 0 30px;
  }
  
  .scroll-button {
    width: 30px;
    height: 30px;
  }
  
  .reportTable th, .reportTable td {
    padding: 8px;
    font-size: 0.8rem;
  }
}
</style>
