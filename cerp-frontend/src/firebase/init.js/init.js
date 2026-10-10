// Import the functions you need from the SDKs you need
//import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
// import { getFirestore } from "firebase/firestore";
 import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
     apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
     authDomain: "computer-vision-5a4fd.firebaseapp.com",
     projectId: "computer-vision-5a4fd",
     storageBucket: "computer-vision-5a4fd.appspot.com",
     messagingSenderId: "63642404290",
     appId: "1:63642404290:web:24a45de1b22fd4a573825b",
     measurementId: "G-PK1MFJRJH0"
 };

// // Initialize Firebase
//const app = initializeApp(firebaseConfig);
//const analytics = getAnalytics(app);
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

//const db = getFirestore()

export { db , firebaseConfig};

export default {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: "computer-vision-5a4fd.firebaseapp.com",
    projectId: "computer-vision-5a4fd",
    storageBucket: "computer-vision-5a4fd.appspot.com",
    messagingSenderId: "63642404290",
    appId: "1:63642404290:web:24a45de1b22fd4a573825b",
    measurementId: "G-PK1MFJRJH0"
};
