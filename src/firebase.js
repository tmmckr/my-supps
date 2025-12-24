import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCMaplALOGvpaBULsfAAcA91CHsuhi1t0A",
  authDomain: "my-supps-app.firebaseapp.com",
  projectId: "my-supps-app",
  storageBucket: "my-supps-app.firebasestorage.app",
  messagingSenderId: "152610706254",
  appId: "1:152610706254:web:d2796e6e33355fd80cc41f",
  measurementId: "G-XPRZV32W26"
};

// App initialisieren
const app = initializeApp(firebaseConfig);
// Datenbank exportieren, damit wir sie überall nutzen können
export const db = getFirestore(app);