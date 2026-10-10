<template>
    <div v-if="show" class="dialog-backdrop">
      <div class="dialog-box">
        <h4>🎉 Congratulations!</h4>
        <p>{{ message }}</p>
        <button @click="closeDialog" class="btn btn-primary">
          OK
        </button>
      </div>
    </div>
  </template>
  
  <script setup>
  import { defineProps, defineEmits } from 'vue';
  
  defineProps({
    show: Boolean,
    message: String
  });
  
  const emit = defineEmits(['close']);
  
  const closeDialog = () => {
    emit('close');
  };
  </script>
  
  <style scoped>
  .dialog-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  
  .dialog-box {
    background: #ffffff;
    padding: 20px;
    border-radius: 8px;
    width: 90%;
    max-width: 400px;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
    text-align: center;
  }
  
  .dialog-box h4 {
    font-size: 1.5rem;
    margin-bottom: 10px;
  }
  
  .dialog-box p {
    font-size: 1rem;
    margin-bottom: 20px;
  }
  
  .dialog-box .btn {
    padding: 8px 20px;
    background-color: #007bff;
    color: #ffffff;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .dialog-box .btn:hover {
    background-color: #0056b3;
  }
  </style>
  