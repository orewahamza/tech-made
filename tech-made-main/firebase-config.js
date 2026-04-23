// Firebase Browser-Compatible SDK (CDN)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getAuth, 
    GoogleAuthProvider, 
    signInWithPopup, 
    signOut, 
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBr3Eqys3X7slEjdWWQD-g0JnT0sv2p2o4",
  authDomain: "image-gen-9a4da.firebaseapp.com",
  projectId: "image-gen-9a4da",
  storageBucket: "image-gen-9a4da.firebasestorage.app",
  messagingSenderId: "344311099519",
  appId: "1:344311099519:web:21cf317b72854400c40f4a",
  measurementId: "G-1S80YNB74L"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { 
    auth, 
    googleProvider, 
    signInWithPopup, 
    signOut, 
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword
};
