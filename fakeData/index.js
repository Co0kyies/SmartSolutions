import { orderFunction } from "../Client_App/svelte-app/src/ShoppingCart/orderFunction.js";

function simulateOrder() {
  let obj = {
    userId: "6ckaJgsqPWUfQcnb3S7yL9xC6K73",
    adress: "example Adress",
    dateOrdered: "01-01-2021",
    city: "Варна",
  };

  orderFunction(obj);
  function selectTheClient() {}
  function generateInBasketEement() {}
  function chooseRoute() {}
  function chooseAdress() {}
  function chooseDate() {}
}

simulateOrder();
