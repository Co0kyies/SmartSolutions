import { getDatabase, ref, child, get } from "firebase/database";

export const getArrayOfAllClients = new Promise((resolve) => {
  const dbRef = ref(getDatabase());
  get(child(dbRef, `website`))
    .then((snapshot) => {
      if (snapshot.exists()) {
        let clients = [];
        for (const key in snapshot) {
          if (Object.hasOwnProperty.call(snapshot, key)) {
            let email = snapshot[key].email;
            let client = "";
            for (let char = 0; char < snapshot[key].email.length; char++) {
              if (email[char] != "@") {
                client += email[char];
              } else {
                break;
              }
            }
            clients.push(client);
          }
        }
        resolve(clients);
      } else {
        return "No data available";
      }
    })
    .catch((error) => {
      console.error(error);
    });
});
