<script setup>
import { ref } from 'vue'
import axios from 'axios';
import { inject } from 'vue';

const url = inject('url');
const router = inject('router');

const isSidebarClosed = ref(false)
const emit = defineEmits(['toggle'])

const logout = () => {
  const token = localStorage.getItem('token');
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  axios.post(url + "logout").then(response => {
    localStorage.removeItem('token');
    router.push('/');
  }).catch(error => {
    localStorage.removeItem('token');
    router.push('/');
  });
}

const toggleSidebar = () => {
  isSidebarClosed.value = !isSidebarClosed.value
  emit('toggle', isSidebarClosed.value)
}
</script>

<template>
  <div :class="{ 'sidebar-closed': isSidebarClosed }" class="sidebar-container">
    <div class="sidebar-toggle-btn" @click="toggleSidebar">
      <i :class="{ 'bx-chevron-right': isSidebarClosed, 'bx-chevron-left': !isSidebarClosed }" class="bx"></i>
    </div>
    <div class="sidebar-logo">
      <img src="/icons/logo.png" />
    </div>
    <ul class="sidebar-menu">
      <li :class="{ 'active': $route.path === '/dashboard' }">
        <RouterLink :to="{ path: '/dashboard' }" class="menu-item">
          <i class="bx bx-home-alt"></i>
          <span class="menu-text">Dashboard</span>
        </RouterLink>
      </li>
      <li :class="{ 'active': $route.path === '/mobile-users' }">
        <RouterLink :to="{ path: '/mobile-users' }" class="menu-item">
          <i class='bx bx-user'></i>
          <span class="menu-text">Mobile Users</span>
        </RouterLink>
      </li>
      <li :class="{ 'active': $route.path === '/Upload' }">
        <RouterLink :to="{ path: '/UPLOAD' }" class="menu-item">
          <i class="bx bx-upload"></i>
          <span class="menu-text">Upload</span>
        </RouterLink>
      </li>
      <li :class="{ 'active': $route.path === '/assign' }">
        <RouterLink :to="{ path: '/assign' }" class="menu-item">
          <i class="bx bx-transfer-alt"></i>
          <span class="menu-text">Assign Pins</span>
        </RouterLink>
      </li>
      <li :class="{ 'active': $route.path === '/report' }">
        <RouterLink :to="{ path: '/report' }" class="menu-item">
          <i class="bx bx-detail"></i>
          <span class="menu-text">Reports</span>
        </RouterLink>
      </li>
      <li :class="{ 'active': $route.path === '/sreport' }">
        <RouterLink :to="{ path: '/sreport' }" class="menu-item">
          <i class="bx bx-detail"></i>
          <span class="menu-text">Sub-reports</span>
        </RouterLink>
      </li>
      <li :class="{ 'active': $route.path === '/Pins' }">
        <RouterLink :to="{ path: '/Pins' }" class="menu-item">
          <i class="bx bx-key"></i>
          <span class="menu-text">Pins Management</span>
        </RouterLink>
      </li>
      <li :class="{ 'active': $route.path === '/circle' }">
        <RouterLink :to="{ path: '/circle' }" class="menu-item">
          <i class="bx bx-group"></i>
          <span class="menu-text">Circle Management</span>
        </RouterLink>
      </li>
      <li :class="{ 'active': $route.path === '/status' }">
        <RouterLink :to="{ path: '/status' }" class="menu-item">
          <i class="bx bx-upload"></i>
          <span class="menu-text">REVIEW pins</span>
        </RouterLink>
      </li>
    </ul>
    <div class="sidebar-footer">
      <a @click="logout()" class="logout-btn">
        <i class="bx bx-log-out"></i>
        <span class="logout-text">Logout</span>
      </a>
    </div>
  </div>
</template>

<style scoped>
.sidebar-container {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 260px;
  background: linear-gradient(180deg, #1a3a53 0%, #0e2a3e 100%);
  color: #e0e0e0;
  padding: 1.5rem 1rem;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  box-shadow: 4px 0 15px rgba(0, 0, 0, 0.1);
  overflow-y: auto; /* Allow sidebar to scroll if content is too tall */
  z-index: 1000; /* Ensure it stays above other content */
}

.sidebar-closed {
  width: 80px;
}

.sidebar-toggle-btn {
  position: absolute;
  top: 1.5rem;
  right: -12px;
  width: 24px;
  height: 24px;
  background: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  z-index: 10;
  transition: all 0.3s ease;
}

.sidebar-toggle-btn:hover {
  transform: scale(1.1);
}

.sidebar-toggle-btn i {
  font-size: 1.2rem;
  color: #1a3a53;
}

.sidebar-logo {
  padding: 1rem 0 2rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid rgb(255, 255, 255);
  text-align: center;
  transition: all 0.3s ease;
}

.sidebar-logo img {
  max-height: 40px;
  transition: all 0.3s ease;
}

.sidebar-closed .sidebar-logo img {
  max-height: 30px;
}

.sidebar-menu {
  list-style: none;
  padding: 0;
  margin: 0;
  flex-grow: 1;
}

.sidebar-menu li {
  margin-bottom: 0.5rem;
  border-radius: 6px;
  overflow: hidden;
  transition: all 0.2s ease;
}

.sidebar-menu li:hover:not(.active) {
  background: rgba(255, 255, 255, 0.05);
}

.sidebar-menu li.active {
  background: rgba(14, 112, 185, 0.8);
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  color: inherit;
  text-decoration: none;
  transition: all 0.2s ease;
}

.menu-item:hover {
  color: #fff;
}

.menu-item i {
  font-size: 1.4rem;
  min-width: 24px;
  margin-right: 1rem;
  transition: margin 0.3s ease;
}

.menu-text {
  font-size: 0.95rem;
  font-weight: 500;
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.sidebar-closed .menu-text {
  opacity: 0;
  transform: translateX(-10px);
  position: absolute;
}

.sidebar-closed .menu-item i {
  margin-right: 0;
  font-size: 1.6rem;
}

.sidebar-footer {
  margin-top: auto;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.logout-btn {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  color: #e0e0e0;
  text-decoration: none;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.logout-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.logout-btn i {
  font-size: 1.4rem;
  min-width: 24px;
  margin-right: 1rem;
  transition: margin 0.3s ease;
}

.logout-text {
  font-size: 0.95rem;
  font-weight: 500;
  transition: opacity 0.3s ease;
}

.sidebar-closed .logout-text {
  opacity: 0;
}

.sidebar-closed .logout-btn i {
  margin-right: 0;
  font-size: 1.6rem;
}

/* Tooltip for closed state */
.sidebar-closed li {
  position: relative;
}

.sidebar-closed li:hover::after {
  content: attr(data-tooltip);
  position: absolute;
  left: 100%;
  top: 50%;
  transform: translateY(-50%);
  margin-left: 15px;
  background: #2c3e50;
  color: white;
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 0.85rem;
  white-space: nowrap;
  z-index: 100;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

/* Add data-tooltip to each li in your template */
</style>