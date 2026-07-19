import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getMessaging, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyCVWGI6mPSg9xKoOIxuF5kfF1S-PhwRYpk",
  authDomain: "smilepet-1561e.firebaseapp.com",
  projectId: "smilepet-1561e",
  storageBucket: "smilepet-1561e.firebasestorage.app",
  messagingSenderId: "72069625685",
  appId: "1:72069625685:web:ce7299da0cf63e8642a1dc",
  measurementId: "G-7PB6SN55BD"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export const getMessagingInstance = async () => {
  if (typeof window !== "undefined") {
    const supported = await isSupported();
    return supported ? getMessaging(app) : null;
  }
  return null;
};

export default app;
