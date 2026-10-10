<script setup>
import { ref, onMounted } from 'vue';
import { provideGlobals } from "../globals.js";

// Reactive state
const baseURL = provideGlobals.getBaseUrl();
const userCount = ref(0);
const surveyedCount = ref(0);
const remainingCount = ref(0);
const final = ref(0);
const isLoading = ref(true);
const error = ref(null);

// API endpoints
const API_ENDPOINTS = {
  users: baseURL + '/api/mobileusers',
  surveyed: baseURL + '/api/noreports',
  remaining: baseURL + '/api/totalrecord'
};


// Simple fetch function for plain integer responses
const fetchCountData = async (endpoint) => {
  try {
    const response = await fetch(endpoint);
    if (!response.ok) throw new Error('Network response was not ok');
    const text = await response.text();
    return parseInt(text, 10) || 0;
  } catch (err) {
    console.error(`Error fetching ${endpoint}:`, err);
    return 0; // Return 0 if there's an error
  }
};

// Fetch all data
const fetchDashboardData = async () => {
  try {
    isLoading.value = true;
    error.value = null;
    
    const [users, surveyed, remaining] = await Promise.all([
      fetchCountData(API_ENDPOINTS.users),
      fetchCountData(API_ENDPOINTS.surveyed),
      fetchCountData(API_ENDPOINTS.remaining)
    ]);
    
  userCount.value = users;
  surveyedCount.value = surveyed;
  remainingCount.value = remaining;

  final.value = remainingCount.value - surveyedCount.value;

    
  } catch (err) {
    error.value = 'Failed to load dashboard data';
    console.error('Dashboard error:', err);
  } finally {
    isLoading.value = false;
  }
};

onMounted(fetchDashboardData);
</script>

<template>
  <div>
    <div class="pageHeading pt-2 mb-md-4 mb-3">
        <p>Dashboard</p>
      </div>

      <div v-if="error" class="alert alert-danger">
        {{ error }}
      </div>

      <div v-if="isLoading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>

      <div v-else class="dashboard-grid">
        <div class="row g-4">
          <!-- Active Users Card -->
          <div class="col-xl-3 col-lg-6 col-md-6 col-12">
            <div class="stat-card p-4 h-100">
              <div class="d-flex align-items-center justify-content-between mb-3">
                <div class="icon-wrapper bg-primary-light">
                  <i class="bx bx-group text-primary"></i>
                </div>
                <span class="badge bg-success-light text-success">+{{ userCount > 0 ? 'Active' : '0' }}</span>
              </div>
              <h6 class="text-muted mb-2">Active Users</h6>
              <h2 class="display-6 fw-bold mb-0">{{ userCount }}</h2>
            </div>
          </div>

          <!-- Surveyed Units Card -->
          <div class="col-xl-3 col-lg-6 col-md-6 col-12">
            <div class="stat-card p-4 h-100">
              <div class="d-flex align-items-center justify-content-between mb-3">
                <div class="icon-wrapper bg-success-light">
                  <i class="bx bx-check-double text-success"></i>
                </div>
              </div>
              <h6 class="text-muted mb-2">Surveyed Units</h6>
              <h2 class="display-6 fw-bold mb-0">{{ surveyedCount }}</h2>
            </div>
          </div>

          <!-- Remaining Units Card -->
          <div class="col-xl-3 col-lg-6 col-md-6 col-12">
            <div class="stat-card p-4 h-100">
              <div class="d-flex align-items-center justify-content-between mb-3">
                <div class="icon-wrapper bg-warning-light">
                  <i class="bx bx-time-five text-warning"></i>
                </div>
              </div>
              <h6 class="text-muted mb-2">Remaining Units</h6>
              <h2 class="display-6 fw-bold mb-0">{{ final }}</h2>
            </div>
          </div>

          <!-- Total Units Card -->
          <div class="col-xl-3 col-lg-6 col-md-6 col-12">
            <div class="stat-card p-4 h-100">
              <div class="d-flex align-items-center justify-content-between mb-3">
                <div class="icon-wrapper bg-info-light">
                  <i class="bx bx-stats text-info"></i>
                </div>
              </div>
              <h6 class="text-muted mb-2">Total Units</h6>
              <h2 class="display-6 fw-bold mb-0">{{ remainingCount }}</h2>
            </div>
          </div>
        </div>
      </div>
  </div>
</template>


<style scoped>
.dashboard-grid {
  padding: 1rem 0;
}

.stat-card {
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  border-color: #3b82f6;
}

.icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.bg-primary-light { background-color: rgba(59, 130, 246, 0.1); }
.bg-success-light { background-color: rgba(16, 185, 129, 0.1); }
.bg-warning-light { background-color: rgba(245, 158, 11, 0.1); }
.bg-info-light { background-color: rgba(6, 182, 212, 0.1); }

.badge {
  padding: 0.5em 0.75em;
  font-weight: 500;
  border-radius: 8px;
}

@media (max-width: 576px) {
  .stat-card {
    padding: 1.5rem !important;
  }
  .display-6 {
    font-size: 2rem;
  }
}
</style>
