import { ref, set, push } from "firebase/database";

export function orderFunction(obj) {
  // userID, Basket, totalPrice, city, adress, date
  function writeOrderToDatabase() {
    let dateOrdered;
    if (obj.dateOrdered) {
      dateOrdered = obj.dateOrdered;
    } else {
      dateOrdered = `${new Date().getDate()}-${
        new Date().getMonth() + 1
      }-${new Date().getFullYear()}`;
    }
    let order = {
      city: obj.city,
      dateOrdered: obj.dateOrdered,
      totalPrice: obj.totalPrice,
      userID: obj.userID,
      adress: obj.adress,
    };
    const allOrdersRef = ref(database, "allOrders/");
    const newOrderRef = push(allOrdersRef);
    const orderId = newOrderRef.key;
    set(newOrderRef, order);
  }
  writeOrderToDatabase();
}
