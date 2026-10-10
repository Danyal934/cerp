<script setup>
import { ref, onMounted } from 'vue';
import { provideGlobals } from "../globals.js";

const baseURL = provideGlobals.getBaseUrl();
const users = ref([]);
const loading = ref(false);
const loadingPins = ref(false);
const selectedUser = ref(null);
const selectedCircle = ref(null);
const pins = ref([]);
const showPinsModal = ref(false);
const showAssignModal = ref(false);
const targetUser = ref('');

// Pagination state for pins
const pinsPage = ref(1);
const pinsPerPage = ref(10);
const pinsTotal = ref(0);
const pinsLastPage = ref(1);

// Fetch users
const fetchUsers = async () => {
  try {
    loading.value = true;
    const response = await fetch(`${baseURL}/api/mobile/users`);
    const data = await response.json();
    
    // Set users immediately without fetching circles
    users.value = data.users.map(user => ({ ...user, circles: [], loadingCircles: false }));
    
  } catch (err) {
    console.error(err);
    alert("Error loading users");
  } finally {
    loading.value = false;
  }
};

// Fetch circles for a specific user
const fetchUserCircles = async (user) => {
  const globalIndex = users.value.findIndex(u => u.username === user.username);
  if (globalIndex === -1) return;

  try {
    users.value[globalIndex].loadingCircles = true;
    const res = await fetch(`${baseURL}/api/circles-assigned-to-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: user.username }),
    });
    const circleData = await res.json();
    users.value[globalIndex].circles = circleData.circles || [];
  } catch (err) {
    console.error(`Error fetching circles for user ${user.username}:`, err);
    alert(`Error fetching circles for ${user.username}`);
  } finally {
    users.value[globalIndex].loadingCircles = false;
  }
};

// Fetch pins for a user's circle with pagination
const fetchPins = async (username, circle, page = 1) => {
  try {
    // Open modal immediately and show loader inside
    selectedUser.value = username;
    selectedCircle.value = circle;
    pinsPage.value = page;
    showPinsModal.value = true;
    showAssignModal.value = false;
    loadingPins.value = true;
    
    const response = await fetch(`${baseURL}/api/pins-by-circle/v2`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        username,
        circle,
        page: pinsPage.value,
        per_page: pinsPerPage.value
      }),
    });
    
    const data = await response.json();
    pins.value = data.pins || [];
    pinsTotal.value = data.count || 0;
    pinsLastPage.value = Math.ceil(pinsTotal.value / pinsPerPage.value);
  } catch (err) {
    console.error(err);
    alert("Error loading pins");
  } finally {
    loadingPins.value = false;
  }
};

const changePinsPage = (page) => {
  if (page < 1 || page > pinsLastPage.value) return;
  fetchPins(selectedUser.value, selectedCircle.value, page);
};

// Assign pins to another user
const assignPinsToUser = async () => {
  if (!targetUser.value) {
    alert('Please select a target user');
    return;
  }
  
  if (!confirm(`Are you sure you want to transfer all pins from ${selectedUser.value} (${selectedCircle.value}) to ${targetUser.value}?`)) {
    return;
  }
  
  try {
    loading.value = true;
    const response = await fetch(`${baseURL}/api/transfer-pins`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        source_user: selectedUser.value,
        target_user: targetUser.value,
        circle: selectedCircle.value
      }),
    });
    
    const data = await response.json();
    if (data.success) {
      alert('Pins transferred successfully!');
      showAssignModal.value = false;
      targetUser.value = '';
      // Refresh the pins list to page 1
      await fetchPins(selectedUser.value, selectedCircle.value, 1);
    } else {
      alert(data.message || 'Failed to transfer pins');
    }
  } catch (err) {
    console.error(err);
    alert("Error transferring pins");
  } finally {
    loading.value = false;
  }
};

onMounted(fetchUsers);
</script>

<template>
  <div class="circle-container p-5">
      <h3>User Circles</h3>

      <div v-if="loading" class="text-center mt-3">Loading...</div>

      <table class="table mt-4">
        <thead>
          <tr>
            <th>Username</th>
            <th>Assigned Circles</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.id">
            <td>{{ user.username }}</td>
            <td>
              <div v-if="user.circles && user.circles.length" class="circle-badge-group">
                <div class="circle-badge-item" v-for="circle in user.circles" :key="circle">
                  <span class="circle-badge-label" @click="fetchPins(user.username, circle)">
                    {{ circle }}
                  </span>
                </div>
              </div>
              <div v-else-if="user.loadingCircles" class="text-muted">
                <span class="spinner-border spinner-border-sm me-1"></span> Loading circles...
              </div>
              <div v-else>
                <button class="btn btn-sm btn-outline-primary" @click="fetchUserCircles(user)">
                  View Circles
                </button>
              </div>
            </td>
            <td>
              <button 
                v-if="user.circles && user.circles.length"
                class="btn btn-sm btn-primary"
                @click="fetchPins(user.username, user.circles[0])"
              >
                View Pins
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Modal for Pins -->
      <div v-if="showPinsModal" class="modal-overlay">
        <div class="modal-content">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h5>Pins for {{ selectedUser }} - {{ selectedCircle }}</h5>
            <div>
              <button 
                class="btn btn-primary me-2" 
                @click="showAssignModal = true"
              >
                Transfer to Another User
              </button>
              <button class="btn btn-close" @click="showPinsModal = false"></button>
            </div>
          </div>

          <!-- Transfer Pins Modal -->
          <div v-if="showAssignModal" class="card mb-4">
            <div class="card-header bg-primary text-white">
              <h6>Transfer Pins to Another User</h6>
            </div>
            <div class="card-body">
              <div class="mb-3">
                <label class="form-label">Select Target User</label>
                <select v-model="targetUser" class="form-select">
                  <option value="">Select a user</option>
                  <option 
                    v-for="user in users.filter(u => u.username !== selectedUser)" 
                    :key="user.username" 
                    :value="user.username"
                  >
                    {{ user.username }}
                  </option>
                </select>
              </div>
              <div class="d-flex justify-content-end">
                <button 
                  class="btn btn-success me-2" 
                  @click="assignPinsToUser"
                  :disabled="!targetUser || loading"
                >
                  <span v-if="loading" class="spinner-border spinner-border-sm"></span>
                  Transfer Pins
                </button>
                <button 
                  class="btn btn-secondary" 
                  @click="showAssignModal = false"
                  :disabled="loading"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>

          <!-- Pins Table -->
          <div v-if="loadingPins" class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-2 text-muted">Loading pins data...</p>
          </div>

          <div v-else class="table-responsive">
            <table class="table table-striped">
              <thead>
                <tr>
                  <th>Pin</th>
                  <th>Rating Area</th>
                  <th>Locality</th>
                  <th>Address</th>
                  <th>Owner</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="pin in pins" :key="pin.id">
                  <td>{{ pin.pin }}</td>
                  <td>{{ pin.ratingarea }}</td>
                  <td>{{ pin.Locality }}</td>
                  <td>{{ pin.Street_Address }}</td>
                  <td>{{ pin.OwnerName }}</td>
                  <td>
                    <span :class="{'badge bg-success': pin.status == 1, 'badge bg-secondary': pin.status == 0}">
                      {{ pin.status == 1 ? 'USED' : 'NotUsed' }}
                    </span>
                  </td>
                </tr>
                <tr v-if="pins.length === 0">
                  <td colspan="6" class="text-center text-muted">No pins found</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination Controls -->
          <div v-if="!loadingPins && pinsTotal > 0" class="d-flex justify-content-between align-items-center mt-3">
            <div class="text-muted">
              Showing {{ (pinsPage - 1) * pinsPerPage + 1 }} to 
              {{ Math.min(pinsPage * pinsPerPage, pinsTotal) }} of 
              {{ pinsTotal }} pins
            </div>
            <nav aria-label="Pins pagination">
              <ul class="pagination mb-0">
                <li class="page-item" :class="{ 'disabled': pinsPage === 1 }">
                  <a class="page-link" href="#" @click.prevent="changePinsPage(pinsPage - 1)">
                    <i class='bx bx-chevron-left'></i> Previous
                  </a>
                </li>
                <li class="page-item" v-for="p in pinsLastPage" :key="p" 
                    :class="{ 'active': pinsPage === p }">
                  <a class="page-link" href="#" @click.prevent="changePinsPage(p)">
                    {{ p }}
                  </a>
                </li>
                <li class="page-item" :class="{ 'disabled': pinsPage === pinsLastPage }">
                  <a class="page-link" href="#" @click.prevent="changePinsPage(pinsPage + 1)">
                    Next <i class='bx bx-chevron-right'></i>
                  </a>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>
  </div>
</template>

<style scoped>
/* Enhanced Circle Badge Styles */
.circle-badge-group {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.circle-badge-item {
  display: inline-flex;
  align-items: center;
  background: #f8f9fa;
  border-radius: 24px;
  padding: 6px 12px 6px 16px;
  margin: 4px 0;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  border: 1px solid #e9ecef;
}

.circle-badge-item:hover {
  background: #e9ecef;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.circle-badge-label {
  font-size: 0.9rem;
  font-weight: 500;
  color: #2c3e50;
  cursor: pointer;
  padding-right: 8px;
}

.circle-badge-remove {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #f8f9fa;
  color: #dc3545;
  border: 1px solid #dc3545;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  font-size: 12px;
  font-weight: bold;
  transition: all 0.2s ease;
  margin-left: 4px;
}

.circle-badge-remove:hover {
  background: #dc3545;
  color: white;
  transform: scale(1.1);
}

/* Enhanced Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
  backdrop-filter: blur(3px);
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  width: 90%;
  max-width: 1200px;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: 0 10px 25px rgba(0,0,0,0.2);
  animation: modalFadeIn 0.3s ease;
}

@keyframes modalFadeIn {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Enhanced Table Styles */
.table {
  --bs-table-bg: transparent;
  --bs-table-striped-bg: rgba(67, 97, 238, 0.03);
  --bs-table-hover-bg: rgba(67, 97, 238, 0.05);
  border-collapse: separate;
  border-spacing: 0 8px;
}

.table thead th {
  background-color: #f8f9fa;
  color: #495057;
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.8rem;
  letter-spacing: 0.5px;
  border-bottom: 2px solid #dee2e6;
  padding: 12px 16px;
}

.table tbody tr {
  background-color: white;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.table tbody tr:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.table td {
  padding: 12px 16px;
  vertical-align: middle;
  border-top: none;
}

/* Enhanced Button Styles */
.btn {
  border-radius: 8px;
  padding: 8px 16px;
  font-weight: 500;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.btn-primary {
  background-color: #4361ee;
  border-color: #4361ee;
}

.btn-primary:hover {
  background-color: #3a56d4;
  border-color: #3a56d4;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(67, 97, 238, 0.2);
}

.btn-danger {
  background-color: #ef233c;
  border-color: #ef233c;
}

.btn-danger:hover {
  background-color: #d90429;
  border-color: #d90429;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(239, 35, 60, 0.2);
}

/* Responsive Adjustments */
@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    padding: 1.5rem;
  }
  
  .circle-badge-item {
    padding: 5px 10px 5px 14px;
  }
  
  .circle-badge-label {
    font-size: 0.85rem;
  }
  
  .circle-badge-remove {
    width: 20px;
    height: 20px;
    font-size: 11px;
  }
  
  .table thead {
    display: none;
  }
  
  .table tbody tr {
    display: block;
    margin-bottom: 16px;
    border-radius: 8px;
  }
  
  .table td {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    border-bottom: 1px solid #eee;
  }
  
  .table td::before {
    content: attr(data-label);
    font-weight: 600;
    margin-right: 12px;
    color: #6c757d;
  }
}
</style>