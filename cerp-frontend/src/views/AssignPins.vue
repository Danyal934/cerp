<script setup>
import { ref, onMounted } from 'vue';
import { provideGlobals } from "../globals.js";

const baseURL = provideGlobals.getBaseUrl();
const users = ref([]);
const loading = ref(false);
const selectedUser = ref(null);
const userCircles = ref([]);
const existingCircles = ref([]);
const apiMessage = ref('');
const error = ref(null);

// Fetch users
const fetchUsers = async () => {
  try {
    loading.value = true;
    error.value = null;
    const response = await fetch(`${baseURL}/api/mobile/users`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    users.value = data.users || [];
  } catch (err) {
    console.error(err);
    error.value = "Error loading users: Please try again later. Rate limit may have been exceeded.";
  } finally {
    loading.value = false;
  }
};

// Fetch user circles and existing assignments
const fetchUserCircles = async (username) => {
  try {
    loading.value = true;
    error.value = null;
    selectedUser.value = username;
    apiMessage.value = '';

    // Fetch all circles available for user
    const resCircles = await fetch(`${baseURL}/api/circles/${username}`);
    const dataCircles = await resCircles.json();
    userCircles.value = (dataCircles.circles || []).map(c => c.trim());

    // Fetch assigned circles
    const resExisting = await fetch(`${baseURL}/api/circles-assigned-to-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    });
    const dataExisting = await resExisting.json();
    existingCircles.value = (dataExisting.circles || []).map(c => c.trim().toLowerCase());

    showCirclesModal.value = true;
  } catch (err) {
    console.error(err);
    apiMessage.value = "Error loading circles";
  } finally {
    loading.value = false;
  }
};

// Check if circle is already assigned
const isExisting = (circle) => {
  return existingCircles.value.includes(circle.trim().toLowerCase());
};

// Add new circle assignment
const addNewCircle = async (circle) => {
  try {
    loading.value = true;
    const res = await fetch(`${baseURL}/api/store-circle-pins`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: selectedUser.value, circle }),
    });
    const data = await res.json();
    apiMessage.value = data.message || 'Circle added successfully';
    await fetchUserCircles(selectedUser.value); // Refresh data
  } catch (err) {
    console.error(err);
    apiMessage.value = "Failed to add circle";
  } finally {
    loading.value = false;
  }
};

// Update (replace) circle assignment
const updateCircle = async (circle) => {
  try {
    loading.value = true;
    const res = await fetch(`${baseURL}/api/replace-circle-pins`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: selectedUser.value, circle }),
    });
    const data = await res.json();
    apiMessage.value = data.message || 'Circle updated successfully';
    await fetchUserCircles(selectedUser.value); // Refresh data
  } catch (err) {
    console.error(err);
    apiMessage.value = "Failed to update circle";
  } finally {
    loading.value = false;
  }
};

// Delete circle assignment
const deleteCircleAssignment = async (circle) => {
  if (!confirm(`Are you sure you want to remove ${circle} from ${selectedUser.value}?`)) return;
  
  try {
    loading.value = true;
    const response = await fetch(`${baseURL}/api/delete-circle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        username: selectedUser.value, 
        circle 
      }),
    });
    
    const data = await response.json();
    if (data.success) {
      apiMessage.value = `Circle ${circle} removed successfully`;
      await fetchUserCircles(selectedUser.value); // Refresh data
    } else {
      apiMessage.value = data.message || 'Failed to remove circle';
    }
  } catch (err) {
    console.error(err);
    apiMessage.value = "Error removing circle assignment";
  } finally {
    loading.value = false;
  }
};

onMounted(fetchUsers);
</script>

<template>
  <div class="container-fluid px-0">
    <div class="pageHeading pt-2 mb-md-4 mb-3">
      <p>Assign Pins to Circles</p>
    </div>

    <div v-if="error" class="alert alert-danger mb-4 d-flex justify-content-between align-items-center">
      <span><i class='bx bx-error-circle me-2'></i>{{ error }}</span>
      <button class="btn btn-sm btn-outline-danger" @click="fetchUsers">Retry</button>
    </div>

    <div class="card p-4 border rounded-3 mb-4 shadow-sm">
      <div v-if="loading && !users.length" class="text-center my-3">
        <div class="spinner-border text-primary" role="status"></div>
        <p class="mt-2 text-muted">Loading user data...</p>
      </div>

      <div class="table-responsive">
        <table class="table mt-2">
        <thead>
          <tr>
            <th>Username</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.id">
            <td>{{ user.username }}</td>
            <td>
              <button 
                class="btn btn-sm btn-primary" 
                @click="fetchUserCircles(user.username)"
              >
                Manage Circles
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      </div>
    </div>

      <!-- Circles Management Modal -->
      <div v-if="showCirclesModal" class="modal-overlay">
        <div class="modal-content">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h5>Manage Circles for {{ selectedUser }}</h5>
            <button class="btn btn-close" @click="showCirclesModal = false"></button>
          </div>

          <div v-if="apiMessage" class="alert" :class="{
            'alert-success': apiMessage.includes('success'),
            'alert-danger': apiMessage.includes('Failed') || apiMessage.includes('Error'),
            'alert-info': !apiMessage.includes('success') && !apiMessage.includes('Failed') && !apiMessage.includes('Error')
          }">
            {{ apiMessage }}
          </div>

          <div class="row">
            <div class="col-md-4 mb-3" v-for="circle in userCircles" :key="circle">
              <div class="border p-3 rounded bg-light position-relative">
                <strong>{{ circle }}</strong>
                <div class="mt-2 d-flex flex-wrap gap-2">
                  <template v-if="!isExisting(circle)">
                    <button 
                      class="btn btn-success btn-sm" 
                      @click="addNewCircle(circle)"
                    >
                      Add New
                    </button>
                  </template>
                  <template v-else>
                    <button 
                      class="btn btn-warning btn-sm" 
                      @click="updateCircle(circle)"
                    >
                      Overwrite
                    </button>
                    <button 
                      class="btn btn-info btn-sm" 
                      @click="addNewCircle(circle)"
                    >
                      Add All
                    </button>
                    <button 
                      class="btn btn-danger btn-sm" 
                      @click="deleteCircleAssignment(circle)"
                    >
                      unassign
                    </button>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
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
  width: 80%;
  max-width: 1000px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 25px rgba(0,0,0,0.2);
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
}

.alert {
  padding: 0.75rem 1.25rem;
  margin-bottom: 1rem;
  border: 1px solid transparent;
  border-radius: 0.25rem;
}

.alert-success {
  color: #155724;
  background-color: #d4edda;
  border-color: #c3e6cb;
}

.alert-danger {
  color: #721c24;
  background-color: #f8d7da;
  border-color: #f5c6cb;
}

.alert-info {
  color: #0c5460;
  background-color: #d1ecf1;
  border-color: #bee5eb;
}

.gap-2 {
  gap: 0.5rem;
}

@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    padding: 1rem;
  }
  
  .col-md-4 {
    width: 100%;
  }
}
</style>