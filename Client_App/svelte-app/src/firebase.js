import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getDatabase, ref, set } from "firebase/database";

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
export const app = initializeApp(firebaseConfig);
export const auth = getAuth();
export const database = getDatabase(app);

export function writeToDatabase(path, values, func) {
  set(ref(database, path), values).then(func);
}
