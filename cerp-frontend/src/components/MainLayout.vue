<script setup>
import Sidebar from './Sidebar.vue'
import Header from './Header.vue'
import { ref } from 'vue'

const isSidebarClosed = ref(false)
const handleSidebarToggle = (closed) => {
  isSidebarClosed.value = closed
}
</script>

<template>
  <div class="app-layout">
    <Sidebar @toggle="handleSidebarToggle"></Sidebar>
    <div :class="['main-content', { 'sidebar-closed': isSidebarClosed }]">
      <Header></Header>
      <div class="page-content">
        <router-view></router-view>
      </div>
    </div>
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
  width: 100%;
  overflow-x: hidden;
  background-color: #f8f9fa;
}

.main-content {
  flex: 1;
  margin-left: 260px;
  width: calc(100% - 260px);
  max-width: calc(100% - 260px);
  min-width: 0;
  transition: margin-left 0.3s ease;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
}

.main-content.sidebar-closed {
  margin-left: 80px;
  width: calc(100% - 80px);
  max-width: calc(100% - 80px);
}

.page-content {
  padding: clamp(0.75rem, 2vw, 2rem);
  margin-top: 70px; /* Account for fixed header if it's fixed */
  flex: 1;
  min-height: calc(100vh - 70px);
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow-x: hidden;
  overflow-y: auto;
}

@media (max-width: 992px) {
  .main-content {
    margin-left: 0;
    width: 100%;
    max-width: 100%;
  }
  .main-content.sidebar-closed {
    margin-left: 0;
    width: 100%;
    max-width: 100%;
  }
  .page-content {
    padding: 0.875rem;
  }
}
@media (max-width: 576px) {
  .page-content {
    padding: 0.75rem;
    margin-top: 64px;
    min-height: calc(100vh - 64px);
  }
}
</style>
