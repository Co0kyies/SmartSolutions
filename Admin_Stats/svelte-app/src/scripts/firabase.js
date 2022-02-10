import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getDatabase, ref, set, child, get } from "firebase/database";

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
  console.log(path, values);
  set(ref(database, path), values).then(func);
}

export const getAllOrdersSnapshot = new Promise((resolve) => {
  const dbRef = ref(getDatabase());
  get(child(dbRef, `allOrders`))
    .then((snapshot) => {
      if (snapshot.exists()) {
        // console.log(snapshot.val());
        resolve(snapshot.val());
      } else {
        return "No data available";
      }
    })
    .catch((error) => {
      console.error(error);
    });
});

export const getAllItemsSnapshot = new Promise((resolve) => {
  const dbRef = ref(getDatabase());
  get(child(dbRef, `items`))
    .then((snapshot) => {
      if (snapshot.exists()) {
        // console.log(snapshot.val());
        resolve(snapshot.val());
      } else {
        return "No data available";
      }
    })
    .catch((error) => {
      console.error(error);
    });
});
