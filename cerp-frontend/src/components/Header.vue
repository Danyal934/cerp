<template>
  <div class="welcome-header">
    <div class="header-content">
      <h1 class="welcome-message">
        Welcome back, <span class="user-name">{{ userName }}</span>
        <span class="welcome-emoji">👋</span>
      </h1>
      
      <div class="datetime-display">
        <div class="date-badge">
          <i class="bx bx-calendar"></i>
          <span>{{ currentDate }}</span>
        </div>
        <div class="time-badge">
          <i class="bx bx-time"></i>
          <span>{{ currentTime }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';

const currentDate = ref('');
const currentTime = ref('');

// Get user name from localStorage
const userName = computed(() => {
  const user = JSON.parse(localStorage.getItem('user'));
  return user?.name || 'User';
});

const getCurrentDateTime = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  currentDate.value = `${day} ${getMonthName(month)}, ${year}`;
  currentTime.value = `${hours}:${minutes}:${seconds}`;
};

const getMonthName = (month) => {
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  return monthNames[month - 1];
};

onMounted(() => {
  getCurrentDateTime();
  setInterval(getCurrentDateTime, 1000);
});
</script>

<style scoped>
.welcome-header {
  background-color: #ffffff;
  padding: 1.5rem 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  margin-bottom: 1.5rem;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.welcome-message {
  font-size: 1.5rem;
  font-weight: 500;
  color: #333;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.user-name {
  font-weight: 600;
  color: #0e507a;
}

.welcome-emoji {
  font-size: 1.3rem;
}

.datetime-display {
  display: flex;
  gap: 1.5rem;
}

.date-badge, .time-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  color: #555;
  background-color: #f8f9fa;
  padding: 0.5rem 1rem;
  border-radius: 20px;
}

.date-badge i, .time-badge i {
  font-size: 1.1rem;
  color: #0e507a;
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .datetime-display {
    width: 100%;
    justify-content: space-between;
    gap: 0.5rem;
  }
  
  .welcome-message {
    font-size: 1.3rem;
  }
}
</style>