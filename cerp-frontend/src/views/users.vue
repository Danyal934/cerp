<script setup>
import { ref, onMounted } from 'vue'
import { auth, createUserWithEmailAndPassword, db } from '../firebase/init.js/auth.js'
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore'

import Sidebar from '../components/Sidebar.vue'
import Header from '../components/Header.vue'
import InputLabel from '../components/InputLabel.vue'
import TextInput from '../components/TextInput.vue'
import InputError from '../components/InputError.vue'
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';

const users = ref([])
const showForm = ref(false)
const isEditing = ref(false)
const editUserId = ref(null)
const errorMessage = ref('')

const form = ref({
  username: '',
  phone_no: '',
  password: '',
  confirmPassword: '',
  designation: ''
})

const resetForm = () => {
  form.value = {
    username: '',
    phone_no: '',
    password: '',
    confirmPassword: '',
    designation: ''
  }
  errorMessage.value = ''
  isEditing.value = false
  editUserId.value = null
}

const fetchUsers = async () => {
  users.value = []
  const snapshot = await getDocs(collection(db, 'users'))
  snapshot.forEach(docSnap => {
    users.value.push({ id: docSnap.id, ...docSnap.data() })
  })
}

const createUser = async () => {
  errorMessage.value = ''

  if (form.value.password !== form.value.confirmPassword) {
    errorMessage.value = "Passwords don't match"
    return
  }

  try {
    const email = `${form.value.phone_no}@example.com`
    const userCredential = await createUserWithEmailAndPassword(auth, email, form.value.password)

    await addDoc(collection(db, 'users'), {
      uid: userCredential.user.uid,
      name: form.value.username,
      phone: form.value.phone_no,
      designation: form.value.designation
    })

    alert('User created successfully!')
    resetForm()
    fetchUsers()
    showForm.value = false
  } catch (error) {
    errorMessage.value = error.message
  }
}

const startEditUser = (user) => {
  form.value = {
    username: user.name,
    phone_no: user.phone,
    password: '',
    confirmPassword: '',
    designation: user.designation
  }
  editUserId.value = user.id
  isEditing.value = true
  showForm.value = true
}

const updateUser = async () => {
  if (!editUserId.value) return
  try {
    const userRef = doc(db, 'users', editUserId.value)
    await updateDoc(userRef, {
      name: form.value.username,
      phone: form.value.phone_no,
      designation: form.value.designation
    })

    alert('User updated successfully!')
    resetForm()
    fetchUsers()
    showForm.value = false
  } catch (error) {
    errorMessage.value = error.message
  }
}

const deleteUser = async (id) => {
  if (!confirm('Are you sure you want to delete this user?')) return
  try {
    await deleteDoc(doc(db, 'users', id))
    alert('User deleted!')
    fetchUsers()
  } catch (error) {
    alert('Error deleting user: ' + error.message)
  }
}

onMounted(() => {
  fetchUsers()
})
</script>

<template>
  <div class="px-3">
      <div class="pageHeading pt-2 mb-3 d-flex justify-content-between align-items-center">
        <p>{{ isEditing ? 'Edit User' : 'User List' }}</p>
        <button class="blueBtn" @click="() => { showForm = !showForm; resetForm(); }">
          {{ showForm ? 'Close Form' : 'Create User' }}
        </button>
      </div>

      <!-- Form -->
      <div v-if="showForm" class="col-6 mb-4">
        <div class="row">
          <div class="col-6 mb-4">
            <InputLabel for="username" value="User Name" />
            <TextInput id="username" v-model="form.username" inputPlaceholder="Write user name" type="text"
              class="block w-100 font-14" required />
          </div>
          <div class="col-6 mb-4">
            <InputLabel for="phone_no" value="Phone No." />
            <TextInput id="phone_no" v-model="form.phone_no" inputPlaceholder="Write phone no." type="number"
              class="block w-100 font-14" required />
          </div>
          <div v-if="!isEditing" class="col-6 mb-4">
            <InputLabel for="password" value="Password" />
            <TextInput id="password" v-model="form.password" inputPlaceholder="Write password" type="password"
              class="block w-100 font-14" required />
          </div>
          <div v-if="!isEditing" class="col-6 mb-4">
            <InputLabel for="confirmPassword" value="Confirm Password" />
            <TextInput id="confirmPassword" v-model="form.confirmPassword" inputPlaceholder="Confirm your password"
              type="password" class="block w-100 font-14" required />
          </div>
          <div class="col-6 mb-4">
            <InputLabel for="designation" value="Designation" />
            <TextInput id="designation" v-model="form.designation" inputPlaceholder="Write Designation" type="text"
              class="block w-100 font-14" required />
          </div>
          <div class="col-4 mt-2">
            <InputError v-if="errorMessage" :message="errorMessage" class="mt-2" />
            <button class="blueBtn w-100 mt-3" @click="isEditing ? updateUser() : createUser()">
              {{ isEditing ? 'Update User' : 'Create User' }}
            </button>
          </div>
        </div>
      </div>

      <!-- User Table -->
      <div class="mt-4">
        <table class="table table-bordered">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Designation</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id">
              <td>{{ user.name }}</td>
              <td>{{ user.phone }}</td>
              <td>{{ user.designation }}</td>
              <td>
                <button class="btn btn-sm btn-warning me-2" @click="startEditUser(user)">Edit</button>
                <button class="btn btn-sm btn-danger" @click="deleteUser(user.id)">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
