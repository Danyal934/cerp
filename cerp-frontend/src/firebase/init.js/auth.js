// src/firebase/init.js
import { initializeApp } from 'firebase/app'
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: "computer-vision-5a4fd.firebaseapp.com",
    projectId: "computer-vision-5a4fd",
    storageBucket: "computer-vision-5a4fd.appspot.com",
    messagingSenderId: "63642404290",
    appId: "1:63642404290:web:24a45de1b22fd4a573825b",
    measurementId: "G-PK1MFJRJH0"
};

const app = initializeApp(firebaseConfig)

const auth = getAuth(app)
const db = getFirestore(app)

export { auth, createUserWithEmailAndPassword, db }
