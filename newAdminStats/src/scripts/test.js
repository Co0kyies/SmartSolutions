import { database } from "./firabase";
import { ref, child, get } from "firebase/database";

export function test() {
  const dbRef = ref(database);
  get(child(dbRef, `allOrders`))
    .then((snapshot) => {
      if (snapshot.exists()) {
        // console.log(snapshot.val());
        return snapshot.val();
      } else {
        return "No data available";
      }
    })
    .catch((error) => {
      console.error(error);
    });
}
