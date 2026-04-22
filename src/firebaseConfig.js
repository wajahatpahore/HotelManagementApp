import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBVE3cZIBfwlZhETztzEzjQOuCpydTLF64",
  authDomain: "hotelmanagementapp-9f38d.firebaseapp.com",
  databaseURL: "https://hotelmanagementapp-9f38d-default-rtdb.firebaseio.com",
  projectId: "hotelmanagementapp-9f38d",
  storageBucket: "hotelmanagementapp-9f38d.firebasestorage.app",
  messagingSenderId: "783542767491",
  appId: "1:783542767491:web:b9f059cf0bb02ff5deb0b6"
};

let auth, db;

try {
  const app = initializeApp(firebaseConfig);
  console.log('✅ Firebase initialized successfully');
  
  auth = getAuth(app);
  db = getFirestore(app);
  
  console.log('✅ Auth and Firestore initialized');
} catch (error) {
  console.error('❌ Firebase initialization error:', error.message);
}

export { auth, db };