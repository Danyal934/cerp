<script setup>
import InputError from '../components/InputError.vue'
import InputLabel from '../components/InputLabel.vue'
import TextInput from '../components/TextInput.vue'
import { ref, inject  } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const email = ref('');
const password = ref('');
const errors = ref({
  email: '',
  password: '',
  api: ''
});
const isLoading = ref(false);
const router = useRouter();
const url = inject('url');

const validateForm = () => {
  let isValid = true;
  errors.value = { email: '', password: '', api: '' };

  if (!email.value) {
    errors.value.email = "Email is required";
    isValid = false;
  } else if (!/^\S+@\S+\.\S+$/.test(email.value)) {
    errors.value.email = "Please enter a valid email";
    isValid = false;
  }

  if (!password.value) {
    errors.value.password = "Password is required";
    isValid = false;
  } else if (password.value.length < 6) {
    errors.value.password = "Password must be at least 6 characters";
    isValid = false;
  }

  return isValid;
};

const signIn = async () => {
  if (!validateForm()) return;

  isLoading.value = true;
  errors.value.api = '';

  try {
    const response = await axios.post(`${url}/api/login`, {
      email: email.value,
      password: password.value
    });

    if (response.data.user.role_id === 1) {
      // Store user data
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      router.push('/dashboard');
    } else {
      errors.value.api = "Access not allowed";
    }
  } catch (error) {
    errors.value.api = error.response?.data?.error || 'Login failed. Please try again.';
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="login">
    <div class="login_form">
      <div class="logo mb-4">
        <img src="/icons/logo.png" alt="logo" />
      </div>
      <p class="font-32 fw-bold mb-4">Login</p>
      
      <div>
        <InputLabel for="username" value="User Email" class="inputLabel" />
        <TextInput 
          id="username" 
          v-model="email" 
          inputPlaceholder="Write user email" 
          type="email"
          class="block w-100 font-14 bg-transparent" 
          required 
          autofocus 
          autocomplete="username" 
        />
        <InputError :message="errors.email" />
      </div>

      <div class="mt-4">
        <InputLabel for="password" value="Password" class="inputLabel" />
        <TextInput 
          id="password" 
          type="password" 
          v-model="password" 
          inputPlaceholder="Write password"
          class="block w-100 font-14 bg-transparent" 
          required 
          autocomplete="current-password" 
        />
        <InputError :message="errors.password" />
      </div>

      <InputError :message="errors.api" class="mt-2" />

      <div class="col-4 mt-4">
        <button 
          @click="signIn" 
          class="blueBtn w-100 d-flex justify-content-center"
          :disabled="isLoading"
        >
          <span v-if="!isLoading">Log in</span>
          <span v-else>Logging in...</span>
        </button>
      </div>
    </div>
  </div>
</template>