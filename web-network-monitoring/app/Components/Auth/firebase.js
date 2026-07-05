import { getApp, getApps, initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBikEX_YhYWGxwQ9qYJcMO65rha0qbcx4w",
  authDomain: "network-monitoring-7b445.firebaseapp.com",
  projectId: "network-monitoring-7b445",
  storageBucket: "network-monitoring-7b445.firebasestorage.app",
  messagingSenderId: "1057879585796",
  appId: "1:1057879585796:web:1ccb2416a38f6c19c13151",
  measurementId: "G-730XQLRGG0"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const analytics =
  typeof window !== "undefined"
    ? isSupported().then((supported) => (supported ? getAnalytics(app) : null))
    : null;

export { app, auth, db, analytics };
