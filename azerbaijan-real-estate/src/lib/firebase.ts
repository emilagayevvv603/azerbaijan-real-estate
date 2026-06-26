import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  projectId: "gen-lang-client-0616071960",
  appId: "1:865597225221:web:ef1fedb17032d6147d5f6c",
  apiKey: "AIzaSyAcZ-grMzvf5T_oTdpw8Yo-obEEVciNNW4",
  authDomain: "gen-lang-client-0616071960.firebaseapp.com",
  storageBucket: "gen-lang-client-0616071960.firebasestorage.app",
  messagingSenderId: "865597225221",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
