<script setup>
import InputError from '../components/InputError.vue'
import InputLabel from '../components/InputLabel.vue'
import TextInput from '../components/TextInput.vue'
</script>

<template>
    <div class="login">
        <div class="login_form">
            <div class="logo mb-4">
                <img src="/icons/logo.png" alt="logo" />
            </div>
            <p class="font-32 fw-bold mb-4">Register</p>
            <div>
                <InputLabel for="newUserEmail" value="Email" class="inputLabel" />
                <TextInput id="newUserEmail" inputPlaceholder="Enter your Email" type="email"
                    class="block w-100 font-14 bg-transparent" required autofocus autocomplete="newUserEmail" />
                <InputError class="mt-2" />
            </div>

            <div class="mt-4">
                <InputLabel for="newUserPassword" value="Password" class="inputLabel" />
                <TextInput id="newUserPassword" type="password" inputPlaceholder="Write password"
                    class="block w-100 font-14 bg-transparent" required autocomplete="current-password" />
                <InputError class="mt-2" />
            </div>

            <div class="col-4 mt-4">
                <button class="blueBtn w-100 d-flex justify-content-center">
                    <span> Register </span>
                </button>
            </div>
        </div>
    </div>
</template>
