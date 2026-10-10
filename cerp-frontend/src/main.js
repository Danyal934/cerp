import '@/assets/css/main.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import firebase from "firebase/compat/app";
import 'firebase/compat/auth';
import firebaseConfig from './firebase/init.js/init.js';
import App from './App.vue'
import router from './router'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap/dist/js/bootstrap.js'
import 'boxicons/css/boxicons.css'
import { provideGlobals } from './globals.js';






const app = createApp(App)
firebase.initializeApp(firebaseConfig);
app.provide('router', router);
app.provide('url', provideGlobals.getBaseUrl());
app.provide('provideGlobals', provideGlobals);



app.use(createPinia())
app.use(router)
app.mount('#app')
