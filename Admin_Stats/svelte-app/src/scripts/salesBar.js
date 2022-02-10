import { getAllOrdersSnapshot, getAllItemsSnapshot } from "./firabase";
export function salesBar() {
  getAllItemsSnapshot.then((items) => {
    console.log(items);
  });
}
