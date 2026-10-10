<script setup>
import InputError from '../components/InputError.vue'
import InputLabel from '../components/InputLabel.vue'
import TextInput from '../components/TextInput.vue'
</script>

<template>
  <div class="px-3">
    <div class="pageHeading pt-2 mb-md-4 mb-3">
        <p>Create User</p>
      </div>
      <div class="col-6 mb-md-4 mb-3">
        <div class="row">
          <div class="col-6 mb-4">
            <InputLabel for="username" value="User Name" class="inputLabel" />
            <TextInput id="username" inputPlaceholder="Write user name" type="text" class="block w-100 font-14" required
              autofocus autocomplete="username" />
            <InputError class="mt-2" />
          </div>
          <div class="col-6 mb-4">
            <InputLabel for="phone_no" value="Phone No." class="inputLabel" />
            <TextInput id="phone_no" inputPlaceholder="Write phone no." type="number" class="block w-100 font-14"
              required autofocus autocomplete="phone_no" />
            <InputError class="mt-2" />
          </div>
          <div class="col-6 mb-4">
            <InputLabel for="new-password" value="Password" class="inputLabel" />
            <TextInput id="new-password" type="password" inputPlaceholder="Write password" class="block w-100 font-14"
              required autocomplete="new-password" />
            <InputError class="mt-2" />
          </div>
          <div class="col-6 mb-4">
            <InputLabel for="new-password" value="Confirm Password" class="inputLabel" />
            <TextInput id="new-password" type="password" inputPlaceholder="Confirm your password"
              class="block w-100 font-14" required autocomplete="new-password" />
            <InputError class="mt-2" />
          </div>
          <div class="col-6 mb-4">
            <InputLabel for="designation" value="Designation" class="inputLabel" />
            <TextInput id="designation" type="text" inputPlaceholder="Write Designation" class="block w-100 font-14"
              required autocomplete="designation" />
            <InputError class="mt-2" />
          </div>

          <div class="col-4 mt-4">
            <button class="blueBtn w-100 d-flex justify-content-center">
              <span> Create User </span>
            </button>
          </div>
        </div>
      </div>
  </div>
</template>
