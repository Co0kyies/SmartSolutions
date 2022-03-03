// Import the functions you need from the SDKs you need

import { initializeApp } from "firebase/app";

import { getAnalytics } from "firebase/analytics";

// TODO: Add SDKs for Firebase products that you want to use

// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration

// For Firebase JS SDK v7.20.0 and later, measurementId is optional

const firebaseConfig = {
  apiKey: "AIzaSyBLM0jRrQr7dgRGfmj-czXsUgKq_HEDmeg",

  authDomain: "smartsolutions-f3f1d.firebaseapp.com",

  databaseURL: "https://smartsolutions-f3f1d-default-rtdb.firebaseio.com",

  projectId: "smartsolutions-f3f1d",

  storageBucket: "smartsolutions-f3f1d.appspot.com",

  messagingSenderId: "577346773409",

  appId: "1:577346773409:web:f0354e0e04282989446be0",

  measurementId: "G-R309HXRD90",
};

// Initialize Firebase

export const app = initializeApp(firebaseConfig);
