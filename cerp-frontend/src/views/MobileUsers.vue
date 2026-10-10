<script setup> 
 import { ref, reactive, computed, onMounted } from 'vue'; 
 import { provideGlobals } from "../globals.js"; 
 
 let baseURL = provideGlobals.getBaseUrl(); 
 
 const users = ref([]); 
 const loading = ref(false); 
 const error = ref(null); 
 const showCreateUserModal = ref(false); 
 
 // Pagination State 
 const itemsPerPage = 20; 
 const currentPage = ref(1); 
 const totalPages = ref(1); 
 const totalItems = ref(0); 
 
 const newUser = reactive({ 
   username: '', 
   email: '', 
   password: '', 
   cnic: '', 
   name: '', 
   phonenumber:'', 
   designation: 'Surveyor', 
   status: true 
 }); 
 
 // UPDATED: Fetch users with server-side pagination 
 const fetchUsers = async (page = 1) => { 
   try { 
     loading.value = true; 
     error.value = null; 
     const response = await fetch(`${baseURL}/api/mobile/users?page=${page}&per_page=${itemsPerPage}`); 
     const data = await response.json(); 
     
     users.value = data.users || []; 
     currentPage.value = data.current_page || 1; 
     totalPages.value = data.last_page || 1; 
     totalItems.value = data.total || 0; 
   } catch (err) { 
     console.error('Error fetching users:', err); 
     error.value = 'Failed to load user data. Please try again.'; 
   } finally { 
     loading.value = false; 
   } 
 }; 
 
 const designationOptions = ['Surveyor', 'Supervisor']; 
 
 // Create new user (refresh current page on success) 
 const createUser = async () => { 
   try { 
     loading.value = true; 
     const response = await fetch(baseURL+'/api/mobile/signup', { 
       method: 'POST', 
       headers: { 'Content-Type': 'application/json' }, 
       body: JSON.stringify(newUser) 
     }); 
 
     const result = await response.json(); 
     if (!response.ok) throw new Error(result.message || 'Failed to create user'); 
 
     Object.keys(newUser).forEach(key => { if (key !== 'designation') newUser[key] = ''; }); 
     newUser.designation = 'Surveyor'; 
     newUser.status = true; 
     showCreateUserModal.value = false; 
     await fetchUsers(currentPage.value); 
     alert('User created successfully!'); 
   } catch (error) { 
     alert(error.message || 'Failed to create user'); 
   } finally { 
     loading.value = false; 
   } 
 }; 
 
 // Block/unblock user 
 const blockUser = async (userId, status) => { 
   try { 
     if (!confirm(`Are you sure?`)) return; 
     loading.value = true; 
     const response = await fetch(baseURL+'/api/change-user-status', { 
       method: 'POST', 
       headers: { 'Content-Type': 'application/json' }, 
       body: JSON.stringify({ user_id: userId, status: status }) 
     }); 
     if (!response.ok) throw new Error('Failed to update status'); 
     await fetchUsers(currentPage.value); 
   } catch (error) { 
     alert(error.message); 
   } finally { 
     loading.value = false; 
   } 
 }; 
 
 const formatDate = (dateString) => { 
   return new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }); 
 }; 
 
 // Pagination Logic 
 const previousPage = () => { if (currentPage.value > 1) fetchUsers(currentPage.value - 1); }; 
 const nextPage = () => { if (currentPage.value < totalPages.value) fetchUsers(currentPage.value + 1); }; 
 const setCurrentPage = (page) => fetchUsers(page); 
 
 onMounted(() => fetchUsers(1)); 
 </script>


<template>
  <div class="container-fluid px-0">
        <div class="pageHeading pt-2 mb-md-4 mb-3 d-flex justify-content-between align-items-center">
          <p>Users Management</p>
          <button class="btn btn-primary" @click="showCreateUserModal = true">
            <i class='bx bx-plus'></i> Create New User
          </button>
        </div>

        <div v-if="error" class="alert alert-danger mb-4 d-flex justify-content-between align-items-center shadow-sm">
          <span><i class='bx bx-error-circle me-2'></i>{{ error }}</span>
          <button class="btn btn-sm btn-outline-danger" @click="fetchUsers">Retry</button>
        </div>
        
        <!-- Loading State -->
        <div v-if="loading && users.length === 0" class="text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="mt-2 text-muted">Fetching users...</p>
        </div>
        
        <!-- Content -->
        <div v-else>
          <!-- Active Users Section -->
          <div class="card mb-4">
            <div class="card-header bg-white border-bottom-0">
              <h5 class="mb-0 text-success">
                <i class='bx bx-user-check me-2'></i>Active Users
              </h5>
            </div>
            <div class="card-body p-0">
              <div class="table-responsive">
                <table class="table table-hover mb-0">
                  <thead class="table-light">
                    <tr>
                      <th>ID</th>
                      <th>Username</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>CNIC</th>
                      <th>Created At</th>
                      <th>Designation</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="user in users.filter(u => u.status)" :key="user.id">
                      <td>{{ user.id }}</td>
                      <td>{{ user.username }}</td>
                      <td>{{ user.name }}</td>
                      <td>{{ user.email }}</td>
                      <td>{{ user.phonenumber }}</td>
                      <td>{{ user.cnic }}</td>
                      <td>{{ formatDate(user.created_at) }}</td>
                      <td><span class="badge bg-primary">{{ user.designation }}</span></td>
                      <td><span class="badge bg-success">Active</span></td>
                      <td>
                        <div class="d-flex gap-2">
                          <button class="btn btn-sm btn-outline-danger" @click="blockUser(user.id, false)" title="Block">
                            <i class='bx bx-block'></i>
                          </button>
                           <!-- <button class="btn btn-sm btn-outline-secondary" @click="deleteUser(user.id)" title="Delete">
                            <i class='bx bx-trash'></i>
                          </button> -->
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Blocked Users Section -->
          <div class="card">
            <div class="card-header bg-white border-bottom-0">
              <h5 class="mb-0 text-danger">
                <i class='bx bx-user-x me-2'></i>Blocked Users
              </h5>
            </div>
            <div class="card-body p-0">
              <div class="table-responsive">
                <table class="table table-hover mb-0">
                  <thead class="table-light">
                    <tr>
                      <th>ID</th>
                      <th>Username</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>CNIC</th>
                      <th>Created At</th>
                      <th>Designation</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="user in users.filter(u => !u.status)" :key="user.id" class="bg-light-danger">
                      <td>{{ user.id }}</td>
                      <td>{{ user.username }}</td>
                      <td>{{ user.name }}</td>
                      <td>{{ user.email }}</td>
                      <td>{{ user.phonenumber }}</td>
                      <td>{{ user.cnic }}</td>
                      <td>{{ formatDate(user.created_at) }}</td>
                      <td><span class="badge bg-secondary">{{ user.designation }}</span></td>
                      <td><span class="badge bg-danger">Blocked</span></td>
                      <td>
                        <div class="d-flex gap-2">
                          <button class="btn btn-sm btn-outline-success" @click="blockUser(user.id, true)" title="Unblock">
                            <i class='bx bx-check-circle'></i>
                          </button>
                          <!-- <button class="btn btn-sm btn-outline-secondary" @click="deleteUser(user.id)" title="Delete">
                            <i class='bx bx-trash'></i>
                          </button> -->
                        </div>
                      </td>
                    </tr>
                    <tr v-if="!users.some(u => !u.status)">
                      <td colspan="10" class="text-center text-muted py-4">No blocked users found</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          <!-- Pagination -->
          <div class="d-flex justify-content-between align-items-center mt-3">
            <div class="text-muted">
              Showing {{ (currentPage - 1) * itemsPerPage + 1 }} to 
              {{ Math.min(currentPage * itemsPerPage, totalItems) }} of 
              {{ totalItems }} users
            </div>
            <nav aria-label="Page navigation">
              <ul class="pagination mb-0">
                <li class="page-item" :class="{ 'disabled': currentPage === 1 }">
                  <a class="page-link" href="#" @click.prevent="previousPage">
                    <i class='bx bx-chevron-left'></i>
                  </a>
                </li>
                <li class="page-item" v-for="pageNumber in totalPages" :key="pageNumber" 
                    :class="{ 'active': currentPage === pageNumber }">
                  <a class="page-link" href="#" @click.prevent="setCurrentPage(pageNumber)">
                    {{ pageNumber }}
                  </a>
                </li>
                <li class="page-item" :class="{ 'disabled': currentPage === totalPages }">
                  <a class="page-link" href="#" @click.prevent="nextPage">
                    <i class='bx bx-chevron-right'></i>
                  </a>
                </li>
              </ul>
            </nav>
          </div>
        </div>

    <!-- Create User Modal -->
    <!-- Create User Modal -->
<div v-if="showCreateUserModal" class="modal fade show d-block" tabindex="-1" role="dialog">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content">
      <div class="modal-header bg-primary text-white">
        <h5 class="modal-title">Create New User</h5>
        <button type="button" class="btn-close btn-close-white" @click="showCreateUserModal = false"></button>
      </div>
      <div class="modal-body">
        <form @submit.prevent="createUser">
          <div class="row g-3">
            <div class="col-md-6">
              <label for="username" class="form-label">Username *</label>
              <input type="text" class="form-control" id="username" v-model="newUser.username" required>
            </div>
            <div class="col-md-6">
              <label for="name" class="form-label">Full Name *</label>
              <input type="text" class="form-control" id="name" v-model="newUser.name" required>
            </div>
            <div class="col-md-6">
              <label for="email" class="form-label">Email *</label>
              <input type="email" class="form-control" id="email" v-model="newUser.email" required>
            </div>
            <div class="col-md-6">
              <label for="phonenumber" class="form-label">Phone Number *</label>
              <input type="tel" class="form-control" id="phonenumber" v-model="newUser.phonenumber" required>
            </div>
            <div class="col-md-6">
              <label for="designation" class="form-label">Designation *</label>
              <select class="form-select" id="designation" v-model="newUser.designation" required>
                <option v-for="option in designationOptions" :value="option" :key="option">
                  {{ option }}
                </option>
              </select>
            </div>
            <div class="col-md-6">
              <label for="password" class="form-label">Password *</label>
              <input type="password" class="form-control" id="password" v-model="newUser.password" required>
            </div>
            <div class="col-12">
              <label for="cnic" class="form-label">CNIC *</label>
              <input type="text" class="form-control" id="cnic" v-model="newUser.cnic" 
                placeholder="XXXXX-XXXXXXX-X" required>
            </div>
            <!-- Optional: Status Toggle -->
            <div class="col-12">
              <div class="form-check form-switch">
                <input class="form-check-input" type="checkbox" id="userStatus" v-model="newUser.status">
                <label class="form-check-label" for="userStatus">Active User</label>
              </div>
            </div>
          </div>
          <div class="modal-footer border-top-0 pt-4">
            <button type="button" class="btn btn-outline-secondary" @click="showCreateUserModal = false">
              Cancel
            </button>
            <button type="submit" class="btn btn-primary" :disabled="loading">
              <span v-if="loading" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
              {{ loading ? 'Creating...' : 'Create User' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</div>
    <div v-if="showCreateUserModal" class="modal-backdrop fade show"></div>
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  min-height: 100vh;
  background-color: #f8f9fa;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column; /* Adjust based on your sidebar width */
  transition: margin-left 0.3s;
}

.content-wrapper {
  flex: 1;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 0;
}

.card {
  border: none;
  border-radius: 8px;
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
  margin-bottom: 1.5rem;
}

.card-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.table {
  font-size: 0.9rem;
}

.table th {
  font-weight: 600;
  white-space: nowrap;
  padding: 12px 16px;
  background-color: #2c6cad !important;
}

.table td {
  padding: 12px 16px;
  vertical-align: middle;
}

.bg-light-danger {
  background-color: rgba(220, 53, 69, 0.05);
}

/* Responsive adjustments */
@media (max-width: 992px) {
  .main-content {
    margin-left: 0;
  }
}

@media (max-width: 768px) {
  .content-wrapper {
    padding: 1rem;
    padding-top: 70px;
  }
  
  .page-title {
    font-size: 1.25rem;
  }
  
  .table-responsive {
    width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  
  .table th, .table td {
    padding: 8px 12px;
    font-size: 0.8rem;
  }
  
  .modal-dialog {
    margin: 0.5rem;
  }
  
  .modal-body {
    padding: 1rem;
  }
}

/* Modal Backdrop */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1040;
  width: 100vw;
  height: 100vh;
  background-color: #000;
  opacity: 0.5;
}

/* Badges */
.badge {
  font-weight: 500;
  padding: 5px 8px;
  font-size: 0.75rem;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.85rem;
}

.btn-sm {
  padding: 0.25rem 0.5rem;
}

.btn i {
  font-size: 1rem;
}

/* Pagination */
.pagination {
  margin-bottom: 0;
}

.page-item.active .page-link {
  background-color: #0d6efd;
  border-color: #0d6efd;
}

.page-link {
  color: #0d6efd;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
}

/* Status Colors */
.text-success {
  color: #198754 !important;
}

.text-danger {
  color: #dc3545 !important;
}

.bg-success {
  background-color: #198754 !important;
}

.bg-danger {
  background-color: #dc3545 !important;
}
</style>
